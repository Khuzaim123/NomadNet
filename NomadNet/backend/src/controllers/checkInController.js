// controllers/checkinController.js

const CheckIn = require('../models/CheckIn');
const Venue = require('../models/Venue');
const { emitNewCheckIn, emitCheckInUpdate, emitCheckInDelete } = require('../utils/socketEmitters');

// ======================
// 📍 CHECK-IN MANAGEMENT
// ======================

// @desc    Create a check-in (venue-only)
// @route   POST /api/checkins
// @access  Private
exports.createCheckIn = async (req, res) => {
  try {
    const {
      venueId,
      note,
      visibility = 'public',
      address // optional override
    } = req.body;

    // ✅ Require a venue: user can only check in to existing venues
    if (!venueId) {
      return res.status(400).json({
        status: 'error',
        message: 'venueId is required to check in. You can only check in to existing venues.'
      });
    }

    // Find venue
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Ensure venue has valid coordinates
    if (
      !venue.location ||
      !Array.isArray(venue.location.coordinates) ||
      venue.location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Venue does not have valid location coordinates'
      });
    }

    const [lng, lat] = venue.location.coordinates;

    // Optional: validate coords
    if (
      isNaN(lng) ||
      isNaN(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Venue coordinates are invalid'
      });
    }

    // Delete user's previous active check-ins (only keep latest)
    await CheckIn.deleteMany({
      user: req.user._id,
      expiresAt: { $gt: Date.now() }
    });

    // Use venue address by default, allow optional override from client
    const checkInAddress = address || venue.address;

    // Create check-in pinned to the venue location
    const checkIn = await CheckIn.create({
      user: req.user._id,
      venue: venue._id,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      address: checkInAddress,
      note,
      visibility,
      expiresAt: Date.now() + 4 * 60 * 60 * 1000 // 4 hours
    });

    // Populate user and venue
    await checkIn.populate('user', 'username displayName avatar profession');
    await checkIn.populate('venue', 'name category address');

    emitNewCheckIn(checkIn);

    res.status(201).json({
      status: 'success',
      message: 'Checked in successfully',
      data: { checkIn }
    });
  } catch (error) {
    console.error('Create check-in error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get check-in by ID
// @route   GET /api/checkins/:id
// @access  Public (respects visibility)
exports.getCheckInById = async (req, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id)
      .populate('user', 'username displayName avatar profession')
      .populate('venue', 'name category address photos ratings');

    if (!checkIn) {
      return res.status(404).json({
        status: 'error',
        message: 'Check-in not found or expired'
      });
    }

    // Check visibility
    if (
      checkIn.visibility === 'private' &&
      (!req.user || checkIn.user._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'This check-in is private'
      });
    }

    res.json({
      status: 'success',
      data: { checkIn }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's check-in history
// @route   GET /api/checkins/user/:userId
// @access  Public (own) / Private (others)
exports.getUserCheckIns = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { limit = 20, page = 1, includeExpired = false } = req.query;

    const query = { user: userId };

    // If viewing others' check-ins, only show public/connections
    if (!req.user || req.user._id.toString() !== userId) {
      query.visibility = { $in: ['public', 'connections'] };
    }

    // Filter expired
    if (includeExpired !== 'true') {
      query.expiresAt = { $gt: Date.now() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const checkIns = await CheckIn.find(query)
      .populate('venue', 'name category address photos')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CheckIn.countDocuments(query);

    res.json({
      status: 'success',
      results: checkIns.length,
      total,
      page: parseInt(page),
      data: { checkIns }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get nearby check-ins (geospatial search)
// @route   GET /api/checkins/nearby/search
// @access  Private
exports.getNearbyCheckIns = async (req, res) => {
  try {
    const { longitude, latitude, radius = 5000, limit = 50 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide longitude and latitude'
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDistance = parseInt(radius);

    if (isNaN(lng) || isNaN(lat) || isNaN(maxDistance)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates or radius'
      });
    }

    // Find nearby active check-ins (includes current user now)
    const checkIns = await CheckIn.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      },
      expiresAt: { $gt: Date.now() },
      visibility: { $in: ['public', 'connections'] }
      // ❌ Removed: user: { $ne: req.user._id }
    })
      .populate('user', 'username displayName avatar profession skills')
      .populate('venue', 'name category address')
      .limit(parseInt(limit));

    const checkInsWithDistance = checkIns.map(checkIn => {
      const distance = calculateDistance(
        [lng, lat],
        checkIn.location.coordinates
      );

      return {
        ...checkIn.toObject(),
        distance: Math.round(distance)
      };
    });

    res.json({
      status: 'success',
      results: checkInsWithDistance.length,
      data: { checkIns: checkInsWithDistance }
    });
  } catch (error) {
    console.error('Get nearby check-ins error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get check-ins at a specific venue
// @route   GET /api/checkins/venue/:venueId
// @access  Public
exports.getVenueCheckIns = async (req, res) => {
  try {
    const { limit = 20, activeOnly = true } = req.query;

    const query = {
      venue: req.params.venueId,
      visibility: { $in: ['public', 'connections'] }
    };

    if (activeOnly === 'true') {
      query.expiresAt = { $gt: Date.now() };
    }

    const checkIns = await CheckIn.find(query)
      .populate('user', 'username displayName avatar profession')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({
      status: 'success',
      results: checkIns.length,
      data: { checkIns }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update check-in (note/visibility only)
// @route   PATCH /api/checkins/:id
// @access  Private (own check-in only)
exports.updateCheckIn = async (req, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return res.status(404).json({
        status: 'error',
        message: 'Check-in not found'
      });
    }

    // Check ownership
    if (checkIn.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own check-ins'
      });
    }

    const { note, visibility } = req.body;

    if (note !== undefined) checkIn.note = note;
    if (visibility !== undefined) checkIn.visibility = visibility;

    await checkIn.save();

    await checkIn.populate('user', 'username displayName avatar');
    await checkIn.populate('venue', 'name category address');

    emitCheckInUpdate(checkIn);

    res.json({
      status: 'success',
      message: 'Check-in updated successfully',
      data: { checkIn }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete check-in
// @route   DELETE /api/checkins/:id
// @access  Private (own check-in only)
exports.deleteCheckIn = async (req, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return res.status(404).json({
        status: 'error',
        message: 'Check-in not found'
      });
    }

    // Check ownership
    if (checkIn.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own check-ins'
      });
    }

    const location = checkIn.location;

    await CheckIn.findByIdAndDelete(req.params.id);

    emitCheckInDelete(req.params.id, location);

    res.json({
      status: 'success',
      message: 'Check-in deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get current user's active check-in
// @route   GET /api/checkins/me/active
// @access  Private
exports.getMyActiveCheckIn = async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({
      user: req.user._id,
      expiresAt: { $gt: Date.now() }
    })
      .populate('venue', 'name category address photos ratings')
      .sort('-createdAt');

    if (!checkIn) {
      return res.json({
        status: 'success',
        data: { checkIn: null }
      });
    }

    res.json({
      status: 'success',
      data: { checkIn }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ======================
// 🛠️ Helper Functions
// ======================

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

  return R * c;
}