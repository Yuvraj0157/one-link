const express = require('express');
const router = express.Router();

const Profile = require('../models/profile');
const User = require('../models/user');

router.get('/:username',(req,res,next)=>{
    const {username} = req.params;
    User.findOne({username:username})
    .then(async (user)=>{
        if(!user){
            //render a register page with this username
            next();
        }else{
            await Profile.updateOne({userid:user._id},{$inc: {totalViews:1}});
            Profile.findOne({userid:user._id})
            .then((profile)=>{
                res.render('userpage/index.ejs',{ profile:profile,username:user.username,email:user.email});
            })
            .catch((err)=>{
                next();
            })
        }
    })
    .catch((err)=>{
        next();
    })
});

module.exports = router;