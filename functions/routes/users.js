const { Router } = require("express");
const router = Router();
const usersController = require("../controllers/users.ctrl");
const Validator = require("../utils/validate");
const Authorizer = require("../utils/authUser");

router.post(
  "/register",
  Validator.validateRegisterData,
  usersController.register
);
router.post("/login", Validator.validateLoginData, usersController.login);
router.post(
  "/uploadImage",
  Authorizer.authorizeUser,
  usersController.uploadImage
);
router.post(
  "/addDetails",
  Authorizer.authorizeUser,
  Validator.formatUserUpdateDetails,
  usersController.addDetails
);
router.get(
  "/getUserDetails",
  Authorizer.authorizeUser,
  usersController.getUserDetails
);
router.get("/:username", usersController.getSingleUser);
router.post(
  "/notifications ",
  Authorizer.authorizeUser,
  usersController.markNotifications
);

module.exports = router;
