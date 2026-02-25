const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, username, email, password } = req.body || {};

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'email already in use' });
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await User.findOne({ username: String(username).trim() });
      if (existingUsername) {
        return res.status(409).json({ error: 'username already in use' });
      }
    }

    // Create new user - password will be hashed by the pre-save hook
    const user = await User.create({
      name: name ? String(name).trim() : undefined,
      username: username ? String(username).trim() : undefined,
      email: String(email).toLowerCase().trim(),
      password: String(password)
    });

    // Don't return password.
    return res.status(201).json({
      id: user._id,
      name: user.name || null,
      username: user.username || null,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    // Handle duplicate key error defensively (unique index race)
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email or username already in use' });
    }

    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'username/email and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: String(username).trim() },
        { email: String(username).toLowerCase().trim() }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'invalid username/email or password' });
    }

    // Compare password using the model method
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'invalid username/email or password' });
    }

    // Store user ID in session
    req.session.userId = user._id;

    // Return user info (without password)
    return res.status(200).json({
      id: user._id,
      name: user.name || null,
      username: user.username || null,
      email: user.email,
      message: 'login successful'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'logout failed' });
    }
    res.status(200).json({ message: 'logout successful' });
  });
});

// Check if user is authenticated
router.get('/check', (req, res) => {
  if (req.session.userId) {
    return res.status(200).json({ authenticated: true, userId: req.session.userId });
  }
  return res.status(401).json({ authenticated: false });
});

module.exports = router;
