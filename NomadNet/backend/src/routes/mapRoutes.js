// routes/mapRoutes.js

const express = require('express');
const router = express.Router();

console.log('📦 Loading mapRoutes.js...');

const mapController = require('../controllers/mapController');
const { protect } = require('../middleware/authMiddleware');

// ======================
// 🗺️ MAP ROUTES
// ======================

// Test route (No auth required)
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Map routes are working!',
    timestamp: new Date().toISOString()
  });
});

// ======================
// 📍 USER LOCATION ROUTES
// ======================

// Get my current location
router.get('/my-location', protect, mapController.getMyLocation);

// Update my location
router.put('/my-location', protect, mapController.updateMyLocation);

// Toggle location sharing
router.patch('/share-location', protect, mapController.toggleShareLocation);

// Get another user's location
router.get('/user/:userId/location', protect, mapController.getUserLocation);

// Get multiple users' locations
router.post('/users/locations', protect, mapController.getMultipleUsersLocations);

// ======================
// 🗺️ NEARBY & DETAILS ROUTES
// ======================

// Get all nearby items for map
router.get('/nearby', protect, mapController.getNearbyAll);

// Get detailed info for map markers
router.get('/user/:userId/details', protect, mapController.getUserDetails);
router.get('/venue/:venueId/details', protect, mapController.getVenueDetails);
router.get('/marketplace/:itemId/details', protect, mapController.getMarketplaceDetails);
router.get('/checkin/:checkinId/details', protect, mapController.getCheckInDetails);

// ======================
// Debug: Log routes
// ======================
console.log('\n✅ Map routes registered:');
router.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`   ${methods} /api/map${r.route.path}`);
  }
});

module.exports = router;