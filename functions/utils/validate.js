const validator = require("validator");
const BaseController = require("../controllers/base.ctrl");

class Validator extends BaseController {
  constructor() {
    super();
  }

  async validateRegisterData(req, res, next) {
    const { email, password, username, confirmPassword } = req.body;

    if ((email && !email.trim()) || !email) {
      return super.sendError(res, null, "Email must not be empty.", 400);
    }
    if (!validator.isEmail(email)) {
      return super.sendError(res, null, "Enter a valid email", 400);
    }
    if ((username && !username.trim()) || !username) {
      return super.sendError(res, null, "Username must not be empty.", 400);
    }
    if ((password && !password.trim()) || !password) {
      return super.sendError(res, null, "Password must not be empty.", 400);
    }

    if (password.length < 8) {
      return super.sendError(
        res,
        null,
        "Password must contain at least 8 characters",
        400
      );
    }
    if (password !== confirmPassword) {
      return super.sendError(res, null, "Passwords don't match", 400);
    }

    return next();
  }

  async validateLoginData(req, res, next) {
    const { email, password } = req.body;
    if ((email && !email.trim()) || !email) {
      return super.sendError(res, null, "Email must not be empty.", 400);
    }
    if (!validator.isEmail(email)) {
      return super.sendError(res, null, "Enter a valid email", 400);
    }
    if ((password && !password.trim()) || !password) {
      return super.sendError(res, null, "Password must not be empty.", 400);
    }
    return next();
  }

  async formatUserUpdateDetails(req, res, next) {
    const { bio, website, location } = req.body;

    if ((bio && !bio.trim()) || !bio) {
      delete req.body.bio;
    }

    if (website && website.trim().substring(0, 4) !== "http") {
      req.body.website = `http://${website.trim()}`;
    } else {
      delete req.body.website;
    }

    if ((location && !location.trim()) || !location) {
      delete req.body.location;
    }

    return next();
  }
}

module.exports = new Validator();
