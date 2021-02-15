// Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const Pool = require('pg').Pool;
const url = require("url");
const uuid = require("uuid").v4;

// Setup
var postParse = bodyParser.urlencoded({extended: false});
const app = express();
const PORT = process.env.PORT || 3001;
const dbUrl = process.env.DATABASE_URL;
const dbUrlParams = url.parse(process.env.DATABASE_URL);
const urlAuth = dbUrlParams.auth.split(":");
let SSL = process.env.SSL || { rejectUnauthorized: false };
let dataset = "users";

app.set("view engine", "pug");
app.set("views", "./views");
app.use(express.static("public"));


if (SSL === "false") {
	SSL = false;
}
const config = {
	user: urlAuth[0],
	password: urlAuth[1],
	host: dbUrlParams.hostname,
	port: dbUrlParams.port,
	database: dbUrlParams.pathname.split("/")[1],
	ssl: SSL,
};
const pool = new Pool(config);

// =======================================
// UTILITIES
// =======================================

function getUsers(req, res) {
	// console.log(`db getUsers`);
	pool.query(`SELECT * FROM ${dataset} ORDER BY id ASC`, (error, results) => {
		if (error) {
			throw error;
		}
		res.status(200).json(results.rows);
	});
}

function addUser(req, res, data) {
   pool.query(`INSERT INTO ${dataset}(id, firstName, lastName, email, age) VALUES($1, $2, $3, $4, $5)`, data, (e, result) => {
      if (e) {
         res.render("error", {attempt: "Error while attempting to add user"});
      } else {
         showAllUsers(res);
      }
   });
}

function showAllUsers(res, sortCol = "id", dir = "ASC") {
   pool.query(`SELECT * FROM ${dataset} ORDER BY ${sortCol} ${dir}`, (e, data) => {
      if (e) throw e;
      res.render("users", {users: data});
   });
}
// =======================================
// GET REQUESTS
// =======================================

app.get("/users/:query*?", (req, res) => {
   let q = {};
   if (req.params.query) {
      q = JSON.parse(req.params.query);
   }
   // console.log(`Query is ${q}`);
   pool.query(`SELECT * FROM ${dataset} WHERE id = $1`, req.params.query, (e, data) => {
      if (e) throw e;
      res.render("users", { users: data, userCount: data.length || 0 });
   });
   // db.find(q, (e, data) => {
   //    if (e) throw e;
   //    activeData = data;
   //    res.render("users", { users: data, userCount: data.length || 0 });
   // });
});

app.get("/", (req, res) => {
   res.render("index");
});

app.get("/addUser", (req, res) => {
   res.render("addUser");
});

app.get("/search", (req, res) => {
   res.render("search");
});

app.get("/edit/:uid", (req, res) => {
   // db.find({ userId: req.params.uid }, (e, data) => {
   //    editing = req.params.uid;
   //    res.render("editUser", data[0]);
   // });
});

app.get("/delete/:uid", (req, res) => {
   // db.find({ userId: req.params.uid }, (e, data) => { })
   //    .deleteOne({ userId: req.params.uid }, (e, result) => {
   //    updateUsers(res);
   // });
});

// =======================================
// POST REQUESTS
// =======================================

app.post("/sort", postParse, (req, res) => {
   let type = req.body.type;
   let order = req.body.order;
   // db.find({}, (e, data) => {
   //    res.render("users", { users: data, userCount: data.length || 0 });
   // }).sort(order + "" + type);
});

app.post("/newUser", postParse, (req, res) => {
   addUser(uuid(), req.body.firstName, req.body.lastName, req.body.email, req.body.age, res);
});

app.post("/editExisting", postParse, (req, res) => {
   let updatedUser = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      age: req.body.age
   };
   // db.findOneAndUpdate({ userId: editing }, updatedUser, (e) => {
   //    if (e) console.log(e);
   //    updateUsers(res);
   // });
});

app.post("/search", postParse, (req, res) => {
   let filter = {};
   if (req.body.firstName) {
      filter["firstName"] = req.body.firstName;
   }
   if (req.body.lastName) {
      filter["lastName"] = req.body.lastName;
   }
   console.log(filter);
   // db.find(filter, (e, data) => {
   //    res.render("users", {users: data, userCount: data.length || 0});
   // });
});

// =======================================
// MISC
// =======================================

app.listen(PORT, () => {
   console.log(`Listening on port ${PORT}`);
});