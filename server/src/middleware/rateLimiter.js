/**
 * Lightweight, in-memory rate limiting middleware.
 * Protects sensitive endpoints (auth, file upload, AI analysis execution)
 * against brute-force attacks and abuse without external Redis infrastructure.
 */

function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes by default
  max = 100, // max requests per windowMs per IP
  message = 'Too many requests from this IP address. Please try again later.',
} = {}) {
  const requestCounts = new Map();

  // Periodic cleanup of expired windows to prevent memory accumulation
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts.entries()) {
      if (now > record.resetTime) {
        requestCounts.delete(ip);
      }
    }
  }, Math.min(windowMs, 60000));

  // Allow Node.js event loop to exit without waiting for timer
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return function rateLimiter(req, res, next) {
    // In test environment, bypass rate limiting to prevent test suite interference
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    let clientRecord = requestCounts.get(clientIp);

    if (!clientRecord || now > clientRecord.resetTime) {
      clientRecord = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestCounts.set(clientIp, clientRecord);
    } else {
      clientRecord.count += 1;
    }

    const remaining = Math.max(0, max - clientRecord.count);
    const retryAfterSeconds = Math.ceil((clientRecord.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));

    if (clientRecord.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: {
          message,
          statusCode: 429,
          retryAfter: retryAfterSeconds,
        },
      });
    }

    next();
  };
}

// Preset rate limiters for specific route tiers
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Resume upload rate limit exceeded. Please wait a minute before uploading again.',
});

const analysisRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'AI analysis rate limit exceeded. Please wait a minute before submitting further requests.',
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  analysisRateLimiter,
};
