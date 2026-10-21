const mongoose = require('mongoose');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_resume_analyzer_test';

async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }
}

async function clearTestDB() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

async function closeTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await clearTestDB();
    await mongoose.disconnect();
  }
}

module.exports = {
  connectTestDB,
  clearTestDB,
  closeTestDB,
  TEST_DB_URI,
};
