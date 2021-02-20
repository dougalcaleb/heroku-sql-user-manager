// Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const Pool = require('pg').Pool;
const url = require("url");
const uuid = require("uuid").v4;
const e = require("express");
const { POINT_CONVERSION_COMPRESSED } = require("constants");

// Setup
var postParse = bodyParser.urlencoded({extended: false});
const app = express();
const PORT = process.env.PORT || 3001;
const dbUrl = process.env.DATABASE_URL;
const dbUrlParams = url.parse(process.env.DATABASE_URL);
const urlAuth = dbUrlParams.auth.split(":");
let SSL = process.env.SSL || { rejectUnauthorized: false };
let dataset = "users";

let CREATE_TABLE = false;
let DROP_OLD_TABLE = false;

let editing;

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

function addUser(res, data) {
   pool.query(`INSERT INTO ${dataset}(id, firstName, lastName, email, age) VALUES($1, $2, $3, $4, $5)`, data, (e, result) => {
      if (e) {
         console.log(e);
         res.render("error", {attempt: "Error while attempting to add user"});
      } else {
         showAllUsers(res);
      }
   });
}

function showAllUsers(res, sortCol = "id", dir = "ASC") {
   pool.query(`SELECT * FROM ${dataset} ORDER BY ${sortCol} ${dir}`, (e, data) => {
      if (e) throw e;
      res.render("users", {users: data.rows, userCount: data.rows.length});
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
   console.log(`Query is ${q}`);
   console.log(`Grabbing from dataset ${dataset} in db at url ${process.env.DATABASE_URL}`);
   pool.query(`SELECT * FROM ${dataset} WHERE id = $1`, [req.params.query], (e, data) => {
      if (e) throw e;
      if (data.rows) {
         console.log(`Retrieved data. Outputting:`);
         console.log(JSON.stringify(data.rows));
         res.render("users", { users: data.rows, userCount: data.rows.length || 0 });
      } else {
         console.log("Recieved no data");
         res.render("users", { users: [], userCount: 0 });
      }
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
   pool.query(`SELECT * FROM ${dataset} WHERE id = $1`, [req.params.uid], (e, data) => {
      if (e) throw e;
      // if (data.rows) {
      //    res.rrend
      // } else {
      //    res.render("users", { users: [], userCount: 0 });
      // }
      editing = req.params.uid;
      res.render("editUser", data.rows[0]);
   });
});

app.get("/delete/:uid", (req, res) => {
   // db.find({ userId: req.params.uid }, (e, data) => { })
   //    .deleteOne({ userId: req.params.uid }, (e, result) => {
   //    updateUsers(res);
   // });
   pool.query(`DELETE FROM ${dataset} WHERE id = $1`, [req.params.uid], (e, data) => {
      if (e) throw e;
      // if (data.rows) {
      //    res.rrend
      // } else {
      //    res.render("users", { users: [], userCount: 0 });
      // }
      pool.query(`SELECT * FROM ${dataset}`, (e, data) => {
         res.render("users", { users: data.rows, userCount: data.rows.length });
      });
   });
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
   pool.query(`SELECT * FROM ${dataset} ORDER BY ${type} ${order}`, (e, data) => {
      res.render("users", { users: data.rows, userCount: data.rows.length });
   });
});

app.post("/newUser", postParse, (req, res) => {
   addUser(res, [uuid(), req.body.firstName, req.body.lastName, req.body.email, req.body.age]);
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
   pool.query(`UPDATE ${dataset} SET firstName = $1, lastName = $2, email = $3, age = $4 WHERE id = $5`, [updatedUser.firstName, updateUser.lastName, updatedUser.email, updatedUser.age, editing], (e, data) => {
      pool.query(`SELECT * FROM ${dataset}`, (e, data) => {
         res.render("users", { users: data.rows, userCount: data.rows.length });
      });
   });
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
   pool.query(`SELECT * FROM ${dataset} WHERE $1 = $2`, [filter[0], filter[1]], (e, data) => {
      res.render("users", { users: data.rows, userCount: data.rows.length });
   });
});

// =======================================
// MISC
// =======================================

app.listen(PORT, () => {
   console.log(`Listening on port ${PORT}`);
});

function manageTables() {
   if (DROP_OLD_TABLE) {
      pool.query(`DROP TABLE ${dataset}`, (e, res) => {
         if (CREATE_TABLE) {
            pool.query(`CREATE TABLE ${dataset} 
               (id varchar(255),
               firstName varchar(255),
               lastName varchar(255),
               email varchar(255),
               age int
            )`, (e, res) => {
                  if (e) throw e;
            });
         }
      });
   } else if (CREATE_TABLE) {
      pool.query(`CREATE TABLE ${dataset} 
         (id varchar(255),
         firstName varchar(255),
         lastName varchar(255),
         email varchar(255),
         age int
      )`, (e, res) => {
            if (e) throw e;
      });
   }
}

// async function updateUsers(res) {
//    db.find({}, (e, data) => {
//       res.render("users", {users: data, userCount: data.length || 0});
//    });
// }
// manageTables();