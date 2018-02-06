const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const userSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Name is mandatory'],
		minLength: [4, 'Name must be four characters lenght at least']
	},
	email: {
		type: String,
		required: [true, 'Email is mandatory'],
		match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Email not valid'],
		unique: [true, 'Email already exists']
	},
	password: {
		type: String,
		required: [true, 'Password is mandatory']
	},
	summary: String,
	imageUrl: String,
	company: String,
	jobTitle: String
}, {
	timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

const User = mongoose.model("User", userSchema);
module.exports = User;