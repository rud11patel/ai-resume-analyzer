const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { generateToken } = require('../src/middleware/auth');
const User = require('../src/models/User');
const JobDescription = require('../src/models/JobDescription');

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
    name: 'User A',
    email: 'usera@example.com',
    passwordHash: 'hashA',
  });
  tokenA = generateToken(userA);

  userB = await User.create({
    name: 'User B',
    email: 'userb@example.com',
    passwordHash: 'hashB',
  });
  tokenB = generateToken(userB);
});

test('POST /api/job-descriptions creates job description for authenticated user', async () => {
  const res = await request(app)
    .post('/api/job-descriptions')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      roleTitle: 'Senior Backend Engineer',
      company: 'Datadog',
      rawText: 'Looking for a Senior Backend Engineer proficient in Node.js, distributed databases, and high-throughput microservices.',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.jobDescription.roleTitle, 'Senior Backend Engineer');
  assert.strictEqual(res.body.data.jobDescription.company, 'Datadog');
});

test('POST /api/job-descriptions rejects requests with missing or short rawText', async () => {
  const res = await request(app)
    .post('/api/job-descriptions')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      roleTitle: 'Senior Backend Engineer',
      rawText: 'Too short',
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('GET /api/job-descriptions lists only the current user job descriptions', async () => {
  await JobDescription.create({
    userId: userA._id,
    roleTitle: 'Role for A',
    company: 'Company A',
    rawText: 'Description for user A position requiring engineering depth and system design.',
  });

  await JobDescription.create({
    userId: userB._id,
    roleTitle: 'Role for B',
    company: 'Company B',
    rawText: 'Description for user B position requiring engineering depth and system design.',
  });

  const resA = await request(app)
    .get('/api/job-descriptions')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.strictEqual(resA.status, 200);
  assert.strictEqual(resA.body.data.count, 1);
  assert.strictEqual(resA.body.data.jobDescriptions[0].roleTitle, 'Role for A');
});

test('DELETE /api/job-descriptions/:id removes record and blocks cross-user deletion', async () => {
  const jd = await JobDescription.create({
    userId: userA._id,
    roleTitle: 'Role to Delete',
    rawText: 'Valid job description content that will be tested for secure deletion.',
  });

  // User B tries to delete User A's JD
  const badDelete = await request(app)
    .delete(`/api/job-descriptions/${jd._id}`)
    .set('Authorization', `Bearer ${tokenB}`);

  assert.strictEqual(badDelete.status, 404);

  // User A deletes own JD
  const goodDelete = await request(app)
    .delete(`/api/job-descriptions/${jd._id}`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert.strictEqual(goodDelete.status, 200);

  const found = await JobDescription.findById(jd._id);
  assert.strictEqual(found, null);
});
