const jwt = require('jsonwebtoken');

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

module.exports = { isAuth };
