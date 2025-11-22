const Venue = require('../models/Venue');
const CheckIn = require('../models/CheckIn');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/imageUpload');

// ======================
// 📍 VENUE MANAGEMENT
// ======================

// @desc    Create a new venue
// @route   POST /api/venues
// @access  Private
exports.createVenue = async (req, res) => {
  try {
    console.log('\n🏢 ============ CREATE VENUE ============');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.length : 0);

    // ✅ FIX: Parse JSON strings when using multipart/form-data
    let venueData = { ...req.body };

    // Parse address if it's a JSON string
    if (typeof venueData.address === 'string') {
      try {
        venueData.address = JSON.parse(venueData.address);
        console.log('✅ Parsed address:', venueData.address);
      } catch (e) {
        console.log('⚠️ Could not parse address, using as-is');
      }
    }

    // Parse contact if it's a JSON string
    if (typeof venueData.contact === 'string') {
      try {
        venueData.contact = JSON.parse(venueData.contact);
        console.log('✅ Parsed contact:', venueData.contact);
      } catch (e) {
        console.log('⚠️ Could not parse contact, using as-is');
      }
    }

    // Parse amenities if it's a JSON string
    if (typeof venueData.amenities === 'string') {
      try {
        venueData.amenities = JSON.parse(venueData.amenities);
        console.log('✅ Parsed amenities:', venueData.amenities);
      } catch (e) {
        console.log('⚠️ Could not parse amenities, using as-is');
      }
    }

    // Parse hours if it's a JSON string
    if (typeof venueData.hours === 'string') {
      try {
        venueData.hours = JSON.parse(venueData.hours);
        console.log('✅ Parsed hours:', venueData.hours);
      } catch (e) {
        console.log('⚠️ Could not parse hours, using as-is');
      }
    }

    const {
      name,
      category,
      longitude,
      latitude,
      address,
      contact,
      amenities,
      hours
    } = venueData;

    // Validate required fields
    if (!name || !category || !longitude || !latitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, category, longitude, and latitude'
      });
    }

    // Validate coordinates
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates'
      });
    }

    // Check if venue already exists at this location (within 50 meters)
    const existingVenue = await Venue.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: 50 // 50 meters
        }
      }
    });

    if (existingVenue) {
      return res.status(400).json({
        status: 'error',
        message: 'A venue already exists at this location',
        data: { existingVenue }
      });
    }

    // ✅ Handle photo uploads (optional)
    const photos = [];
    if (req.files && req.files.length > 0) {
      console.log(`📸 Uploading ${req.files.length} photo(s) to Cloudinary...`);
      
      for (const file of req.files) {
        try {
          const publicId = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const result = await uploadToCloudinary(
            file.buffer,
            'nomadnet/venues',
            publicId
          );
          
          photos.push({
            url: result.secure_url,
            uploadedBy: req.user._id
          });
          
          console.log('✅ Photo uploaded:', result.secure_url);
        } catch (uploadError) {
          console.error('❌ Photo upload failed:', uploadError.message);
          // Continue with venue creation even if photo upload fails
        }
      }
    }

    // Create venue
    const venue = await Venue.create({
      name,
      category,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      address,
      contact,
      amenities,
      hours,
      photos,
      createdBy: req.user._id,
      source: 'user_submitted'
    });

    console.log('✅ Venue created:', venue._id);
    console.log('='.repeat(50) + '\n');

    res.status(201).json({
      status: 'success',
      message: 'Venue created successfully',
      data: { venue }
    });
  } catch (error) {
    console.error('❌ Create venue error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get venue by ID
// @route   GET /api/venues/:id
// @access  Public
exports.getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate('createdBy', 'username displayName avatar');

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Get recent check-ins at this venue
    const recentCheckIns = await CheckIn.find({
      venue: venue._id,
      visibility: { $in: ['public', 'connections'] }
    })
      .populate('user', 'username displayName avatar profession')
      .sort('-createdAt')
      .limit(10);

    res.json({
      status: 'success',
      data: {
        venue,
        recentCheckIns,
        totalCheckIns: recentCheckIns.length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all venues (with filters)
// @route   GET /api/venues
// @access  Public
exports.getAllVenues = async (req, res) => {
  try {
    const {
      category,
      search,
      amenities,
      minRating,
      limit = 50,
      page = 1
    } = req.query;

    // Build query
    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (amenities) {
      const amenitiesArray = amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }

    if (minRating) {
      query['ratings.overall'] = { $gte: parseFloat(minRating) };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const venues = await Venue.find(query)
      .populate('createdBy', 'username displayName avatar')
      .sort('-ratings.overall -createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Venue.countDocuments(query);

    res.json({
      status: 'success',
      results: venues.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: { venues }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get nearby venues (geospatial search)
// @route   GET /api/venues/nearby/search
// @access  Public
exports.getNearbyVenues = async (req, res) => {
  try {
    const {
      longitude,
      latitude,
      radius = 5000, // 5km default
      category,
      amenities,
      minRating,
      limit = 50
    } = req.query;

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

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      }
    };

    if (category) {
      query.category = category;
    }

    if (amenities) {
      query.amenities = { $all: amenities.split(',') };
    }

    if (minRating) {
      query['ratings.overall'] = { $gte: parseFloat(minRating) };
    }

    const venues = await Venue.find(query)
      .populate('createdBy', 'username displayName avatar')
      .limit(parseInt(limit));

    // Calculate distance for each venue
    const venuesWithDistance = venues.map(venue => {
      const distance = calculateDistance(
        [lng, lat],
        venue.location.coordinates
      );

      return {
        ...venue.toObject(),
        distance: Math.round(distance) // in meters
      };
    });

    res.json({
      status: 'success',
      results: venuesWithDistance.length,
      data: { venues: venuesWithDistance }
    });
  } catch (error) {
    console.error('Get nearby venues error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update venue
// @route   PUT /api/venues/:id
// @access  Private (creator or admin)
exports.updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Check ownership
    if (venue.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update venues you created'
      });
    }

    // Fields that can be updated
    const allowedUpdates = [
      'name',
      'category',
      'address',
      'contact',
      'amenities',
      'hours'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedVenue = await Venue.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username displayName avatar');

    res.json({
      status: 'success',
      message: 'Venue updated successfully',
      data: { venue: updatedVenue }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete venue
// @route   DELETE /api/venues/:id
// @access  Private (creator or admin)
exports.deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Check ownership
    if (venue.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete venues you created'
      });
    }

    // Delete photos from Cloudinary
    if (venue.photos && venue.photos.length > 0) {
      for (const photo of venue.photos) {
        const publicId = extractPublicId(photo.url);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (err) {
            console.error('Error deleting photo:', err);
          }
        }
      }
    }

    // Delete all check-ins at this venue
    await CheckIn.deleteMany({ venue: venue._id });

    await Venue.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Venue and associated check-ins deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add photo to venue
// @route   POST /api/venues/:id/photos
// @access  Private
exports.addVenuePhoto = async (req, res) => {
  try {
    console.log('\n📸 ============ ADD VENUE PHOTO ============');
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file'
      });
    }

    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Upload to Cloudinary
    const publicId = `venue_${venue._id}_${Date.now()}`;
    console.log('☁️  Uploading to Cloudinary...');

    const result = await uploadToCloudinary(
      req.file.buffer,
      'nomadnet/venues',
      publicId
    );

    console.log('✅ Upload successful:', result.secure_url);

    // Add photo to venue
    venue.photos.push({
      url: result.secure_url,
      uploadedBy: req.user._id
    });

    await venue.save();

    res.json({
      status: 'success',
      message: 'Photo added successfully',
      data: {
        photo: {
          url: result.secure_url,
          uploadedBy: req.user._id
        }
      }
    });
  } catch (error) {
    console.error('Add venue photo error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get venue categories
// @route   GET /api/venues/categories/list
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'cafe', label: 'Cafe', icon: '☕' },
      { value: 'coworking', label: 'Coworking Space', icon: '💼' },
      { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
      { value: 'bar', label: 'Bar', icon: '🍺' },
      { value: 'park', label: 'Park', icon: '🌳' },
      { value: 'library', label: 'Library', icon: '📚' },
      { value: 'hotel', label: 'Hotel', icon: '🏨' },
      { value: 'other', label: 'Other', icon: '📍' }
    ];

    // Get count for each category
    const categoryCounts = await Venue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoriesWithCount = categories.map(cat => {
      const countData = categoryCounts.find(c => c._id === cat.value);
      return {
        ...cat,
        count: countData ? countData.count : 0
      };
    });

    res.json({
      status: 'success',
      data: { categories: categoriesWithCount }
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

  return R * c; // Distance in meters
}