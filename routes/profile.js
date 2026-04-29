const express = require('express');
const router = express.Router();

const Profile = require('../models/profile');
const User = require('../models/user');
const { cachePageMiddleware, profileCacheKey } = require('../middlewares/cacheMiddleware');
const { deleteCache } = require('../utils/cache');

// Cache profile pages for 5 minutes (300 seconds)
router.get('/:username', cachePageMiddleware(300, profileCacheKey), async (req, res, next) => {
    try {
        const { username } = req.params;
        
        // Only select needed fields for user lookup
        const user = await User.findOne({ username }).select('_id username email').lean();
        
        if (!user) {
            // render a register page with this username
            return next();
        }
        
        // Increment view count
        await Profile.updateOne({ userid: user._id }, { $inc: { totalViews: 1 } });
        
        // Get profile with only needed fields
        const profile = await Profile.findOne({ userid: user._id })
            .select('photo title bio theme totalViews links handles')
            .lean();
        
        if (!profile) {
            return next();
        }
        
        res.render('userpage/index', {
            profile: profile,
            username: user.username,
            email: user.email
        });
        
    } catch (err) {
        next(err);
    }
});

module.exports = router;