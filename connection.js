const mongoose = require('mongoose');
const url =  process.env.URL;

mongoose.connect( url, {
  useNewUrlParser: "true",
});

mongoose.connection.on("error", err => {
  console.log("err", err)
});

mongoose.connection.on("connected", (err, res) => {
  console.log("mongoose is connected")
});


module.exports;