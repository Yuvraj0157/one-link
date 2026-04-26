const crypto = require('crypto');

// Generate CSRF token
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Middleware to add CSRF token to session and locals
const csrfProtection = (req, res, next) => {
    // Skip CSRF for API routes or if already has token
    if (req.path.startsWith('/api/')) {
        return next();
    }

    // Generate token if not exists
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateToken();
    }

    // Make token available to views
    res.locals.csrfToken = req.session.csrfToken;
    
    next();
};

// Middleware to verify CSRF token on POST requests
const verifyCsrfToken = (req, res, next) => {
    // Skip for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip for API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }

    // Skip for routes that handle CSRF verification internally
    const skipRoutes = [
        '/appearance',           // Multipart form - verified after multer
        '/appearance/delete',    // AJAX - verified in route
        '/dashboard/handles',    // AJAX - verified in route
        '/dashboard/delete-link' // Form - verified in route
    ];

    if (skipRoutes.some(route => req.path.startsWith(route)) && req.method === 'POST') {
        return next();
    }

    const token = req.body._csrf || req.headers['x-csrf-token'];
    const sessionToken = req.session.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
        console.warn('CSRF token validation failed');
        return res.status(403).render('403', {
            error: 'Invalid security token. Please refresh the page and try again.'
        });
    }

    next();
};

module.exports = {
    csrfProtection,
    verifyCsrfToken,
    generateToken
};
