const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/authValidators");

router.post("/register", registerValidator, validate, authController.register);
router.post("/login", loginValidator, validate, authController.login);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);
router.post("/refresh", authController.refreshToken);
router.post("/forgot-password", forgotPasswordValidator, validate, authController.forgotPassword);
router.post("/reset-password/:token", resetPasswordValidator, validate, authController.resetPassword);
router.put("/update-details", protect, authController.updateDetails);
router.put("/update-password", protect, authController.updatePassword);

module.exports = router;