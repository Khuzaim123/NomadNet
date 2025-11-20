const express = require('express');
const router = express.Router();
const {
  createListing,
  getAllListings,
  getListingById,
  getMyListings,
  getListingsByUser,
  updateListing,
  deletePhoto,
  deleteListing,
  requestItem,
  updateRequestStatus,
  getMyRequests,
  getNearbyListings
} = require('../controllers/marketplaceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createListingValidation,
  updateListingValidation,
  requestItemValidation,
  updateRequestStatusValidation,
  deletePhotoValidation,
  validate
} = require('../middleware/marketplaceValidator');

// ======================
// 📍 Public Routes (No Auth Required)
// ======================

// Get all listings with filters/search/pagination
router.get('/', getAllListings);

// Get nearby listings (geospatial search)
router.get('/nearby', getNearbyListings);

// Get single listing by ID
router.get('/:id', getListingById);

// Get all listings by a specific user
router.get('/user/:userId', getListingsByUser);

// ======================
// 🔒 Protected Routes (Auth Required)
// ======================
router.use(protect); // All routes below require authentication

// Create new listing (with photo upload and validation)
router.post(
  '/', 
  upload.array('photos', 5), 
  createListingValidation, 
  validate, 
  createListing
);

// Get current user's own listings
router.get('/my/listings', getMyListings);

// Get current user's requests (items they requested from others)
router.get('/my/requests', getMyRequests);

// Update listing (with optional new photos and validation)
router.put(
  '/:id', 
  upload.array('photos', 5), 
  updateListingValidation, 
  validate, 
  updateListing
);

// Delete specific photo from listing (with validation)
router.delete(
  '/:id/photos', 
  deletePhotoValidation, 
  validate, 
  deletePhoto
);

// Delete entire listing
router.delete('/:id', deleteListing);

// Request item/service (sends email to owner, with validation)
router.post(
  '/:id/request', 
  requestItemValidation, 
  validate, 
  requestItem
);

// Update request status (accept/decline/complete) - owner only, with validation
router.patch(
  '/:id/request/:requestId', 
  updateRequestStatusValidation, 
  validate, 
  updateRequestStatus
);

module.exports = router;