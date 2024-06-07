const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, body } = require('express-validator');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

const emailController = require('../utils/emailController');
const User = require('../models/user');
const Profile = require('../models/profile');
const { default: mongoose } = require('mongoose');

// Generate a random buffer of 32 bytes (256 bits)

// const randomBytes = crypto.randomBytes(32);
// const secret = randomBytes.toString('hex');
// console.log('Generated secret:', secret);


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
        const {username,password,email} = req.body;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) { 
            // console.log(errors.array());  
            return res.status(422).render('auth/register', { title: 'Register', error: errors.array()[0].msg});
        }
        try {
            let user = await User.find({username:username});
            if(user.length>0){
                req.flash('error', 'Username already exists');
                res.redirect('/register');
            }
            user = await User.find({email:email});
            if(user.length>0){
                req.flash('error', 'Email already exists');
                res.redirect('/register');
            }
            const hash = await bcrypt.hash(password, 10);
            user = await User.create({
                username:username,
                email:email,
                password:hash,
                createdDate:new Date().toLocaleString("en-US",{timeZone: 'Asia/Kolkata'}),
            }); 
            const profile = await Profile.create({userid:user._id});
            if(user){
                jwt.sign({ userID: user._id }, process.env.JWT_VERIFICATION_SECRET, { expiresIn: process.env.JWT_VERIFICATION_EXPIRY || '15m'}, (err, token) => {
                    if (err) {
                        console.log(err);
                    }
                    const link = `${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}/verify-email/${token}`;
                    emailController.sendVerificationEmail(link, email);
                    res.redirect('/login');
                });

            }else{
                req.flash('error', 'Error creating user');
                res.redirect('/register');
            }
        }catch(error){
            console.log(error);
            res.status(500).render('500');
        }
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
    [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
        body('password')
        .trim()
    ],
    async (req, res) => {
        const {email, password} = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).render('auth/login', { title: 'Login', error: errors.array()[0].msg});
        }
        try {
            const user = await User.findOne({ email: email });
            if (user) {
                // console.log(user);
                bcrypt.compare(password, user.password, (err, comparison) => {
                    if (comparison) {
                        const userID = user._id;
                        jwt.sign({ userID }, process.env.JWT_LOGIN_SECRET, { expiresIn: process.env.JWT_LOGIN_EXPIRY || '5d'}, (err, token) => {
                            if (err) {
                                console.log(err);
                            }
                            res.cookie('jwt', token, { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000, secure: true});
                            res.redirect('/dashboard');
                        });
                    } else {
                        req.flash('error', 'Incorrect password');
                        res.redirect('/login');
                    }
                });
            } else {
                req.flash('error', 'Invalid email');
                res.redirect('/login');
            }
        } catch (error) {
            console.log(error);
            res.status(500).render('500');
        }
    }
);

router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login');
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
    [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail()
    ],
    async (req, res) => {
        const email = req.body.email;
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).render('auth/forgot-password', { title: 'Forgot Password', error: errors.array()[0].msg});
            }
            const user = await User.findOne({ email: email })
            if (user) {
                const userID = user._id;
                jwt.sign({ userID: userID }, process.env.JWT_RESET_PASSWORD, { expiresIn: process.env.JWT_RESET_PASSWORD_EXPIRY || '15m'}, (err, token) => {
                    if (err) {
                        console.log(err);
                    }
                    const link = `${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}/reset-password/${token}`;
                    emailController.sendEmail(link, email);
                    res.redirect('/login');
                });
            } else {
                req.flash('error', 'Invalid email');
                res.redirect('/forgot-password');
            }
        }catch(error){
            console.log(error);
            res.status(500).render('500');
        }
    }
);

router.get('/reset-password/:token', async (req, res) => {
    if (!req.params.token) {
        res.status(404).render('404');
    }
    const token = req.params.token;
    res.render('auth/reset-password', { title: 'Reset Password', error: null, token: token });
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
        const token = req.body.token;
        const password = req.body.password;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // let message = null;
            // if(errors.array().length > 0) {
            //     message = errors.array()[0].msg;
            // }
            return res.status(422).render('auth/reset-password', { title: 'Reset Password', error: errors.array()[0].msg , token: token });
        }

        try {
            jwt.verify(token, process.env.JWT_RESET_PASSWORD, async (err, decoded) => {
                if (err) {
                    console.log(err);
                    res.redirect('/forgot-password');
                }
                // console.log(decoded);
                if (decoded) {
                    const user = await User.findOne({ _id: decoded.userID});
                    if (user) {
                        const hash = await bcrypt.hash(password, 10);
                        user.password = hash;
                        await user.save();
                        res.redirect('/login');
                    } else {
                        req.flash('error', 'Invalid email');
                        res.redirect('/forgot-password');
                    }
                }
                else {
                    res.status(404).render('404');
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).render('500');
        }
    }
);

router.get('/verify-email/:token', async (req, res) => {
    if (!req.params.token) {
        res.status(404).render('404');
    }
    const token = req.params.token;
    try {
        jwt.verify(token, process.env.JWT_VERIFICATION_SECRET, async (err, decoded) => {
            if (err) {
                console.log(err);
                res.status(404).render('404');
            }
            if (decoded) {
                const user = await User.findOne({ _id: decoded.userID });
                if (user) {
                    user.isVerified = true;
                    await user.save();
                    res.redirect('/login');
                } else {
                    res.status(404).render('404');
                }
            }
            else {
                res.status(404).render('404');
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).render('500');
    }
});

module.exports = router;