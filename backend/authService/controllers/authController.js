const bcrypt = require('bcryptjs');
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
        const token = jwt.sign({id: newUser._id }, 'secretkey123', {
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
            return next(new createError('Invaild email or password!', 401));
        }

        const token = jwt.sign({ id: user._id }, 'secretkey123', {
            expiresIn: '90d',
        });

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