const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  emailValidation,
  passwordValidation,
  changePasswordValidation,
  validate
} = require('../middleware/validator');

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', emailValidation, validate, forgotPassword);
router.put('/reset-password/:token', passwordValidation, validate, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/resend-verification', protect, resendVerificationEmail);
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);

module.exports = router;