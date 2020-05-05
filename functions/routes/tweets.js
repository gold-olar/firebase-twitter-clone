const { Router } = require("express");
const router = Router();
const tweetsController = require('../controllers/tweets.ctrl');
const Authorizer = require('../utils/authUser');


router.get('/', Authorizer.authorizeUser, tweetsController.getAllTweets);
router.post('/add', Authorizer.authorizeUser, tweetsController.addTweet);



module.exports = router;