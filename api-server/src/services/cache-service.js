const { getRedisClient } = require('../config/redis');

// In-memory fallback cache if Redis is unavailable
const memoryCache = new Map();

const CacheService = {
  /**
   * Get cached value
   */
  async get(key) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const val = await redis.get(key);
        return val ? JSON.parse(val) : null;
      }
    } catch (err) {
      console.error('Cache get error:', err.message);
    }

    // Fallback to memory
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    memoryCache.delete(key);
    return null;
  },

  /**
   * Set cached value with TTL in seconds
   */
  async set(key, data, ttlSeconds = 300) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.setEx(key, ttlSeconds, JSON.stringify(data));
        return;
      }
    } catch (err) {
      console.error('Cache set error:', err.message);
    }

    // Fallback to memory
    memoryCache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000
    });
  },

  /**
   * Invalidate cache by key or pattern
   */
  async invalidate(pattern) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
        return;
      }
    } catch (err) {
      console.error('Cache invalidate error:', err.message);
    }

    // Fallback: clear matching memory keys
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        memoryCache.delete(key);
      }
    }
  }
};

module.exports = CacheService;
