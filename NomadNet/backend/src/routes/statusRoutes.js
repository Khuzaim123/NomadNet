const express = require('express');
const router = express.Router();
const {
  createOrUpdateStatus,
  getMyStatus,
  getUserStatus,
  getAllStatuses,
  getNearbyStatuses,
  deleteStatus,
  getStatusStats,
  getContactsStatuses
} = require('../controllers/statusController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getAllStatuses)
  .post(createOrUpdateStatus)
  .delete(deleteStatus);

router.get('/me', getMyStatus);
router.get('/stats', getStatusStats);
router.get('/contacts', getContactsStatuses);
router.get('/nearby', getNearbyStatuses);
router.get('/user/:userId', getUserStatus);

module.exports = router;