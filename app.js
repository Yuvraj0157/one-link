const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');
const _ = require('lodash');
const mongoose = require("mongoose");
require("dotenv").config();

const { isAuth } = require('./middlewares/auth');

// Importing Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

app.use(morgan("dev"));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: { maxAge: 60000 }
}));
app.use(flash());
app.use(cookieParser());
app.set("view engine", "ejs");

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
app.use('/dashboard',isAuth,dashboardRoutes);
// app.use(userRoutes);

app.get("/", (req, res) => {
  res.redirect('/login');
});

app.use("*",(req,res)=>{
  res.status(404).render("404");
});
