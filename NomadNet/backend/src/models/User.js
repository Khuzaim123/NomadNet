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
    minlength: 6,
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
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
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
  // ✅ Verification
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
  emailVerificationToken: String,
  emailVerificationExpire: Date,

  // ======================
  // 🔁 Password Reset
  // ======================
  passwordResetToken: String,
  passwordResetExpire: Date,

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
UserSchema.index({ currentLocation: '2dsphere' });
UserSchema.index({ username: 1, email: 1 });
UserSchema.index({ currentCity: 1, isOnline: 1 });
UserSchema.index({ skills: 1, interests: 1 });

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

// Generate email verification token (valid for 24h)
UserSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

// Generate password reset token (valid for 1h)
UserSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
