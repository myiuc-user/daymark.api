const globalRequestCounts = new Map();
const sensitiveRequestCounts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;
const SENSITIVE_MAX_REQUESTS = 10;

const getKey = (req) => {
  return req.user?.id || req.ip || req.connection.remoteAddress;
};

const cleanupOldRequests = (counts, key) => {
  const now = Date.now();
  if (counts.has(key)) {
    const requests = counts.get(key).filter(time => now - time < WINDOW_MS);
    if (requests.length === 0) {
      counts.delete(key);
    } else {
      counts.set(key, requests);
    }
  }
};

const checkLimit = (counts, key, limit) => {
  const now = Date.now();
  cleanupOldRequests(counts, key);

  if (!counts.has(key)) {
    counts.set(key, []);
  }

  const requests = counts.get(key);
  requests.push(now);

  return requests.length <= limit ? null : requests.length;
};

export const rateLimiter = (req, res, next) => {
  const key = getKey(req);
  const exceeded = checkLimit(globalRequestCounts, key, MAX_REQUESTS);

  if (exceeded) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
  }

  res.set('X-RateLimit-Limit', MAX_REQUESTS);
  res.set('X-RateLimit-Remaining', MAX_REQUESTS - (globalRequestCounts.get(key)?.length || 0));
  res.set('X-RateLimit-Reset', new Date(Date.now() + WINDOW_MS).toISOString());

  next();
};

export const sensitiveRateLimiter = (req, res, next) => {
  const key = getKey(req);
  const exceeded = checkLimit(sensitiveRequestCounts, key, SENSITIVE_MAX_REQUESTS);

  if (exceeded) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
  }

  res.set('X-RateLimit-Limit', SENSITIVE_MAX_REQUESTS);
  res.set('X-RateLimit-Remaining', SENSITIVE_MAX_REQUESTS - (sensitiveRequestCounts.get(key)?.length || 0));
  res.set('X-RateLimit-Reset', new Date(Date.now() + WINDOW_MS).toISOString());

  next();
};
