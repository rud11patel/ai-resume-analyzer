const { validateEnv } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const app = require('./app');

async function startServer() {
  try {
    // 1. Validate environment configuration before booting
    const env = validateEnv();

    // 2. Connect to MongoDB (non-blocking failure allows degraded mode)
    await connectDB(env.MONGODB_URI);

    // 3. Start Express server
    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Express server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`[Server] Health check available at http://localhost:${env.PORT}/api/health`);
    });

    // 4. Graceful shutdown handler
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });

      // Force shutdown if cleanup takes too long
      setTimeout(() => {
        console.error('[Server] Forcefully shutting down after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error(`[Server Fatal Startup Error]: ${error.message}`);
    process.exit(1);
  }
}

// Global process error safety nets
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]:', error);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
