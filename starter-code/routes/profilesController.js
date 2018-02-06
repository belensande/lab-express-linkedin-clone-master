const express = require("express");
const router = express.Router();

// User model
const User = require("../models/user");
const Friendship = require("../models/friendship");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

router.get("/:id", (req, res, next) => {
	const id = req.params.id;

	User.findById(id,
		(userErr, user) => {
			if (userErr) {
				next(userErr);
			} else if (!user) {
				const err = new Error('User Found');
				err.status = 404;
				next(err);
			} else {
				if (req.session.currentUser) {
					const currentUserId = req.session.currentUser._id;

					Friendship.find({$and: [{ accepted: true }, { $or: [{ requester: id }, { requested: id }] }, { $or: [{ requester: currentUserId }, { requested: currentUserId }] }]},
						(err, results) => {
							if (err) {
								next(err);
							} else {
								res.render("profiles/show", {
									profileUser: user, noImage: '/images/no-image.png', friends : results.length > 0
								});
							}
						});
				} else {
					res.render("profiles/show", {
						profileUser: user, noImage: '/images/no-image.png'
					});
				}
			}
		});
});

router.get("/:id/edit", (req, res, next) => {
	if (!req.session.currentUser) {
		res.redirect('/login');
	} else if (req.session.currentUser._id !== req.params.id) {
		res.redirect('/');
	} else {
		res.render('profiles/edit');
	}
});

router.post("/:id", (req, res, next) => {
	if (!req.session.currentUser) {
		res.redirect('/login');
	} else if (req.session.currentUser._id !== req.params.id) {
		const errTemp = new Error("Can`t modify another user's profile");
		errTemp.status = 403;
		return next(errTenp);
	} else {
		User.findById(req.params.id, (err, user) => {
			if (err || !user) {
				const err = new Error('User Found');
				err.status = 404;
				next(err);
			} else {
				let oldPass = user.password;
				let newPass = req.body.password;
				if (oldPass !== newPass) {
					const salt = bcrypt.genSaltSync(bcryptSalt);
					newPass = bcrypt.hashSync(newPass, salt);
				}

				const userInfo = {
					name: req.body.name,
					password: newPass,
					email: req.body.email,
					summary: req.body.summary,
					imageUrl: req.body.imageUrl,
					company: req.body.company,
					jobTitle: req.body.jobTitle
				};

				if (userInfo.name === "" || userInfo.password === "" || userInfo.email === "") {
					let userTemp = userInfo;
					user._id = req.params.id;
					userTemp.render("profiles/edit", {
						errorMessage: "Indicate a name, password and email to save profile",
						user: userTemp
					});
					return;
				}

				User.update({ _id: req.params.id }, userInfo, { runValidators: true }, (err, result) => {
					if (err) {
						if (err.name == 'ValidationError') {
							let userTemp = userInfo;
							userTemp._id = req.params.id;
							res.render('profiles/edit', {
								errorMessage: err.errors[0].message,
								user: userTemp
							});
						} else {
							next(err);
						}
					} else {
						res.redirect(`/profiles/${req.params.id}`);
					}
				});
			}
		});
	}
});

module.exports = router;