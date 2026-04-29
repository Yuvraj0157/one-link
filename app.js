const express = require("express");
require('express-async-errors'); // Handle async errors automatically
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

// Import utilities
const logger = require('./utils/logger');
const { addCorrelationId, logRequest } = require('./middlewares/requestLogger');
const {
    errorHandler,
    notFoundHandler,
    handleUnhandledRejection,
    handleUncaughtException
} = require('./middlewares/errorHandler');

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

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

// Add correlation ID to all requests (must be early in middleware chain)
app.use(addCorrelationId);

// Request logging
app.use(logRequest);

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

// Morgan logging with Winston stream (only in development)
if (process.env.NODE_ENV !== 'production') {
    const morgan = require("morgan");
    app.use(morgan("dev", { stream: logger.stream }));
}
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
    logger.info('Connected to MongoDB successfully');
    const port = process.env.PORT || 80;
    app.listen(port, () => {
      logger.info(`Server started on port ${port}`, {
        environment: process.env.NODE_ENV || 'development',
        port: port
      });
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    process.exit(1);
  });

// Routes
app.use(authRoutes);
app.use('/dashboard',isAuth,isVerified,dashboardRoutes);
app.use('/appearance',isAuth,isVerified,appearanceRoutes);
app.use('/analytics',isAuth,isVerified,analyticsRoutes);
app.use('/track',analyticsRoutes); // Public route for link tracking
app.use('/profile',profileRoutes);

app.get("/", isAuth, (req, res) => {
  res.render("home/index", { isLoggedIn: req.isLoggedIn });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Centralized error handler (must be last)
app.use(errorHandler);
