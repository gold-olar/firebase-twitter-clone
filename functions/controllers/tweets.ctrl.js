const admin = require("firebase-admin");
const db = admin.firestore();
const BaseController = require("./base.ctrl");

class TweetController extends BaseController {
  constructor() {
    super();
  }

  async getAllTweets(req, res) {
    let tweets = [];
    try {
      const data = await db
        .collection("tweets")
        .orderBy("createdAt", "desc")
        .get();
      if (data) {
        data.forEach((doc) => {
          tweets.push({
            tweetId: doc.id,
            tweetBody: doc.data(),
          });
        });
        return super.sendSuccess(res, tweets, "Fetched tweets", 200);
      }
      return super.sendError(
        res,
        null,
        "Could not fetch tweets, try again",
        400
      );
    } catch (err) {
      return super.sendError(res, err, err.message, 500);
    }
  }

  async getSingleTweet(req, res) {
    const {
      params: { tweetId },
    } = req;

    try {
      const singleTweet = await db.doc(`tweets/${tweetId}`).get();
      if (!singleTweet.exists) {
        return super.sendError(res, null, "Tweet not found", 404);
      }
      const tweetData = singleTweet.data();
      const tweetsComment = await db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("tweetId", "==", tweetId)
        .get();
      const commentsArray = [];

      await tweetsComment.forEach((comment) =>
        commentsArray.push(comment.data())
      );

      const tweet = {
        ...tweetData,
        tweetId,
        comments: commentsArray,
      };
      return super.sendSuccess(res, tweet, "Fetched Tweet.", 200);
    } catch (err) {
      return super.sendError(res, err, err.message, 500);
    }
  }

  async addTweet(req, res) {
    try {
      const { username } = req.user;
      const {
        body: { body },
      } = req;
      const newTweet = {
        username,
        body,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      };
      const doc = await db.collection("tweets").add(newTweet);
      if (doc) {
        return super.sendSuccess(res, null, "Added tweet", 200);
      }
      return super.sendError(res, null, "Could not add tweet, try again", 400);
    } catch (err) {
      return super.sendError(res, err, err.message, 500);
    }
  }

  async createTweetComment(req, res) {
    const {
      params: { tweetId },
      body: { body },
      user: { username, imageUrl },
    } = req;

    try {
      const newComment = {
        body,
        tweetId,
        username,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        userImage: imageUrl,
      };
      
      const existingTweet = db.docs(`tweets/${tweetId}`).get();
      if(!existingTweet.exists) {
        return super.sendError(res, null, "The tweet you are trying to comment on no longer exists.", 404);
      }
      const comment = await db.collection("comments").add(newComment);
      if (comment) {
        return super.sendSuccess(res, null, "Added comment", 200);
      }
      return super.sendError(
        res,
        null,
        "Could not add comment, try again",
        400
      );
    } catch (err) {
      return super.sendError(res, err, err.message, 500);
    }
  }
}

module.exports = new TweetController();
