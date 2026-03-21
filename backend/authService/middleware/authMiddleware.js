const jwt = require('jsonwebtoken');
const createError = require('../utils/appError');

exports.verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

        if (!token) {
            return next(new createError('Authentication required!', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        return next(new createError('Invalid or expired token!', 401));
    }
};
