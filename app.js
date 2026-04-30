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
const passport = require('./config/passport');

// Import utilities
const logger = require('./utils/logger');
const { initRedis, closeRedis } = require('./utils/cache');
const { addCorrelationId, logRequest } = require('./middlewares/requestLogger');
const {
    errorHandler,
    notFoundHandler,
    handleUnhandledRejection,
    handleUncaughtException
} = require('./middlewares/errorHandler');

const { isAuth, isVerified } = require('./middlewares/auth');
const { generalLimiter } = require('./middlewares/security');

// Importing Routes
const authRoutes = require("./routes/auth");
const appearanceRoutes = require("./routes/appearance");
const profileRoutes = require("./routes/profile");
const dashboardRoutes = require("./routes/dashboard");
const analyticsRoutes = require("./routes/analytics");
const legalRoutes = require("./routes/legal");

const app = express();

// Trust proxy - required for correct IP detection behind load balancers/proxies
app.set('trust proxy', true);

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
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://ka-f.fontawesome.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https://onelinkprofile.s3.ap-south-1.amazonaws.com", "https://onelinkprofile.s3.amazonaws.com", "https://www.google.com", "https://*.gstatic.com", "https://img.shields.io", "https://flagsapi.com"],
            connectSrc: ["'self'", "https://ka-f.fontawesome.com", "https://cdn.jsdelivr.net"],
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
app.use(passport.initialize());
app.use(passport.session());
app.use(compression());


app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// Connecting to MongoDB and Redis
async function startServer() {
  try {
    // Connect to MongoDB with connection pooling
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });
    logger.info('Connected to MongoDB successfully with connection pooling', {
      maxPoolSize: 10,
      minPoolSize: 2
    });
    
    // Initialize Redis (optional - app will work without it)
    await initRedis();
    
    const port = process.env.PORT || 80;
    const server = app.listen(port, () => {
      logger.info(`Server started on port ${port}`, {
        environment: process.env.NODE_ENV || 'development',
        port: port
      });
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await closeRedis();
        await mongoose.connection.close();
        process.exit(0);
      });
    });
    
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

startServer();

// Routes
app.use(authRoutes);
app.use('/dashboard',isAuth,isVerified,dashboardRoutes);
app.use('/appearance',isAuth,isVerified,appearanceRoutes);
app.use('/analytics',isAuth,isVerified,analyticsRoutes);
app.use('/track',analyticsRoutes); // Public route for link tracking
app.use('/profile',profileRoutes);
app.use(legalRoutes); // Public legal pages

app.get("/", isAuth, (req, res) => {
  res.render("home/index", { isLoggedIn: req.isLoggedIn });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Centralized error handler (must be last)
app.use(errorHandler);
