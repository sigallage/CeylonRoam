const express = require("express");
const itineraryController = require('../../controllers/itineraryController');
const { verifyToken } = require('../../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.post("/", verifyToken, itineraryController.saveItinerary);
router.get("/", verifyToken, itineraryController.getUserItineraries);
router.get("/:id", verifyToken, itineraryController.getItineraryById);
router.delete("/:id", verifyToken, itineraryController.deleteItinerary);

module.exports = router;
