const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const friendshipSchema = new Schema({
	requester: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Requester id is mandatory']
	},
	requested: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Requested id is mandatory']
	},
	accepted: {
		type: Boolean,
		default: false
	}
}, {
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
	});

const Friendship = mongoose.model("Friendship", friendshipSchema);

module.exports = Friendship;