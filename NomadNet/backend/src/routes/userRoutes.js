const express = require('express');
const router = express.Router();
const {
  getUserById,
  getUserByUsername,
  updateProfile,
  uploadAvatar,
  updateLocation,
  updatePrivacySettings,
  getNearbyUsers,
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  deleteAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/:id', getUserById);
router.get('/username/:username', getUserByUsername);

// Protected routes
router.put('/:id', protect, updateProfile);
router.post('/:id/avatar', protect, upload.single('avatar'), uploadAvatar);
router.patch('/:id/location', protect, updateLocation);
router.patch('/:id/privacy', protect, updatePrivacySettings);
router.delete('/:id', protect, deleteAccount);

// Nearby users
router.get('/nearby/search', protect, getNearbyUsers);

// Block/Unblock
router.post('/:id/block', protect, blockUser);
router.delete('/:id/block', protect, unblockUser);
router.get('/blocked/list', protect, getBlockedUsers);

// Report
router.post('/:id/report', protect, reportUser);

module.exports = router;