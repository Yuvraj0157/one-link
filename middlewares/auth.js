const jwt = require('jsonwebtoken');

const User = require('../models/user');

const isAuth = (req, res, next) => {
    const token = req.cookies['jwt'];
    if (token) {
        jwt.verify(token, process.env.JWT_LOGIN_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.status(403).render('home/index', { isLoggedIn: false });
            } else {
                req.userID = decodedToken.userID;
                req.isLoggedIn = true;
                next(); 
            }
        });
    } else {
        res.status(200).render('home/index', { isLoggedIn: false }); 
    }
};

const isVerified = (req, res, next) => {
    const userID = req.userID;
    User.findOne({ _id: userID })
    .then((user) => {
        if (user.status === 'verification') {
            res.render('dashboard/mailverification.ejs', { user: user });
        } else {
            next();
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(500).render('500');
    });
}

module.exports = { isAuth , isVerified };
