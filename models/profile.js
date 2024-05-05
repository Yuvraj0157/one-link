const mongoose = require('mongoose');
const {Link,linkSchema} = require('./link');

const profileSchema = new mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        unique:true
    },
    photo:{
        type:String
    },
    title:{
        type:String
    },
    bio:{
        type:String
    },
    theme:{
        type:String,
        enum: ['default','dark','wave','purple','hexagonal','bluedot','purpledot','shapes','soundwave','abstractpaper','stockmarket','worldmapindia','moon','snow','sprinkle','masscircles','animatedshape','meteor'],
        default: 'default'
    },
    totalViews:{
        type:Number,
        default:0,
    },
    links:[linkSchema],
    handles: {
        email: { type: String },
        facebook: { type: String },
        twitter: { type: String },
        instagram: { type: String },
        youtube: { type: String },
        linkedin: { type: String },
        clubhouse: { type: String },
        whatsapp: { type: String },
        telegram: { type: String },
        signal: { type: String },
        twitch: { type: String },
        pinterest: { type: String },
        tiktok: { type: String },
        spotify: { type: String },
        amazon: { type: String },
        snapchat: { type: String },
        payment: { type: String },
        github: { type: String },
    }
})

const Profile = mongoose.model('profile',profileSchema);

module.exports = Profile;