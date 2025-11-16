const express = require('express');
const router = express.Router();

console.log('📦 Loading userRoutes.js...');

// ==========================================
// 1️⃣ Load Dependencies with Better Error Handling
// ==========================================

const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

console.log('✅ User controller loaded');
console.log('   Functions:', Object.keys(userController).join(', '));

// ==========================================
// 2️⃣ Upload Middleware (Optional - with fallback)
// ==========================================

let uploadMiddleware;
try {
  uploadMiddleware = require('../middleware/uploadMiddleware');
  console.log('✅ Upload middleware loaded');
} catch (error) {
  console.warn('⚠️  Upload middleware not found - using fallback');
  uploadMiddleware = {
    single: () => (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'File upload not configured. Please set up Cloudinary.'
        });
      }
      next();
    }
  };
}

// ==========================================
// 3️⃣ Test Route (MUST BE FIRST)
// ==========================================

router.get('/test', (req, res) => {
  console.log('✅ Test route hit!');
  res.json({ 
    status: 'success',
    message: 'User routes are working!',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 4️⃣ Specific Routes (BEFORE /:id patterns)
// ==========================================

// Blocked users list
router.get('/blocked/list', protect, userController.getBlockedUsers);

// Nearby users search
router.get('/nearby/search', protect, userController.getNearbyUsers);

// Username lookup
router.get('/username/:username', userController.getUserByUsername);

// ==========================================
// 5️⃣ ID-Based Routes
// ==========================================

// Get user by ID (public)
router.get('/:id', userController.getUserById);

// Update profile (protected)
router.put('/:id', protect, userController.updateProfile);

// Upload avatar (protected)
router.post('/:id/avatar', protect, uploadMiddleware.single('avatar'), userController.uploadAvatar);

// Update location (protected)
router.patch('/:id/location', protect, userController.updateLocation);

// Update privacy (protected)
router.patch('/:id/privacy', protect, userController.updatePrivacySettings);

// Delete account (protected)
router.delete('/:id', protect, userController.deleteAccount);

// Block user (protected)
router.post('/:id/block', protect, userController.blockUser);

// Unblock user (protected)
router.delete('/:id/block', protect, userController.unblockUser);

// Report user (protected)
router.post('/:id/report', protect, userController.reportUser);

// ==========================================
// 6️⃣ Debug: Log All Registered Routes
// ==========================================

console.log('\n✅ User routes registered:');
router.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`   ${methods} /api/users${r.route.path}`);
  }
});

console.log('✅ All user routes defined\n');

module.exports = router;