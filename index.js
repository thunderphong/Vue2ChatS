// Require config to dotenv
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "config/.env") });

// Express
const express = require("express");
const app = express();

// Req.body
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// Cross origin ...
const cors = require("cors");
app.use(cors());

// Require mongoose connection and database
require("./database/mongoose");
const User = require("./model/user.js");
const Chat = require("./model/chat.js");

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

// namespace

// Add namespace. Params need: { namespace*, user }
app.post("/addNamespace", async (req, res) => {
	try {
		// Check Namespace
		const isExist = await Chat.findNameSpace(req.body.namespace);
		if (isExist != "") throw new Error(isExist);

		// Check user
		const userData = await User.findCredentialsWithUsername(req.body.user.username);
		const namespace = new Chat(req.body);
		await namespace.addUserToListUser(
			{
				id: userData._id,
				username: userData.username,
			},
			req.body.namespace
		);
		res.status(201).json(namespace);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// Add user to namespace. Params need: { namespace, user }
app.post("/addUserToNamespace", async (req, res) => {
	try {
		const namespace = await Chat.findOne({ namespace: req.body.namespace });
		const userData = await User.findCredentialsWithUsername(req.body.user.username);

		if (!namespace) throw new Error("Namespace not found!");
		await namespace.addUserToListUser(
			{
				id: userData._id,
				username: userData.username,
			},
			req.body.namespace
		);
		res.status(201).json(namespace);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// Add dialog to namespace. Params need: { namespace, username, message }
app.post("/dialog", async (req, res) => {
	try {
		const namespace = await Chat.findOne({ namespace: req.body.namespace });
		const data = {
			username: req.body.username,
			message: req.body.message,
			timeSend: new Date(Date.now()),
		};
		namespace.chatDialog = namespace.chatDialog.concat([data]);
		namespace.save();
		res.json(namespace.chatDialog);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// Get namespace list
app.get("/getNamespace", async (req, res) => {
	try {
		const namespaceArray = await Chat.find({}, "namespace");
		res.status(201).send(namespaceArray);
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// Get namespace list of a user.
app.get("/getNamespaceOfMe/:username", async (req, res) => {
	try {
		const user = await User.findOne({ username: req.params.username });
		if (user) res.status(201).json(user.namespaces);
		else return res.status(400).send("Not found user");
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// Get user list of a namespace.
app.get("/getUserList/:namespace", async (req, res) => {
	try {
		const namespace = await Chat.findOne({ namespace: req.params.namespace });
		if (namespace) res.status(201).json(namespace.listUser);
		else return res.status(400).send("Not found namespace");
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// Get Dialog from a namespace
app.get("/getDialogOfNamespace/:namespace", async (req, res) => {
	try {
		const room = await Chat.findOne({ namespace: req.params.namespace });
		if (room) res.status(201).send(room.chatDialog);
		else throw new Error("Khong tim thay namespace");
	} catch (err) {
		res.status(400).send({ error: err.message });
	}
});

// IO

const server = require("http").createServer(app);
const options = { cors: true };
const io = require("socket.io")(server, options);

io.on("connection", (socket) => {
	console.log("Client", socket.id, "connected in room", socket.rooms);

	socket.on("disconnecting", (reason) => {
		console.log(reason);
	});
});

server.listen(process.env.PORT, () => {
	console.log("Server's up on port", process.env.PORT);
});

// Namespace

const nameArray = ["commonRoom", "commonRoom2", "testRoom", "Thn"];

for (const nps of nameArray) {
	let namespaceUserNums = 0;
	const name = io.of("/" + nps);

	name.on("connection", (socket) => {
		console.log("A user has entered namespace " + nps + ", id:", socket.id);

		// socket.on("SEND_MESSAGE", (userObject) => {
		// 	io.of(nps).emit("MESSAGE", {
		// 		user: userObject.user,
		// 		msg: userObject.message,
		// 	});
		// 	if (!userObject.isCreated) namespaceUserNums++;
		// 	console.log("Namespace " + nps + ": ", userObject);
		// });

		socket.on("SEND_HELLO", (message) => {
			namespaceUserNums++;
			console.log("SEND_HeLLO", message, nps, "Num:", namespaceUserNums);
			io.of(nps).emit("HELLO", message);
		});

		socket.on("disconnecting", (reason) => {
			console.log(reason);
		});
	});
}
