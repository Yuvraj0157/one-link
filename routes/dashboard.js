const express = require('express');
const router = express.Router();

const Profile = require('../models/profile');
const User = require('../models/user');
const { Link } = require('../models/link');
const LinkClick = require('../models/linkClick');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');
const { deleteCachePattern } = require('../utils/cache');

/**
 * Dashboard home page
 */
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const profile = await Profile.findOne({ userid: req.userID }).lean();
    const user = await User.findById(req.userID).select('username email status').lean();
    
    if (!user) {
        throw new AppError('User not found', 404);
    }
    
    // Calculate quick stats
    const stats = {
        totalLinks: 0,
        activeLinks: 0,
        totalViews: profile?.totalViews || 0,
        totalClicks: 0
    };
    
    if (profile && profile.links) {
        stats.totalLinks = profile.links.length;
        stats.activeLinks = profile.links.filter(link => link.active !== false).length;
    }
    
    // Calculate total clicks in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const clicksCount = await LinkClick.countDocuments({
        userId: req.userID,
        timestamp: { $gte: thirtyDaysAgo }
    });
    stats.totalClicks = clicksCount;
    
    // Filter only active links and paginate
    let paginatedProfile = { ...profile };
    if (profile && profile.links) {
        // Filter active links only
        const activeLinks = profile.links.filter(link => link.active !== false);
        const totalLinks = activeLinks.length;
        const totalPages = Math.ceil(totalLinks / limit);
        
        paginatedProfile.links = activeLinks.slice(skip, skip + limit);
        paginatedProfile.pagination = {
            page,
            limit,
            totalPages,
            totalLinks,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }
    
    logger.info('Dashboard accessed', {
        correlationId: req.correlationId,
        userId: req.userID,
    });
    
    res.render('dashboard/index', { user, profile: paginatedProfile, stats, pageTitle: 'Dashboard' });
});

/**
 * Add link page
 */
router.get('/add-link', async (req, res) => {
    const user = await User.findById(req.userID).select('username email').lean();
    
    if (!user) {
        throw new AppError('User not found', 404);
    }
    
    res.render('dashboard/add_link', { user, pageTitle: 'Add Link' });
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
    
    // Invalidate user's profile cache
    const user = await User.findById(req.userID).select('username').lean();
    if (user) {
        await deleteCachePattern(`profile:${user.username}*`);
        await deleteCachePattern(`analytics:*:${req.userID}*`);
    }
    
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
    
    const user = await User.findById(req.userID).select('username email').lean();
    const profile = await Profile.findOne({ userid: req.userID });
    
    if (!user || !profile) {
        throw new AppError('User or profile not found', 404);
    }
    
    const link = profile.links.id(id);
    
    if (!link) {
        throw new AppError('Link not found', 404);
    }
    
    res.render('dashboard/update_link', { link, user, pageTitle: 'Update Link' });
});

/**
 * Update link
 */
router.post('/update-link', async (req, res) => {
    const { title, url, linkID } = req.body;
    
    if (!title || !url || !linkID) {
        throw new AppError('Title, URL, and Link ID are required', 400);
    }
    
    const profile = await Profile.findOne({ userid: req.userID }).select('links');
    
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
    
    // Invalidate user's profile cache
    const user = await User.findById(req.userID).select('username').lean();
    if (user) {
        await deleteCachePattern(`profile:${user.username}*`);
        await deleteCachePattern(`analytics:*:${req.userID}*`);
    }
    
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
    
    const { id } = req.body;
    
    if (!id) {
        throw new AppError('Link ID is required', 400);
    }
    
    const profile = await Profile.findOne({ userid: req.userID }).select('links');
    
    if (!profile) {
        throw new AppError('Profile not found', 404);
    }
    
    const link = profile.links.id(id);
    
    if (!link) {
        throw new AppError('Link not found', 404);
    }
    
    // Soft delete: Mark link as inactive instead of deleting
    link.active = false;
    await profile.save();
    
    logger.info('Link marked as inactive (soft delete)', {
        correlationId: req.correlationId,
        userId: req.userID,
        linkId: id
    });
    
    // Invalidate user's profile cache
    const user = await User.findById(req.userID).select('username').lean();
    if (user) {
        await deleteCachePattern(`profile:${user.username}*`);
        await deleteCachePattern(`analytics:*:${req.userID}*`);
    }
    
    logger.info('Link deleted', {
        correlationId: req.correlationId,
        userId: req.userID,
        linkId: id,
    });
    
    res.redirect('/dashboard');
});

/**
 * Restore archived link
 */
router.post('/restore-link', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, message: 'Link ID is required' });
        }
        
        const profile = await Profile.findOne({ userid: req.userID }).select('links');
        
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        
        const link = profile.links.id(id);
        
        if (!link) {
            return res.status(404).json({ success: false, message: 'Link not found' });
        }
        
        // Restore link: Mark as active
        link.active = true;
        await profile.save();
        
        logger.info('Link restored (marked as active)', {
            correlationId: req.correlationId,
            userId: req.userID,
            linkId: id
        });
        
        // Invalidate user's profile cache
        const user = await User.findById(req.userID).select('username').lean();
        if (user) {
            await deleteCachePattern(`profile:${user.username}*`);
            await deleteCachePattern(`analytics:*:${req.userID}*`);
        }
        
        res.json({ success: true, message: 'Link restored successfully' });
    } catch (error) {
        logger.error('Error restoring link', {
            correlationId: req.correlationId,
            userId: req.userID,
            error: error.message
        });
        res.status(500).json({ success: false, message: 'Failed to restore link' });
    }
});

