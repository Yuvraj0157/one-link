const express = require('express');
const router = express.Router();

const Profile = require('../models/profile');
const User = require('../models/user');
const { Link } = require('../models/link');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Dashboard home page
 */
router.get('/', async (req, res) => {
    const profile = await Profile.findOne({ userid: req.userID });
    const user = await User.findById(req.userID);
    
    if (!user) {
        throw new AppError('User not found', 404);
    }
    
    logger.info('Dashboard accessed', {
        correlationId: req.correlationId,
        userId: req.userID,
    });
    
    res.render('dashboard/index', { user, profile });
});

/**
 * Add link page
 */
router.get('/add-link', async (req, res) => {
    const user = await User.findById(req.userID);
    
    if (!user) {
        throw new AppError('User not found', 404);
    }
    
    res.render('dashboard/add_link', { user });
});

/**
 * Add new link
 */
router.post('/add-link', async (req, res) => {
    const { title, url } = req.body;
    
    if (!title || !url) {
        throw new AppError('Title and URL are required', 400);
    }
    
    const newLink = new Link({ title, url });
    await Profile.updateOne(
        { userid: req.userID },
        { $push: { links: newLink } }
    );
    
    logger.info('Link added', {
        correlationId: req.correlationId,
        userId: req.userID,
        linkTitle: title,
    });
    
    res.redirect('/dashboard');
});

/**
 * Update link page
 */
router.get('/update-link', async (req, res) => {
    const { id } = req.query;
    
    if (!id) {
        throw new AppError('Link ID is required', 400);
    }
    
    const user = await User.findById(req.userID);
    const profile = await Profile.findOne({ userid: req.userID });
    
    if (!user || !profile) {
        throw new AppError('User or profile not found', 404);
    }
    
    const link = profile.links.id(id);
    
    if (!link) {
        throw new AppError('Link not found', 404);
    }
    
    res.render('dashboard/update_link', { link, user });
});

/**
 * Update link
 */
router.post('/update-link', async (req, res) => {
    const { title, url, linkID } = req.body;
    
    if (!title || !url || !linkID) {
        throw new AppError('Title, URL, and Link ID are required', 400);
    }
    
    const profile = await Profile.findOne({ userid: req.userID });
    
    if (!profile) {
        throw new AppError('Profile not found', 404);
    }
    
    const link = profile.links.id(linkID);
    
    if (!link) {
        throw new AppError('Link not found', 404);
    }
    
    link.title = title;
    link.url = url;
    await profile.save();
    
    logger.info('Link updated', {
        correlationId: req.correlationId,
        userId: req.userID,
        linkId: linkID,
    });
    
    res.redirect('/dashboard');
});

/**
 * Delete link
 */
router.post('/delete-link', async (req, res) => {
    // CSRF verification
    const token = req.body._csrf;
    if (!token || token !== req.session.csrfToken) {
        throw new AppError('Invalid security token. Please try again.', 403);
    }
    
    const { id } = req.body;
    
    if (!id) {
        throw new AppError('Link ID is required', 400);
    }
    
    const profile = await Profile.findOne({ userid: req.userID });
    
    if (!profile) {
        throw new AppError('Profile not found', 404);
    }
    
    const link = profile.links.id(id);
    
    if (!link) {
        throw new AppError('Link not found', 404);
    }
    
    link.deleteOne();
    await profile.save();
    
    logger.info('Link deleted', {
        correlationId: req.correlationId,
        userId: req.userID,
        linkId: id,
    });
    
    res.redirect('/dashboard');
});

/**
 * Social handles page
 */
router.get('/handles', async (req, res) => {
    const user = await User.findById(req.userID);
    const profile = await Profile.findOne({ userid: req.userID });
    
    if (!user || !profile) {
        throw new AppError('User or profile not found', 404);
    }
    
    res.render('dashboard/handles', { user, data: profile });
});

/**
 * Update social handles
 */
router.post('/handles', async (req, res) => {
    // CSRF verification for AJAX request
    const token = req.body._csrf || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
        return res.status(403).json({
            status: 'error',
            message: 'Invalid CSRF token',
        });
    }
    
    try {
        const data = { ...req.body };
        // Remove CSRF token from data before saving
        delete data._csrf;
        
        const profile = await Profile.findOne({ userid: req.userID });
        
        if (!profile) {
            return res.status(404).json({
                status: 'error',
                message: 'Profile not found',
            });
        }
        
        const newData = { ...profile.handles, ...data };
        await Profile.updateOne({ userid: req.userID }, { handles: newData });
        
        logger.info('Social handles updated', {
            correlationId: req.correlationId,
            userId: req.userID,
        });
        
        res.json({
            status: 'success',
            message: 'Handles updated successfully',
        });
    } catch (err) {
        logger.error('Error updating handles', {
            correlationId: req.correlationId,
            userId: req.userID,
            error: err.message,
        });
        
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating handles.',
        });
    }
});

module.exports = router;
