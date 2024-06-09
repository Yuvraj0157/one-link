const express = require('express');
const router = express.Router();

const Profile = require('../models/profile');
const User = require('../models/user');
const {Link} = require('../models/link');

router.get('/', async (req, res) => {
    Profile.findOne({ userid: req.userID })
    .then((profile) => {
        User.findOne({ _id: req.userID })
        .then((user) => {
            res.render('dashboard/index', { user: user, profile: profile });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).render('500');
        });
    })
    .catch((err) => {
        console.log(err);
        res.status(500).render('500');
    });
});

router.get('/add-link', (req, res) => {
    User.findOne({ _id: req.userID })
    .then((user) => {
        res.render('dashboard/add_link', { user: user });
    })
    .catch((err) => {
        console.log(err);
        res.status(500).render('500');
    });
});

router.post('/add-link', (req, res) => {
    const { title, url } = req.body
    const newLink = new Link({ title, url });
    Profile.updateOne({ userid: req.userID }, { $push: { links: newLink } })
    .then(() => {
        res.redirect('/dashboard');
    })
    .catch((err) => {
        console.log(err);
        res.status(500).render('500');
    });
});


router.get('/update-link',(req,res)=>{
    User.findOne({ _id: req.userID })
    .then((user) => {
        Profile.findOne({userid:req.userID})
        .then((profile)=>{
            res.render('dashboard/update_link',{link:profile.links.id(req.query.id),user:user});
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).render('500');
        })
    })
    .catch((err) => {
        console.log(err);
        res.status(500).render('500');
    });
});

router.post('/update-link',(req,res)=>{
    const {title,url,linkID} = req.body;
    Profile.findOne({userid:req.userID})
    .then((profile)=>{
        const link = profile.links.id(linkID);
        link.title = title;
        link.url = url;
        profile.save()
        .then(()=>{
            res.redirect('/dashboard');
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).render('500');
        })
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).render('500');
    })
});

router.get('/delete-link',(req,res)=>{
    Profile.findOne({userid:req.userID})
    .then((profile)=>{
        const link = profile.links.id(req.query.id);
        link.deleteOne();
        profile.save()
        .then(()=>{
            res.redirect('/dashboard');
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).render('500');
        })
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).render('500');
    })
});

router.get('/handles',(req,res)=>{
    User.findOne({_id:req.userID})
    .then((user)=>{
        Profile.findOne({userid:req.userID})
        .then((profile)=>{
            res.render('dashboard/handles',{user:user,data:profile});
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).render('500');
        })
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).render('500');
    })
});

router.post('/handles',(req,res)=>{
    // console.log(req.body);
    const data = {...req.body};
    Profile.findOne({userid:req.userID})
    .then((profile)=>{
        newData = {...profile.handles,...data};
        Profile.updateOne({userid:req.userID},{handles:newData})
        .then(()=>{
            res.json({status:"success",message:"Handles updated successfully"});
        })
        .catch((err)=>{
            console.log(err);
            res.json({status:"error",message:"An error occurred while updating handles."});
        })
    })
    .catch((err)=>{
        console.log(err);
        res.json({status:"error",message:"An error occurred while updating handles."});
    })
});

module.exports = router;
