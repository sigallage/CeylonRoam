const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const ContactMessage = require('../src/models/ContactMessage');
const createError = require('../utils/appError');
const { sendOTPEmail } = require('../utils/emailService');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otpService');


// REGSITER USER
exports.signup = async (req, res, next) => {
    try {
        const email = req.body.email.trim().toLowerCase();
        const user = await User.findOne({ email });
        if (user) {
            return next(new createError('User already exists!', 400));
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        const newUser = await User.create({
            ...req.body,
            email,
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

        const user = await User.findOne({ email: email.trim().toLowerCase() });

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
        console.error('Login error:', error);
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

// FORGOT PASSWORD - Send OTP
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        console.log('=== FORGOT PASSWORD DEBUG ===');
        console.log('Received email:', email);
        console.log('Email type:', typeof email);
        console.log('Email trimmed:', email?.trim());

        if (!email) {
            return next(new createError('Email is required', 400));
        }

        // Check if user exists
        const trimmedEmail = email.trim().toLowerCase();
        console.log('Searching for user with email:', trimmedEmail);
        
        const user = await User.findOne({ email: trimmedEmail });
        console.log('User found:', user ? 'YES' : 'NO');
        
        if (!user) {
            // Check all users in database for debugging
            const allUsers = await User.find({}, 'email');
            console.log('Total users in database:', allUsers.length);
            console.log('Registered emails:', allUsers.map(u => u.email));
            return next(new createError('No user found with this email', 404));
        }

        // Generate OTP
        const otp = generateOTP();

        // Store OTP
        storeOTP(trimmedEmail, otp);

        // Send OTP via email
        const emailResult = await sendOTPEmail(trimmedEmail, otp);

        res.status(200).json({
            status: 'success',
            message: 'OTP sent successfully',
            mode: emailResult.mode || 'production',
            ...(emailResult.mode === 'development' && { 
                note: 'Check server console for OTP (development mode)' 
            }),
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        next(error);
    }
};

// VERIFY OTP
exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        console.log('\n=== VERIFY OTP DEBUG ===');
        console.log('Raw email:', email);
        console.log('Raw OTP:', otp);
        console.log('OTP type:', typeof otp);

        if (!email || !otp) {
            return next(new createError('Email and OTP are required', 400));
        }

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedOTP = String(otp).trim();
        
        console.log('Trimmed email:', trimmedEmail);
        console.log('Trimmed OTP:', trimmedOTP);
        
        // Verify OTP
        const result = verifyOTP(trimmedEmail, trimmedOTP);

        if (!result.valid) {
            return next(new createError(result.message, 400));
        }

        // Store verified email in session for password reset
        req.session.verifiedEmail = trimmedEmail;
        req.session.verifiedAt = Date.now();

        res.status(200).json({
            status: 'success',
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

// RESET PASSWORD - After OTP verification
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

        // Check if OTP was verified (session-based check)
        const verifiedEmail = req.session?.verifiedEmail;
        const verifiedAt = req.session?.verifiedAt;
        const VERIFICATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

        if (!verifiedEmail || verifiedEmail !== normalizedEmail) {
            return next(new createError('Please verify OTP first!', 403));
        }

        if (!verifiedAt || Date.now() - verifiedAt > VERIFICATION_TIMEOUT) {
            delete req.session.verifiedEmail;
            delete req.session.verifiedAt;
            return next(new createError('Verification expired. Please request a new OTP!', 403));
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return next(new createError('User not found!', 404));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        // Clear verification from session
        delete req.session.verifiedEmail;
        delete req.session.verifiedAt;

        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully.',
        });
    } catch (error) {
        next(error);
    }
};

// CHECK EMAIL EXISTS - For reset password flow
exports.checkEmailExists = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return next(new createError('Email is required!', 400));
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(200).json({
                status: 'success',
                exists: false,
                message: 'No account found with that email.',
            });
        }

        res.status(200).json({
            status: 'success',
            exists: true,
            message: 'Account found.',
        });
    } catch (error) {
        next(error);
    }
};

// CONTACT US - Store message
exports.submitContactMessage = async (req, res, next) => {
    try {
        const { name, email, message, rating } = req.body || {};

        if (!name || typeof name !== 'string' || !name.trim()) {
            return next(new createError('Name is required!', 400));
        }
        if (!email || typeof email !== 'string' || !email.trim()) {
            return next(new createError('Email is required!', 400));
        }
        if (!message || typeof message !== 'string' || !message.trim()) {
            return next(new createError('Message is required!', 400));
        }

        const doc = await ContactMessage.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            ...(rating !== undefined && rating !== null && rating !== '' ? { rating: Number(rating) } : {}),
        });

        res.status(201).json({
            status: 'success',
            message: 'Message submitted successfully',
            id: doc._id,
        });
    } catch (error) {
        next(error);
    }
};

// DEBUG ENDPOINT - Check database status
exports.debugUsers = async (req, res, next) => {
    try {
        const users = await User.find({}, 'name email');
        res.status(200).json({
            status: 'success',
            totalUsers: users.length,
            users: users.map(u => ({ name: u.name, email: u.email })),
        });
    } catch (error) {
        next(error);
    }
};
