// Mongoose
const mongoose = require("mongoose");

// User
const User = require("./user.js");

const chatSchema = mongoose.Schema({
	namespace: {
		type: String,
		unique: true,
		required: true,
	},
	listUser: [
		{
			id: { type: String },
			username: { type: String },
		},
	],
	chatDialog: [
		{
			username: { type: String, required: true },
			message: { type: String, required: true },
			timeSend: { type: Date, required: true },
		},
	],
});

/*---------Reference Methods----------*/
chatSchema.methods.addUserToListUser = async function (user, namespace) {
	const userS = await User.findOne({ username: user.username });

	if (userS.namespaces.indexOf(namespace) == -1) {
		// Add namespace to User.js
		userS.namespaces.push(namespace);
		userS.save();

		// Add user to Chat.js
		const chat = this;
		chat.listUser = chat.listUser.concat([user]);
		await chat.save();
	} else return;
};

/*---------Model methods----------*/

// Find Is a certain namespace exists
chatSchema.statics.findNameSpace = async (name) => {
	const isExist = await Chat.findOne({ namespace: name });
	if (isExist) return "Cannot create room has already created!";
	else return "";
};

const Chat = mongoose.model("chat", chatSchema);

module.exports = Chat;
