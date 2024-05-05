const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

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
},{strict:false});

userSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("account",userSchema);

module.exports = User;
