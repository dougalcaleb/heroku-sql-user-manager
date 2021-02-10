const express = require("express");
const bodyParser = require("body-parser");

var postParse = bodyParser.urlencoded({extended: false});
const app = express();
const PORT = process.env.PORT || 3001;

app.set("view engine", "pug");
app.set("views", "/views");
app.use(express.static("public"));

// =======================================
// GET REQUESTS
// =======================================

app.get("/", (req, res) => {
   res.render("index");
});

// =======================================
// POST REQUESTS
// =======================================

// app.post("/", postParse, (req, res) => {

// });

// =======================================
// MISC
// =======================================

app.listen(PORT, () => {
   console.log(`Listening on port ${PORT}`);
});