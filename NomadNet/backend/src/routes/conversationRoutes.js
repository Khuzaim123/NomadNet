const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

console.log('📦 Loading conversationRoutes.js...');

// Import controller
let conversationController;
try {
  conversationController = require('../controllers/conversationController');
  console.log('✅ Conversation controller loaded');
} catch (error) {
  console.error('❌ Error loading conversation controller:', error.message);
  throw error;
}

const {
  createOrGetConversation,
  getConversations,
  toggleArchiveConversation,
  deleteConversation,
  markAsRead
} = conversationController;

// All routes are protected
router.use(protect);

// Test route
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Conversation routes working!',
    timestamp: new Date().toISOString()
  });
});

// Main routes
router.route('/')
  .get(getConversations)
  .post(createOrGetConversation);

router.route('/:id')
  .delete(deleteConversation);

router.put('/:id/archive', toggleArchiveConversation);
router.put('/:id/read', markAsRead);

console.log('✅ Conversation routes defined');

module.exports = router;