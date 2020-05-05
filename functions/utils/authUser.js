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
        /*
            Because I can't spread {
                ...decodedToken,
                username,
            }
            Fuck Shittt Mehn
          */
        req.user = decodedToken;
        req.user.username = userDetails.docs[0].data().username;

        return next();
      }
      return super.sendError(
        res,
        null,
        "Login session expired. Please login.",
        403
      );
    } catch (err) {
      return super.sendError(
        res,
        null,
        "You do not have acces to this resource",
        403
      );
    }
  }
}

module.exports = new Authorizer();
