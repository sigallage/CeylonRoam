const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    numberOfDays: {
        type: Number,
        required: true,
    },
    budget: {
        type: String,
        default: '',
    },
    interests: {
        type: [String],
        default: [],
    },
    itineraryData: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for faster queries by userId and email
itinerarySchema.index({ userId: 1, userEmail: 1, createdAt: -1 });

const Itinerary = mongoose.model('Itinerary', itinerarySchema);
module.exports = Itinerary;
