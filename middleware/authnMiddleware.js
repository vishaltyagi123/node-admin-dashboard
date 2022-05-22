const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const session = require('express-session')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const tokenSecret = process.env.TOKEN_SECRET;
const cookieSecret = process.env.SECRET;

app.use(cookieParser(cookieSecret));
app.use(session({ secret: cookieSecret, cookie: { maxAge: 60000 }, resave: true , saveUninitialized: true}));
app.use(flash());

const verifyToken = (req ,res ,next) => {
	const cookieHeader = req.cookies;
	if (!cookieHeader) {
		req.flash("message", "Unauthorized Request");
		return res.redirect('/');
    }

    const token = req.cookies.jwt_token;
    jwt.verify(token, tokenSecret, (err, user) => {
        if (err) {
        	req.flash("message", "Unauthorized Request");
        	return res.redirect('/');
        }
        res.header('Authorization', 'Bearer '+ token);
        next();
    });
}



const isLoggedIn = (req ,res ,next) => {
    const token = req.cookies.jwt_token;
    if (token) {
        return res.redirect('/dashboard');
    }
    return next();
}

const authJwt = {
    verifyToken: verifyToken,
    isLoggedIn: isLoggedIn
};
module.exports = authJwt;
