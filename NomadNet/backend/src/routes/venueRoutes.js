const express = require('express');
const router = express.Router();

console.log('📦 Loading venueRoutes.js...');

// Controllers
const venueController = require('../controllers/venueController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Upload middleware
let uploadMiddleware;
try {
  uploadMiddleware = require('../middleware/uploadMiddleware');
  console.log('✅ Upload middleware loaded for venues');
} catch (error) {
  console.error('❌ Upload middleware failed:', error.message);
  process.exit(1);
}

// Validators
const {
  createVenueValidation,
  updateVenueValidation,
  nearbySearchValidation,
  validate
} = require('../middleware/venueValidator');

// ======================
// 📍 VENUE ROUTES
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
router.get('/categories/list', venueController.getCategories);

// Search nearby venues (PUBLIC)
router.get(
  '/nearby/search',
  nearbySearchValidation,
  validate,
  venueController.getNearbyVenues
);

// Get all venues with filters (PUBLIC)
router.get('/', venueController.getAllVenues);

// Create venue (PROTECTED)
router.post(
  '/',
  protect,
  uploadMiddleware.array('photos', 5), // ✅ Accept up to 5 photos (optional)
  createVenueValidation,
  validate,
  venueController.createVenue
);

// Get venue by ID (PUBLIC)
router.get('/:id', venueController.getVenueById);

// Update venue (PROTECTED - creator only)
router.put(
  '/:id',
  protect,
  updateVenueValidation,
  validate,
  venueController.updateVenue
);

// Delete venue (PROTECTED - creator only)
router.delete('/:id', protect, venueController.deleteVenue);

// Add photo to venue (PROTECTED)
router.post(
  '/:id/photos',
  protect,
  uploadMiddleware.single('photo'),
  venueController.addVenuePhoto
);

// ======================
// Debug: Log routes
// ======================
console.log('\n✅ Venue routes registered:');
router.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`   ${methods} /api/venues${r.route.path}`);
  }
});

module.exports = router;