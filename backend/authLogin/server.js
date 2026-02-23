const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./src/routes/authRoutes");

const app = express();

const PORT = 5002;
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;

// ================= DATABASE =================
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: "ceylonroam_secret_key",
    resave: false,
    saveUninitialized: false
}));

// ================= VIEW ENGINE =================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

// ================= ROUTES =================
app.use("/", authRoutes);

// ================= SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});