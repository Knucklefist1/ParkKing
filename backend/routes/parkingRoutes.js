// ✅ parkingRoutes.js — now using the real controller
const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Use the real controller logic instead of dummy data
router.get('/', parkingController.getAllParkingLocations);
router.post('/:locationId/:spotId/reserve', parkingController.reserveParkingSpot);
router.post('/:locationId/:spotId/release', parkingController.releaseParkingSpot);

module.exports = router;
