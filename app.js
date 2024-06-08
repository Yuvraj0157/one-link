const express = require("express");
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');
const mongoose = require("mongoose");
require("dotenv").config();
const path = require('path');

const { isAuth, isVerified } = require('./middlewares/auth');

// Importing Routes
const authRoutes = require("./routes/auth");
const appearanceRoutes = require("./routes/appearance");
const profileRoutes = require("./routes/profile");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

app.use(morgan("dev"));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: { maxAge: 60000 }
}));
app.use(flash());
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
app.use('/profile',profileRoutes);

app.get("/", isAuth, (req, res) => {
  // console.log(req.isLoggedIn);
  res.render("home/index", { isLoggedIn: req.isLoggedIn });
});

app.use("*",(req,res)=>{
  res.status(404).render("404");
});
