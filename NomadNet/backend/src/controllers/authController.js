const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
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

    // Check if user exists
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

    // Create user
    const user = await User.create({
      email,
      password,
      username,
      displayName,
      currentCity
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail(email, username, verificationToken);
      console.log('✅ Verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          emailVerified: user.emailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }

    // Set email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json({
      status: 'success',
      message: 'Email verified successfully! You can now use all features.',
      data: {
        emailVerified: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
exports.resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.emailVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    await sendVerificationEmail(user.email, user.username, verificationToken);

    res.json({
      status: 'success',
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
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

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update online status
    user.isOnline = true;
    user.lastActive = Date.now();
    await user.save();

    // Generate token
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
          currentLocation: user.currentLocation,
          emailVerified: user.emailVerified,
          isOnline: user.isOnline
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Forgot password
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
      // Don't reveal that user doesn't exist (security best practice)
      return res.json({
        status: 'success',
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.username, resetToken);

      res.json({
        status: 'success',
        message: 'Password reset email sent! Please check your inbox.',
        // For development/testing only - remove in production
        resetToken: resetToken
      });
    } catch (emailError) {
      // If email fails, clear the token
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: 'error',
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a new password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters'
      });
    }

    // Get hashed token
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    // Generate new JWT token
    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Password reset successful! You can now login with your new password.',
      data: {
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Change password (when logged in)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Password changed successfully',
      data: { token }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get current logged in user
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
    // Update user status
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