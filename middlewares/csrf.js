const crypto = require('crypto');

// Generate CSRF token
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Middleware to add CSRF token to session and locals
// TEMPORARILY DISABLED - Will be re-enabled after testing
const csrfProtection = (req, res, next) => {
    // Provide empty token for compatibility with views
    res.locals.csrfToken = '';
    next();
};

// Middleware to verify CSRF token on POST requests
// TEMPORARILY DISABLED - Will be re-enabled after testing
const verifyCsrfToken = (req, res, next) => {
    // Skip all CSRF verification for now
    next();
};

module.exports = {
    csrfProtection,
    verifyCsrfToken,
    generateToken
};
