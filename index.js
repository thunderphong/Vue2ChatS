// Require config to dotenv
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "config/.env") });

// Express
const express = require("express");
const app = express();
app.listen(process.env.PORT, () => {
	console.log("Server's up on port", process.env.PORT);
});

// Req.body
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// Cross origin ...
const cors = require("cors");
app.use(cors());

// Require mongoose connection and database
require("./database/mongoose");
const User = require("./model/user.js");

// Route
app.get("/", (req, res) => {
	res.send("HELLO WORLD!!!");
});

// Register
app.post("/register", async (req, res) => {
	const user = new User(req.body);
	try {
		const cred = await User.findByCredentials(req.body.username, req.body.email);
		if (cred != "") throw new Error(cred);
		await user.save();
		res.status(201).send({ user });
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// Login
app.post("/login", async (req, res) => {
	try {
		const user = await User.findByCredentialsForLogin(req.body.email, req.body.password);
		const token = await user.generateAuthToken();
		res.send({ token, user });
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// Logout
app.post("/logout", async (req, res) => {
	try {
		console.log(req.body);
		const user = await User.findOne({ username: req.body.username });
		if (!user) throw new Error("Cannot logout!");
		else
			user.tokens = user.tokens.filter((token) => {
				return token.token !== req.body.token;
			});
		// else user.tokens = [];
		await user.save();
		res.status(200).send("OK");
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});
