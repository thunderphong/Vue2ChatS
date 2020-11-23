// Mongoose
const mongoose = require("mongoose");

// Hash password
const bcrypt = require("bcryptjs");

// Token
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
	{
		username: {
			type: String,
			unique: true,
			required: true,
			lowercase: true,
			minlength: 6,
		},
		email: {
			type: String,
			unique: true,
			required: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 7,
		},
		tokens: [{ token: { type: String, required: true } }],
		namespaces: [],
		// avatar: { type: Buffer },
	},
	{ timestamps: true }
);

// Set a virtual data where data actually go in to Chat schema
// userSchema.virtual("chat", {
// 	ref: "Chat",
// 	localField: "_id",
// 	foreignField: "listUser",
// });

// Reference Methods

// Generate Token
userSchema.methods.generateAuthToken = async function () {
	const user = this;
	const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
	user.tokens = user.tokens.concat({ token });
	await user.save();
	return token;
};

// Auto hide credentials field in returned data
userSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;

	return userObject;
};

// Model methods

// Find duplicate email and used username in register
userSchema.statics.findByCredentials = async (username, email) => {
	const user = await User.findOne({ username: username });
	if (user) {
		return "Username has already taken!";
	}

	const mail = await User.findOne({ email });
	if (mail) return "Email has already registered!";

	return "";
};

// Find credencials for login
userSchema.statics.findByCredentialsForLogin = async (email, password) => {
	const user = await User.findOne({ email });
	if (!user) throw new Error("Unable to login - Email");

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) throw new Error("Unable to login - Password");

	return user;
};

// Find credentials with username
userSchema.statics.findCredentialsWithUsername = async (username) => {
	const user = await User.findOne({ username });
	if (!user) throw new Error("No user have username:", username);

	return user;
};

// Pre and post internal methods

// Hash password before saving
userSchema.pre("save", async function (next) {
	const user = this;

	if (user.isModified("password")) user.password = await bcrypt.hash(user.password, 8);

	next();
});

const User = mongoose.model("user", userSchema);

module.exports = User;
