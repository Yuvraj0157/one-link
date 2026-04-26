const express = require("express");
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');
const mongoose = require("mongoose");
require("dotenv").config();
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const { isAuth, isVerified } = require('./middlewares/auth');
const { generalLimiter } = require('./middlewares/security');
const { csrfProtection, verifyCsrfToken } = require('./middlewares/csrf');

// Importing Routes
const authRoutes = require("./routes/auth");
const appearanceRoutes = require("./routes/appearance");
const profileRoutes = require("./routes/profile");
const dashboardRoutes = require("./routes/dashboard");
const analyticsRoutes = require("./routes/analytics");

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://getbootstrap.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://kit.fontawesome.com", "https://unpkg.com", "https://ajax.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://ka-f.fontawesome.com"],
            imgSrc: ["'self'", "data:", "https://onelinkprofile.s3.ap-south-1.amazonaws.com", "https://onelinkprofile.s3.amazonaws.com"],
            connectSrc: ["'self'", "https://ka-f.fontawesome.com"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Sanitized request data: ${key}`);
    },
}));

// Apply general rate limiting to all routes
app.use(generalLimiter);

app.use(morgan("dev"));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
    }
}));
app.use(flash());
app.use(compression());

// CSRF Protection - add token to all views
app.use(csrfProtection);

// CSRF Verification - verify token on POST requests
app.use(verifyCsrfToken);

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// Connecting to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then((result) => {
    console.log('Connected to MongoDB.....');
    app.listen(process.env.PORT || 80, () => {
      console.log(`Listening at.... http://localhost:${process.env.PORT || 80}`);
    });
  })
  .catch((err) => console.log(err));

// Routes
app.use(authRoutes);
app.use('/dashboard',isAuth,isVerified,dashboardRoutes);
app.use('/appearance',isAuth,isVerified,appearanceRoutes);
app.use('/analytics',isAuth,isVerified,analyticsRoutes);
app.use('/track',analyticsRoutes); // Public route for link tracking
app.use('/profile',profileRoutes);

app.get("/", isAuth, (req, res) => {
  // console.log(req.isLoggedIn);
  res.render("home/index", { isLoggedIn: req.isLoggedIn });
});

app.use("*",(req,res)=>{
  res.status(404).render("404");
});

app.use((err,req,res,next)=>{
  console.error(`Error occurred in route: ${req.path}`);
  console.error(err.stack);
  res.status(500).render("500");
});
