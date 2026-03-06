const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const createError = require('../utils/appError');


// REGSITER USER
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

        // Assign JWT ( json web token ) to user
        const token = jwt.sign({id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: '90d',
        });

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully!',
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone || '',
            },
        });    

    } catch (error) {
        next(error);
    }
};

// LOGGING USER
exports.login = async (req, res, next) => {
    try{
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if(!user) return next(new createError('User not found!', 404));

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return next(new createError('Invalid email or password!', 401));
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '90d',
        });

        res.status(200).json({
            status: 'success',
            token,
            message: 'Logged in successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
            },
        });
    }
    catch(error){
        next(error);
    }

};

// UPDATE USER PROFILE
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id; // from JWT middleware
        const { name, phone } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return next(new createError('User not found!', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone || '',
            },
        });
    } catch (error) {
        next(error);
    }
};

// PASSWORD RESET (no OTP)
// Step 1: check email exists (frontend can decide to proceed)
exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return next(new createError('Email is required!', 400));
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('_id');

        res.status(200).json({
            status: 'success',
            exists: Boolean(user),
            message: user ? 'Email found. You can reset your password.' : 'No account found with that email.',
        });
    } catch (error) {
        next(error);
    }
};

// Step 2: directly set a new password by email (no OTP)
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || typeof email !== 'string') {
            return next(new createError('Email is required!', 400));
        }
        if (!newPassword || typeof newPassword !== 'string') {
            return next(new createError('New password is required!', 400));
        }
        if (newPassword.length < 6) {
            return next(new createError('Password must be at least 6 characters!', 400));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Keep response generic-ish; frontend can still show a message.
            return res.status(200).json({
                status: 'success',
                message: 'If an account exists for that email, the password was updated.',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully.',
        });
    } catch (error) {
        next(error);
    }
};