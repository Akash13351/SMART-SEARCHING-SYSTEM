// config/redis.js
const redis = require('redis');

// Connect to default local Redis instance
const redisClient = redis.createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.log('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Successfully connected to Redis Cache!');
});

// Since Redis 4.x+, we need to explicitly connect
redisClient.connect().catch(console.error);

module.exports = redisClient;
