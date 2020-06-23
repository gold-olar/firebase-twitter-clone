/* eslint-disable promise/no-nesting */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase = require("firebase");
const serviceAccount = require("../firebaseAuth.json");
const express = require("express");
require("dotenv").config();

const app = express();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_COMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

// Routes
const tweetsRouter = require("./routes/tweets");
const usersRouter = require("./routes/users");

app.use("/tweets", tweetsRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).json({
    message: "Not found",
  });
});

exports.api = functions.region("europe-west1").https.onRequest(app);

// Boi,  Clean up the callback hell you have here godammit !!!

exports.createNotificationsOnLike = functions
  .region("europe-west1")
  .firestore.document("/likes{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/tweets/${snapshot.data().tweetId}`)
      .get()
      .then((doc) => {
        // eslint-disable-next-line promise/always-return
        if (doc.exists && doc.data().username !== snapshot.data().username) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: admin.firestore.Timestamp.fromDate(new Date()),
            tweetId: doc.id,
            recipient: doc.data().username,
            sender: snapshot.data().username,
            type: "like",
            read: false,
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

exports.deleteNotificationsOnUnlike = functions
  .region("europe-west1")
  .firestore.document("/likes{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()

      .catch((err) => {
        console.log(err);
      });
  });

exports.createNotificationsOnComment = functions
  .region("europe-west1")
  .firestore.document("/comments{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/tweets/${snapshot.data().tweetId}`)
      .get()
      .then((doc) => {
        // eslint-disable-next-line promise/always-return
        if (doc.exists && doc.data().username !== snapshot.data().username) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: admin.firestore.Timestamp.fromDate(new Date()),
            tweetId: doc.id,
            recipient: doc.data().username,
            sender: snapshot.data().username,
            type: "comment",
            read: false,
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

exports.onUserImageChange = functions
  .region("europe-west1")
  .firestore.document("/users/{id}")
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch;
      return db
        .collection("tweets")
        .where("username", "==", change.before.data().username)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const tweet = db.doc(`/tweets/${doc.id}`);
            batch.updata(tweet, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    }
    return true;
  });
exports.onTweetDelete = functions
  .region("europe-west1")
  .firestore.document("/tweets/{tweetId}")
  .onDelete((snapshot, context) => {
    const tweetId = context.params.tweetId;
    const batch = db.batch;
    return db
      .collection("comments")
      .where("tweetId", "==", tweetId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection("likes")
          .where("tweetId", "==", tweetId)
          .get()
          .then((data) => {
            data.forEach((doc) => {
              batch.delete(db.doc(`/likes/${doc.id}`));
            });
            return db
              .collection("notifications")
              .where("tweetId", "==", tweetId)
              .get()
              .then((data) => {
                data.forEach((doc) => {
                  batch.delete(db.doc(`/notifications/${doc.id}`));
                });
                return batch.commit();
              })
              .catch((err) => {
                console.log(err);
              });
          });
      });
  });
