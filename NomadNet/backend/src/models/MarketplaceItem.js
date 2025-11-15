const mongoose = require('mongoose');

const MarketplaceItemSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  category: {
    type: String,
    required: true,
    enum: [
      'electronics', 'furniture', 'books', 'sports', 'musical_instruments',
      'web_development', 'design', 'photography', 'writing', 'consulting',
      'language_lessons', 'fitness', 'other'
    ]
  },
  photos: [{
    type: String
  }],
  condition: {
    type: String,
    enum: ['new', 'like_new', 'good', 'fair', 'poor'],
    required: function() { return this.type === 'item'; }
  },
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
  priceType: {
    type: String,
    enum: ['free', 'barter', 'paid'],
    default: 'free'
  },
  price: {
    amount: Number,
    currency: { type: String, default: 'USD' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]
  },
  deliveryOptions: [{
    type: String,
    enum: ['pickup', 'delivery', 'remote']
  }],
  views: {
    type: Number,
    default: 0
  },
  requests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
MarketplaceItemSchema.index({ location: '2dsphere' });
MarketplaceItemSchema.index({ owner: 1, isActive: 1 });
MarketplaceItemSchema.index({ category: 1, available: 1 });
MarketplaceItemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('MarketplaceItem', MarketplaceItemSchema);