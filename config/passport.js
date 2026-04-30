/**
 * Passport Configuration for OAuth Authentication
 * Handles Google OAuth 2.0 strategy
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const Profile = require('../models/profile');
const logger = require('../utils/logger');

/**
 * Serialize user for session
 */
passport.serializeUser((user, done) => {
    done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('_id username email status');
        done(null, user);
    } catch (error) {
        logger.error('Error deserializing user', { error: error.message });
        done(error, null);
    }
});

/**
 * Google OAuth Strategy
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
        proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // User exists, check if they have googleId
                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                    logger.info('Google ID added to existing user', {
                        userId: user._id,
                        email: user.email
                    });
                }
                return done(null, user);
            }

            // Create new user
            const username = profile.emails[0].value.split('@')[0] + '_' + Date.now();
            
            user = await User.create({
                username: username,
                email: profile.emails[0].value,
                googleId: profile.id,
                status: 'active', // Auto-verify Google users
                createdDate: new Date().toLocaleString("en-US", { timeZone: 'Asia/Kolkata' })
            });

            // Create profile for new user
            await Profile.create({
                userid: user._id,
                title: profile.displayName || username
            });

            logger.info('New user created via Google OAuth', {
                userId: user._id,
                email: user.email
            });

            done(null, user);
        } catch (error) {
            logger.error('Error in Google OAuth strategy', {
                error: error.message,
                stack: error.stack
            });
            done(error, null);
        }
    }));
} else {
    logger.warn('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

module.exports = passport;

// Made with Bob
