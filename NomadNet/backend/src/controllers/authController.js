const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const {
  sendRegistrationOTP,
  sendPasswordResetOTP,
  sendPasswordChangeOTP,
  sendWelcomeEmail
} = require('../utils/emailService');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, username, displayName, currentCity } = req.body;

    // Validate required fields
    if (!email || !password || !username || !displayName || !currentCity) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: userExists.email === email
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    // Create new user (unverified)
    const user = await User.create({
      email,
      password,
      username,
      displayName,
      currentCity,
      emailVerified: false
    });

    // Generate OTP for email verification
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    try {
      await sendRegistrationOTP(email, username, otp);
      console.log(`✅ OTP sent successfully to: ${email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      
      // Rollback: Delete user if email fails
      await User.findByIdAndDelete(user._id);
      
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send verification email. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    // Success response
    res.status(201).json({
      status: 'success',
      message: `Registration successful! We've sent a 6-digit OTP to ${email}. Please check your inbox and verify to continue.`,
      data: {
        userId: user._id,
        email: user.email,
        username: user.username,
        requiresOTP: true,
        otpExpiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    // Generic error
    res.status(500).json({
      status: 'error',
      message: 'Server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify OTP after registration
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and OTP'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified'
      });
    }

    // Verify OTP
    const verification = user.verifyOTP(otp);

    if (!verification.success) {
      await user.save();
      return res.status(400).json({
        status: 'error',
        message: verification.message
      });
    }

    // Mark as verified
    user.emailVerified = true;
    user.isVerified = true;
    user.verificationBadge = 'email';
    user.clearOTP();
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.username);
      console.log(`✅ Welcome email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Email verified successfully! You can now login.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified'
      });
    }

    // Check rate limiting (1 minute cooldown)
    if (user.otpLastSent) {
      const timeSinceLastOTP = Date.now() - user.otpLastSent;
      const cooldownMs = 60 * 1000; // 1 minute

      if (timeSinceLastOTP < cooldownMs) {
        const waitTime = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000);
        return res.status(429).json({
          status: 'error',
          message: `Please wait ${waitTime} seconds before requesting a new OTP`
        });
      }
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP
    try {
      await sendRegistrationOTP(user.email, user.username, otp);
      console.log(`✅ OTP resent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to resend OTP:', emailError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send email. Please try again.'
      });
    }

    res.json({
      status: 'success',
      message: 'New OTP sent! Please check your email.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check email verification
    if (!user.emailVerified) {
      return res.status(403).json({
        status: 'error',
        message: 'Please verify your email before logging in. Check your inbox for the OTP.',
        emailVerified: false,
        requiresOTP: true
      });
    }

    // Update online status
    user.isOnline = true;
    user.lastActive = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          currentCity: user.currentCity,
          emailVerified: user.emailVerified,
          isOnline: user.isOnline
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        status: 'success',
        message: 'If an account exists, an OTP has been sent to your email.'
      });
    }

    // Generate reset OTP
    const otp = user.generatePasswordResetOTP();
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetOTP(user.email, user.username, otp);
      console.log(`✅ Password reset OTP sent to: ${user.email}`);

      res.json({
        status: 'success',
        message: 'Password reset OTP sent! Check your email.'
      });
    } catch (emailError) {
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Verify reset OTP & set new password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email, OTP, and new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify OTP
    const verification = user.verifyPasswordResetOTP(otp);

    if (!verification.success) {
      return res.status(400).json({
        status: 'error',
        message: verification.message
      });
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Password reset successful! You can now login.',
      data: { token }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Request OTP for password change
// @route   POST /api/auth/change-password/request
// @access  Private
exports.requestPasswordChangeOTP = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Store temp password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.tempPassword = await bcrypt.hash(newPassword, salt);

    // Generate OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP
    try {
      await sendPasswordChangeOTP(user.email, user.username, otp);
      console.log(`✅ Password change OTP sent to: ${user.email}`);

      res.json({
        status: 'success',
        message: 'OTP sent to your email. Please verify to complete password change.'
      });
    } catch (emailError) {
      console.error('Failed to send password change email:', emailError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Request password change error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Verify OTP and change password
// @route   POST /api/auth/change-password/verify
// @access  Private
exports.verifyPasswordChangeOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide OTP'
      });
    }

    const user = await User.findById(req.user.id).select('+password +tempPassword');

    if (!user.tempPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'No password change request found'
      });
    }

    // Verify OTP
    const verification = user.verifyOTP(otp);

    if (!verification.success) {
      await user.save();
      return res.status(400).json({
        status: 'error',
        message: verification.message
      });
    }

    // Update password
    user.password = user.tempPassword;
    user.tempPassword = undefined;
    user.clearOTP();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Password changed successfully',
      data: { token }
    });
  } catch (error) {
    console.error('Verify password change error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastActive: Date.now()
    });

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};