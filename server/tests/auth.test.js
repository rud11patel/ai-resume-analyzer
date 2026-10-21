const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../src/models/User');

test.before(async () => {
  await connectTestDB();
});

test.after(async () => {
  await closeTestDB();
});

test.beforeEach(async () => {
  await clearTestDB();
});

test('POST /api/auth/register creates user, returns token, and sets cookie', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      password: 'SecurePassword123!',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.user.name, 'Jordan Lee');
  assert.strictEqual(res.body.data.user.email, 'jordan.lee@example.com');
  assert.strictEqual(res.body.data.user.passwordHash, undefined); // Password hash must never leak
  assert.ok(res.body.data.token);

  // Check HTTP-only cookie
  const cookieHeader = res.headers['set-cookie'];
  assert.ok(cookieHeader);
  assert.ok(cookieHeader.some((c) => c.includes('token=')));
  assert.ok(cookieHeader.some((c) => c.includes('HttpOnly')));
});

test('POST /api/auth/register rejects duplicate email address with 409 Conflict', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      password: 'SecurePassword123!',
    });

  const duplicateRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jordan Duplicate',
      email: 'JORDAN.LEE@example.com', // Case insensitivity check
      password: 'AnotherPassword456!',
    });

  assert.strictEqual(duplicateRes.status, 409);
  assert.strictEqual(duplicateRes.body.success, false);
  assert.ok(duplicateRes.body.error.message.includes('already exists'));
});

test('POST /api/auth/register validates required fields and password length', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jo',
      email: 'invalid-email',
      password: '123',
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/auth/login authenticates with valid credentials', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      password: 'SecurePassword123!',
    });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'jordan.lee@example.com',
      password: 'SecurePassword123!',
    });

  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.success, true);
  assert.ok(loginRes.body.data.token);
  assert.strictEqual(loginRes.body.data.user.email, 'jordan.lee@example.com');
});

test('POST /api/auth/login rejects incorrect password with 401 Unauthorized', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      password: 'SecurePassword123!',
    });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'jordan.lee@example.com',
      password: 'WrongPassword!',
    });

  assert.strictEqual(loginRes.status, 401);
  assert.strictEqual(loginRes.body.success, false);
  assert.strictEqual(loginRes.body.error.message, 'Invalid email or password.');
});

test('GET /api/auth/me returns authenticated user profile with Bearer token', async () => {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      password: 'SecurePassword123!',
    });

  const token = regRes.body.data.token;

  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.body.success, true);
  assert.strictEqual(meRes.body.data.user.email, 'jordan.lee@example.com');
});

test('GET /api/auth/me returns 401 when no token is supplied', async () => {
  const meRes = await request(app).get('/api/auth/me');
  assert.strictEqual(meRes.status, 401);
  assert.strictEqual(meRes.body.success, false);
});

test('POST /api/auth/logout clears auth cookie', async () => {
  const res = await request(app).post('/api/auth/logout');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  const cookieHeader = res.headers['set-cookie'];
  assert.ok(cookieHeader);
  assert.ok(cookieHeader.some((c) => c.includes('token=;')));
});
