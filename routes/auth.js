const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { check, body } = require('express-validator');
const { validationResult } = require('express-validator');

const emailController = require('../utils/emailController');
const User = require('../models/user');
const Profile = require('../models/profile');
const { authLimiter, passwordResetLimiter, emailLimiter } = require('../middlewares/security');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

// Promisify JWT functions
const signToken = promisify(jwt.sign);
const verifyToken = promisify(jwt.verify);

/**
 * Register page
 */
router.get('/register', (req, res) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/register', { title: 'Register', error: message});
});

router.post('/register',
    authLimiter,
    [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
        body('password', 'Password must be at least 6 characters long and alphanumeric')
        .isLength({ min: 6 })
        .isAlphanumeric()
        .trim(),
        body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
    ],
    async (req, res) => {
        const { username, password, email } = req.body;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).render('auth/register', {
                title: 'Register',
                error: errors.array()[0].msg
            });
        }
        
        // Check if username exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            req.flash('error', 'Username already exists');
            return res.redirect('/register');
        }
        
        // Check if email exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            req.flash('error', 'Email already exists');
            return res.redirect('/register');
        }
        
        // Hash password
        const hash = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await User.create({
            username,
            email,
            password: hash,
            createdDate: new Date().toLocaleString("en-US", { timeZone: 'Asia/Kolkata' }),
        });
        
        // Create profile
        await Profile.create({ userid: user._id });
        
        // Generate verification token
        const token = await signToken(
            { userID: user._id },
            process.env.JWT_VERIFICATION_SECRET,
            { expiresIn: process.env.JWT_VERIFICATION_EXPIRY || '15m' }
        );
        
        // Send verification email
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const link = `${protocol}://${req.headers.host}/verify-email/${token}`;
        await emailController.sendVerificationEmail(link, email);
        
        logger.info('User registered', {
            correlationId: req.correlationId,
            userId: user._id,
            email: user.email,
        });
        
        res.redirect('/login');
    }
);

router.get('/login', (req, res) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', { title: 'Login', error: message});
});

router.post('/login',
    authLimiter,
    [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
        body('password')
        .trim()
    ],
    async (req, res) => {
        const { email, password } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).render('auth/login', {
                title: 'Login',
                error: errors.array()[0].msg
            });
        }
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }
        
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn('Failed login attempt', {
                correlationId: req.correlationId,
                email,
            });
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }
        
        // Generate JWT token
        const token = await signToken(
            { userID: user._id },
            process.env.JWT_LOGIN_SECRET,
            { expiresIn: process.env.JWT_LOGIN_EXPIRY || '5d' }
        );
        
        // Set cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        logger.info('User logged in', {
            correlationId: req.correlationId,
            userId: user._id,
            email: user.email,
        });
        
        res.redirect('/dashboard');
    }
);

/**
 * Logout
 */
router.get('/logout', (req, res) => {
    logger.info('User logged out', {
        correlationId: req.correlationId,
        userId: req.userID || 'unknown',
    });
    
    res.clearCookie('jwt');
    res.redirect('/');
});

router.get('/forgot-password', (req, res) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/forgot-password', { title: 'Forgot Password' , error: message});
});

router.post('/forgot-password',
    passwordResetLimiter,
    [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail()
    ],
    async (req, res) => {
        const { email } = req.body;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).render('auth/forgot-password', {
                title: 'Forgot Password',
                error: errors.array()[0].msg
            });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not for security
            req.flash('error', 'If that email exists, a reset link has been sent');
            return res.redirect('/forgot-password');
        }
        
        // Generate reset token
        const token = await signToken(
            { userID: user._id },
            process.env.JWT_RESET_PASSWORD,
            { expiresIn: process.env.JWT_RESET_PASSWORD_EXPIRY || '15m' }
        );
        
        // Send reset email
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const link = `${protocol}://${req.headers.host}/reset-password/${token}`;
        await emailController.sendEmail(link, email);
        
        logger.info('Password reset requested', {
            correlationId: req.correlationId,
            email,
        });
        
        res.redirect('/login');
    }
);

/**
 * Reset password page
 */
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    
    if (!token) {
        throw new AppError('Reset token is required', 400);
    }
    
    res.render('auth/reset-password', {
        title: 'Reset Password',
        error: null,
        token
    });
});

router.post('/reset-password',
    [
        body('password', 'Password must be at least 6 characters long and alphanumeric')
        .isLength({ min: 6 })
        .isAlphanumeric()
        .trim(),
        body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
    ],
    async (req, res) => {
        const { token, password } = req.body;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).render('auth/reset-password', {
                title: 'Reset Password',
                error: errors.array()[0].msg,
                token
            });
        }

        // Verify token
        const decoded = await verifyToken(token, process.env.JWT_RESET_PASSWORD);
        
        if (!decoded || !decoded.userID) {
            throw new AppError('Invalid or expired reset token', 400);
        }
        
        // Find user
        const user = await User.findById(decoded.userID);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        
        // Hash new password
        const hash = await bcrypt.hash(password, 10);
        user.password = hash;
        await user.save();
        
        logger.info('Password reset successful', {
            correlationId: req.correlationId,
            userId: user._id,
        });
        
        res.redirect('/login');
    }
);

/**
 * Verify email
 */
router.get('/verify-email/:token', emailLimiter, async (req, res) => {
    const { token } = req.params;
    
    if (!token) {
        throw new AppError('Verification token is required', 400);
    }
    
    // Verify token
    const decoded = await verifyToken(token, process.env.JWT_VERIFICATION_SECRET);
    
    if (!decoded || !decoded.userID) {
        throw new AppError('Invalid or expired verification token', 400);
    }
    
    // Find and update user
    const user = await User.findById(decoded.userID);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    
    user.status = 'active';
    await user.save();
    
    logger.info('Email verified', {
        correlationId: req.correlationId,
        userId: user._id,
        email: user.email,
    });
    
    res.redirect('/dashboard');
});

module.exports = router;