
const express = require("express");
const authController = require('../../controllers/authController');
const { verifyToken } = require('../../middleware/authMiddleware');
const router = express.Router();


router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.put("/profile", authController.updateProfile);

// Password reset with OTP
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);
router.post('/contact-us', authController.submitContactMessage);

// Check if email exists (for reset password flow)
router.post('/reset-password/request', authController.checkEmailExists);

// Debug endpoint - remove in production
router.get("/debug/users", authController.debugUsers);

module.exports = router;
