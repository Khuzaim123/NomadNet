// src/controllers/messageController.js
const Message = require('../models/Message');
const Conversation = require('../models/conversation');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, content, messageType = 'text', attachments } = req.body;
    const senderId = req.user.id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Get or create conversation
    let conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        unreadCount: new Map([
          [senderId, 0],
          [receiverId, 0]
        ])
      });
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === senderId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create message
    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
      type: messageType,
      attachments: attachments || [],
    });

    // Update conversation
    conversation.lastMessage = message._id;
    const currentUnreadCount = conversation.unreadCount.get(receiverId) || 0;
    conversation.unreadCount.set(receiverId, currentUnreadCount + 1);
    
    conversation.archivedBy = conversation.archivedBy.filter(
      id => id.toString() !== senderId
    );
    
    await conversation.save();

    // Populate message with sender and receiver info
    await message.populate('sender', 'name email avatar username displayName');
    await message.populate('receiver', 'name email avatar username displayName');

    // ✅ REAL-TIME: Emit socket event to all participants
    const io = req.app.get('io');
    if (io) {
      const messageData = {
        _id: message._id,
        conversation: conversation._id,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        type: message.type,
        attachments: message.attachments,
        createdAt: message.createdAt,
        isRead: false
      };

      // Emit to conversation room
      io.to(conversation._id.toString()).emit('newMessage', messageData);
      
      // Also emit to receiver's personal room for notifications
      io.to(`user:${receiverId}`).emit('newMessage', messageData);
      
      // Emit conversation update for sidebar
      const conversationUpdate = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar username displayName')
        .populate('lastMessage');
      
      io.to(`user:${receiverId}`).emit('conversationUpdated', conversationUpdate);
      io.to(`user:${senderId}`).emit('conversationUpdated', conversationUpdate);

      console.log(`📨 Message emitted to conversation: ${conversation._id}`);
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedBy: { $ne: userId }
    })
      .populate('sender', 'name email avatar username displayName')
      .populate('receiver', 'name email avatar username displayName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      conversation: conversationId,
      deletedBy: { $ne: userId }
    });

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.receiver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();

      const conversation = await Conversation.findById(message.conversation);
      if (conversation) {
        const currentCount = conversation.unreadCount.get(req.user.id) || 0;
        conversation.unreadCount.set(req.user.id, Math.max(0, currentCount - 1));
        await conversation.save();
      }

      // ✅ REAL-TIME: Emit read receipt
      const io = req.app.get('io');
      if (io) {
        io.to(message.conversation.toString()).emit('messageRead', {
          messageId: message._id,
          readBy: req.user.id,
          readAt: message.readAt
        });
      }
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const isAuthorized = 
      message.sender.toString() === req.user.id ||
      message.receiver.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!message.deletedBy.includes(req.user.id)) {
      message.deletedBy.push(req.user.id);
      await message.save();
    }

    if (message.deletedBy.length === 2) {
      message.isDeleted = true;
      await message.save();
    }

    // ✅ REAL-TIME: Emit message deleted event
    const io = req.app.get('io');
    if (io) {
      io.to(message.conversation.toString()).emit('messageDeleted', {
        messageId: message._id,
        deletedBy: req.user.id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false,
      deletedBy: { $ne: req.user.id }
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};