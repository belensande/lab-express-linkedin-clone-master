const express = require('express');
const router = express.Router();
const moment = require('moment');

// User model
const Post = require("../models/post");
const Friendship = require("../models/friendship");
const mongoose = require('mongoose');

router.use('/:id', (req, res, next) => {
	if (req.session.currentUser && req.session.currentUser._id == req.params.id) {
		next();
	} else {
		res.redirect("/login");
	}
});

router.get('/:id', function (req, res, next) {
	const id = req.params.id;

	Friendship.find({ accepted: true, $or: [{ requester: id }, { requested: id }] }, { requester: 1, created_at: 1 })
		.populate('requester')
		.populate('requested')
		.sort({ "created_at": -1 })
		.exec((err, friendships) => {
			if (err) {
				next(error);
			} else {
				const friends = friendships.map((friendship) => {
					return friendship.requester._id == id ? friendship.requested._id : friendship.requester._id;
				});
				friends.push(id);
				Post.find({ _created: { $in: friends } })
					.populate('_created')
					.sort({ "created_at": -1 })
					.exec(function (err, posts) {
						if (err) {
							next(error);
						} else {
							res.render('home', { posts, moment });
						}
					});
			}
		});
});

router.get('/:id/posts/new', function (req, res, next) {
	res.render('posts/new', { post: { content: ""} });
});

router.post("/:id/posts/", (req, res, next) => {
	const userId = req.params.id;

	if (req.body.content === "") {
		res.render(`/posts/new/`, {
			errorMessage: "Content is mandatory",
			post: { content: req.body.content}
		});
		return;
	}

	const newPost = Post({
		content: req.body.content,
		_created: mongoose.Types.ObjectId(userId)
	});
	
	newPost.save((err) => {
		if (err) {
			res.render(`/posts/new`, {
				errorMessage: err.message,
				post: { content: req.body.content }
			});
		} else {
			res.redirect("/");
		}
	});
});

router.post("/:userId/posts/:postId/delete", (req, res, next) => {
	const postId = req.params.postId;

	Post.findById({ _id: postId }, (err, post) => {
		if (err) {
			return next(err);
		} else if (!post) {
			const errTemp = new Error('Post not found');
			errTemp.status = 404;
			return next(errTenp);
		} else if (post._created != req.session.currentUser._id) {
			const errTemp = new Error('You are not the author of the post');
			errTemp.status = 403;
			return next(errTenp);
		} else {
			Post.findByIdAndRemove(postId, (err, post) => {
				if (err) { return next(err); }
				return res.redirect('/');
			});
		}
	});
});

router.get('/:userId/posts/:postId/edit', function (req, res, next) {
	const postId = req.params.postId;

	Post.findById({ _id: postId }, (err, post) => {
		if (err) {
			return next(err);
		} else if (!post) {
			const errTemp = new Error('Post not found');
			errTemp.status = 404;
			return next(errTenp);
		} else if (post._created != req.session.currentUser._id) {
			const errTemp = new Error('You are not the author of the post');
			errTemp.status = 403;
			return next(errTenp);
		} else {
			res.render('posts/new', { post: post });
		}
	});
});

router.post('/:userId/posts/:postId', function (req, res, next) {
	const postId = req.params.postId;
	const userId = req.params.userId

	if (req.session.currentUser._id !== userId) {
		const errTemp = new Error("Can`t modify another user's post");
		errTemp.status = 403;
		return next(errTenp);
	} else {
		Post.findById(postId, (err, post) => {
			if (err) {
				return next(err);
			} else if(!post) {
				const err = new Error('Post not found');
				err.status = 404;
				return next(err);
			} else {
				const postInfo = {
					content: req.body.content,
					_created: mongoose.Types.ObjectId(userId)
				};

				if (postInfo.content === "") {
					let postTemp = postInfo;
					postTemp._id = postId;
					res.render("posts/new", {
						errorMessage: "Content is mandatory",
						post: postTemp
					});
					return;
				}

				Post.update({ _id: postId }, postInfo, { runValidators: true }, (err, result) => {
					if (err) {
						if (err.name == 'ValidationError') {
							let postTemp = postInfo;
							postTemp._id = postId;
							res.render("posts/new", {
								errorMessage: err.errors[Object.keys(err.errors)[0]].message,
								post: postTemp
							});
							return;
						} else {
							return next(err);
						}
					} else {
						res.redirect(`/`);
						return;
					}
				});
			}
		});
	}
});

module.exports = router;