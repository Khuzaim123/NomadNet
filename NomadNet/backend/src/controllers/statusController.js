const Status = require('../models/Status');
const User = require('../models/User');

// @desc    Create or update user status
// @route   POST /api/status
// @access  Private
exports.createOrUpdateStatus = async (req, res) => {
  try {
    const { type, message, emoji, location, duration } = req.body;
    const userId = req.user.id;

    // Calculate expiration time based on duration (in hours, default 4)
    const expiresAt = new Date(Date.now() + (duration || 4) * 60 * 60 * 1000);

    // Prepare status data
    const statusData = {
      user: userId,
      type: type || 'available',
      message: message || '',
      emoji: emoji || '👋',
      expiresAt
    };

    // Add location if provided
    if (location && location.coordinates && location.coordinates.length === 2) {
      statusData.location = {
        type: 'Point',
        coordinates: location.coordinates // [longitude, latitude]
      };
    }

    // Find and update or create new status
    let status = await Status.findOneAndUpdate(
      { user: userId },
      statusData,
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name email avatar userType');

    res.status(200).json({
      success: true,
      data: status,
      message: 'Status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current user's status
// @route   GET /api/status/me
// @access  Private
exports.getMyStatus = async (req, res) => {
  try {
    const status = await Status.findOne({ user: req.user.id })
      .populate('user', 'name email avatar userType');

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'No active status found'
      });
    }

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get status of a specific user
// @route   GET /api/status/user/:userId
// @access  Private
exports.getUserStatus = async (req, res) => {
  try {
    const status = await Status.findOne({ user: req.params.userId })
      .populate('user', 'name email avatar userType location');

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'User has no active status'
      });
    }

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all active statuses
// @route   GET /api/status
// @access  Private
exports.getAllStatuses = async (req, res) => {
  try {
    const { 
      type, 
      userType, 
      page = 1, 
      limit = 20,
      nearMe 
    } = req.query;

    // Build query
    let query = {};

    // Filter by status type
    if (type) {
      query.type = type;
    }

    // Get statuses
    let statusQuery = Status.find(query)
      .populate('user', 'name email avatar userType location bio');

    // Filter by user type after population
    let statuses = await statusQuery
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by userType if specified
    if (userType) {
      statuses = statuses.filter(status => 
        status.user && status.user.userType === userType
      );
    }

    // If nearMe is requested and user has location
    if (nearMe === 'true' && req.user.location && req.user.location.coordinates) {
      // This would need geospatial query - simplified version
      statuses = statuses.filter(status => 
        status.location && status.location.coordinates
      );
    }

    // Exclude current user's status
    statuses = statuses.filter(status => 
      status.user._id.toString() !== req.user.id
    );

    const total = await Status.countDocuments(query);

    res.status(200).json({
      success: true,
      count: statuses.length,
      data: statuses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalStatuses: total,
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

// @desc    Get statuses near a location
// @route   GET /api/status/nearby
// @access  Private
exports.getNearbyStatuses = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000, userType } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude'
      });
    }

    // Find statuses near the location
    const statuses = await Status.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance) // in meters
        }
      }
    }).populate('user', 'name email avatar userType location bio');

    // Filter by userType if specified
    let filteredStatuses = statuses;
    if (userType) {
      filteredStatuses = statuses.filter(status => 
        status.user && status.user.userType === userType
      );
    }

    // Exclude current user
    filteredStatuses = filteredStatuses.filter(status => 
      status.user._id.toString() !== req.user.id
    );

    res.status(200).json({
      success: true,
      count: filteredStatuses.length,
      data: filteredStatuses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user's status
// @route   DELETE /api/status
// @access  Private
exports.deleteStatus = async (req, res) => {
  try {
    const status = await Status.findOneAndDelete({ user: req.user.id });

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'No active status found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get status statistics
// @route   GET /api/status/stats
// @access  Private
exports.getStatusStats = async (req, res) => {
  try {
    const stats = await Status.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalActive = await Status.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalActiveStatuses: totalActive,
        byType: stats
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

// @desc    Get statuses of users I'm chatting with
// @route   GET /api/status/contacts
// @access  Private
exports.getContactsStatuses = async (req, res) => {
  try {
    const Conversation = require('../models/conversation');
    
    // Get all conversations of current user
    const conversations = await Conversation.find({
      participants: req.user.id
    }).select('participants');

    // Extract unique contact IDs
    const contactIds = new Set();
    conversations.forEach(conv => {
      conv.participants.forEach(participantId => {
        if (participantId.toString() !== req.user.id) {
          contactIds.add(participantId.toString());
        }
      });
    });

    // Get statuses of these contacts
    const statuses = await Status.find({
      user: { $in: Array.from(contactIds) }
    }).populate('user', 'name email avatar userType');

    res.status(200).json({
      success: true,
      count: statuses.length,
      data: statuses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};