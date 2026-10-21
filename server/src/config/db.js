const mongoose = require('mongoose');

/**
 * Sanitizes a MongoDB connection URI for safe logging without exposing passwords.
 * @param {string} uri 
 * @returns {string} Sanitized URI
 */
function sanitizeMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@.+)/i, '$1****$2');
}

/**
 * Maps Mongoose readyState numbers to human-readable strings.
 */
function getReadyStateText(state) {
  switch (state) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
}

/**
 * Connect to MongoDB with error handling and retry timeout.
 * @param {string} uri 
 * @returns {Promise<typeof mongoose>}
 */
async function connectDB(uri) {
  if (!uri) {
    throw new Error('connectDB requires a valid MONGODB_URI');
  }

  const safeUri = sanitizeMongoUri(uri);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
    });

    console.log(`[Database] MongoDB connected successfully to ${safeUri}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB (${safeUri}): ${error.message}`);
    // We do not rethrow fatal exit here so the HTTP server can still run in degraded mode if desired
    return null;
  }
}

/**
 * Disconnect from MongoDB (useful for graceful shutdown or tests).
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected cleanly');
  }
}

/**
 * Returns current database health status.
 */
function getDBStatus() {
  const state = mongoose.connection.readyState;
  return {
    state,
    statusText: getReadyStateText(state),
    isConnected: state === 1,
    host: mongoose.connection.host ? mongoose.connection.host : null,
    name: mongoose.connection.name ? mongoose.connection.name : null,
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
  sanitizeMongoUri,
};
