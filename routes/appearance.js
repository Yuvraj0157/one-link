const express = require('express');
const router = express.Router();

const multer  = require('multer');
const { S3Client, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const Profile = require('../models/profile');
const User = require('../models/user');
const { deleteCachePattern } = require('../utils/cache');
const { optimizeImage, validateImage } = require('../utils/imageOptimizer');
const logger = require('../utils/logger');


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

// Use memory storage for image optimization before upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit before optimization
    fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  }).single('file');

router.get('/', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.userID }).select('username email').lean();
        const profile = await Profile.findOne({ userid: req.userID })
            .select('photo title bio theme')
            .lean();
        
        res.render('appearance/index', { user: user, data: profile, pageTitle: 'Appearance' });
    } catch (err) {
        console.log(err);
        res.status(500).render('500');
    }
});

router.post('/', (req, res) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          req.flash('error', 'File too large. Maximum size allowed is 5MB.');
        } else {
          req.flash('error', err.message);
        }
        return res.redirect('/appearance');
      } else if (err) {
        req.flash('error', err.message || 'An unknown error occurred.');
        return res.redirect('/appearance');
      }
      
      let data = {
        title: req.body.title,
        bio: req.body.bio,
        theme: req.body.theme,
      };
  
      try {
        if (req.file) {
          // Optimize image first (resize to 800x800)
          const optimizedBuffer = await optimizeImage(req.file.buffer, {
            width: 800,
            height: 800,
            quality: 85,
            format: 'jpeg'
          });

          // Validate optimized image (will always pass since we resized to 800x800)
          const validation = await validateImage(optimizedBuffer, {
            maxSize: 5 * 1024 * 1024, // 5MB
            minWidth: 100,
            minHeight: 100,
            maxWidth: 2000,
            maxHeight: 2000
          });

          if (!validation.valid) {
            req.flash('error', validation.errors[0]);
            return res.redirect('/appearance');
          }

          // Upload optimized image to S3
          const key = `${req.userID}.jpg`;
          const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: optimizedBuffer,
            ContentType: 'image/jpeg',
            ACL: 'public-read',
            ContentDisposition: 'inline'
          };

          const command = new PutObjectCommand(uploadParams);
          await s3.send(command);

          // Construct S3 URL
          const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${key}`;
          data.photo = s3Url + "?v=" + Date.now();

          logger.info('Image uploaded and optimized', {
            correlationId: req.correlationId,
            userId: req.userID,
            originalSize: req.file.size,
            optimizedSize: optimizedBuffer.length
          });
        }
    
        await Profile.findOneAndUpdate({ userid: req.userID }, data, { select: 'photo title bio theme' });
        
        // Invalidate user's profile cache
        const user = await User.findById(req.userID).select('username').lean();
        if (user) {
          await deleteCachePattern(`profile:${user.username}*`);
        }
        
        res.redirect('/appearance');
      } catch (error) {
        logger.error('Error updating appearance', {
          correlationId: req.correlationId,
          userId: req.userID,
          error: error.message
        });
        req.flash('error', 'An error occurred while updating your profile.');
        res.redirect('/appearance');
      }
    });
  });

router.post("/delete", async (req, res) => {

  const s3PhotoKey = req.body.uri.split("/")[3];
  // console.log(s3PhotoKey);
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3PhotoKey,
  };

  const command = new DeleteObjectCommand(params);
  try {
    await s3.send(command);
    Profile.findOneAndUpdate({ userid: req.userID }, { photo: null }, { select: 'photo' })
      .then(async () => {
        // Invalidate user's profile cache
        const user = await User.findById(req.userID).select('username').lean();
        if (user) {
          await deleteCachePattern(`profile:${user.username}*`);
        }
        res.json({ status: "success" , message: "Photo deleted successfully"});
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ status: "error", message: "An error occurred" });
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "error", message: "An error occurred" });
  }
});
    

module.exports = router;