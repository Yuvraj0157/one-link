const jwt = require('jsonwebtoken');

const User = require('../models/user');

const isAuth = (req, res, next) => {
    const token = req.cookies['jwt'];
    if (token) {
        jwt.verify(token, process.env.JWT_LOGIN_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/login'); 
            } else {
                req.userID = decodedToken.userID;
                next(); 
            }
        });
    } else {
        res.redirect('/login'); 
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
