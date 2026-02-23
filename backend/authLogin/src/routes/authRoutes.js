const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// Home
router.get("/", (req, res) => {
    res.redirect("/login");
});

// Show Login
router.get("/login", (req, res) => {
    res.render("login", { message: null });
});

// Handle Login
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.render("login", {
                message: "Invalid username/email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render("login", {
                message: "Invalid username/email or password"
            });
        }

        req.session.userId = user._id;

        res.send("🎉 Login Successful!");

    } catch (error) {
        console.log(error);
        res.render("login", { message: "Something went wrong" });
    }
});

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

module.exports = router;