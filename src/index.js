const express = require("express");
const bodyParser = require("body-parser");
const functions = require("firebase-functions");
const {db} = require("./firebase/firebase")
const app = express();
const port = 8080;
// create application/json parser
const jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
// const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get("/api/webhooks", async (req, res) => {
  try {
    const allEntries = [];
    const querySnapshot = await db.collection("sentry-web-hooks").get();
    querySnapshot.forEach( (doc) => allEntries.push(doc.data()));
    return res.send(allEntries);
  } catch (err) {
    console.log("error", err);
  }
});

app.post("/api/test", jsonParser, (req, res) => {
  const {name} = req?.body;

  if (name) {
    const entry = db.collection("sentry-web-hooks").doc();
  }
  return res.send("webhooks");
});

app.post("/api/webhooks", jsonParser, (req, res) => {
  console.log("On post webhooks", req.body);
  return res.send("webhooks");
});

app.listen(process.env.PORT || port, function() {
  console.log("server is opened At " + port);
});

exports.app = functions.https.onRequest(app);
