const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const createError = require('../utils/appError');


// Helper function for JWT creation
function createJwtToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '90d',
    });
}

// REGISTER USER
exports.signup = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            return next(new createError('User already exists!', 400));
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        const newUser = await User.create({
            ...req.body,
            password: hashedPassword,
        });

        // Assign JWT to user
        const token = createJwtToken(newUser._id);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully!',
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });

    } catch (error) {
        next(error);
    }
};

// LOGGING USER
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) return next(new createError('User not found!', 404));

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return next(new createError('Invaild email or password!', 401));
        }

        const token = createJwtToken(user._id);

        res.status(200).json({
            status: 'success',
            token,
            message: 'Logged in successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
        });
    }
    catch(error){
        next(error);
    }

};