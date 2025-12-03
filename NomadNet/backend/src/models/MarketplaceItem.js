const mongoose = require('mongoose');

const MarketplaceItemSchema = new mongoose.Schema({
  // ======================
  // 👤 Owner Information
  // ======================
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ======================
  // 📋 Basic Information
  // ======================
  type: {
    type: String,
    enum: ['item', 'skill', 'service'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: 1000
  },

  // ======================
  // 🏷️ Category
  // ======================
  category: {
    type: String,
    required: true,
    enum: [
      'electronics', 
      'furniture', 
      'books', 
      'sports', 
      'musical_instruments',
      'web_development', 
      'design', 
      'photography', 
      'writing', 
      'consulting',
      'language_lessons', 
      'fitness', 
      'other'
    ]
  },
  
  // Custom category name when category is "other"
  otherCategoryName: {
    type: String,
    trim: true,
    maxlength: 50
    // Validation handled in pre-save hook below
  },

  // ======================
  // 📸 Media
  // ======================
  photos: [{
    type: String
  }],

  // ======================
  // 🔧 Item Specific
  // ======================
  condition: {
    type: String,
    enum: ['new', 'like_new', 'good', 'fair', 'poor'],
    required: function() { 
      return this.type === 'item'; 
    }
  },

  // ======================
  // ⏰ Availability
  // ======================
  available: {
    type: Boolean,
    default: true
  },
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableUntil: {
    type: Date
  },

  // ======================
  // 💰 Pricing
  // ======================
  priceType: {
    type: String,
    enum: ['free', 'barter', 'paid'],
    default: 'free'
  },
  price: {
    amount: Number,
    currency: { 
      type: String, 
      default: 'USD' 
    }
  },

  // ======================
  // 📍 Location
  // ======================
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]
  },

  // ======================
  // 🚚 Delivery Options
  // ======================
  deliveryOptions: [{
    type: String,
    enum: ['pickup', 'delivery', 'remote']
  }],

  // ======================
  // 📊 Metrics
  // ======================
  views: {
    type: Number,
    default: 0
  },

  // ======================
  // 💬 Requests
  // ======================
  requests: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    message: String,
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending'
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],

  // ======================
  // ⚙️ Status
  // ======================
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ======================
// 🔍 Indexes
// ======================

// Geospatial index for location-based queries
MarketplaceItemSchema.index({ location: '2dsphere' });

// Compound index for owner's active listings
MarketplaceItemSchema.index({ owner: 1, isActive: 1 });

// Compound index for category filtering with availability
MarketplaceItemSchema.index({ category: 1, available: 1 });

// Text index for search functionality
MarketplaceItemSchema.index({ title: 'text', description: 'text' });

// Index for type filtering
MarketplaceItemSchema.index({ type: 1 });

// Index for price type filtering
MarketplaceItemSchema.index({ priceType: 1 });

// Compound index for filtering by type and category
MarketplaceItemSchema.index({ type: 1, category: 1 });

// ======================
// ✅ Validation Hooks
// ======================

// Pre-save hook: Validate otherCategoryName
MarketplaceItemSchema.pre('save', function(next) {
  // If category is 'other', otherCategoryName must be provided
  if (this.category === 'other' && !this.otherCategoryName) {
    const error = new Error('Please specify category name when selecting "other"');
    error.name = 'ValidationError';
    return next(error);
  }
  
  // If category is NOT 'other', clear otherCategoryName (data cleanup)
  if (this.category !== 'other' && this.otherCategoryName) {
    this.otherCategoryName = undefined;
  }
  
  next();
});

// Pre-update hook: Validate otherCategoryName on updates
MarketplaceItemSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Handle both $set updates and direct updates
  const updateData = update.$set || update;
  
  // Check if category is being updated to 'other'
  if (updateData.category === 'other' && !updateData.otherCategoryName) {
    const error = new Error('Please specify category name when selecting "other"');
    error.name = 'ValidationError';
    return next(error);
  }
  
  // If category is being changed from 'other' to something else, clear otherCategoryName
  if (updateData.category && updateData.category !== 'other') {
    if (update.$set) {
      update.$set.otherCategoryName = undefined;
    } else {
      update.otherCategoryName = undefined;
    }
  }
  
  next();
});

// ======================
// 📊 Virtual Properties
// ======================

// Virtual for total requests count
MarketplaceItemSchema.virtual('totalRequests').get(function() {
  return this.requests ? this.requests.length : 0;
});

// Virtual for pending requests count
MarketplaceItemSchema.virtual('pendingRequests').get(function() {
  return this.requests ? this.requests.filter(req => req.status === 'pending').length : 0;
});

// Virtual for accepted requests count
MarketplaceItemSchema.virtual('acceptedRequests').get(function() {
  return this.requests ? this.requests.filter(req => req.status === 'accepted').length : 0;
});

// Virtual to get the display category (uses otherCategoryName if category is 'other')
MarketplaceItemSchema.virtual('displayCategory').get(function() {
  if (this.category === 'other' && this.otherCategoryName) {
    return this.otherCategoryName;
  }
  return this.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// ======================
// 🔧 Instance Methods
// ======================

// Method to check if user has already requested this listing
MarketplaceItemSchema.methods.hasUserRequested = function(userId) {
  return this.requests.some(req => req.user.toString() === userId.toString());
};

// Method to get user's request for this listing
MarketplaceItemSchema.methods.getUserRequest = function(userId) {
  return this.requests.find(req => req.user.toString() === userId.toString());
};

// Method to increment view count
MarketplaceItemSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

// ======================
// 📤 Export Model
// ======================

module.exports = mongoose.models.MarketplaceItem || mongoose.model('MarketplaceItem', MarketplaceItemSchema);