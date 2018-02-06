const express = require('express');
const router = express.Router();

const Friendship = require("../models/friendship");
const User = require("../models/user");
const mongoose = require('mongoose');

router.use('/:id', (req, res, next) => {
	if (req.session.currentUser && req.session.currentUser._id == req.params.id) {
		next();
	} else {
		res.redirect("/login");
	}
});

router.get("/:id", (req, res, next) => {
	const id = req.params.id;

	Friendship.find({ accepted: true, $or: [{ requester: id }, { requested: id }] }, { requester: 1, created_at: 1 })
		.populate('requester')
		.populate('requested')
		.sort({ "created_at": -1 })
		.exec( (err, friendships) => {
			if (err) {
				next(error);
			} else {
				const friends = friendships.map((friendship) => {
					return friendship.requester._id == id ? friendship.requested : friendship.requester;
				});
				res.render("relations/index", { friends });
			}
		});
});

router.get("/:id/requests", (req, res, next) => {
	const id = req.params.id;

	Friendship.find({ accepted: false, requested: id }, {requester: 1, created_at: 1})
		.populate('requester')
		.sort({ "created_at": -1 })
		.exec(function (err, requests) {
			if (err) {
				next(error);
			} else {
				res.render('relations/requests', { requests });
			}
		});
});

router.post("/:id/request/:otherId", (req, res, next) => {
	const id = req.params.id;
	const otherId = req.params.otherId;

	if (id == otherId) {
		const err = new Error("Can't send a request to yourself");
		err.status = 500;
		next(err);
	}

	User.findById(otherId,
	(userErr, user) => {
		if (userErr) {
			next(userErr);
		} else if (!user) {
			const err = new Error('User Found');
			err.status = 404;
			next(err);
		} else {
			Friendship.find({ $and: [{ $or: [{ requester: id }, { requested: id }] }, { $or: [{ requester: otherId }, { requested: otherId }] }] },
				(err, results) => {
					if (err) {
						next(err);
					} else {
						if (results.length) {
							const err = new Error('Request already exists between users');
							err.status = 500;
							next(err);
						} else {
							const newFriendship = Friendship({
								requester: mongoose.Types.ObjectId(id),
								requested: mongoose.Types.ObjectId(otherId)
							});

							newFriendship.save((err) => {
								if (err) {
									next(err);
								} else {
									res.redirect("/");
								}
							});

						}
					}
				});
		}
	});

});

router.post("/:id/request/:requestId/accept", (req, res, next) => {
	const id = req.params.id;
	const requestId = req.params.requestId;

	Friendship.findByIdAndUpdate(requestId, { $set: { accepted: true } }, (err, tank) => {
		if (err) return next(err);
		res.redirect("/");
	});

});

module.exports = router;