require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // Import mongoose
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post')
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const { hash } = require('crypto');
const jwt = require('jsonwebtoken');
const { log } = require('console');

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
})

.then(() => console.log('Mongo connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.set("view engine", 'ejs');
app.use(express.static(path.join(__dirname)));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', function (req, res) {
    res.render('index');
});

app.post('/register', async (req, res) => {
    let { email, password, username, name, age } = req.body;

    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("User is already registered");

    // Hash the password
    // const salt = await bcrypt.genSalt(10);
    // const hash = await bcrypt.hash(password, salt);

    // // Create a new user
    // const newUser = new userModel({
    //     email,
    //     password: hash,
    //     username: username,
    //     name,
    //     age,
    // });

    // // Save the new user to the database
    // await newUser.save();
    // res.status(201).send("User registered successfully");
    bcrypt.genSalt(10,(err,salt) => {
        bcrypt.hash(password,salt,async (err,hash) =>{
            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password : hash
            });
            let token = jwt.sign({email:email , userid:user._id},"shhhhh")
            res.cookie("token",token);
            res.redirect("/login")
        
        })
    })
});

// for login 

app.get("/login",(req,res)=>{
    res.render("login")
})


app.get("/profile",isLoggedIn, async (req,res) =>{
    let user = await userModel.findOne({email:req.user.email}).populate("posts");
    // console.log(user.posts);
    
    res.render("profile",{user})
    
})

app.get("/like/:id",isLoggedIn, async (req,res) =>{
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
    }
    await post.save();
    res.redirect("/profile")
    
})

app.get("/edit/:id",isLoggedIn, async (req,res) =>{
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    
    res.render('edit',{post})
})

app.get("/update/:id",isLoggedIn, async (req,res) =>{
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{content:req.body.content});
    
    res.redirect("/profile")
})

app.post("/post",isLoggedIn, async (req,res) =>{
    let user = await userModel.findOne({email:req.user.email})
    let {content}= req.body;

    // console.log(req.body)
    let post = await postModel.create({
        user:user._id,
        content
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile")
})

app.post('/login', async (req, res) => {
    let { email, password} = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("SOmething went wrong");
   
    // checking the pasword and email 
    bcrypt.compare(password,user.password,function (err,result){
        if(result){
            let token = jwt.sign({email:email , userid:user._id},"shhhhh")
            res.cookie("token",token);
            res.status(200).redirect("profile");
        
        }     
            else res.redirect("/login")
    })
});

// for log out

app.get('/logout',(req,res)=>{
    res.cookie("token", "");
    res.redirect("/login")
})

function isLoggedIn(req, res, next) {
    if (!req.cookies.token) { // Check if the token cookie is present
        return res.redirect("/login");
    } else {
        try {
            let data = jwt.verify(req.cookies.token, "shhhhh"); // Use req.cookies.token
            req.user = data; // Attach user data to req
            next();
        } catch (err) {
            return res.redirect("/login"); // Handle invalid token
        }
    }
}


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
