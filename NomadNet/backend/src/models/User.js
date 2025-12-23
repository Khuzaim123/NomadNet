const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  // ======================
  // 🔐 Authentication
  // ======================
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 8,
    select: false
  },

  // ======================
  // 👤 Profile Info
  // ======================
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  displayName: {
    type: String,
    required: [true, 'Please add a display name'],
    trim: true
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=random'
  },
  bio: {
    type: String,
    maxlength: 500
  },

  // ======================
  // 💼 Professional Info
  // ======================
  profession: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],

  // ======================
  // 🔗 Links
  // ======================
  links: {
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    twitter: { type: String }
  },

  // ======================
  // 📍 Location Info
  // ======================
  currentCity: {
    type: String,
    required: [true, 'Please add your current city']
  },
  currentCountry: {
    type: String
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },
  homeCountry: {
    type: String
  },

  // ======================
  // 🗣️ Languages
  // ======================
  languages: [{
    type: String
  }],

  // ======================
  // 💬 Activity & Status
  // ======================
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },

  // ======================
  // ⚙️ Privacy Settings
  // ======================
  shareLocation: {
    type: Boolean,
    default: true
  },
  visibility: {
    type: String,
    enum: ['public', 'connections', 'hidden'],
    default: 'public'
  },
  whoCanMessage: {
    type: String,
    enum: ['everyone', 'nearby', 'connections'],
    default: 'everyone'
  },

  // ======================
  // ✅ Verification (UPDATED FOR OTP)
  // ======================
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationBadge: {
    type: String,
    enum: ['none', 'email', 'phone', 'id'],
    default: 'none'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // ✅ OTP Fields
  otp: String,
  otpExpire: Date,
  otpAttempts: {
    type: Number,
    default: 0
  },
  otpLastSent: Date,

  // ======================
  // 🔁 Password Reset (USING OTP)
  // ======================
  passwordResetOTP: String,
  passwordResetOTPExpire: Date,
  
  // ======================
  // 🔄 Temp Password Storage
  // ======================
  tempPassword: String, // For password change verification

  // ======================
  // 🚫 Safety
  // ======================
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ======================
// ⚡ Indexes
// ======================
UserSchema.index({ currentLocation: '2dsphere' }, { sparse: true });
UserSchema.index({ currentCity: 1 });
UserSchema.index({ isOnline: 1 });

// ======================
// 🔑 Password Hashing
// ======================
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ======================
// 🔍 Methods
// ======================

// Compare entered password with stored hash
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last activity time
UserSchema.methods.updateActivity = function() {
  this.lastActive = Date.now();
  this.isOnline = true;
  return this.save();
};

// ✅ Generate OTP for email verification (6 digits, valid for 10 minutes)
UserSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  this.otp = crypto.createHash('sha256').update(otp).digest('hex');
  this.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.otpLastSent = Date.now();
  
  return otp; // Return plain OTP to send via email
};

// ✅ Verify OTP
UserSchema.methods.verifyOTP = function(enteredOTP) {
  if (!this.otp || !this.otpExpire) {
    return { success: false, message: 'No OTP found. Please request a new one.' };
  }

  if (Date.now() > this.otpExpire) {
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }

  const hashedOTP = crypto.createHash('sha256').update(enteredOTP).digest('hex');
  
  if (hashedOTP !== this.otp) {
    this.otpAttempts += 1;
    
    if (this.otpAttempts >= 5) {
      this.otp = undefined;
      this.otpExpire = undefined;
      return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }
    
    return { success: false, message: `Invalid OTP. ${5 - this.otpAttempts} attempts remaining.` };
  }

  return { success: true };
};

// ✅ Generate Password Reset OTP
UserSchema.methods.generatePasswordResetOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.passwordResetOTP = crypto.createHash('sha256').update(otp).digest('hex');
  this.passwordResetOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return otp;
};

// ✅ Verify Password Reset OTP
UserSchema.methods.verifyPasswordResetOTP = function(enteredOTP) {
  if (!this.passwordResetOTP || !this.passwordResetOTPExpire) {
    return { success: false, message: 'No reset OTP found.' };
  }

  if (Date.now() > this.passwordResetOTPExpire) {
    return { success: false, message: 'OTP has expired.' };
  }

  const hashedOTP = crypto.createHash('sha256').update(enteredOTP).digest('hex');
  
  if (hashedOTP !== this.passwordResetOTP) {
    return { success: false, message: 'Invalid OTP.' };
  }

  return { success: true };
};

// ✅ Clear OTP data
UserSchema.methods.clearOTP = function() {
  this.otp = undefined;
  this.otpExpire = undefined;
  this.otpAttempts = 0;
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);