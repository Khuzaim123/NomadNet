const express = require('express');
const router = express.Router();

console.log('📦 Loading authRoutes.js...');

// ✅ Load controller with error handling
let authController;
try {
  authController = require('../controllers/authController');
  console.log('✅ Auth controller loaded');
  console.log('   Available functions:', Object.keys(authController));
} catch (error) {
  console.error('❌ Error loading auth controller:', error.message);
  throw error; // Re-throw to stop route loading
}

// ✅ Load middleware with error handling
let authMiddleware, validator;

try {
  authMiddleware = require('../middleware/authMiddleware');
  console.log('✅ Auth middleware loaded');
} catch (error) {
  console.error('❌ Error loading auth middleware:', error.message);
  throw error;
}

try {
  validator = require('../middleware/validator');
  console.log('✅ Validator loaded');
  console.log('   Available validators:', Object.keys(validator));
} catch (error) {
  console.error('❌ Error loading validator:', error.message);
  throw error;
}

// ✅ Destructure after successful load
const { 
  register,
  verifyOTP,
  resendOTP,
  login, 
  getMe, 
  logout,
  forgotPassword,
  resetPassword,
  requestPasswordChangeOTP,
  verifyPasswordChangeOTP
} = authController;

const { protect } = authMiddleware;

const {
  registerValidation,
  loginValidation,
  otpVerificationValidation,
  resendOTPValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  requestPasswordChangeValidation,
  verifyPasswordChangeValidation,
  validate
} = validator;

// ======================
// 🧪 Test Routes
// ======================
router.get('/test', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/verify-otp',
      'POST /api/auth/resend-otp',
      'POST /api/auth/login',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'GET /api/auth/me (protected)',
      'POST /api/auth/logout (protected)',
      'POST /api/auth/change-password/request (protected)',
      'POST /api/auth/change-password/verify (protected)'
    ]
  });
});

// ======================
// 🌐 Public Routes
// ======================
router.post('/register', registerValidation, validate, register);
router.post('/verify-otp', otpVerificationValidation, validate, verifyOTP);
router.post('/resend-otp', resendOTPValidation, validate, resendOTP);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

// ======================
// 🔒 Protected Routes
// ======================
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/change-password/request', protect, requestPasswordChangeValidation, validate, requestPasswordChangeOTP);
router.post('/change-password/verify', protect, verifyPasswordChangeValidation, validate, verifyPasswordChangeOTP);

console.log('✅ All auth routes defined');

module.exports = router;