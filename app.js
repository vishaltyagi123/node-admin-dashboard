const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash')
var cookieParser = require('cookie-parser');
const json = require('json');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path')
require('dotenv').config()
const cookieSecret = process.env.SECRET;

const Connection = require('./connection.js');
const userModel  = require('./model/vishal.model');


/* Start Routes */
const userRoute  = require('./routes/userRoute');
//const adminRoute = require('./routes/admin');
const pimRoute = require('./routes/pim');

const port = process.env.PORT || 8000;
const app = express();
const router = express.Router();

// const bodyParserEncoded = bodyParser.urlencoded({ extended:false });

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(express.urlencoded({ extended:false }));
app.use(express.json());

app.use(cookieParser(cookieSecret));
app.use(session({ secret: cookieSecret, cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }));
app.use(flash());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const server = http.createServer(app);

app.use('/', userRoute);
//app.use('/pim', pimRoute );


app.get('*', function(req, res, next){
  res.status(404).render('routeNotFound');
});


server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});


