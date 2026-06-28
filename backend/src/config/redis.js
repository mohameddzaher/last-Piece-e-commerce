import { createClient } from 'redis';

/**
 * OPTIONAL Redis. Only activates when REDIS_URL is set. With it, socket.io can
 * broadcast across multiple app instances and rate limiting is shared cluster-
 * wide — both of which break on a single in-memory instance once you scale
 * horizontally. Without REDIS_URL, everything falls back to in-memory (fine for
 * a single instance), so this never blocks local dev or a basic deploy.
 */
let clientPromise = null;

export const redisEnabled = () => !!process.env.REDIS_URL;

/**
 * Returns a connected redis client (memoized), or null if REDIS_URL is unset
 * or the connection fails — callers must handle null and degrade gracefully.
 */
export const getRedis = async () => {
  if (!process.env.REDIS_URL) return null;
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    try {
      const client = createClient({ url: process.env.REDIS_URL });
      client.on('error', (e) => console.error('Redis error:', e.message));
      await client.connect();
      console.log('✅ Redis connected');
      return client;
    } catch (e) {
      console.error('⚠️  Redis connection failed, falling back to in-memory:', e.message);
      return null;
    }
  })();
  return clientPromise;
};
