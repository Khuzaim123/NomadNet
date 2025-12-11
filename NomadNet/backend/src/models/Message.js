// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ✅ ADD: receiver field (controller depends on this)
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    content: {
      type: String,
      trim: true,
    },

    // Your schema originally had `type`. Keep it and map controller's messageType to this
    type: {
      type: String,
      enum: ['text', 'image', 'location', 'marketplace', 'venue', 'checkin'],
      default: 'text',
    },

    imageUrl: {
      type: String,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: undefined  // Don't create this field if not provided
      },
      coordinates: {
        type: [Number],
        default: undefined  // Don't create empty array if not provided
      },
      name: {
        type: String,
        default: undefined
      }
    },

    // ✅ NEW: Reference to marketplace item when sharing an offer
    marketplaceItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceItem',
    },

    // ✅ NEW: Reference to venue when sharing a location
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
    },

    // ✅ NEW: Reference to check-in when sharing user's current location
    checkIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CheckIn',
    },

    // ✅ ADD: attachments (optional)
    attachments: [
      {
        type: String, // or change to { url, type } if you want richer data
      },
    ],

    // Existing: readBy array (you can keep using this later if you want per-user read tracking)
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],

    // ✅ ADD: simple isRead/readAt fields (controller uses these)
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },

    // ✅ ADD: deletedBy (controller uses this)
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

// Validation: Content is required for text messages
MessageSchema.pre('save', function (next) {
  if (this.type === 'text' && (!this.content || this.content.trim() === '')) {
    next(new Error('Content is required for text messages'));
  } else {
    next();
  }
});

// ✅ Validation: Ensure proper references for new message types
MessageSchema.pre('save', function (next) {
  if (this.type === 'marketplace' && !this.marketplaceItem) {
    return next(new Error('Marketplace message must have a marketplaceItem reference'));
  }
  if (this.type === 'venue' && !this.venue) {
    return next(new Error('Venue message must have a venue reference'));
  }
  if (this.type === 'checkin' && !this.checkIn) {
    return next(new Error('Check-in message must have a checkIn reference'));
  }
  next();
});

// Update conversation's lastMessage when new message is created
MessageSchema.post('save', async function () {
  await mongoose.model('Conversation').findByIdAndUpdate(this.conversation, {
    lastMessage: this._id,
    updatedAt: this.createdAt,
  });
});

// ✅ Check if model exists before creating it (as you had)
module.exports =
  mongoose.models.Message || mongoose.model('Message', MessageSchema);