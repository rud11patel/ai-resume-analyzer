const test = require('node:test');
const assert = require('node:assert');
const { validateEnv } = require('../src/config/env');

test('validateEnv throws clear error when MONGODB_URI is missing', () => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  try {
    assert.throws(
      () => validateEnv(),
      (err) => {
        return err.message.includes('MONGODB_URI is required');
      }
    );
  } finally {
    if (originalUri) {
      process.env.MONGODB_URI = originalUri;
    }
  }
});

test('validateEnv throws clear error when PORT is invalid', () => {
  const originalPort = process.env.PORT;
  const originalUri = process.env.MONGODB_URI;

  process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
  process.env.PORT = 'invalid-port';

  try {
    assert.throws(
      () => validateEnv(),
      (err) => {
        return err.message.includes('PORT must be a valid integer');
      }
    );
  } finally {
    process.env.PORT = originalPort;
    process.env.MONGODB_URI = originalUri;
  }
});
