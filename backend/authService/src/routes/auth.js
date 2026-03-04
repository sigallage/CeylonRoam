
const express = require("express");
const authController = require('../../controllers/authController');
const protect = require('../middleware/protect');
const router = express.Router();


router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.put("/profile", protect, authController.updateProfile);

module.exports = router;
