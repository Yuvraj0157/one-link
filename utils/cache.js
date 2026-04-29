const redis = require('redis');
const logger = require('./logger');

// Redis client configuration
let redisClient = null;
let isRedisConnected = false;

// Initialize Redis client
async function initRedis() {
    try {
        // Only initialize if Redis URL is provided
        if (!process.env.REDIS_URL) {
            logger.warn('Redis URL not configured. Caching will be disabled.');
            return null;
        }

        redisClient = redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection failed after 10 attempts');
                        return new Error('Redis reconnection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error', { error: err.message });
            isRedisConnected = false;
        });

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
            isRedisConnected = true;
        });

        redisClient.on('ready', () => {
            logger.info('Redis client ready');
            isRedisConnected = true;
        });

        redisClient.on('end', () => {
            logger.warn('Redis client disconnected');
            isRedisConnected = false;
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        logger.error('Failed to initialize Redis', { error: error.message });
        isRedisConnected = false;
        return null;
    }
}

// Get cached data
async function getCache(key) {
    if (!isRedisConnected || !redisClient) {
        return null;
    }

    try {
        const data = await redisClient.get(key);
        if (data) {
            logger.debug('Cache hit', { key });
            return JSON.parse(data);
        }
        logger.debug('Cache miss', { key });
        return null;
    } catch (error) {
        logger.error('Cache get error', { key, error: error.message });
        return null;
    }
}

// Set cached data with TTL (time to live in seconds)
async function setCache(key, data, ttl = 300) {
    if (!isRedisConnected || !redisClient) {
        return false;
    }

    try {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        logger.debug('Cache set', { key, ttl });
        return true;
    } catch (error) {
        logger.error('Cache set error', { key, error: error.message });
        return false;
    }
}

// Delete cached data
async function deleteCache(key) {
    if (!isRedisConnected || !redisClient) {
        return false;
    }

    try {
        await redisClient.del(key);
        logger.debug('Cache deleted', { key });
        return true;
    } catch (error) {
        logger.error('Cache delete error', { key, error: error.message });
        return false;
    }
}

// Delete multiple keys matching a pattern
async function deleteCachePattern(pattern) {
    if (!isRedisConnected || !redisClient) {
        return false;
    }

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            logger.debug('Cache pattern deleted', { pattern, count: keys.length });
        }
        return true;
    } catch (error) {
        logger.error('Cache pattern delete error', { pattern, error: error.message });
        return false;
    }
}

// Clear all cache
async function clearCache() {
    if (!isRedisConnected || !redisClient) {
        return false;
    }

    try {
        await redisClient.flushAll();
        logger.info('All cache cleared');
        return true;
    } catch (error) {
        logger.error('Cache clear error', { error: error.message });
        return false;
    }
}

// Check if Redis is connected
function isConnected() {
    return isRedisConnected;
}

// Close Redis connection
async function closeRedis() {
    if (redisClient) {
        try {
            await redisClient.quit();
            logger.info('Redis connection closed');
        } catch (error) {
            logger.error('Error closing Redis connection', { error: error.message });
        }
    }
}

module.exports = {
    initRedis,
    getCache,
    setCache,
    deleteCache,
    deleteCachePattern,
    clearCache,
    isConnected,
    closeRedis
};
