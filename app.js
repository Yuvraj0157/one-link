const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
var cookieParser = require('cookie-parser');
var _ = require('lodash');
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Importing Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

const app = express();

app.use(morgan("dev"));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.set("view engine", "ejs");

// Connecting to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    console.log('Connected to MongoDB.....');
    app.listen(process.env.PORT || 80, () => {
      console.log(`Listening at.... http://localhost:${process.env.PORT || 80}`);
    });
  })
  .catch((err) => console.log(err));

// Routes
// app.use(authRoutes);
// app.use(userRoutes);

app.get("/", (req, res) => {
  res.redirect('/login');
});

app.use("*",(req,res)=>{
  res.status(404).render("404");
});
