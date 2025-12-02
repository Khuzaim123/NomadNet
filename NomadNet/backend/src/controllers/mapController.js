// controllers/mapController.js

const User = require('../models/User');
const Venue = require('../models/Venue');
const MarketplaceItem = require('../models/MarketplaceItem');
const CheckIn = require('../models/CheckIn');
const {
  calculateDistance,
  buildNearbyQuery,
  formatDistance,
  validateLocation
} = require('../utils/geoUtils');

// ======================
// 🗺️ MAP ENDPOINTS
// ======================

// @desc    Get all nearby items for map display
// @route   GET /api/map/nearby
// @access  Private
const getNearbyAll = async (req, res) => {
  try {
    const {
      longitude,
      latitude,
      radius = 300, // Default 300m as requested
      types = 'users,venues,marketplace,checkins', // What to fetch
      limit = 50
    } = req.query;

    console.log('\n🗺️  ============ NEARBY SEARCH ============');
    console.log('Location:', { longitude, latitude, radius });
    console.log('Types:', types);

    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide longitude and latitude'
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDistance = parseInt(radius);

    // Build geospatial query
    const locationQuery = buildNearbyQuery(lng, lat, maxDistance);
    const requestedTypes = types.split(',');

    const results = {
      users: [],
      venues: [],
      marketplace: [],
      checkIns: []
    };

    // ======================
    // 👥 Fetch Nearby Users
    // ======================
    if (requestedTypes.includes('users')) {
      const users = await User.find({
        _id: { $ne: req.user._id }, // Exclude self
        currentLocation: locationQuery,
        shareLocation: true,
        visibility: { $in: ['public', 'connections'] },
        emailVerified: true
      })
        .select('username displayName avatar profession skills currentCity currentLocation isOnline lastActive')
        .limit(parseInt(limit));

      results.users = users.map(user => ({
        _id: user._id,
        type: 'user',
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        profession: user.profession,
        skills: user.skills,
        currentCity: user.currentCity,
        isOnline: user.isOnline,
        lastActive: user.lastActive,
        location: {
          type: 'Point',
          coordinates: user.currentLocation.coordinates
        },
        distance: Math.round(
          calculateDistance([lng, lat], user.currentLocation.coordinates)
        ),
        distanceFormatted: formatDistance(
          calculateDistance([lng, lat], user.currentLocation.coordinates)
        )
      }));
    }

    // ======================
    // 🏢 Fetch Nearby Venues
    // ======================
    if (requestedTypes.includes('venues')) {
      const venues = await Venue.find({
        location: locationQuery
      })
        .populate('createdBy', 'username displayName avatar')
        .limit(parseInt(limit));

      results.venues = venues.map(venue => ({
        _id: venue._id,
        type: 'venue',
        name: venue.name,
        category: venue.category,
        address: venue.address,
        photos: venue.photos,
        ratings: venue.ratings,
        amenities: venue.amenities,
        location: {
          type: 'Point',
          coordinates: venue.location.coordinates
        },
        distance: Math.round(
          calculateDistance([lng, lat], venue.location.coordinates)
        ),
        distanceFormatted: formatDistance(
          calculateDistance([lng, lat], venue.location.coordinates)
        ),
        createdBy: venue.createdBy
      }));
    }

    // ======================
    // 🛍️ Fetch Nearby Marketplace Items
    // ======================
    if (requestedTypes.includes('marketplace')) {
      const items = await MarketplaceItem.find({
        location: locationQuery,
        isActive: true,
        available: true
      })
        .populate('owner', 'username displayName avatar currentCity isOnline')
        .limit(parseInt(limit));

      results.marketplace = items.map(item => ({
        _id: item._id,
        type: 'marketplace',
        itemType: item.type,
        title: item.title,
        category: item.category,
        displayCategory: item.displayCategory,
        photos: item.photos,
        priceType: item.priceType,
        price: item.price,
        condition: item.condition,
        location: {
          type: 'Point',
          coordinates: item.location.coordinates
        },
        distance: Math.round(
          calculateDistance([lng, lat], item.location.coordinates)
        ),
        distanceFormatted: formatDistance(
          calculateDistance([lng, lat], item.location.coordinates)
        ),
        owner: item.owner
      }));
    }

    // ======================
    // 📍 Fetch Nearby Check-ins
    // ======================
    if (requestedTypes.includes('checkins')) {
      const checkIns = await CheckIn.find({
        location: locationQuery,
        expiresAt: { $gt: Date.now() },
        visibility: { $in: ['public', 'connections'] },
        user: { $ne: req.user._id }
      })
        .populate('user', 'username displayName avatar profession skills')
        .populate('venue', 'name category address')
        .limit(parseInt(limit));

      results.checkIns = checkIns.map(checkIn => ({
        _id: checkIn._id,
        type: 'checkin',
        note: checkIn.note,
        address: checkIn.address,
        createdAt: checkIn.createdAt,
        expiresAt: checkIn.expiresAt,
        location: {
          type: 'Point',
          coordinates: checkIn.location.coordinates
        },
        distance: Math.round(
          calculateDistance([lng, lat], checkIn.location.coordinates)
        ),
        distanceFormatted: formatDistance(
          calculateDistance([lng, lat], checkIn.location.coordinates)
        ),
        user: checkIn.user,
        venue: checkIn.venue
      }));
    }

    // ======================
    // 📊 Summary Stats
    // ======================
    const summary = {
      totalResults: 
        results.users.length +
        results.venues.length +
        results.marketplace.length +
        results.checkIns.length,
      breakdown: {
        users: results.users.length,
        venues: results.venues.length,
        marketplace: results.marketplace.length,
        checkIns: results.checkIns.length
      },
      searchRadius: maxDistance,
      searchRadiusFormatted: formatDistance(maxDistance),
      centerPoint: { longitude: lng, latitude: lat }
    };

    console.log('✅ Results:', summary.breakdown);
    console.log('=========================================\n');

    res.json({
      status: 'success',
      data: results,
      summary
    });
  } catch (error) {
    console.error('❌ Get nearby all error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get detailed user info for map marker click
// @route   GET /api/map/user/:userId/details
// @access  Private
const getUserDetails = async (req, res) => {
  try {
    const { longitude, latitude } = req.query;

    const user = await User.findById(req.params.userId)
      .select('-password -otp -otpExpire -passwordResetOTP -tempPassword -reportedBy');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if blocked
    if (user.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({
        status: 'error',
        message: 'You have been blocked by this user'
      });
    }

    // Get user's active marketplace items
    const marketplaceItems = await MarketplaceItem.find({
      owner: user._id,
      isActive: true,
      available: true
    })
      .select('type title category displayCategory photos priceType price condition')
      .limit(10);

    // Get user's current check-in
    const currentCheckIn = await CheckIn.findOne({
      user: user._id,
      expiresAt: { $gt: Date.now() }
    })
      .populate('venue', 'name category address')
      .sort('-createdAt');

    // Get venues created by user
    const venuesCreated = await Venue.find({
      createdBy: user._id
    })
      .select('name category address photos ratings')
      .limit(5);

    // Calculate distance if coordinates provided
    let distance = null;
    let distanceFormatted = null;

    if (longitude && latitude && user.currentLocation) {
      const lng = parseFloat(longitude);
      const lat = parseFloat(latitude);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        distance = Math.round(
          calculateDistance([lng, lat], user.currentLocation.coordinates)
        );
        distanceFormatted = formatDistance(distance);
      }
    }

    res.json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          profession: user.profession,
          skills: user.skills,
          interests: user.interests,
          languages: user.languages,
          currentCity: user.currentCity,
          currentCountry: user.currentCountry,
          homeCountry: user.homeCountry,
          isOnline: user.isOnline,
          lastActive: user.lastActive,
          links: user.links,
          currentLocation: user.currentLocation,
          distance,
          distanceFormatted
        },
        marketplaceItems: {
          items: marketplaceItems,
          count: marketplaceItems.length
        },
        currentCheckIn,
        venuesCreated: {
          venues: venuesCreated,
          count: venuesCreated.length
        }
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get detailed venue info for map marker click
// @route   GET /api/map/venue/:venueId/details
// @access  Public
const getVenueDetails = async (req, res) => {
  try {
    const { longitude, latitude } = req.query;

    const venue = await Venue.findById(req.params.venueId)
      .populate('createdBy', 'username displayName avatar');

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Get active check-ins at this venue
    const activeCheckIns = await CheckIn.find({
      venue: venue._id,
      expiresAt: { $gt: Date.now() },
      visibility: { $in: ['public', 'connections'] }
    })
      .populate('user', 'username displayName avatar profession')
      .sort('-createdAt')
      .limit(10);

    // Calculate distance
    let distance = null;
    let distanceFormatted = null;

    if (longitude && latitude && venue.location) {
      const lng = parseFloat(longitude);
      const lat = parseFloat(latitude);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        distance = Math.round(
          calculateDistance([lng, lat], venue.location.coordinates)
        );
        distanceFormatted = formatDistance(distance);
      }
    }

    res.json({
      status: 'success',
      data: {
        venue: {
          ...venue.toObject(),
          distance,
          distanceFormatted
        },
        activeCheckIns: {
          checkIns: activeCheckIns,
          count: activeCheckIns.length
        }
      }
    });
  } catch (error) {
    console.error('Get venue details error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get detailed marketplace item info
// @route   GET /api/map/marketplace/:itemId/details
// @access  Public
const getMarketplaceDetails = async (req, res) => {
  try {
    const { longitude, latitude } = req.query;

    const item = await MarketplaceItem.findById(req.params.itemId)
      .populate('owner', 'username displayName avatar bio profession currentCity isOnline lastActive');

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Marketplace item not found'
      });
    }

    // Calculate distance
    let distance = null;
    let distanceFormatted = null;

    if (longitude && latitude && item.location) {
      const lng = parseFloat(longitude);
      const lat = parseFloat(latitude);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        distance = Math.round(
          calculateDistance([lng, lat], item.location.coordinates)
        );
        distanceFormatted = formatDistance(distance);
      }
    }

    res.json({
      status: 'success',
      data: {
        item: {
          ...item.toObject(),
          distance,
          distanceFormatted
        }
      }
    });
  } catch (error) {
    console.error('Get marketplace details error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get detailed check-in info
// @route   GET /api/map/checkin/:checkinId/details
// @access  Private
const getCheckInDetails = async (req, res) => {
  try {
    const { longitude, latitude } = req.query;

    const checkIn = await CheckIn.findById(req.params.checkinId)
      .populate('user', 'username displayName avatar bio profession skills currentCity')
      .populate('venue', 'name category address photos ratings');

    if (!checkIn) {
      return res.status(404).json({
        status: 'error',
        message: 'Check-in not found or expired'
      });
    }

    // Check visibility
    if (checkIn.visibility === 'private' && 
        (!req.user || checkIn.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'This check-in is private'
      });
    }

    // Calculate distance
    let distance = null;
    let distanceFormatted = null;

    if (longitude && latitude && checkIn.location) {
      const lng = parseFloat(longitude);
      const lat = parseFloat(latitude);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        distance = Math.round(
          calculateDistance([lng, lat], checkIn.location.coordinates)
        );
        distanceFormatted = formatDistance(distance);
      }
    }

    res.json({
      status: 'success',
      data: {
        checkIn: {
          ...checkIn.toObject(),
          distance,
          distanceFormatted
        }
      }
    });
  } catch (error) {
    console.error('Get check-in details error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ======================
// 📤 Exports
// ======================
module.exports = {
  getNearbyAll,
  getUserDetails,
  getVenueDetails,
  getMarketplaceDetails,
  getCheckInDetails
};