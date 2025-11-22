const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  // ======================
  // 🗨️ Conversation
  // ======================
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },

  // ======================
  // 👤 Sender
  // ======================
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ======================
  // 📝 Message Content
  // ======================
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'location'],
    default: 'text'
  },
  imageUrl: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number],
    name: String
  },

  // ======================
  // 🎯 NEW: Message Context (What is this message about?)
  // ======================
  contextType: {
    type: String,
    enum: ['conversation', 'marketplace', 'venue'],
    default: 'conversation'
  },

  // Reference to marketplace item (when contextType is 'marketplace')
  marketplaceItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceItem',
    required: function() {
      return this.contextType === 'marketplace';
    }
  },

  // Reference to venue (when contextType is 'venue')
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: function() {
      return this.contextType === 'venue';
    }
  },

  // ======================
  // 📖 Read Status
  // ======================
  readBy: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    readAt: { 
      type: Date, 
      default: Date.now 
    }
  }],

  // ======================
  // ✏️ Edit & Delete
  // ======================
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ======================
// 🔍 Indexes
// ======================
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

// NEW: Indexes for context-based queries
MessageSchema.index({ marketplaceItem: 1, createdAt: -1 });
MessageSchema.index({ venue: 1, createdAt: -1 });
MessageSchema.index({ contextType: 1, createdAt: -1 });

// Compound index for finding messages about specific items
MessageSchema.index({ conversation: 1, contextType: 1, marketplaceItem: 1 });
MessageSchema.index({ conversation: 1, contextType: 1, venue: 1 });

// ======================
// ✅ Validation Hooks
// ======================

// Pre-save validation: Ensure context consistency
MessageSchema.pre('save', function(next) {
  // If contextType is 'marketplace', marketplaceItem must be provided
  if (this.contextType === 'marketplace' && !this.marketplaceItem) {
    return next(new Error('Marketplace item reference is required when contextType is marketplace'));
  }

  // If contextType is 'venue', venue must be provided
  if (this.contextType === 'venue' && !this.venue) {
    return next(new Error('Venue reference is required when contextType is venue'));
  }

  // If contextType is 'conversation', clear marketplace and venue references
  if (this.contextType === 'conversation') {
    this.marketplaceItem = undefined;
    this.venue = undefined;
  }

  // If contextType is 'marketplace', clear venue reference
  if (this.contextType === 'marketplace') {
    this.venue = undefined;
  }

  // If contextType is 'venue', clear marketplace reference
  if (this.contextType === 'venue') {
    this.marketplaceItem = undefined;
  }

  next();
});

// ======================
// 📊 Virtual Properties
// ======================

// Check if message is read by specific user
MessageSchema.virtual('isReadBy').get(function() {
  return (userId) => {
    return this.readBy.some(read => read.user.toString() === userId.toString());
  };
});

// Get context info (marketplace item or venue)
MessageSchema.virtual('contextInfo').get(function() {
  if (this.contextType === 'marketplace' && this.marketplaceItem) {
    return {
      type: 'marketplace',
      id: this.marketplaceItem._id || this.marketplaceItem,
      data: this.populated('marketplaceItem') ? this.marketplaceItem : null
    };
  }
  
  if (this.contextType === 'venue' && this.venue) {
    return {
      type: 'venue',
      id: this.venue._id || this.venue,
      data: this.populated('venue') ? this.venue : null
    };
  }

  return {
    type: 'conversation',
    id: null,
    data: null
  };
});

// ======================
// 🔧 Instance Methods
// ======================

// Mark message as read by user
MessageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(
    read => read.user.toString() === userId.toString()
  );

  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }

  return Promise.resolve(this);
};

// Edit message content
MessageSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Soft delete message
MessageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.content = 'This message has been deleted';
  return this.save();
};

// Check if user can edit/delete this message
MessageSchema.methods.canModify = function(userId) {
  return this.sender.toString() === userId.toString();
};

// ======================
// 🔄 Post-save Hook
// ======================

// Update conversation's lastMessage when new message is created
MessageSchema.post('save', async function() {
  try {
    await mongoose.model('Conversation').findByIdAndUpdate(
      this.conversation,
      { 
        lastMessage: this._id,
        updatedAt: this.createdAt
      }
    );
  } catch (error) {
    console.error('Error updating conversation lastMessage:', error);
  }
});

// ======================
// 📤 Export
// ======================
module.exports = mongoose.model('Message', MessageSchema);