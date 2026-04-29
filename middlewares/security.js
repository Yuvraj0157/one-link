const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes (login, register, forgot password)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests
    // Validate proxy configuration
    validate: {trustProxy: false}
});

// Rate limiter for general routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per 15 minutes (more reasonable for development)
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // Validate proxy configuration
    validate: {trustProxy: false},
    skip: (req) => {
        // Skip rate limiting for static assets
        return req.path.startsWith('/public/') ||
               req.path.startsWith('/css/') ||
               req.path.startsWith('/js/') ||
               req.path.endsWith('.css') ||
               req.path.endsWith('.js') ||
               req.path.endsWith('.ico') ||
               req.path.endsWith('.svg') ||
               req.path.endsWith('.png') ||
               req.path.endsWith('.jpg');
    }
});

// Rate limiter for email verification resend
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per hour
    message: 'Too many email requests, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
    // Validate proxy configuration
    validate: {trustProxy: false}
});

// Rate limiter for password reset
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per hour
    message: 'Too many password reset attempts, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
    // Validate proxy configuration
    validate: {trustProxy: false}
});

module.exports = {
    authLimiter,
    generalLimiter,
    emailLimiter,
    passwordResetLimiter
};