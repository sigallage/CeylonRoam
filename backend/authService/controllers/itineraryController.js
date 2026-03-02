const Itinerary = require('../src/models/Itinerary');
const User = require('../src/models/User');
const createError = require('../utils/appError');

// SAVE ITINERARY
exports.saveItinerary = async (req, res, next) => {
    try {
        const userId = req.user.id; // from JWT middleware
        const {
            title,
            destination,
            startDate,
            endDate,
            numberOfDays,
            budget,
            interests,
            itineraryData
        } = req.body;

        // Get user email
        const user = await User.findById(userId);
        if (!user) {
            return next(new createError('User not found!', 404));
        }

        const newItinerary = await Itinerary.create({
            userId,
            userEmail: user.email,
            title,
            destination,
            startDate,
            endDate,
            numberOfDays,
            budget,
            interests,
            itineraryData,
        });

        res.status(201).json({
            status: 'success',
            message: 'Itinerary saved successfully!',
            itinerary: newItinerary,
        });
    } catch (error) {
        next(error);
    }
};

// GET ALL ITINERARIES FOR A USER
exports.getUserItineraries = async (req, res, next) => {
    try {
        const userId = req.user.id; // from JWT middleware

        const itineraries = await Itinerary.find({ userId })
            .sort({ createdAt: -1 }) // Most recent first
            .select('-__v');

        res.status(200).json({
            status: 'success',
            count: itineraries.length,
            itineraries,
        });
    } catch (error) {
        next(error);
    }
};

// GET SINGLE ITINERARY BY ID
exports.getItineraryById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const itinerary = await Itinerary.findOne({
            _id: id,
            userId, // Ensure user can only access their own itineraries
        });

        if (!itinerary) {
            return next(new createError('Itinerary not found!', 404));
        }

        res.status(200).json({
            status: 'success',
            itinerary,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE ITINERARY
exports.deleteItinerary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const itinerary = await Itinerary.findOneAndDelete({
            _id: id,
            userId, // Ensure user can only delete their own itineraries
        });

        if (!itinerary) {
            return next(new createError('Itinerary not found!', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Itinerary deleted successfully!',
        });
    } catch (error) {
        next(error);
    }
};
