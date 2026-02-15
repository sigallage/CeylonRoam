const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'email already in use' });
    }

    const user = await User.create({
      name: name ? String(name).trim() : undefined,
      email: String(email).toLowerCase().trim(),
      password: String(password)
    });

    // Don’t return password.
    return res.status(201).json({
      id: user._id,
      name: user.name || null,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    // Handle duplicate key error defensively (unique index race)
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email already in use' });
    }

    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = router;
