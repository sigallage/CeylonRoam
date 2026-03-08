const express = require("express");
const authController = require('../../controllers/authController');
const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.put("/profile", authController.updateProfile);

module.exports = router;
