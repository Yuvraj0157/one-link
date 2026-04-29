const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const addCorrelationId = (req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('X-Correlation-ID', req.correlationId);
    next();
};

const logRequest = (req, res, next) => {
    const startTime = Date.now();
    
    logger.info('Incoming request', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.userID || 'anonymous',
    });

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
