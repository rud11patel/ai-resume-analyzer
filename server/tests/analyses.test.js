const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { generateToken } = require('../src/middleware/auth');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');
const JobDescription = require('../src/models/JobDescription');
const AnalysisResult = require('../src/models/AnalysisResult');

let userA, userB, tokenA, tokenB, resumeA, jdA;

test.before(async () => {
  await connectTestDB();
});

test.after(async () => {
  await closeTestDB();
});

test.beforeEach(async () => {
  await clearTestDB();

  userA = await User.create({
    name: 'User Alpha',
    email: 'alpha@example.com',
    passwordHash: 'hashAlpha',
  });
  tokenA = generateToken(userA);

  userB = await User.create({
    name: 'User Beta',
    email: 'beta@example.com',
    passwordHash: 'hashBeta',
  });
  tokenB = generateToken(userB);

  resumeA = await Resume.create({
    userId: userA._id,
    originalName: 'Alpha_Resume.pdf',
    fileName: 'resume-alpha.pdf',
    filePath: 'uploads/resume-alpha.pdf',
    fileType: 'application/pdf',
    fileSize: 25000,
  });

  jdA = await JobDescription.create({
    userId: userA._id,
    roleTitle: 'Software Architect',
    company: 'Alpha Corp',
    rawText: 'Looking for a Software Architect to design distributed systems.',
  });
});

test('POST /api/analyses creates record and tags demo data status', async () => {
  const res = await request(app)
    .post('/api/analyses')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      resumeId: resumeA._id,
      jobDescriptionId: jdA._id,
      overallScore: 86,
      scoreLabel: 'Strong Match',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.analysis.isDemoData, true);
  assert.strictEqual(res.body.data.analysis.overallScore, 86);
});

test('GET /api/analyses lists populated records for authenticated user', async () => {
  await AnalysisResult.create({
    userId: userA._id,
    resumeId: resumeA._id,
    jobDescriptionId: jdA._id,
    overallScore: 86,
    scoreLabel: 'Strong Match',
    status: 'completed',
  });

  const res = await request(app)
    .get('/api/analyses')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.count, 1);
  assert.strictEqual(res.body.data.analyses[0].resumeId.originalName, 'Alpha_Resume.pdf');
  assert.strictEqual(res.body.data.analyses[0].jobDescriptionId.roleTitle, 'Software Architect');
});

test('GET /api/analyses/:id blocks cross-user access with 404', async () => {
  const analysis = await AnalysisResult.create({
    userId: userA._id,
    resumeId: resumeA._id,
    jobDescriptionId: jdA._id,
    overallScore: 86,
    scoreLabel: 'Strong Match',
    status: 'completed',
  });

  // User B tries to access User A's analysis
  const res = await request(app)
    .get(`/api/analyses/${analysis._id}`)
    .set('Authorization', `Bearer ${tokenB}`);

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/analyses rejects empty extracted text when not in demo mode', async () => {
  const res = await request(app)
    .post('/api/analyses')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      resumeId: resumeA._id,
      jobDescriptionId: jdA._id,
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.error.message, /extracted text/i);
});

test('POST /api/analyses blocks cross-user resume authorization', async () => {
  // User B attempts to analyze User A's resume
  const res = await request(app)
    .post('/api/analyses')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({
      resumeId: resumeA._id,
      jobDescriptionId: jdA._id,
    });

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/analyses performs real AI analysis when Python service is available', async () => {
  resumeA.extractedText = `
Alex Morgan
alex@example.com | (555) 123-4567

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frameworks: React, Node.js, Express.js
Tools: Docker, Git, CI/CD

EXPERIENCE
Senior Software Engineer (2020 - Present)
- Engineered high-throughput distributed microservices using Python and Docker.
- Architected REST APIs with Express.js and PostgreSQL.

EDUCATION
Bachelor of Science in Computer Science
`;
  resumeA.extractionStatus = 'completed';
  await resumeA.save();

  const res = await request(app)
    .post('/api/analyses')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      resumeId: resumeA._id,
      jobDescriptionId: jdA._id,
    });

  // If live Python service is available on port 8000:
  if (res.status === 201) {
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.analysis.isDemoData, false);
    assert.strictEqual(res.body.data.analysis.status, 'completed');
    assert.strictEqual(typeof res.body.data.analysis.overallScore, 'number');
    assert.ok(res.body.data.analysis.overallScore >= 0 && res.body.data.analysis.overallScore <= 100);
    assert.ok(res.body.data.analysis.structuredOutput.subScores);
  } else {
    // If Python service is offline in this test run:
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.body.data.analysis.status, 'failed');
  }
});

test('POST /api/analyses handles Python service failure without record corruption', async () => {
  const originalUrl = process.env.PYTHON_SERVICE_URL;
  process.env.PYTHON_SERVICE_URL = 'http://127.0.0.1:59999'; // Intentionally closed port

  try {
    resumeA.extractedText = 'Experienced Python and React developer building cloud applications with microservices.';
    resumeA.extractionStatus = 'completed';
    await resumeA.save();

    const res = await request(app)
      .post('/api/analyses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        resumeId: resumeA._id,
        jobDescriptionId: jdA._id,
      });

    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.data.analysis.status, 'failed');
    assert.match(res.body.data.analysis.errorMessage, /unreachable|unavailable/i);

    // Verify record in MongoDB was safely marked as failed rather than corrupted
    const saved = await AnalysisResult.findById(res.body.data.analysis._id);
    assert.strictEqual(saved.status, 'failed');
    assert.strictEqual(saved.isDemoData, false);
  } finally {
    process.env.PYTHON_SERVICE_URL = originalUrl;
  }
});
