const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { generateToken } = require('../src/middleware/auth');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');

let userA, userB, tokenA, tokenB;

test.before(async () => {
  await connectTestDB();
});

test.after(async () => {
  await closeTestDB();
});

test.beforeEach(async () => {
  await clearTestDB();

  userA = await User.create({
    name: 'Alice Candidate',
    email: 'alice@example.com',
    passwordHash: 'hashA',
  });
  tokenA = generateToken(userA);

  userB = await User.create({
    name: 'Bob Candidate',
    email: 'bob@example.com',
    passwordHash: 'hashB',
  });
  tokenB = generateToken(userB);
});

test('POST /api/resumes rejects upload when unauthenticated', async () => {
  const res = await request(app)
    .post('/api/resumes')
    .attach('file', Buffer.from('%PDF-1.4 test'), 'sample.pdf');

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/resumes rejects unsupported file extensions with 400 Bad Request', async () => {
  const res = await request(app)
    .post('/api/resumes')
    .set('Authorization', `Bearer ${tokenA}`)
    .attach('file', Buffer.from('malicious payload'), 'script.sh');

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.error.message.includes('Unsupported file format'));
});

test('POST /api/resumes uploads PDF, stores metadata, and handles Python extraction gracefully', async () => {
  const samplePdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Title (Resume) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
  );

  const res = await request(app)
    .post('/api/resumes')
    .set('Authorization', `Bearer ${tokenA}`)
    .attach('file', samplePdfBuffer, 'Alice_Resume.pdf');

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.resume.originalName, 'Alice_Resume.pdf');
  assert.ok(res.body.data.resume.fileName.startsWith('resume-'));
  assert.strictEqual(res.body.data.resume.filePath, undefined); // Path stripped for security

  // Verify persistence in MongoDB
  const savedInDb = await Resume.findById(res.body.data.resume._id);
  assert.ok(savedInDb);
  assert.strictEqual(savedInDb.userId.toString(), userA._id.toString());
  assert.ok(['completed', 'failed'].includes(savedInDb.extractionStatus));

  // Clean up test file on disk
  if (savedInDb.filePath && fs.existsSync(savedInDb.filePath)) {
    fs.unlinkSync(savedInDb.filePath);
  }
});

test('GET /api/resumes lists only the authenticated user resumes', async () => {
  // Create resume for Alice
  await Resume.create({
    userId: userA._id,
    originalName: 'Alice_CV.pdf',
    fileName: 'resume-alice.pdf',
    filePath: 'uploads/resume-alice.pdf',
    fileType: 'application/pdf',
    fileSize: 12000,
    extractionStatus: 'completed',
  });

  // Create resume for Bob
  await Resume.create({
    userId: userB._id,
    originalName: 'Bob_CV.pdf',
    fileName: 'resume-bob.pdf',
    filePath: 'uploads/resume-bob.pdf',
    fileType: 'application/pdf',
    fileSize: 14000,
    extractionStatus: 'completed',
  });

  // Alice fetches resumes
  const aliceRes = await request(app)
    .get('/api/resumes')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.strictEqual(aliceRes.status, 200);
  assert.strictEqual(aliceRes.body.data.count, 1);
  assert.strictEqual(aliceRes.body.data.resumes[0].originalName, 'Alice_CV.pdf');

  // Bob fetches resumes
  const bobRes = await request(app)
    .get('/api/resumes')
    .set('Authorization', `Bearer ${tokenB}`);

  assert.strictEqual(bobRes.status, 200);
  assert.strictEqual(bobRes.data?.count || bobRes.body.data.count, 1);
  assert.strictEqual(bobRes.body.data.resumes[0].originalName, 'Bob_CV.pdf');
});

test('GET /api/resumes/:id blocks cross-user access with 404', async () => {
  const aliceResume = await Resume.create({
    userId: userA._id,
    originalName: 'Confidential_Alice.pdf',
    fileName: 'resume-confidential.pdf',
    filePath: 'uploads/resume-confidential.pdf',
    fileType: 'application/pdf',
    fileSize: 15000,
  });

  // Bob attempts to read Alice's resume
  const bobRes = await request(app)
    .get(`/api/resumes/${aliceResume._id}`)
    .set('Authorization', `Bearer ${tokenB}`);

  assert.strictEqual(bobRes.status, 404);
  assert.strictEqual(bobRes.body.success, false);
});

test('DELETE /api/resumes/:id deletes resume and removes physical file', async () => {
  const testUploadDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(testUploadDir)) {
    fs.mkdirSync(testUploadDir, { recursive: true });
  }

  const dummyFilePath = path.join(testUploadDir, 'test-delete-file.pdf');
  fs.writeFileSync(dummyFilePath, 'dummy pdf content');

  const resume = await Resume.create({
    userId: userA._id,
    originalName: 'ToDelete.pdf',
    fileName: 'test-delete-file.pdf',
    filePath: dummyFilePath,
    fileType: 'application/pdf',
    fileSize: 2000,
  });

  assert.strictEqual(fs.existsSync(dummyFilePath), true);

  const deleteRes = await request(app)
    .delete(`/api/resumes/${resume._id}`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteRes.body.success, true);

  // File should be deleted from disk
  assert.strictEqual(fs.existsSync(dummyFilePath), false);

  // Document should be deleted from DB
  const inDb = await Resume.findById(resume._id);
  assert.strictEqual(inDb, null);
});
