const cloudinary = require('cloudinary').v2;

// Cloudinary configuration from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // ✅ Updated
  api_key: process.env.CLOUDINARY_API_KEY,        // ✅ Updated
  api_secret: process.env.CLOUDINARY_API_SECRET   // ✅ Updated
});

module.exports = cloudinary;