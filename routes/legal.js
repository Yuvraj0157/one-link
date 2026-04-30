/**
 * Legal Routes
 * Handles Privacy Policy and Terms of Service pages
 * 
 * @module routes/legal
 */

const express = require('express');
const router = express.Router();

/**
 * GET /privacy-policy
 * Display Privacy Policy page
 * 
 * @route GET /privacy-policy
 * @returns {HTML} Privacy Policy page
 */
router.get('/privacy-policy', (req, res) => {
    res.render('legal/privacy-policy', {
        title: 'Privacy Policy'
    });
});

/**
 * GET /terms-of-service
 * Display Terms of Service page
 * 
 * @route GET /terms-of-service
 * @returns {HTML} Terms of Service page
 */
router.get('/terms-of-service', (req, res) => {
    res.render('legal/terms-of-service', {
        title: 'Terms of Service'
    });
});

/**
 * GET /terms (alias for /terms-of-service)
 * Display Terms of Service page
 * 
 * @route GET /terms
 * @returns {HTML} Terms of Service page
 */
router.get('/terms', (req, res) => {
    res.redirect('/terms-of-service');
});

/**
 * GET /privacy (alias for /privacy-policy)
 * Display Privacy Policy page
 * 
 * @route GET /privacy
 * @returns {HTML} Privacy Policy page
 */
router.get('/privacy', (req, res) => {
    res.redirect('/privacy-policy');
});

module.exports = router;

// Made with Bob
