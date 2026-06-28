import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis, redisEnabled } from '../config/redis.js';

// Development mode check - more lenient limits in dev
const isDev = process.env.NODE_ENV === 'development';

// When Redis is configured, share rate-limit counters across all app instances
// (in-memory counters would let a client get N× the limit by hitting N
// instances). Built lazily so a Redis hiccup can't crash limiter construction.
const makeStore = (prefix) => {
  if (!redisEnabled()) return undefined;
  try {
    return new RedisStore({
      prefix,
      sendCommand: async (...args) => {
        const client = await getRedis();
        if (!client) throw new Error('redis unavailable');
        return client.sendCommand(args);
      },
    });
  } catch {
    return undefined; // fall back to in-memory
  }
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 10, // More attempts in dev
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  store: makeStore('rl:auth:'),
});

export const apiLimiter = rateLimit({
  // An SPA fires many calls per page view (list + facets + cart + wishlist…),
  // so 200/15min throttled legit browsing. 1500/15min (~100/min) still blocks
  // scrapers/abuse but leaves real users plenty of headroom. Tune via env.
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX || (isDev ? 5000 : 1500)),
  message: { success: false, message: 'Too many requests from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:api:'),
});

export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 100 : 30, // More searches in dev
  message: { success: false, message: 'Too many search requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:search:'),
});
