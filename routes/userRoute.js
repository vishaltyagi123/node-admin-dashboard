const express = require('express')
const {body,validationResult} = require('express-validator')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const router = express.Router()
const userModel  = require('../model/vishal.model')
const session = require('express-session')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const {verifyToken,isLoggedIn} = require("../middleware/authnMiddleware")
const cookieSecret = process.env.SECRET;
const tokenSecret = process.env.TOKEN_SECRET;
const paginate = require('paginate')({ mongoose: mongoose})

const UserModel = mongoose.model('users',userModel);

app.use(cookieParser(cookieSecret));
app.use(session({ secret: cookieSecret, cookie: { maxAge: 60000 }, resave: true , saveUninitialized: true}));
app.use(flash());

const bodyParserEncoded = bodyParser.urlencoded({ extended:false });


router.get('/',isLoggedIn,(req, res) => {
    const cookie = req.cookies.jwt_token;
    let lval =  (cookie) ? true : false;
    res.render('login', {message: "", login: lval});
});


/* == Login == */

router.post('/login',
    body('email','Please enter Email!').notEmpty(),
    body('password','Please enter Password!').notEmpty(),(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const alert  = errors.array();
        return res.render('login', {
            alert: alert,
            message: "",
        });
    }

    try {
        UserModel.findOne({email: req.body.email}, function(err, user){
            let hashedNotPassword = req.body.password;
            const saltRounds = 10;
            bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
                if (isMatch) {
                    let token = jwt.sign({
                            userId: user.id,
                            email: user.email,
                            user:user.username
                        }, tokenSecret, { expiresIn: 60 * 60 }
                    );
                    if(token){
                        res.header('Authorization', 'Bearer '+ token);
                        res.cookie('jwt_token',token, {secure: true, maxAge: 3600000});
                    }
                    return res.redirect('/dashboard');
                }
                return res.render('login', {
                    message: "Wrong details please check at once",
                });
            })
        });
    } catch (err) {
        const error = new Error("Error! Something went wrong.");
        return next(error);
    }
});


/* == Token Verification == */

router.get('/dashboard', verifyToken, (req, res) => {
    const token = req.cookies.jwt_token;
    let lval =  (token) ? true : false;
    var decoded = jwt.verify(token, tokenSecret);
    console.log(decoded);
    const msg = req.flash('message');
    UserModel.find({}, function(err, users){
        if(err){
            console.log(err);
        } else {
            res.render('dashboard', {
                users:users,
                searchResult: "",
                message: msg,
                login:lval,
                auth: decoded
            });
        }
    });
});



/* == Users Pagination == */

router.get('/users/:page?', verifyToken , function(req, res, next) {
    const token = req.cookies.jwt_token;
    const lval =  (token) ? true : false;
    let decoded = jwt.verify(token, tokenSecret);
    let perPage = 10;
    let page = req.params.page || 1;
    if (!page) {
        next();
        return;
    }

    if(!isNaN(page)){
        UserModel.find({}).skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, users) {
            UserModel.count().exec(function(err, count) {
                if (err) return next(err)
                res.render('users',{
                    users:users,
                    count: count,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    auth: decoded
                });
            });
        });
    }else{
        throw new Error('NaN');
    }
});


router.get('/edit/:id', verifyToken, (req, res) => {
    //const User = mongoose.model('users',userModel);
    const msg = req.flash('message', '');
    UserModel.findOne({_id:req.params.id}, function(err, users){
        if(err){
            console.log(err);
        }else {
            res.render('editList', { "users": users });
        }
    })
})


router.post('/update/:id',verifyToken, 
    body('username','Please enter a username!').isLength({min:3}),
    body('email').isEmail().notEmpty(),(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

        const alert  = errors.array();
        return res.render('register', {
            alert
        });
    }

    UserModel.findOneAndUpdate({_id:req.params.id},{username:req.body.username},{email:req.body.email},(err, post) => {
        if(err){
            console.log(err);
        }else {
            req.flash("message", "User updated.");
            res.redirect('/users');
        }
    });
});

/* == Registration Url == */

router.get('/register', isLoggedIn, ( req ,res ) => {
    const msg = req.flash('message');
    res.render('register', {
        message: msg,
    });
});


/* === search in exprrss === */

