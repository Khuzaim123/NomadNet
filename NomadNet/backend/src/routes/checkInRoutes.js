const express = require('express');
const router = express.Router();

console.log('📦 Loading checkInRoutes.js...');

// Controllers
const checkInController = require('../controllers/checkInController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Validators
const {
  createCheckInValidation,
  updateCheckInValidation,
  nearbySearchValidation,
  validate
} = require('../middleware/checkInValidator');

// ======================
// 📍 CHECK-IN ROUTES
// ======================

// Test route
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Check-in routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Get current user's active check-in (PROTECTED)
router.get('/me/active', protect, checkInController.getMyActiveCheckIn);

// Search nearby check-ins (PROTECTED)
router.get(
  '/nearby/search',
  protect,
  nearbySearchValidation,
  validate,
  checkInController.getNearbyCheckIns
);

// Get check-ins at a venue (PUBLIC)
router.get('/venue/:venueId', checkInController.getVenueCheckIns);

// Get user's check-in history (PUBLIC/PRIVATE)
router.get('/user/:userId', optionalProtect, checkInController.getUserCheckIns);

// Create check-in (PROTECTED)
router.post(
  '/',
  protect,
  createCheckInValidation,
  validate,
  checkInController.createCheckIn
);

// Get check-in by ID (PUBLIC - respects visibility)
router.get('/:id', optionalProtect, checkInController.getCheckInById);

// Update check-in (PROTECTED - own only)
router.patch(
  '/:id',
  protect,
  updateCheckInValidation,
  validate,
  checkInController.updateCheckIn
);

// Delete check-in (PROTECTED - own only)
router.delete('/:id', protect, checkInController.deleteCheckIn);

// ======================
// Debug: Log routes
// ======================
console.log('\n✅ Check-in routes registered:');
router.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`   ${methods} /api/checkins${r.route.path}`);
  }
});

module.exports = router;