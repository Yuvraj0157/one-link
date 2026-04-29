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

    // Skip for API routes and public routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/profile') || req.path.startsWith('/track')) {
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
        console.warn('CSRF token validation failed', {
            hasToken: !!token,
            hasSessionToken: !!sessionToken,
            tokensMatch: token === sessionToken,
            path: req.path
        });
        
        // If it's a form submission, redirect back with error
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            req.flash('error', 'Your session has expired. Please try again.');
            return res.redirect('back');
        }
        
        return res.status(403).render('403', {
            error: 'Invalid security token. Your session may have expired. Please refresh the page and try again.'
        });
    }

    next();
};

module.exports = {
    csrfProtection,
    verifyCsrfToken,
    generateToken
};