/**
 * Reorder links via drag & drop
 */
router.post('/reorder-links', async (req, res) => {
    try {
        const { order } = req.body;
        
        if (!order || !Array.isArray(order)) {
            return res.status(400).json({ success: false, message: 'Invalid order array' });
        }
        
        const profile = await Profile.findOne({ userid: req.userID });
        
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        
        // Create a map of link IDs to links for quick lookup
        const linkMap = new Map();
        profile.links.forEach(link => {
            linkMap.set(link._id.toString(), link);
        });
        
        // Reorder links based on the new order
        const reorderedLinks = [];
        for (const linkId of order) {
            const link = linkMap.get(linkId);
            if (link) {
                reorderedLinks.push(link);
                linkMap.delete(linkId);
            }
        }
        
        // Add any remaining links that weren't in the order array (shouldn't happen, but just in case)
        linkMap.forEach(link => {
            reorderedLinks.push(link);
        });
        
        // Update profile with new order
        profile.links = reorderedLinks;
        await profile.save();
        
        // Invalidate user's profile cache
        const user = await User.findById(req.userID).select('username').lean();
        if (user) {
            await deleteCachePattern(`profile:${user.username}*`);
        }
        
        logger.info('Links reordered', {
            correlationId: req.correlationId,
            userId: req.userID,
            linkCount: order.length
        });
        
        res.json({ success: true, message: 'Links reordered successfully' });
    } catch (error) {
        logger.error('Error reordering links', {
            correlationId: req.correlationId,
            userId: req.userID,
            error: error.message
        });
        res.status(500).json({ success: false, message: 'Failed to reorder links' });
    }
});

/**
 * Bulk archive links
 */
router.post('/bulk-archive', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid link IDs array' });
        }
        
        const profile = await Profile.findOne({ userid: req.userID });
        
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        
        // Mark all specified links as inactive
        let archivedCount = 0;
        ids.forEach(linkId => {
            const link = profile.links.id(linkId);
            if (link && link.active !== false) {
                link.active = false;
                archivedCount++;
            }
        });
        
        await profile.save();
        
        // Invalidate user's profile cache
        const user = await User.findById(req.userID).select('username').lean();
        if (user) {
            await deleteCachePattern(`profile:${user.username}*`);
            await deleteCachePattern(`analytics:*:${req.userID}*`);
        }
        
        logger.info('Bulk archive links', {
            correlationId: req.correlationId,
            userId: req.userID,
            count: archivedCount
        });
        
        res.json({ success: true, message: `${archivedCount} link(s) archived successfully` });
    } catch (error) {
        logger.error('Error bulk archiving links', {
            correlationId: req.correlationId,
            userId: req.userID,
            error: error.message
        });
        res.status(500).json({ success: false, message: 'Failed to archive links' });
    }
});

/**
 * Permanently delete archived link
 */
router.post('/permanent-delete-link', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, message: 'Link ID is required' });
        }
        
        const profile = await Profile.findOne({ userid: req.userID }).select('links');
        
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        
        const link = profile.links.id(id);
        
        if (!link) {
            return res.status(404).json({ success: false, message: 'Link not found' });
        }
        
        // Check if link is inactive (archived)
        if (link.active !== false) {
            return res.status(400).json({
                success: false,
                message: 'Only archived links can be permanently deleted. Please archive the link first.'
            });
        }
        
        // Permanently delete the link
        profile.links.pull(id);
        await profile.save();
        
        // Delete all associated click data
        await LinkClick.deleteMany({ linkId: id });
        
        logger.info('Link permanently deleted', {
            correlationId: req.correlationId,
            userId: req.userID,
            linkId: id
        });
        
        // Invalidate user's profile cache
        const user = await User.findById(req.userID).select('username').lean();
        if (user) {
            await deleteCachePattern(`profile:${user.username}*`);
            await deleteCachePattern(`analytics:*:${req.userID}*`);
        }
        
        res.json({ success: true, message: 'Link restored successfully' });
        
    } catch (error) {
        logger.error('Error restoring link', {
            correlationId: req.correlationId,
            error: error.message
        });
        res.status(500).json({ success: false, message: 'Failed to restore link' });
    }
});

/**
 * Social handles page
 */
router.get('/handles', async (req, res) => {
    const user = await User.findById(req.userID).select('username email').lean();
    const profile = await Profile.findOne({ userid: req.userID }).select('handles').lean();
    
    if (!user || !profile) {
        throw new AppError('User or profile not found', 404);
    }
    
    res.render('dashboard/handles', { user, data: profile, pageTitle: 'Social Handles' });
});

/**
 * Update social handles
 */
router.post('/handles', async (req, res) => {
    // CSRF verification for AJAX request
    try {
        const data = { ...req.body };
        
        const profile = await Profile.findOne({ userid: req.userID }).select('handles');
        
        if (!profile) {
            return res.status(404).json({
                status: 'error',
                message: 'Profile not found',
            });
        }
        
        const newData = { ...profile.handles, ...data };
        await Profile.updateOne({ userid: req.userID }, { handles: newData });
        
        // Invalidate user's profile cache
        const user = await User.findById(req.userID).select('username').lean();
        if (user) {
            await deleteCachePattern(`profile:${user.username}*`);
        }
        
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
