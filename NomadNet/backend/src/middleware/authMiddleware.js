const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - requires authentication
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists'
      });
    }

    // ✅ CHECK EMAIL VERIFICATION for protected routes
    if (!req.user.emailVerified) {
      return res.status(403).json({
        status: 'error',
        message: 'Please verify your email to access this feature',
        emailVerified: false,
        requiresVerification: true
      });
    }

    // Update activity
    req.user.updateActivity();
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please login again.'
    });
  }
};

// ✅ NEW: Optional verification check (for routes that don't strictly require it)
exports.optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(); // Continue without user
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (req.user) {
      req.user.updateActivity();
    }
  } catch (err) {
    // Silent fail - just continue without user
  }

  next();
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'User role is not authorized to access this route'
      });
    }
    next();
  };
};

// ✅ NEW: Check email verification only (without full auth)
exports.requireVerifiedEmail = async (req, res, next) => {
  if (!req.user || !req.user.emailVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'Email verification required for this action',
      emailVerified: false,
      requiresVerification: true
    });
  }
  next();
};