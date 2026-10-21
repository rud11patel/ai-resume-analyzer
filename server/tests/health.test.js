const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

test('GET /api/health returns 200 and structured health information', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect('Content-Type', /json/)
    .expect(200);

  assert.ok(response.body);
  assert.ok(['ok', 'degraded'].includes(response.body.status));
  assert.strictEqual(typeof response.body.uptime, 'number');
  assert.ok(response.body.timestamp);
  assert.ok(response.body.services);
  assert.strictEqual(response.body.services.api.status, 'healthy');
  assert.ok(typeof response.body.services.database.connected === 'boolean');
});

test('GET /api/unknown-endpoint returns 404 with structured JSON error', async () => {
  const response = await request(app)
    .get('/api/unknown-endpoint')
    .expect('Content-Type', /json/)
    .expect(404);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.error.statusCode, 404);
  assert.match(response.body.error.message, /Route not found/);
});
