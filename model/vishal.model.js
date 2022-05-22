const Mongoose = require("mongoose")

const userSchema = new Mongoose.Schema({
    username: {
	    type: String,
	    required: true,
        errorMessage: 'UserName is required',
    },
    email: {
        type: String,
        required: true,
        errorMessage: 'Email is required',
    },
    password: {
        type: String,
        required: true,
        errorMessage: 'Password is required',
    },
});

Mongoose.model("User", userSchema )


module.exports = userSchema;
