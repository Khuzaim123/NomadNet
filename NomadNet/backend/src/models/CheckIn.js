const mongoose = require('mongoose');

const CheckInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
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
    type: String
  },
  note: {
    type: String,
    maxlength: 200
  },
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 4 * 60 * 60 * 1000,
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Indexes
CheckInSchema.index({ location: '2dsphere' });
CheckInSchema.index({ user: 1, expiresAt: 1 });
CheckInSchema.index({ venue: 1, createdAt: -1 });

module.exports = mongoose.models.CheckIn || mongoose.model('CheckIn', CheckInSchema);