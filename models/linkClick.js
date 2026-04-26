const mongoose = require('mongoose');

const linkClickSchema = new mongoose.Schema({
    linkId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    linkTitle: {
        type: String,
        required: true
    },
    linkUrl: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    referrer: {
        type: String,
        default: 'direct'
    },
    userAgent: {
        type: String
    },
    deviceType: {
        type: String,
        enum: ['Mobile', 'Desktop', 'Tablet'],
        default: 'Desktop'
    },
    country: {
        type: String,
        default: 'Unknown'
    },
    countryCode: {
        type: String,
        default: 'XX'
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
linkClickSchema.index({ userId: 1, timestamp: -1 });
linkClickSchema.index({ linkId: 1, timestamp: -1 });
linkClickSchema.index({ userId: 1, linkId: 1, timestamp: -1 });

// TTL index - automatically delete clicks older than 90 days
linkClickSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days = 7,776,000 seconds

// Static method to get click count for a link
linkClickSchema.statics.getClickCount = async function(linkId) {
    return await this.countDocuments({ linkId });
};

// Static method to get clicks for a user's all links
linkClickSchema.statics.getUserClicks = async function(userId, startDate, endDate) {
    const query = { userId };
    
    if (startDate && endDate) {
        query.timestamp = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    return await this.find(query).sort({ timestamp: -1 });
};

// Static method to get analytics summary
linkClickSchema.statics.getAnalyticsSummary = async function(userId) {
    const totalClicks = await this.countDocuments({ userId });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayClicks = await this.countDocuments({
        userId,
        timestamp: { $gte: today }
    });
    
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const weekClicks = await this.countDocuments({
        userId,
        timestamp: { $gte: last7Days }
    });
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const monthClicks = await this.countDocuments({
        userId,
        timestamp: { $gte: last30Days }
    });
    
    // Top links
    const topLinks = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$linkId',
                title: { $first: '$linkTitle' },
                url: { $first: '$linkUrl' },
                clicks: { $sum: 1 }
            }
        },
        { $sort: { clicks: -1 } },
        { $limit: 5 }
    ]);
    
    // Top referrers
    const topReferrers = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$referrer',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);
    
    // Top countries
    const topCountries = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), country: { $ne: 'Unknown' } } },
        {
            $group: {
                _id: '$country',
                countryCode: { $first: '$countryCode' },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);
    
    return {
        totalClicks,
        todayClicks,
        weekClicks,
        monthClicks,
        topLinks,
        topReferrers,
        topCountries
    };
};

// Static method to get daily clicks for chart
linkClickSchema.statics.getDailyClicks = async function(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const dailyClicks = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    return dailyClicks;
};

const LinkClick = mongoose.model('LinkClick', linkClickSchema);

module.exports = LinkClick;

// Made with Bob
