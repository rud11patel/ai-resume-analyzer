const { getDBStatus } = require('../config/db');

/**
 * Controller to handle API health check request.
 * GET /api/health
 */
function getHealth(req, res) {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus.isConnected;

  const payload = {
    status: isHealthy ? 'ok' : 'degraded',
    message: isHealthy ? 'API and Database are operational' : 'API is running but Database is disconnected',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: {
        status: 'healthy',
        nodeVersion: process.version,
      },
      database: {
        status: dbStatus.statusText,
        connected: dbStatus.isConnected,
        databaseName: dbStatus.name || undefined,
      },
    },
  };

  // Return 200 even if degraded so clients/dashboards can inspect the service statuses
  res.status(200).json(payload);
}

module.exports = {
  getHealth,
};
