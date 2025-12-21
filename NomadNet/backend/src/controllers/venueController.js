// src/controllers/venueController.js

const Venue = require('../models/Venue');
const CheckIn = require('../models/CheckIn');
const { fetchOSMPlaces } = require('../utils/osmService');

// ======================
// 🗺️ Helper: Map OSM tags → our category
// ======================

function mapOSMTagsToCategory(tags = {}) {
  const amenity = (tags.amenity || '').toLowerCase();
  const office = (tags.office || '').toLowerCase();
  const leisure = (tags.leisure || '').toLowerCase();
  const tourism = (tags.tourism || '').toLowerCase();

  if (amenity === 'cafe') return 'cafe';
  if (office === 'coworking') return 'coworking';
  if (amenity === 'restaurant') return 'restaurant';
  if (amenity === 'bar' || amenity === 'pub') return 'bar';
  if (leisure === 'park') return 'park';
  if (amenity === 'library') return 'library';
  if (tourism === 'hotel') return 'hotel';

  return 'other';
}

// ======================
// 📍 Get venue by ID
// ======================

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
    console.error('Get venue by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ======================
// 📋 Get all venues (with filters)
// ======================

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
    const numericLimit = parseInt(limit);
    const numericPage = parseInt(page);
    const skip = (numericPage - 1) * numericLimit;

    const venues = await Venue.find(query)
      .populate('createdBy', 'username displayName avatar')
      .sort('-ratings.overall -createdAt')
      .limit(numericLimit)
      .skip(skip);

    const total = await Venue.countDocuments(query);

    res.json({
      status: 'success',
      results: venues.length,
      total,
      page: numericPage,
      totalPages: Math.ceil(total / numericLimit),
      data: { venues }
    });
  } catch (error) {
    console.error('Get all venues error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ======================
// 📍 Get nearby venues (with OSM auto-import)
// ======================

// @desc    Get nearby venues (geospatial search, auto-import from OSM if empty)
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

    // Base Mongo query
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

    const numericLimit = parseInt(limit);

    // 1️⃣ Try local DB first
    let venues = await Venue.find(query)
      .populate('createdBy', 'username displayName avatar')
      .limit(numericLimit);

    // 2️⃣ If no local venues, import from OSM via Overpass, then re-query
    if (venues.length === 0) {
      try {
        console.log('\n🌐 No local venues found, importing from OSM (Overpass)...');

        const osmElements = await fetchOSMPlaces({
          latitude: lat,
          longitude: lng,
          radius: maxDistance,
          category
        });

        console.log(`   Overpass returned ${osmElements.length} elements`);

        for (const el of osmElements) {
          if (!el.tags) continue;
          const tags = el.tags;

          const elLat = el.lat || (el.center && el.center.lat);
          const elLon = el.lon || (el.center && el.center.lon);

          if (typeof elLat !== 'number' || typeof elLon !== 'number') {
            continue;
          }

          const mappedCategory = category || mapOSMTagsToCategory(tags);

          const name = tags.name || 'Unnamed place';

          const address = {
            street: tags['addr:street'] || '',
            city: tags['addr:city'] || '',
            country: tags['addr:country'] || '',
            postalCode: tags['addr:postcode'] || '',
            formatted:
              tags['addr:full'] ||
              `${tags['addr:street'] || ''}, ${tags['addr:city'] || ''}, ${
                tags['addr:country'] || ''
              }`.replace(/^, |, ,|, $/g, '')
          };

          const doc = {
            name,
            category: mappedCategory,
            location: {
              type: 'Point',
              coordinates: [elLon, elLat]
            },
            address,
            // Ratings: OSM doesn't provide, keep defaults
            source: 'osm_overpass',
            externalId: String(el.id)
          };

          // Upsert by externalId+source to avoid duplicates
          await Venue.findOneAndUpdate(
            { externalId: String(el.id), source: 'osm_overpass' },
            { $set: doc },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }

        // Re-run the DB query after import
        venues = await Venue.find(query)
          .populate('createdBy', 'username displayName avatar')
          .limit(numericLimit);
      } catch (externalError) {
        console.error('❌ Error importing from OSM:', externalError);
        // Fall through; respond with whatever we have (likely 0)
      }
    }

    // Add distance field
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

// ======================
// 🏷️ Get categories
// ======================

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
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// ======================
// 🛠️ Helper: distance
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