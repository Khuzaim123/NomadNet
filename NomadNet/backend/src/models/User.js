const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Authentication
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
    select: false // Don't return password by default
  },
  
  // Profile
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
  
  // Professional Info
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
  
  // Links
  links: {
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    twitter: { type: String }
  },
  
  // Location
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
  
  // Languages
  languages: [{
    type: String
  }],
  
  // Status & Activity
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Privacy Settings
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
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationBadge: {
    type: String,
    enum: ['none', 'email', 'phone', 'id'],
    default: 'none'
  },
  
  // Safety
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    date: { type: Date, default: Date.now }
  }],
  
  // Metadata
  passwordResetToken: String,
  passwordResetExpire: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
UserSchema.index({ currentLocation: '2dsphere' });
UserSchema.index({ username: 1, email: 1 });
UserSchema.index({ currentCity: 1, isOnline: 1 });
UserSchema.index({ skills: 1, interests: 1 });

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update lastActive on any action
UserSchema.methods.updateActivity = function() {
  this.lastActive = Date.now();
  this.isOnline = true;
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);