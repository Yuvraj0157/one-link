const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

// Promisify jwt.verify for async/await usage
const verifyToken = promisify(jwt.verify);

/**
 * Authentication middleware - checks if user has valid JWT token
 */
const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies['jwt'];
        
        if (!token) {
            req.isLoggedIn = false;
            // If accessing protected route, redirect to login
            if (req.path.startsWith('/dashboard') || req.path.startsWith('/appearance') || req.path.startsWith('/analytics')) {
                return res.redirect('/login');
            }
            // For home page, just set isLoggedIn flag
            return next();
        }

        // Verify token
        const decodedToken = await verifyToken(token, process.env.JWT_LOGIN_SECRET);
        
        // Set user info in request
        req.userID = decodedToken.userID;
        req.isLoggedIn = true;
        
        logger.debug('User authenticated', {
            correlationId: req.correlationId,
            userId: req.userID,
        });
        
        next();
    } catch (err) {
        logger.warn('Authentication failed', {
            correlationId: req.correlationId,
            error: err.message,
        });
        
        // Clear invalid token
        res.clearCookie('jwt');
        req.isLoggedIn = false;
        
        // If accessing protected route, redirect to login
        if (req.path.startsWith('/dashboard') || req.path.startsWith('/appearance') || req.path.startsWith('/analytics')) {
            return res.redirect('/login');
        }
        
        // For home page, continue with isLoggedIn = false
        return next();
    }
};

/**
 * Email verification middleware - checks if user has verified their email
 */
const isVerified = async (req, res, next) => {
    try {
        const user = await User.findById(req.userID).select('status email');
        
        if (!user) {
            throw new AppError('User not found', 404);
        }
        
        if (user.status === 'verification') {
            logger.info('User email not verified', {
                correlationId: req.correlationId,
                userId: req.userID,
            });
            return res.render('dashboard/mailverification.ejs', { user: user });
        }
        
        next();
    } catch (err) {
        logger.error('Error checking user verification status', {
            correlationId: req.correlationId,
            userId: req.userID,
            error: err.message,
        });
        throw err;
    }
};

module.exports = { isAuth, isVerified };
