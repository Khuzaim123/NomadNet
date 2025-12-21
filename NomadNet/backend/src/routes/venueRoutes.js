// src/routes/venueRoutes.js
const express = require('express');
const router = express.Router();

console.log(' Loading venueRoutes.js...');

// Import only the read-only controllers
const {
  getVenueById,
  getAllVenues,
  getNearbyVenues,
  getCategories
} = require('../controllers/venueController');

// ======================
//  VENUE ROUTES (READ-ONLY)
// ======================

// Test route
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Venue routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Get venue categories (PUBLIC)
router.get('/categories/list', getCategories);

// Search nearby venues (PUBLIC)
router.get('/nearby/search', getNearbyVenues);

// Get all venues with filters (PUBLIC)
router.get('/', getAllVenues);

// Get venue by ID (PUBLIC)
router.get('/:id', getVenueById);

// ======================
// Debug: Log routes
// ======================
console.log('\n Venue routes registered:');
router.stack.forEach(r => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`   ${methods} /api/venues${r.route.path}`);
  }
});

module.exports = router;