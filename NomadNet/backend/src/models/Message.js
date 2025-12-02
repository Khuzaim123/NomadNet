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
      required: [true, 'Message content is required'],
      trim: true,
    },

    // Your schema originally had `type`. Keep it and map controller's messageType to this
    type: {
      type: String,
      enum: ['text', 'image', 'location'],
      default: 'text',
    },

    imageUrl: {
      type: String,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
      name: String,
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