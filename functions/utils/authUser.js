const BaseController = require("../controllers/base.ctrl");
const admin = require("firebase-admin");
const db = admin.firestore();

class Authorizer extends BaseController {
  constructor() {
    super();
  }

  async authorizeUser(req, res, next) {
    try {
      let token;
      const { authorization } = req.headers;
      if (authorization && authorization.startsWith("Bearer ")) {
        token = authorization.split("Bearer ")[1];
      }
      const decodedToken = await admin.auth().verifyIdToken(token);
      if (decodedToken) {
        const userDetails = await db
          .collection("users")
          .where("userId", "==", decodedToken.uid)
          .limit(1)
          .get();
        const { username, imageUrl } = userDetails.docs[0].data();

        req.user = {
          ...decodedToken,
          username,
          imageUrl,
        };

        return next();
      }
      return super.sendError(
        res,
        null,
        "Login session expired. Please login.",
        403
      );
    } catch (err) {
      return super.sendError(res, err.code, err.message, 403);
    }
  }
}

module.exports = new Authorizer();
