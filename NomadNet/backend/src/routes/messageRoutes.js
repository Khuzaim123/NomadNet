const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Upload middleware for image uploads
let uploadMiddleware;
try {
  uploadMiddleware = require('../middleware/uploadMiddleware');
  console.log('✅ Upload middleware loaded');
} catch (error) {
  console.error('⚠️ Upload middleware not available:', error.message);
}

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

// Image upload route - manually upload to Cloudinary
if (uploadMiddleware) {
  const cloudinary = require('../config/cloudinary');

  router.post('/upload-image', uploadMiddleware.single('image'), async (req, res) => {
    try {
      console.log('📸 Image upload request received');

      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No image file provided'
        });
      }

      console.log('📤 Uploading to Cloudinary from buffer...');

      // Upload buffer to Cloudinary using upload_stream
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'nomadnet/chat',
            resource_type: 'image',
            transformation: [
              { width: 2000, height: 2000, crop: 'limit' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('✅ Cloudinary upload success:', result.secure_url);
              resolve(result);
            }
          }
        );

        // Write buffer to stream
        uploadStream.end(req.file.buffer);
      });

      const result = await uploadPromise;

      // Return the Cloudinary URL
      res.json({
        status: 'success',
        data: {
          imageUrl: result.secure_url
        }
      });
    } catch (error) {
      console.error('❌ Image upload error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to upload image'
      });
    }
  });
  console.log('✅ Image upload route registered: POST /api/messages/upload-image');
}

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