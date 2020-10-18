// Mongoose
const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
	{
		email: { type: String },
		password: { type: String },
		name: { type: String },
		token: [{ token: { type: String } }],
		avatar: { type: Buffer },
	},
	{ timestamps: true }
);

const User = mongoose.model("user", userSchema);

module.exports = User;
