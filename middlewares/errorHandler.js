const logger = require('../utils/logger');

/**
 * Custom Application Error class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Not Found Error Handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
    error.correlationId = req.correlationId;
    next(error);
};

/**
 * Centralized Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    const correlationId = req.correlationId || 'unknown';
    
    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let isOperational = err.isOperational || false;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        isOperational = true;
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        isOperational = true;
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value entered';
        isOperational = true;
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        isOperational = true;
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        isOperational = true;
    }

    // Log error with correlation ID
    const errorLog = {
        correlationId,
        statusCode,
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.userID || 'anonymous',
    };

    if (statusCode >= 500) {
        logger.error('Server Error', errorLog);
    } else {
        logger.warn('Client Error', errorLog);
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && !isOperational) {
        message = 'Something went wrong';
    }

    // Send appropriate response based on request type
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        // API/AJAX request - send JSON
        return res.status(statusCode).json({
            success: false,
            error: {
                message,
                correlationId,
                ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
            },
        });
    }

    // Regular request - render error page
    if (statusCode === 404) {
        return res.status(404).render('404', { correlationId });
    } else if (statusCode === 403) {
        return res.status(403).render('403', { correlationId });
    } else {
        return res.status(statusCode).render('500', { 
            correlationId,
            message: process.env.NODE_ENV !== 'production' ? message : 'Something went wrong'
        });
    }
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', {
            reason: reason instanceof Error ? reason.message : reason,
            stack: reason instanceof Error ? reason.stack : undefined,
            promise,
        });
        // In production, you might want to gracefully shutdown
        // process.exit(1);
    });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', {
            message: error.message,
            stack: error.stack,
        });
        // Exit process as the application is in an undefined state
        process.exit(1);
    });
};

module.exports = {
    AppError,
    asyncHandler,
    notFoundHandler,
    errorHandler,
    handleUnhandledRejection,
    handleUncaughtException,
};

// Made with Bob
