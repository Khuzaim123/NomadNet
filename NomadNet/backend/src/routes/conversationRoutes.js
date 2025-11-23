const express = require('express');
const router = express.Router();
const {
  createOrGetConversation,
  getConversations,
  getConversation,
  toggleArchiveConversation,
  deleteConversation,
  markAsRead
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getConversations)
  .post(createOrGetConversation);

router.route('/:id')
  .get(getConversation)
  .delete(deleteConversation);

router.put('/:id/archive', toggleArchiveConversation);
router.put('/:id/read', markAsRead);

module.exports = router;