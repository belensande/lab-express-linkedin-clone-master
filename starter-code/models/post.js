const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const postSchema = new Schema({
	content: {
		type: String,
		required: [true, 'Content is mandatory']
	},
	_created: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'User id is mandatory']
	}
}, {
	timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;