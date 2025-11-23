// routes/marketplaceRoutes.js
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
const normalizeArrayFields = require('../middleware/normalizeArrayFields');
const {
  createListingValidation,
  updateListingValidation,
  requestItemValidation,
  updateRequestStatusValidation,
  deletePhotoValidation,
  validate
} = require('../middleware/marketplaceValidator');

// Public Routes
router.get('/nearby', getNearbyListings);      
router.get('/user/:userId', getListingsByUser); 
router.get('/:id', getListingById);              
router.get('/', getAllListings);              


// Protected Routes
router.use(protect);

router.post(
  '/', 
  upload.array('photos', 5),
  normalizeArrayFields,
  createListingValidation,
  validate,
  createListing
);

router.get('/my/listings', getMyListings);
router.get('/my/requests', getMyRequests);

router.put(
  '/:id', 
  upload.array('photos', 5),
  normalizeArrayFields,
  updateListingValidation,
  validate,
  updateListing
);

router.delete('/:id/photos', deletePhotoValidation, validate, deletePhoto);
router.delete('/:id', deleteListing);
router.post('/:id/request', requestItemValidation, validate, requestItem);
router.patch('/:id/request/:requestId', updateRequestStatusValidation, validate, updateRequestStatus);

module.exports = router;