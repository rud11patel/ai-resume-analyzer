const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const jobDescriptionRoutes = require('./routes/jobDescription.routes');
const analysisRoutes = require('./routes/analysis.routes');

const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

/**
 * Creates and configures the Express application.
 * Separated from server startup to allow isolated unit/integration testing.
 */
function createApp() {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  // CORS configuration
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) in development
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));

  // Request logging (concise and non-sensitive)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));
  }

  // Cookie parser for secure HTTP-only auth tokens
  app.use(cookieParser());

  // JSON request body parser with explicit limit
  const requestLimit = process.env.REQUEST_LIMIT || '10mb';
  app.use(express.json({ limit: requestLimit }));
  app.use(express.urlencoded({ extended: true, limit: requestLimit }));

  // API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/job-descriptions', jobDescriptionRoutes);
  app.use('/api/analyses', analysisRoutes);

  // Fallback 404 handler for unknown routes
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
