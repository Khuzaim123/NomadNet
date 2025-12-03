const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

console.log('📦 Loading messageRoutes.js...');

// Import controller
let messageController;
try {
  messageController = require('../controllers/messageController');
  console.log('✅ Message controller loaded');
} catch (error) {
  console.error('❌ Error loading message controller:', error.message);
  throw error;
}

const {
  sendMessage,
  getMessages,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount
} = messageController;

// All routes are protected
router.use(protect);

// Test route
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Message routes working!',
    timestamp: new Date().toISOString()
  });
});

// Main routes
router.post('/', sendMessage);
router.get('/unread/count', getUnreadCount);
router.get('/:conversationId', getMessages);
router.put('/:id/read', markMessageAsRead);
router.delete('/:id', deleteMessage);

console.log('✅ Message routes registered:');
console.log('   POST /api/messages/');
console.log('   GET /api/messages/unread/count');
console.log('   GET /api/messages/:conversationId');
console.log('   PUT /api/messages/:id/read');
console.log('   DELETE /api/messages/:id');

console.log('✅ Message routes defined');

module.exports = router;