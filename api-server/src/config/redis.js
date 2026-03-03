const { createClient } = require('redis');

let client = null;
let connectionFailed = false;

async function getRedisClient() {
  // If previous connection attempt failed, don't retry every request
  // Retry after 30 seconds
  if (connectionFailed) {
    if (Date.now() - connectionFailed < 30000) return null;
    connectionFailed = false;
  }

  if (client && client.isOpen) return client;

  client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    socket: {
      connectTimeout: 3000,
      reconnectStrategy: (retries) => {
        if (retries > 3) return false; // Stop after 3 retries
        return Math.min(retries * 500, 3000);
      }
    }
  });

  client.on('error', (err) => {
    if (err.code !== 'ECONNREFUSED') {
      console.error('Redis error:', err.message);
    }
  });

  client.on('reconnecting', () => {
    console.log('Redis reconnecting...');
  });

  try {
    await client.connect();
    console.log('Redis connected');
    connectionFailed = false;
    return client;
  } catch (err) {
    console.error('Redis connection failed:', err.message);
    connectionFailed = Date.now();
    client = null;
    return null;
  }
}

module.exports = { getRedisClient };
