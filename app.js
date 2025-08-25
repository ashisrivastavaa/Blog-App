const express = require('express');
const app = express();
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const upload = require('./config/multerconfig');
const userModel = require('./models/user');
const postModel = require('./models/post');

app.set("view engine", 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// ================== ROUTES ===================

// Home
app.get("/", (req, res) => {
    res.render("index");
});
app.get("/register", (req, res) => {
    res.render("index");
});

// Profile
app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    res.render("profile", { user, posts: user.posts });
});

// Like/Unlike
app.get("/like/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id });

    if (!post) return res.send("Post not found");

    let likeIndex = post.likes.indexOf(req.user.userid);

    if (likeIndex === -1) {
        post.likes.push(req.user.userid);
    } else {
        post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.redirect("/profile");
});

// Upload Profile Picture Page
app.get("/profile/upload", isLoggedIn, (req, res) => {
    res.render("profileupload");
});

// Handle Upload
app.post('/upload', isLoggedIn, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file uploaded");

        let user = await userModel.findOne({ email: req.user.email });
        user.profilepic = req.file.filename;
        await user.save();
    console.log(req.file);
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Upload failed");
    }
});

// Edit Post
app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id });
    res.render("edit",{post})
});
app.post("/update/:id", isLoggedIn, async (req, res) => {
    await postModel.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.redirect('/profile');
});

// Create new post
app.post("/profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let { content } = req.body;

    let post = await postModel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
});

// Register
app.post("/register", async (req, res) => {
    let { email, password, username, name, age } = req.body;

    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let newUser = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            });

            let token = jwt.sign({ email: email, userid: newUser._id }, "shhhhhhhh");
            res.cookie("token", token);
            res.redirect("/profile");
        });
    });
});

// Login Page
app.get("/login", (req, res) => {
    res.render("login");   
});

// Login Logic
app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.status(400).send("Email or Password is Wrong");

    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: user.email, userid: user._id }, "shhhhhhhh");
            res.cookie("token", token);
            res.redirect("/profile");
        } else {
            res.status(400).send("Email or Password is Wrong");
        }
    });
});

// Logout
app.get('/logout', (req, res) => {
    res.cookie("token", ""); 
    res.redirect("/login");
});

// Middleware
function isLoggedIn(req, res, next) {
    let token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        let data = jwt.verify(token, "shhhhhhhh");
        req.user = data;
        next();
    } catch (err) {
        return res.send("Invalid Token, please login again!");
    }
}

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
