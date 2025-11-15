const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/imageUpload');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken -reportedBy');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user is blocked by the requester
    if (req.user && user.blockedUsers.includes(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'You have been blocked by this user'
      });
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user profile by username
// @route   GET /api/users/username/:username
// @access  Public
exports.getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -emailVerificationToken -passwordResetToken -reportedBy');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (own profile only)
exports.updateProfile = async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own profile'
      });
    }

    // Fields that can be updated
    const allowedUpdates = [
      'displayName',
      'bio',
      'profession',
      'skills',
      'interests',
      'links',
      'currentCity',
      'currentCountry',
      'homeCountry',
      'languages'
    ];

    // Filter out fields that are not allowed
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Upload/Update avatar
// @route   POST /api/users/:id/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own avatar'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file'
      });
    }

    const user = await User.findById(req.params.id);

    // Delete old avatar from Cloudinary (if exists and not default)
    if (user.avatar && !user.avatar.includes('ui-avatars.com')) {
      const oldPublicId = extractPublicId(user.avatar);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (err) {
          console.error('Error deleting old avatar:', err);
        }
      }
    }

    // Upload new avatar to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'nomadnet/avatars',
      `user_${user._id}_${Date.now()}`
    );

    // Update user avatar
    user.avatar = result.secure_url;
    await user.save();

    res.json({
      status: 'success',
      message: 'Avatar uploaded successfully',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user location
// @route   PATCH /api/users/:id/location
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own location'
      });
    }

    const { longitude, latitude, city, country } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide longitude and latitude'
      });
    }

    // Validate coordinates
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        ...(city && { currentCity: city }),
        ...(country && { currentCountry: country }),
        lastActive: Date.now()
      },
      { new: true }
    ).select('-password');

    res.json({
      status: 'success',
      message: 'Location updated successfully',
      data: {
        location: user.currentLocation,
        currentCity: user.currentCity,
        currentCountry: user.currentCountry
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update privacy settings
// @route   PATCH /api/users/:id/privacy
// @access  Private
exports.updatePrivacySettings = async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own privacy settings'
      });
    }

    const allowedSettings = ['shareLocation', 'visibility', 'whoCanMessage'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedSettings.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('shareLocation visibility whoCanMessage');

    res.json({
      status: 'success',
      message: 'Privacy settings updated successfully',
      data: { settings: user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get nearby users
// @route   GET /api/users/nearby
// @access  Private
exports.getNearbyUsers = async (req, res) => {
  try {
    const { longitude, latitude, radius = 5000 } = req.query; // radius in meters (default 5km)

    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide longitude and latitude'
      });
    }

    // Convert to numbers
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDistance = parseInt(radius);

    // Find nearby users using geospatial query
    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude current user
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      },
      shareLocation: true,
      visibility: { $in: ['public', 'connections'] },
      isOnline: true
    })
    .select('username displayName avatar profession skills currentCity currentLocation lastActive')
    .limit(50);

    // Calculate distance for each user
    const usersWithDistance = users.map(user => {
      const distance = calculateDistance(
        [lng, lat],
        user.currentLocation.coordinates
      );

      return {
        ...user.toObject(),
        distance: Math.round(distance) // in meters
      };
    });

    res.json({
      status: 'success',
      results: usersWithDistance.length,
      data: { users: usersWithDistance }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const userToBlock = req.params.id;

    if (userToBlock === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot block yourself'
      });
    }

    // Check if user exists
    const targetUser = await User.findById(userToBlock);
    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already blocked
    if (user.blockedUsers.includes(userToBlock)) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already blocked'
      });
    }

    // Add to blocked list
    user.blockedUsers.push(userToBlock);
    await user.save();

    res.json({
      status: 'success',
      message: 'User blocked successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Unblock a user
// @route   DELETE /api/users/:id/block
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const userToUnblock = req.params.id;

    const user = await User.findById(req.user.id);

    // Check if user is blocked
    if (!user.blockedUsers.includes(userToUnblock)) {
      return res.status(400).json({
        status: 'error',
        message: 'User is not blocked'
      });
    }

    // Remove from blocked list
    user.blockedUsers = user.blockedUsers.filter(
      id => id.toString() !== userToUnblock
    );
    await user.save();

    res.json({
      status: 'success',
      message: 'User unblocked successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get blocked users list
// @route   GET /api/users/blocked
// @access  Private
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers', 'username displayName avatar');

    res.json({
      status: 'success',
      results: user.blockedUsers.length,
      data: { blockedUsers: user.blockedUsers }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Report a user
// @route   POST /api/users/:id/report
// @access  Private
exports.reportUser = async (req, res) => {
  try {
    const userToReport = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a reason for reporting'
      });
    }

    if (userToReport === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot report yourself'
      });
    }

    const targetUser = await User.findById(userToReport);

    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if already reported by this user
    const alreadyReported = targetUser.reportedBy.some(
      report => report.user.toString() === req.user.id
    );

    if (alreadyReported) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reported this user'
      });
    }

    // Add report
    targetUser.reportedBy.push({
      user: req.user.id,
      reason: reason,
      date: Date.now()
    });

    await targetUser.save();

    res.json({
      status: 'success',
      message: 'User reported successfully. Our team will review this report.'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own account'
      });
    }

    const user = await User.findById(req.params.id);

    // Delete avatar from Cloudinary
    if (user.avatar && !user.avatar.includes('ui-avatars.com')) {
      const publicId = extractPublicId(user.avatar);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (err) {
          console.error('Error deleting avatar:', err);
        }
      }
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    // TODO: Also delete related data (messages, check-ins, marketplace items, etc.)

    res.json({
      status: 'success',
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(coords1, coords2) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}