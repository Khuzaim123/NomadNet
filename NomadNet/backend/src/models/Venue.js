const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a venue name'],
    trim: true
  },
  category: {
    type: String,
    enum: ['cafe', 'coworking', 'restaurant', 'bar', 'park', 'library', 'hotel', 'other'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    street: String,
    city: String,
    country: String,
    postalCode: String,
    formatted: String
  },
  contact: {
    phone: String,
    website: String,
    email: String
  },
  photos: [{
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  amenities: [{
    type: String,
    enum: ['wifi', 'power_outlets', 'coffee', 'quiet', 'air_conditioning', 'outdoor_seating', 'parking']
  }],
  hours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  ratings: {
    overall: { type: Number, default: 0, min: 0, max: 5 },
    wifi: { type: Number, default: 0, min: 0, max: 5 },
    noise: { type: Number, default: 0, min: 0, max: 5 },
    crowdedness: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  source: {
    type: String,
    enum: ['user_submitted', 'google_places', 'foursquare'],
    default: 'user_submitted'
  },
  externalId: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
VenueSchema.index({ location: '2dsphere' });
VenueSchema.index({ category: 1, 'ratings.overall': -1 });
VenueSchema.index({ name: 'text', 'address.formatted': 'text' });

module.exports = mongoose.model('Venue', VenueSchema);