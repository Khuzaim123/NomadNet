const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/imageUpload');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpire -passwordResetOTP -tempPassword -reportedBy');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user is blocked by the requester
    if (req.user && user.blockedUsers.includes(req.user._id)) {
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
      .select('-password -otp -otpExpire -passwordResetOTP -tempPassword -reportedBy');

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
    // ✅ FIX: Convert both to string for comparison
    if (req.params.id !== req.user._id.toString()) {
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
    ).select('-password -otp -otpExpire -passwordResetOTP -tempPassword');

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
    // ✅ FIX: Convert to string
    if (req.params.id !== req.user._id.toString()) {
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
    // ✅ FIX: Convert to string for proper comparison
    if (req.params.id !== req.user._id.toString()) {
      console.log('ID Mismatch:');
      console.log('req.params.id:', req.params.id, typeof req.params.id);
      console.log('req.user._id:', req.user._id.toString(), typeof req.user._id.toString());
      
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
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        status: 'error',
        message: 'Longitude and latitude must be valid numbers'
      });
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90'
      });
    }

    const updateData = {
      currentLocation: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      lastActive: Date.now()
    };

    // Only update city/country if provided
    if (city) updateData.currentCity = city;
    if (country) updateData.currentCountry = country;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpire -passwordResetOTP -tempPassword');

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
    console.error('Update location error:', error);
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
    // ✅ FIX: Convert to string
    if (req.params.id !== req.user._id.toString()) {
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

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid privacy settings provided'
      });
    }

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
// @route   GET /api/users/nearby/search
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

    if (isNaN(lng) || isNaN(lat) || isNaN(maxDistance)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates or radius'
      });
    }

    // Find nearby users using geospatial query
    const users = await User.find({
      _id: { $ne: req.user._id }, // Exclude current user
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
      emailVerified: true
    })
    .select('username displayName avatar profession skills currentCity currentLocation lastActive isOnline')
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
    console.error('Get nearby users error:', error);
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

    // ✅ FIX: Convert to string
    if (userToBlock === req.user._id.toString()) {
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

    const user = await User.findById(req.user._id);

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

    const user = await User.findById(req.user._id);

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
// @route   GET /api/users/blocked/list
// @access  Private
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
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

    // ✅ FIX: Convert to string
    if (userToReport === req.user._id.toString()) {
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
      report => report.user.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reported this user'
      });
    }

    // Add report
    targetUser.reportedBy.push({
      user: req.user._id,
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
    // ✅ FIX: Convert to string
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own account'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

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