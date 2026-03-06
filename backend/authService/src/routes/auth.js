
const express = require("express");
const authController = require('../../controllers/authController');
const { verifyToken } = require('../../middleware/authMiddleware');
const router = express.Router();


router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.put("/profile", protect, authController.updateProfile);

// Reset password (no OTP)
router.post('/reset-password/request', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
