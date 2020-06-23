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
            ...doc.data(),
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
      const {
        user: { username, imageUrl },
      } = req;
      const {
        body: { body },
      } = req;
      const newTweet = {
        username,
        body,
        userImage: imageUrl,
        likeCount: 0,
        commentCount: 0,
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

  async likeTweet(req, res) {
    const {
      user: { username },
      params: { tweetId },
    } = req;

    try {
      const likeDoc = db
        .collection(`likes`)
        .where("username", "==", username)
        .where("tweetId", "==", tweetId)
        .limit(1);

      const tweetDoc = db.doc(`tweets/${tweetId}`);
      let tweetData;
      const tweet = await tweetDoc.get();

      if (tweet.exists) {
        tweetData = tweet.data();
        tweetData = {
          ...tweetData,
          id: tweet.id,
        };
        const like = await likeDoc.get();

        if (like.empty) {
          const addLike = await db.collection("likes").add({
            tweetId,
            username,
          });
          if (addLike) {
            tweetData.likeCount++;
            const increaseCount = await tweetDoc.update({
              likeCount: tweetData.likeCount,
            });
            if (increaseCount) {
              super.sendSuccess(res, tweetData, "Liked Successfully", 200);
            }
          }
        } else {
          return super.sendError(
            res,
            null,
            "Tweet has been liked already.",
            400
          );
        }
      } else {
        return super.sendError(res, null, "Tweet was not found", 404);
      }
      return super.sendError(res, null, "Something went wromg", 400);
    } catch (err) {
      return super.sendError(res, err, err.message, 500);
    }
  }

  async unlikeTweet(req, res) {
    const {
      user: { username },
      params: { tweetId },
    } = req;

    try {
      const likeDoc = db
        .collection(`likes`)
        .where("username", "==", username)
        .where("tweetId", "==", tweetId)
        .limit(1);

      const tweetDoc = db.doc(`tweets/${tweetId}`);
      let tweetData;
      const tweet = await tweetDoc.get();
      if (tweet.exists) {
        tweetData = tweet.data();
        tweetData = {
          ...tweetData,
          id: tweet.id,
        };
        const like = await likeDoc.get();
        if (like.empty) {
          return super.sendError(res, null, "Tweet has not been liked.", 400);
        } else {
          const removeLike = await db.doc(`likes/${like.docs[0].id}`).delete();
          if (removeLike) {
            tweetData.likeCount--;
            const decreaseCount = await tweetDoc.update({
              likeCount: tweetData.likeCount,
            });
            if (decreaseCount) {
              super.sendSuccess(res, tweetData, "Unliked Successfully", 200);
            }
          }
        }
        return super.sendError(res, null, "Something went wromg", 400);
      } else {
        return super.sendError(res, null, "Tweet was not found", 404);
      }
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

      const existingTweet = await db.doc(`tweets/${tweetId}`).get();
      if (!existingTweet.exists) {
        return super.sendError(
          res,
          null,
          "The tweet you are trying to comment on no longer exists.",
          404
        );
      }
      await existingTweet.ref.update({
        commentCount: existingTweet.data().commentCount + 1,
      });
      const increaseComment = await existingTweet.ref.update({
        commentCount: existingTweet.data().commentCount + 1,
      });
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

  async deleteTweet(req, res) {
    const {
      params: { tweetId },
      user: { username },
    } = req;

    try {
      const document = await db.doc(`/tweets/${tweetId}`);
      console.log(document);
      const tweetDocument = await document.get();
      console.log(tweetDocument, "exists??");
      if (!tweetDocument.exists) {
        return super.sendError(res, null, "Tweet does not exist", 404);
      }
      if (tweetDocument.data().username === username) {
        return super.sendError(
          res,
          null,
          "You are not authorized to delete this tweet ",
          403
        );
      }
      const deleteDoc = await document.delete();
      if (deleteDoc) {
        return super.sendSuccess(res, null, "Tweet deleted successfully", 200);
      }
      return super.sendError(res, null, "Something went wromg", 400);
    } catch (err) {
      return super.sendError(res, err, err.message, 500);
    }
  }
}

module.exports = new TweetController();
