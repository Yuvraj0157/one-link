const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
    },
    createdDate:{
      type:String
    },
    status:{
      type:String,
      enum:['verification','active'],
      default:'verification'
    }
});

const User = mongoose.model("user",userSchema);

module.exports = User;
