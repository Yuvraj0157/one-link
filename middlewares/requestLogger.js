const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Middleware to add correlation ID to each request
 */
const addCorrelationId = (req, res, next) => {
    // Check if correlation ID exists in headers, otherwise generate new one
    req.correlationId = req.headers['x-correlation-id'] || uuidv4();
    
    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', req.correlationId);
    
    next();
};

/**
 * Middleware to log incoming requests
 */
const logRequest = (req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    logger.info('Incoming request', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.userID || 'anonymous',
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        
        logger[logLevel]('Request completed', {
            correlationId: req.correlationId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.userID || 'anonymous',
        });
    });

    next();
};

/**
 * Middleware to sanitize sensitive data from logs
 */
const sanitizeLogData = (data) => {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    const sanitized = { ...data };
    
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '***REDACTED***';
        }
    });
    
    return sanitized;
};

module.exports = {
    addCorrelationId,
    logRequest,
    sanitizeLogData,
};

// Made with Bob
