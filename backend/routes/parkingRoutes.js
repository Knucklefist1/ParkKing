const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Dummy 
router.get('/', parkingController.getAllParkingLocations);
router.post('/:locationId/:spotId/reserve', parkingController.reserveParkingSpot);
router.post('/:locationId/:spotId/release', parkingController.releaseParkingSpot);

module.exports = router;
