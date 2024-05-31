const express = require('express');
const router = express.Router();

const multer  = require('multer')
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const Profile = require('../models/profile');
const User = require('../models/user');


const s3 = new S3Client({
  region: process.env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  sslEnabled: false,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET_NAME,
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
        cb(null, `${req.userID}.jpg`);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: 'public-read',
      contentDisposition: 'inline',
    }),
    limits: { fileSize: 1024 * 1024 * 1 }
  }).single('file');

router.get('/',(req,res)=>{
    User.findOne({ _id: req.userID })
    .then((user)=>{
        Profile.findOne({userid:req.userID})
        .then((profile)=>{
            res.render('appearance/index',{user:user,data:profile});
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

router.post('/', (req, res) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          req.flash('error', 'File too large. Maximum size allowed is 1MB.');
        } else {
          req.flash('error', err.message);
        }
        return res.redirect('/appearance');
      } else if (err) {
        req.flash('error', 'An unknown error occurred.');
        return res.redirect('/appearance'); 
      }
      let data = {
        title: req.body.title,
        bio: req.body.bio,
        theme: req.body.theme,
      };
  
      if (req.file) {
        data.photo = req.file.location;
      }
  
      Profile.findOneAndUpdate({ userid: req.userID }, data)
        .then(() => {
          res.redirect('/appearance');
        })
        .catch((err) => {
          console.log(err);
          res.status(500).redirect('/appearance');
        });
    });
  });
    

module.exports = router;