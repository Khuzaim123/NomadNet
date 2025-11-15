const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['available', 'working', 'coffee', 'exploring', 'busy', 'custom'],
    default: 'available'
  },
  message: {
    type: String,
    maxlength: 200
  },
  emoji: {
    type: String,
    default: '👋'
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 4 * 60 * 60 * 1000, // 4 hours
    index: { expires: 0 } // TTL index - auto delete when expired
  }
}, {
  timestamps: true
});

// Indexes
StatusSchema.index({ user: 1, expiresAt: 1 });
StatusSchema.index({ location: '2dsphere' });

// Only one active status per user
StatusSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Status', StatusSchema);