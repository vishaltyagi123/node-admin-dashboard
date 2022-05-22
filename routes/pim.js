const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const router = express.Router()
const json = require('json')
const http = require('http')
const path = require('path')


router.get('/', (req ,res) => {
	res.send('pim call');
});


// switch(service) {
//     case category:
//         categoryService("catgory");
//     break;

//     case product:
//         productService("product");
//     break;

//     case fetch:
//         fetchAsync("url");
//     break;

//     default
// }


// const categoryService = (catgory) => {
//     console.log(catgory);
// }


// const productService = (product) => {
// 	console.log(product);
// }


// async function fetch (url) {
//     let response = await fetch(url);
//     let data = await response.json();
//     return data;
// }

