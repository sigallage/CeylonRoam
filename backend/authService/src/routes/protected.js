const express = require('express');
const protect = require('../middleware/protect');
const router = express.Router();

// Example protected route
router.get('/profile', protect, (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Access granted to protected route',
        user: req.user,
    });
});

module.exports = router;