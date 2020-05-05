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
  measurementId: process.env.MEASUREMENT_ID,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

firebase.initializeApp(firebaseConfig);

// Routes
const tweetsRouter = require("./routes/tweets");
const usersRouter = require("./routes/users");

app.use("/tweets", tweetsRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    res.status(404).json({
        message: 'Not found'
    })
});
  

exports.api = functions.https.onRequest(app);
