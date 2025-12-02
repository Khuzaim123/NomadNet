const mongoose = require('mongoose'); //orm for mongodb

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Ensure only 2 participants (for direct messages)
ConversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  next();
});

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);