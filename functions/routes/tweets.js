const { Router } = require("express");
const router = Router();
const tweetsController = require("../controllers/tweets.ctrl");
const Validator = require("../utils/validate");
const Authorizer = require("../utils/authUser");

router.get("/", Authorizer.authorizeUser, tweetsController.getAllTweets);
router.get("/", Authorizer.authorizeUser, tweetsController.getAllTweets);
router.post(
  "/:tweetId/comment",
  Authorizer.authorizeUser,
  Validator.validateTweetData,
  tweetsController.createTweetComment
);
router.post(
  "/add",
  Authorizer.authorizeUser,
  Validator.validateTweetData,
  tweetsController.addTweet
);

module.exports = router;
