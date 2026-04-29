const { getCache, setCache } = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {function} keyGenerator - Optional function to generate cache key
 */
function cacheMiddleware(ttl = 300, keyGenerator = null) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate cache key
            const cacheKey = keyGenerator 
                ? keyGenerator(req) 
                : `cache:${req.originalUrl || req.url}`;

            // Try to get cached response
            const cachedData = await getCache(cacheKey);
            
            if (cachedData) {
                logger.debug('Serving from cache', { 
                    correlationId: req.correlationId,
                    cacheKey 
                });
                return res.json(cachedData);
            }

            // Store original res.json function
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function(data) {
                // Cache the response
                setCache(cacheKey, data, ttl).catch(err => {
                    logger.error('Failed to cache response', { 
                        correlationId: req.correlationId,
                        error: err.message 
                    });
                });

                // Send the response
                return originalJson(data);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error', { 
                correlationId: req.correlationId,
                error: error.message 
            });
            next();
        }
    };
}

/**
 * Cache middleware for rendered pages
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Optional function to generate cache key
 */
function cachePageMiddleware(ttl = 300, keyGenerator = null) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate cache key
            const cacheKey = keyGenerator 
                ? keyGenerator(req) 
                : `page:${req.originalUrl || req.url}`;

            // Try to get cached response
            const cachedHtml = await getCache(cacheKey);
            
            if (cachedHtml) {
                logger.debug('Serving page from cache', { 
                    correlationId: req.correlationId,
                    cacheKey 
                });
                return res.send(cachedHtml);
            }

            // Store original res.render function
            const originalRender = res.render.bind(res);

            // Override res.render to cache the response
            res.render = function(view, options, callback) {
                // Call original render with a callback to capture HTML
                originalRender(view, options, (err, html) => {
                    if (err) {
                        if (callback) {
                            return callback(err);
                        }
                        return next(err);
                    }

                    // Cache the HTML
                    setCache(cacheKey, html, ttl).catch(err => {
                        logger.error('Failed to cache page', { 
                            correlationId: req.correlationId,
                            error: err.message 
                        });
                    });

                    // Send the response
                    if (callback) {
                        callback(null, html);
                    } else {
                        res.send(html);
                    }
                });
            };

            next();
        } catch (error) {
            logger.error('Cache page middleware error', { 
                correlationId: req.correlationId,
                error: error.message 
            });
            next();
        }
    };
}

/**
 * Generate cache key for user-specific data
 */
function userCacheKey(prefix) {
    return (req) => `${prefix}:user:${req.userID}`;
}

/**
 * Generate cache key for profile pages
 */
function profileCacheKey(req) {
    return `profile:${req.params.username}`;
}

module.exports = {
    cacheMiddleware,
    cachePageMiddleware,
    userCacheKey,
    profileCacheKey
};

// Made with Bob
