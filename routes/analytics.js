const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const geoip = require('geoip-lite');
const LinkClick = require('../models/linkClick');
const Profile = require('../models/profile');
const User = require('../models/user');
const { cacheMiddleware, userCacheKey } = require('../middlewares/cacheMiddleware');
const { deleteCache, deleteCachePattern } = require('../utils/cache');

// Helper function to detect device type from user agent
function getDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'Tablet';
    }
    if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
        return 'Mobile';
    }
    return 'Desktop';
}

// Helper function to get performance badge
function getPerformanceBadge(clicks) {
    if (clicks >= 100) return { icon: 'fas fa-rocket', text: 'Excellent', class: 'danger' };
    if (clicks >= 50) return { icon: 'fas fa-star', text: 'Popular', class: 'warning' };
    if (clicks >= 20) return { icon: 'fas fa-chart-line', text: 'Growing', class: 'info' };
    if (clicks >= 5) return { icon: 'fas fa-check-circle', text: 'Good', class: 'success' };
    if (clicks >= 1) return { icon: 'fas fa-certificate', text: 'New', class: 'primary' };
    return { icon: 'far fa-circle', text: 'No Clicks', class: 'secondary' };
}

// Track link click and redirect
router.get('/link/:username/:linkId', async (req, res) => {
    try {
        const { username, linkId } = req.params;
        
        // Find user and profile (only select needed fields)
        const user = await User.findOne({ username }).select('_id').lean();
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        const profile = await Profile.findOne({ userid: user._id }).select('links').lean();
        if (!profile) {
            return res.status(404).send('Profile not found');
        }
        
        // Find the specific link (use find instead of .id() for lean objects)
        const link = profile.links.find(l => l._id.toString() === linkId);
        if (!link) {
            return res.status(404).send('Link not found');
        }
        
        // Get request information
        const referrer = req.get('Referrer') || req.get('Referer') || 'direct';
        const userAgent = req.get('User-Agent') || 'Unknown';
        const deviceType = getDeviceType(userAgent);
        
        // Get IP and lookup country
        let ipAddress = req.headers['x-forwarded-for'] ||
                        req.headers['x-real-ip'] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        req.ip ||
                        '';
        
        // Handle multiple IPs in x-forwarded-for (take the first one)
        if (ipAddress.includes(',')) {
            ipAddress = ipAddress.split(',')[0].trim();
        }
        
        // Remove IPv6 prefix
        const cleanIP = ipAddress.replace('::ffff:', '').replace('::1', '127.0.0.1');
        
        // Lookup geolocation
        const geo = geoip.lookup(cleanIP);
        
        let country = 'Unknown';
        let countryCode = 'XX';
        
        if (geo && geo.country) {
            country = geo.country;
            countryCode = geo.country;
        } else if (cleanIP === '127.0.0.1' || cleanIP === 'localhost') {
            country = 'Local';
            countryCode = 'LC';
        }
        
        // Create click record (async, don't wait)
        LinkClick.create({
            linkId: link._id,
            userId: user._id,
            linkTitle: link.title,
            linkUrl: link.url,
            referrer: referrer,
            userAgent: userAgent,
            deviceType: deviceType,
            country: country,
            countryCode: countryCode
        }).catch(err => {
            console.error('Error tracking click:', err);
        });
        
        // Redirect to actual URL
        res.redirect(link.url);
        
    } catch (error) {
        console.error('Error in link tracking:', error);
        res.status(500).send('Server error');
    }
});

