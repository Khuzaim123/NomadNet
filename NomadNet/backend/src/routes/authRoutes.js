const express = require('express');
const router = express.Router();
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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
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
} = require('../middleware/validator');

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

module.exports = router;