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
      return super.sendError(res, null, "Could not fetch tweets, try again", 400);
    } catch (err) {
      return super.sendError(res, err, err.message, 500);
    }
  }

  async addTweet(req, res) {
    try {
      const { username } = req.user;
      const { body } = req.body;
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
}

module.exports = new TweetController();
