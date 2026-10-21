const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');
const JobDescription = require('../src/models/JobDescription');
const AnalysisResult = require('../src/models/AnalysisResult');

test.before(async () => {
  await connectTestDB();
});

test.after(async () => {
  await closeTestDB();
});

test('End-to-End Workflow: Register -> Login -> Upload Resume -> Save JD -> Analyze -> Retrieve History -> Delete', async () => {
  await clearTestDB();

  // 1. User Registration
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Samantha Carter',
      email: 'samantha.carter@example.com',
      password: 'SecurePassword123!',
    });

  assert.strictEqual(registerRes.status, 201);
  assert.strictEqual(registerRes.body.success, true);
  assert.ok(registerRes.body.data.token, 'Token returned on register');
  assert.strictEqual(registerRes.body.data.user.email, 'samantha.carter@example.com');
  assert.strictEqual(registerRes.body.data.user.passwordHash, undefined, 'Password hash must never be returned');

  // 2. User Login
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'samantha.carter@example.com',
      password: 'SecurePassword123!',
    });

  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.success, true);
  const token = loginRes.body.data.token;
  assert.ok(token);

  // 3. Authenticated Session Check
  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.body.data.user.name, 'Samantha Carter');

  // 4. Resume Upload (Simulated PDF buffer)
  const dummyPdfPath = path.join(__dirname, 'fixtures', 'test_e2e_resume.pdf');
  fs.mkdirSync(path.dirname(dummyPdfPath), { recursive: true });
  fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');

  const uploadRes = await request(app)
    .post('/api/resumes')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', dummyPdfPath, 'Samantha_Carter_Resume.pdf');

  assert.strictEqual(uploadRes.status, 201);
  assert.strictEqual(uploadRes.body.success, true);
  const resumeId = uploadRes.body.data.resume._id;
  assert.ok(resumeId);

  // Provide realistic extracted text to test AI pipeline
  const resumeDoc = await Resume.findById(resumeId);
  resumeDoc.extractedText = `
Samantha Carter
samantha@example.com | (555) 234-5678 | San Francisco, CA

PROFESSIONAL SUMMARY
Senior Full Stack Engineer with 6+ years of experience designing scalable distributed cloud systems, React web apps, and Python APIs.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL, Go
Frontend: React, Next.js, Tailwind CSS, Redux
Backend: Node.js, Express.js, FastAPI, REST, GraphQL
Data & Cloud: PostgreSQL, MongoDB, Docker, Kubernetes, AWS, CI/CD

EXPERIENCE
Lead Software Engineer | Apex Cloud Systems (2021 - Present)
- Architected high-performance microservices handling 25k req/sec with Node.js and Redis.
- Built mission-critical React dashboards with real-time WebSocket telemetry.
- Automated deployment pipelines using Docker, Kubernetes, and GitHub Actions.

Software Engineer | Nova Interactive (2018 - 2021)
- Developed RESTful API endpoints in Python and PostgreSQL.
- Maintained 99.9% uptime across production clusters.

EDUCATION
B.S. in Computer Science | University of California, Berkeley
`;
  resumeDoc.extractionStatus = 'completed';
  await resumeDoc.save();

  // 5. Job Description Creation
  const jdRes = await request(app)
    .post('/api/job-descriptions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      roleTitle: 'Senior Full Stack Engineer',
      company: 'Stripe',
      rawText: `
About the Role:
We are looking for a Senior Full Stack Engineer to build next-generation payment infrastructure.

Requirements:
- 5+ years of software development experience with React and Node.js.
- Strong proficiency in TypeScript, JavaScript, and Python.
- Proven experience with Docker, Kubernetes, CI/CD, and AWS.
- Solid background in PostgreSQL or MongoDB database design and query optimization.
- Experience with microservices architecture and distributed systems.
`,
    });

  assert.strictEqual(jdRes.status, 201);
  assert.strictEqual(jdRes.body.success, true);
  const jdId = jdRes.body.data.jobDescription._id;
  assert.ok(jdId);

  // 6. Resource Listing Check
  const listResumesRes = await request(app)
    .get('/api/resumes')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(listResumesRes.status, 200);
  assert.strictEqual(listResumesRes.body.data.count, 1);
  assert.strictEqual(listResumesRes.body.data.resumes[0].originalName, 'Samantha_Carter_Resume.pdf');

  const listJdsRes = await request(app)
    .get('/api/job-descriptions')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(listJdsRes.status, 200);
  assert.strictEqual(listJdsRes.body.data.count, 1);
  assert.strictEqual(listJdsRes.body.data.jobDescriptions[0].roleTitle, 'Senior Full Stack Engineer');

  // 7. Execute Analysis
  const analysisRes = await request(app)
    .post('/api/analyses')
    .set('Authorization', `Bearer ${token}`)
    .send({
      resumeId,
      jobDescriptionId: jdId,
    });

  // Verify response: If python service is live, 201; if test offline, 503 but handled safely
  let analysisId;
  if (analysisRes.status === 201) {
    assert.strictEqual(analysisRes.body.success, true);
    analysisId = analysisRes.body.data.analysis._id;
    assert.strictEqual(analysisRes.body.data.analysis.status, 'completed');
    assert.strictEqual(analysisRes.body.data.analysis.isDemoData, false);
    assert.ok(analysisRes.body.data.analysis.overallScore >= 0 && analysisRes.body.data.analysis.overallScore <= 100);
    assert.ok(analysisRes.body.data.analysis.structuredOutput);
  } else {
    // If Python service is offline in this test run:
    assert.strictEqual(analysisRes.status, 503);
    analysisId = analysisRes.body.data.analysis._id;
    assert.strictEqual(analysisRes.body.data.analysis.status, 'failed');
  }

  // 8. Retrieve Analysis Record by ID
  const getAnalysisRes = await request(app)
    .get(`/api/analyses/${analysisId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(getAnalysisRes.status, 200);
  assert.strictEqual(getAnalysisRes.body.data.analysis.resumeId.originalName, 'Samantha_Carter_Resume.pdf');
  assert.strictEqual(getAnalysisRes.body.data.analysis.jobDescriptionId.roleTitle, 'Senior Full Stack Engineer');

  // 9. Verify History List
  const historyRes = await request(app)
    .get('/api/analyses')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(historyRes.status, 200);
  assert.strictEqual(historyRes.body.data.count, 1);
  assert.strictEqual(historyRes.body.data.analyses[0]._id.toString(), analysisId.toString());

  // 10. Multi-Tenant Authorization Security Check
  const attackerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Malicious Mallory',
      email: 'mallory@example.com',
      password: 'Password999!',
    });
  const attackerToken = attackerRes.body.data.token;

  // Attacker cannot view Samantha's resume
  const stolenResume = await request(app)
    .get(`/api/resumes/${resumeId}`)
    .set('Authorization', `Bearer ${attackerToken}`);
  assert.strictEqual(stolenResume.status, 404);

  // Attacker cannot view Samantha's job description
  const stolenJd = await request(app)
    .get(`/api/job-descriptions/${jdId}`)
    .set('Authorization', `Bearer ${attackerToken}`);
  assert.strictEqual(stolenJd.status, 404);

  // Attacker cannot view Samantha's analysis
  const stolenAnalysis = await request(app)
    .get(`/api/analyses/${analysisId}`)
    .set('Authorization', `Bearer ${attackerToken}`);
  assert.strictEqual(stolenAnalysis.status, 404);

  // Attacker cannot trigger analysis using Samantha's resume
  const unauthorizedAnalysis = await request(app)
    .post('/api/analyses')
    .set('Authorization', `Bearer ${attackerToken}`)
    .send({
      resumeId,
      jobDescriptionId: jdId,
    });
  assert.strictEqual(unauthorizedAnalysis.status, 404);

  // 11. Safe Deletion & Cascade Verification
  const deleteAnalysisRes = await request(app)
    .delete(`/api/analyses/${analysisId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(deleteAnalysisRes.status, 200);

  const deleteResumeRes = await request(app)
    .delete(`/api/resumes/${resumeId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(deleteResumeRes.status, 200);

  const deleteJdRes = await request(app)
    .delete(`/api/job-descriptions/${jdId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(deleteJdRes.status, 200);

  // Verify resources are wiped from database
  const countResumes = await Resume.countDocuments({ userId: meRes.body.data.user._id });
  const countJds = await JobDescription.countDocuments({ userId: meRes.body.data.user._id });
  const countAnalyses = await AnalysisResult.countDocuments({ userId: meRes.body.data.user._id });
  assert.strictEqual(countResumes, 0);
  assert.strictEqual(countJds, 0);
  assert.strictEqual(countAnalyses, 0);

  // Clean fixture file
  if (fs.existsSync(dummyPdfPath)) {
    fs.unlinkSync(dummyPdfPath);
  }
});
