const express = require("express");
const request = require("request");

const bodyParser = require("body-parser");
const functions = require("firebase-functions");
const { db } = require("./firebase/firebase");
const app = express();
const port = 8080;
// create application/json parser
const jsonParser = bodyParser.json();

const SENTRY_TOKEN =
  "f36b22a3e71c4f8e9e5a76fa24e6b5a2a290eedf494d4d4aac818ddd7c4d0ed4";
const MOMO_SENTRY_SERVRER = "https://sentry.io/api/0/organizations/testorg-3m";

// create application/x-www-form-urlencoded parser
// const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.get("/api/webhooks", async (req, res) => {
  try {
    const allEntries = [];
    const querySnapshot = await db.collection("sentry-web-hooks").get();
    querySnapshot.forEach((doc) => allEntries.push(doc.data()));
    return res.send(allEntries);
  } catch (err) {
    console.log("error", err);
  }
});

app.post("/api/webhooks/update-all-issuse", jsonParser, async (req, res) => {
  // const entry = db.collection("sentry-web-hooks").doc();
  const response = await new Promise((resolve, reject) => {
    request.get(`${MOMO_SENTRY_SERVRER}/issues/`, {
      headers: {
        Authorization: `Bearer ${SENTRY_TOKEN}`
      }
    }, async (error, res) => {
      try {
        const body = JSON.parse(res.body)
        resolve(body)
      } catch (e) {
        reject(e);
      }
      if (res?.body) {
        const issues = JSON.parse(res.body);
        const batch = db.batch(); 58

        await issues.map(async (item) => {
          const entry = await db.collection("sentry-web-hooks").doc(item?.id);
          Object.keys(item.stats).map(iss => {
            item.stats[iss] = item.stats[iss].reduce((arr, curr) => {
              return [...arr, {
                "key": curr[0],
                "value": curr[1]
              }]

            }, [])
            return iss;
          })
          batch.create(entry, item)
        })
        await batch.commit();
        try {
          const body = JSON.parse(res.body)
          resolve(body)
        } catch (e) {
          reject(e);
        }
      }
    })
  })

  res.send({
    response
  });
});

app.get("/api/webhooks/update-events-of-issue", async (req, res) => {
  const snapshot = await db.collection("sentry-web-hooks").get();
  const data = snapshot.docs.map(doc => doc.data());

  if (data) {
    const listPromise = data?.map((item) => new Promise((resolve, reject) => {
      request.get(`${MOMO_SENTRY_SERVRER}/issues/${item?.id}/events/`, {

        headers: {
          Authorization: `Bearer ${SENTRY_TOKEN}`
        }
      }, async (err, res) => {
        try {
          const body = JSON.parse(res.body)
          resolve(body)
        } catch (e) {
          reject(e);
        }
      })
    }).catch(err => err))
    const listEvent = await Promise.all(listPromise);
    const batch = db.batch();
    await listEvent.map(async (eve) => {
      const entry = await db.collection("sentry-web-hooks").doc(eve[0]?.groupID).collection('events');

      eve?.map(async (ea) => {
        try {
          const enity = await entry.doc(ea.eventID);
          await batch.create(enity, ea)
        } catch (err) {
          console.log("err", err);
        }
      })

    })
    await batch.commit();

  }
  res.send({
    data

  });
});

app.post("/api/webhooks", jsonParser, async (req, res) => {
  const { action, data } = req.body
  console.log("🚀 ~ file: index.js ~ line 123 ~ app.post ~ req.body", req.body)
  try {
    if (action === 'created') {
      if (data?.error) {
        data.error.tags = data.error.tags?.reduce((arr, tag) => {
          return [...arr, {
            "key": tag[0],
            "value": tag[1]
          }]
        }, [])
        data.error.request.headers = data.error.request.headers?.reduce((arr, head) => {
          return [...arr, {
            "key": head[0],
            "value": head[1]
          }]
        }, [])
        const entry = await db.collection("sentry-web-hooks").doc(data?.error?.['issue_id']).collection('events');
        await entry.doc(data?.error?.['event_id']).set(data?.error)
      } else if (data?.issue) {
        const entry = await db.collection("sentry-web-hooks").doc(data?.issue?.id);
        entry.set(data?.issue);
      }
    }
  } catch (err) {
    console.log("🚀 ~ file: index.js ~ line 150 ~ app.post ~ err", err)
    return res.send({ err })
  }
  return res.send("webhooks");
});

app.listen(process.env.PORT || port, function () {
  console.log("server is opened At " + port);
});

exports.app = functions.https.onRequest(app);
