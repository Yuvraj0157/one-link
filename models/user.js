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
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for performance optimization
userSchema.index({ username: 1 }); // Index for username lookups
userSchema.index({ email: 1 }); // Index for email lookups
userSchema.index({ status: 1 }); // Index for filtering by status
userSchema.index({ createdDate: -1 }); // Index for sorting by creation date

const User = mongoose.model("user",userSchema);

module.exports = User;
