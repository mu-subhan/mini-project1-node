require('dotenv').config();
const mongoose = require('mongoose');

// Define user schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true },
    password: { type: String },
    profilepic:{
        type:String,
        default : "default.jpeg"
    },
    posts : [
        {type:mongoose.Schema.Types.ObjectId,ref:"post"}
    ]
});

// Create the user model 
const user = mongoose.model("user", userSchema);

// Export the user model
module.exports = user;
