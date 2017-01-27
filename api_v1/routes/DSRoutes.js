/**
 * Device Server routes
 */

const express = require('express');
const router = express.Router();
const DSController = require('../controllers/DSController');

/**
 * Get called whenever new client connects to Device Server
 */
router.post('/onClientConnected', DSController.onClientConnected);

/**
 * Gets called whenever DigitalInputState property of object /3200/0 changes
 */
router.post('/onDoorOpenedOptoClickStateChanged', DSController.onDoorOpenedOptoClickStateChanged);

/**
 * Gets called whenever DigitalInputState property of object /3200/1 changes
 */
router.post('/onDoorClosedOptoClickStateChanged', DSController.onDoorClosedOptoClickStateChanged);

module.exports = router;