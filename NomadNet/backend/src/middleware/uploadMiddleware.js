const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // ✅ ADD DEBUGGING
  console.log('📁 File upload attempt:');
  console.log('   - Original name:', file.originalname);
  console.log('   - Mimetype:', file.mimetype);
  console.log('   - Size:', file.size);

  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  console.log('   - Extension test:', extname);
  console.log('   - Mimetype test:', mimetype);

  if (extname && mimetype) {
    console.log('✅ File validation passed');
    cb(null, true);
  } else {
    console.log('❌ File validation failed');
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

module.exports = upload;