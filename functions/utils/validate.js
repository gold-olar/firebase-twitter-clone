const validator = require("validator");
const BaseController = require("../controllers/base.ctrl");

class Validator extends BaseController {
  constructor() {
    super();
  }

  async validateRegisterData(req, res, next) {
    const { email, password, username, confirmPassword } = req.body;
    if (!email || !password || !username) {
      return super.sendError(res, null, "Please fill all fields", 400);
    }
    if (!validator.isEmail(email)) {
      return super.sendError(res, null, "Enter a valid email", 400);
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
    if (!email.trim() || !password.trim()) {
      return super.sendError(res, null, "Please fill all fields", 400);
    }
    if (!validator.isEmail(email)) {
      return super.sendError(res, null, "Enter a valid email", 400);
    }
    return next();
  }
}

module.exports = new Validator();