// Analytics dashboard route
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Get date range from query params
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter = {
                timestamp: {
                    $gte: new Date(startDate),
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                }
            };
        }

        const user = await User.findOne({ _id: req.userID }).select('username email').lean();
        const profile = await Profile.findOne({ userid: req.userID }).select('links totalViews').lean();
        
        // Get analytics summary with date filter
        const summary = await LinkClick.getAnalyticsSummary(req.userID, dateFilter);
        
        // Filter topLinks to show only ACTIVE links that exist in profile
        const activeLinkIds = profile.links
            .filter(link => link.active !== false)
            .map(link => link._id.toString());
        
        summary.topLinks = summary.topLinks.filter(link =>
            activeLinkIds.includes(link._id.toString())
        );
        
        // Get daily clicks for chart with date filter
        let days = 30;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        }
        const dailyClicks = await LinkClick.getDailyClicks(req.userID, days, dateFilter);
        
        // Get recent clicks with pagination and date filter
        const clickQuery = { userId: req.userID, ...dateFilter };
        const totalClicks = await LinkClick.countDocuments(clickQuery);
        const recentClicks = await LinkClick.find(clickQuery)
            .select('linkTitle linkUrl timestamp referrer deviceType country')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const totalPages = Math.ceil(totalClicks / limit);
        
        // Get clicks per link with CTR and performance badges
        const totalViews = profile.totalViews || 0;
        
        // Get click data for ALL links (active and inactive)
        const linksWithClicks = await Promise.all(
            profile.links.map(async (link) => {
                const clickCount = await LinkClick.getClickCount(link._id);
                const ctr = totalViews > 0 ? ((clickCount / totalViews) * 100).toFixed(2) : 0;
                const badge = getPerformanceBadge(clickCount);
                
                return {
                    ...link,
                    clicks: clickCount,
                    ctr: ctr,
                    badge: badge,
                    isActive: link.active !== false
                };
            })
        );
        
        // Calculate device type distribution with date filter
        const deviceMatch = { userId: new mongoose.Types.ObjectId(req.userID), ...dateFilter };
        const deviceStats = await LinkClick.aggregate([
            { $match: deviceMatch },
            { $group: { _id: '$deviceType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Calculate quick stats with date filter
        const allClicks = await LinkClick.find(clickQuery);
        
        // Average clicks per day (last 90 days)
        const avgClicksPerDay = summary.totalClicks > 0 ? (summary.totalClicks / 90).toFixed(1) : 0;
        
        // Most active day of week
        const dayClicks = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        allClicks.forEach(click => {
            const day = new Date(click.timestamp).getDay();
            dayClicks[day] = (dayClicks[day] || 0) + 1;
        });
        const mostActiveDay = Object.keys(dayClicks).length > 0
            ? dayNames[Object.keys(dayClicks).reduce((a, b) => dayClicks[a] > dayClicks[b] ? a : b)]
            : 'N/A';
        
        // Peak hour
        const hourClicks = {};
        allClicks.forEach(click => {
            const hour = new Date(click.timestamp).getHours();
            hourClicks[hour] = (hourClicks[hour] || 0) + 1;
        });
        const peakHour = Object.keys(hourClicks).length > 0
            ? Object.keys(hourClicks).reduce((a, b) => hourClicks[a] > hourClicks[b] ? a : b)
            : 'N/A';
        const peakHourFormatted = peakHour !== 'N/A'
            ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`
            : 'N/A';
        
        const quickStats = {
            avgClicksPerDay,
            mostActiveDay,
            peakHour: peakHourFormatted
        };
        
        res.render('dashboard/analytics', {
            user,
            profile,
            summary,
            dailyClicks,
            recentClicks,
            linksWithClicks,
            totalViews,
            deviceStats,
            quickStats,
            baseUrl: `${req.protocol}://${req.get('host')}`,
            pageTitle: 'Analytics',
            startDate: startDate || '',
            endDate: endDate || '',
            pagination: {
                page,
                limit,
                totalPages,
                totalClicks,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        res.status(500).render('500');
    }
});

// Export analytics data as JSON (cache for 1 minute)
router.get('/export', cacheMiddleware(60, userCacheKey('analytics-export')), async (req, res) => {
    try {
        const { startDate, endDate, format, limit } = req.query;
        const maxLimit = parseInt(limit) || 1000; // Default max 1000 records
        
        let query = { userId: req.userID };
        
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Use pagination for large exports
        const clicks = await LinkClick.find(query)
            .select('timestamp linkTitle linkUrl referrer userAgent deviceType country')
            .sort({ timestamp: -1 })
            .limit(maxLimit)
            .lean();
        
        if (format === 'csv') {
            // Convert to CSV
            const csv = [
                'Date,Time,Link Title,Link URL,Referrer,User Agent',
                ...clicks.map(click => 
                    `${click.timestamp.toLocaleDateString()},${click.timestamp.toLocaleTimeString()},"${click.linkTitle}","${click.linkUrl}","${click.referrer}","${click.userAgent}"`
                )
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
            res.send(csv);
        } else {
            // Return JSON
            res.json({
                success: true,
                data: clicks,
                count: clicks.length
            });
        }
        
    } catch (error) {
        console.error('Error exporting analytics:', error);
        res.status(500).json({ success: false, error: 'Export failed' });
    }
});

// Get analytics for specific link (cache for 2 minutes)
router.get('/link/:linkId', cacheMiddleware(120, (req) => `analytics:link:${req.params.linkId}`), async (req, res) => {
    try {
        const { linkId } = req.params;
        
        // Verify link belongs to user (only select links field)
        const profile = await Profile.findOne({ userid: req.userID }).select('links').lean();
        const link = profile.links.find(l => l._id.toString() === linkId);
        
        if (!link) {
            return res.status(404).json({ success: false, error: 'Link not found' });
        }
        
        const clicks = await LinkClick.find({ linkId })
            .select('timestamp referrer deviceType country userAgent')
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();
        
        const clickCount = await LinkClick.getClickCount(linkId);
        
        res.json({
            success: true,
            link: {
                title: link.title,
                url: link.url,
                clicks: clickCount
            },
            recentClicks: clicks
        });
        
    } catch (error) {
        console.error('Error getting link analytics:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
