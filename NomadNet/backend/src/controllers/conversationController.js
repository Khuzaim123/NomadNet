const Conversation = require('../models/conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get or create conversation
// @route   POST /api/conversations
// @access  Private
exports.createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user.id;

    // Validate participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is trying to message themselves
    if (participantId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] }
    }).populate('participants', 'name email avatar userType')
      .populate('lastMessage');

    if (conversation) {
      return res.status(200).json({
        success: true,
        data: conversation
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [currentUserId, participantId],
      unreadCount: {
        [currentUserId]: 0,
        [participantId]: 0
      }
    });

    conversation = await conversation.populate('participants', 'name email avatar userType');

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all conversations for logged-in user
// @route   GET /api/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, archived = false } = req.query;

    const query = {
      participants: userId,
      archivedBy: archived === 'true' ? userId : { $ne: userId }
    };

    const conversations = await Conversation.find(query)
      .populate('participants', 'name email avatar userType location')
      .populate({
        path: 'lastMessage',
        select: 'content sender createdAt messageType isRead'
      })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add unread count for current user and other participant info
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId
      );
      
      return {
        ...conv,
        otherParticipant,
        unreadCount: conv.unreadCount.get(userId) || 0,
        isArchived: conv.archivedBy.some(id => id.toString() === userId)
      };
    });

    const total = await Conversation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: formattedConversations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalConversations: total,
        limit: limit
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

// @desc    Get single conversation
// @route   GET /api/conversations/:id
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name email avatar userType location')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== req.user.id
    );

    res.status(200).json({
      success: true,
      data: {
        ...conversation.toObject(),
        otherParticipant,
        unreadCount: conversation.unreadCount.get(req.user.id) || 0
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

// @desc    Archive/Unarchive conversation
// @route   PUT /api/conversations/:id/archive
// @access  Private
exports.toggleArchiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const userId = req.user.id;
    const isArchived = conversation.archivedBy.some(
      id => id.toString() === userId
    );

    if (isArchived) {
      // Unarchive
      conversation.archivedBy = conversation.archivedBy.filter(
        id => id.toString() !== userId
      );
    } else {
      // Archive
      conversation.archivedBy.push(userId);
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      data: conversation,
      message: isArchived ? 'Conversation unarchived' : 'Conversation archived'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete conversation (for current user)
// @route   DELETE /api/conversations/:id
// @access  Private
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark all messages as deleted for this user
    await Message.updateMany(
      { conversation: req.params.id },
      { $addToSet: { deletedBy: req.user.id } }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/conversations/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: req.params.id,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Reset unread count
    conversation.unreadCount.set(req.user.id, 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};