const express = require("express");
const authController = express.Router();

// User model
const User = require("../models/user");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

authController.use('/login', (req, res, next) => {
	if (req.session.currentUser) {
		res.redirect(`/users/${req.session.currentUser._id}`);
	} else {
		next();
	}
});

authController.get("/", (req, res, next) => {
	res.redirect(`/login`);
});

authController.get("/login", (req, res, next) => {
	res.render("authentication/login");
});

authController.post("/login", (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	if (email === "" || password === "") {
		res.render("authentication/login", {
			errorMessage: "Indicate an email and a password to log in"
		});
		return;
	}

	User.findOne({ "email": email },
		(err, user) => {
			if (err || !user) {
				res.render("authentication/login", {
					errorMessage: "There's no user with that email"
				});
				return;
			} else {
				if (bcrypt.compareSync(password, user.password)) {
					req.session.currentUser = user;
					return res.redirect(`/users/${user._id}`);
				} else {
					res.render("authentication/login", {
						errorMessage: "Incorrect password"
					});
					return;
				}
			}
		});
});

authController.get("/logout", (req, res, next) => {
	req.session.destroy((err) => {
		if (err) {
			return next(err);
		}
		res.redirect("/login");
	});
});

authController.get("/signup", (req, res, next) => {
	res.render("authentication/signup");
});

authController.post("/signup", (req, res, next) => {
	if (req.body.name === "" || req.body.password === "" || req.body.email === "") {
		res.render("authentication/signup", {
			errorMessage: "Indicate a name, password and email to sign up"
		});
		return;
	}

	User.findOne({ "email": req.body.email }, (err, user) => {
		if (user !== null) {
			res.render("authentication/signup", {
				errorMessage: "Email registered before"
			});
			return;
		}
	});

	const salt = bcrypt.genSaltSync(bcryptSalt);
	const hashPass = bcrypt.hashSync(req.body.password, salt);

	const newUser = User({
		name: req.body.name,
		password: hashPass,
		email: req.body.email,
		summary: req.body.summary,
		imageUrl: req.body.imageUrl,
		company: req.body.company,
		jobTitle: req.body.jobTitle
	});

	newUser.save((err) => {
		if (err) {
			res.render("authentication/signup", {
				errorMessage: err.message
			});
		}
		else { res.redirect("/"); }
	});
});

module.exports = authController;