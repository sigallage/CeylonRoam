const jwt = require('jsonwebtoken');
const User = require('../models/User');
const createError = require('../../utils/appError');

// JWT verification middleware
module.exports = async function protect(req, res, next) {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new createError('Not authorized, token missing', 401));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return next(new createError('User not found', 404));
        }
        next();
    } catch (err) {
        return next(new createError('Not authorized, token failed', 401));
    }
};