router.get('/search/:username?' ,verifyToken, function(req, res, next) {
    const token = req.cookies.jwt_token;
    let decoded = jwt.verify(token, tokenSecret);
    console.log(req.query);
    UserModel.find({ "username": { $regex: '.*' + req.query.username + '.*' }},(err, searchResult) => {
        if(err) { res.send(err) }
        console.log(searchResult);
        return res.render('dashboard', {
            searchResult: searchResult,
            message: "",
            login:"",
            auth: decoded
        });
    });
});




/* === register user route === */

router.post('/register',isLoggedIn, bodyParserEncoded,
    [
        body('username','Please enter a username!').isLength({min:3}),
        body('email','Enter valid Email').isEmail().exists(),
        body('password','Please enter a Password!').isLength({ min: 5 }),
        body('confirmpassword',"Please enter Confirm Password!").isLength({ min: 5 }),
    ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const alert  = errors.array();
        return res.render('register', { alert });
    }

    if(req.body.password != req.body.confirmpassword) {
        let alert = [{ value: '', msg: 'Passwords doesn\'t match' }];
        return res.render('register', { alert });
    }

    UserModel.findOne({email:req.body.email}, function(err, userExist){
        if(err){
            console.log(err);
        }
        
        if(userExist){
            let alert = [{ value: '', msg: 'Email already Exist' }];
            return res.render('register', { alert });
        }
        let passwordNotHashed = req.body.password;
       
        bcrypt.genSalt(10, function (err, Salt) {
            bcrypt.hash(passwordNotHashed, Salt, function (err, hash) {
                if (err) {
                    return console.log('Cannot encrypt');
                }

                const saveUserData = new UserModel({
                    username: req.body.username,
                    email: req.body.email,
                    password: hash
                });

                saveUserData.save(function (err) {
                    if(err)
                        console.log(err);
                    req.flash('message','User added');
                    res.redirect('/register');
                });
            });
        });
    })
});


/* == profile == */

router.get('/profile', verifyToken, (req, res) => {
    const token = req.cookies.jwt_token;
    let decoded = jwt.verify(token, tokenSecret);
    UserModel.findOne({_id:decoded.userId}, function(err, admin ){
        if(err){
            console.log(err);
        }else {
            res.render('profile', {
                admin: admin,
                message: "",
                auth: decoded
            });
        }
    })
})

/*== change password == */

router.get('/change-password', verifyToken, (req, res) => {
    const token = req.cookies.jwt_token;
    let decoded = jwt.verify(token, tokenSecret);
    res.render('changePassword', {
        message: "",
        auth: decoded
    });
})


router.post('/change-password',verifyToken, bodyParserEncoded,
    [
        body('password','Please enter a Password!').isLength({ min: 5 }),
        body('confirmpassword',"Please enter Confirm Password!").isLength({ min: 5 }),
    ], (req, res) => {

    const token = req.cookies.jwt_token;
    let decoded = jwt.verify(token, tokenSecret);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const alert  = errors.array();
        return res.render('changePassword', { "alert": alert, "auth": decoded });
    }

    if(req.body.password != req.body.confirmpassword) {
        let alert = [{ value: '', msg: 'Passwords doesn\'t match' }];
        return res.render('changePassword', { "alert": alert, "auth": decoded});
    }

    let passwordNotHashed = req.body.password;

    bcrypt.genSalt(10, function (err, Salt) {
        bcrypt.hash(passwordNotHashed, Salt, function (err, hash) {
            if (err) {
                return console.log('Cannot encrypt');
            }

            UserModel.findOneAndUpdate({_id: decoded.userId },{ password: hash },(err, logedInUser) => {
                if(err){
                    console.log(err);
                }else {
                    req.flash("message", "User updated.");
                    res.redirect('/change-password');
                }
            })
        });
    });
});


/* == User Delete == */

router.get('/delete/:id', verifyToken, (req, res) => {
    const userModelData = mongoose.model('users',userModel);
    userModelData.findOneAndRemove({_id: req.params.id}, (err) => {
        if (err) {
            req.send(err);
        }

        req.flash("message", "User has been deleted.");
        return res.redirect("/users");
    });
});

/*== Logout Route ==*/

router.get('/logout', (req, res) => {
    res.clearCookie('jwt_token');
    res.clearCookie('admin_session');
    return res.redirect("/");
});


module.exports = router;