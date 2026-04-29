const redis = require('redis');

async function clearCache() {
    const client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    });

    try {
        await client.connect();
        console.log('Connected to Redis');
        
        await client.flushAll();
        console.log('✅ All Redis cache cleared successfully!');
        
        await client.quit();
        process.exit(0);
    } catch (error) {
        console.error('Error clearing cache:', error);
        process.exit(1);
    }
}

clearCache();

// Made with Bob
