const mongoose = require('mongoose');

mongoose.set('autoCreate', false);

const linkSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    url:{
        type:String,
        required:true
    },
    icon:{
        type:String,
        default:'fas fa-link'
    },
    active:{
        type:Boolean,
        default:true
    }
}, {
    timestamps: true
})

const Link = mongoose.model("link",linkSchema);

module.exports = {
    Link,
    linkSchema
};