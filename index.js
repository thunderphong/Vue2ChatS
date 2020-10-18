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

// Require Mongoose
require("./database/mongoose");

// Route

app.get("/", (req, res) => {
	res.send("HELLO WORLD!!!");
});
