const MarketplaceItem = require('../models/MarketplaceItem');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/imageUpload');
const { sendMarketplaceRequestEmail } = require('../utils/emailService');

// @desc    Create new marketplace listing
// @route   POST /api/marketplace
// @access  Private
// @desc    Create new marketplace listing
// @route   POST /api/marketplace
// @access  Private
exports.createListing = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      category,
      otherCategoryName,  // ✅ Already extracted
      condition,
      priceType,
      price,
      availableFrom,
      availableUntil,
      deliveryOptions
    } = req.body;

    // Validate required fields
    if (!type || !title || !description || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide type, title, description, and category'
      });
    }

    // ✅ Validate otherCategoryName when category is 'other'
    if (category === 'other' && !otherCategoryName) {
      return res.status(400).json({
        status: 'error',
        message: 'Please specify category name when selecting "other"'
      });
    }

    // Validate type-specific requirements
    if (type === 'item' && !condition) {
      return res.status(400).json({
        status: 'error',
        message: 'Condition is required for item listings'
      });
    }

    // Handle photo uploads
    const photos = [];
    if (req.files && req.files.length > 0) {
      console.log(`📸 Uploading ${req.files.length} photos for listing...`);
      
      for (const file of req.files) {
        try {
          const publicId = `marketplace_${req.user._id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const result = await uploadToCloudinary(
            file.buffer,
            'nomadnet/marketplace',
            publicId
          );
          photos.push(result.secure_url);
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          // Continue with other photos
        }
      }
    }

    // Get user's location for the listing
    const user = await User.findById(req.user._id);
    
    const listingData = {
      owner: req.user._id,
      type,
      title,
      description,
      category,
      photos,
      priceType: priceType || 'free',
      deliveryOptions: deliveryOptions || ['pickup']
    };

    // ✅ ADD THIS - Include otherCategoryName when category is 'other'
    if (category === 'other' && otherCategoryName) {
      listingData.otherCategoryName = otherCategoryName;
    }

    // Add optional fields
    if (condition) listingData.condition = condition;
    if (price) listingData.price = price;
    if (availableFrom) listingData.availableFrom = availableFrom;
    if (availableUntil) listingData.availableUntil = availableUntil;
    
    // Add location from user profile
    if (user.currentLocation) {
      listingData.location = user.currentLocation;
    }

    const listing = await MarketplaceItem.create(listingData);

    // Populate owner details
    await listing.populate('owner', 'username displayName avatar currentCity');

    res.status(201).json({
      status: 'success',
      message: 'Listing created successfully',
      data: { listing }
    });
  } catch (error) {
    console.error('Create listing error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all marketplace listings with filters
// @route   GET /api/marketplace
// @access  Public
exports.getAllListings = async (req, res) => {
  try {
    const {
      type,
      category,
      priceType,
      search,
      sort,
      page = 1,
      limit = 20,
      latitude,
      longitude,
      radius = 50000 // 50km default
    } = req.query;

    // Build query
    const query = {
      isActive: true,
      available: true
    };

    if (type) query.type = type;
    if (category) query.category = category;
    if (priceType) query.priceType = priceType;

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Geospatial search
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const maxDistance = parseInt(radius);

      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      };
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'views') sortOption = { views: -1 };
    if (sort === 'price-low') sortOption = { 'price.amount': 1 };
    if (sort === 'price-high') sortOption = { 'price.amount': -1 };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await MarketplaceItem.find(query)
      .populate('owner', 'username displayName avatar currentCity isOnline')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await MarketplaceItem.countDocuments(query);

    res.json({
      status: 'success',
      results: listings.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      data: { listings }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single listing by ID
// @route   GET /api/marketplace/:id
// @access  Public
exports.getListingById = async (req, res) => {
  try {
    const listing = await MarketplaceItem.findById(req.params.id)
      .populate('owner', 'username displayName avatar bio profession currentCity isOnline lastActive')
      .populate('requests.user', 'username displayName avatar');

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    // Increment view count (only if not the owner)
    if (!req.user || listing.owner._id.toString() !== req.user._id.toString()) {
      listing.views += 1;
      await listing.save();
    }

    res.json({
      status: 'success',
      data: { listing }
    });
  } catch (error) {
    console.error('Get listing error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's own listings
// @route   GET /api/marketplace/my/listings
// @access  Private
exports.getMyListings = async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const query = { owner: req.user._id };
    
    if (status === 'active') {
      query.isActive = true;
      query.available = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'unavailable') {
      query.available = false;
    }

    const listings = await MarketplaceItem.find(query)
      .sort({ createdAt: -1 })
      .populate('requests.user', 'username displayName avatar');

    res.json({
      status: 'success',
      results: listings.length,
      data: { listings }
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get listings by user ID
// @route   GET /api/marketplace/user/:userId
// @access  Public
exports.getListingsByUser = async (req, res) => {
  try {
    const listings = await MarketplaceItem.find({
      owner: req.params.userId,
      isActive: true,
      available: true
    })
    .populate('owner', 'username displayName avatar currentCity')
    .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      results: listings.length,
      data: { listings }
    });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update listing
// @route   PUT /api/marketplace/:id
// @access  Private (owner only)
exports.updateListing = async (req, res) => {
  try {
    const listing = await MarketplaceItem.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own listings'
      });
    }

    // Fields that can be updated
    const allowedUpdates = [
      'title',
      'description',
      'condition',
      'available',
      'availableFrom',
      'availableUntil',
      'priceType',
      'price',
      'deliveryOptions',
      'otherCategoryName'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (req.body.category === 'other' && !req.body.otherCategoryName && !listing.otherCategoryName) {
      return res.status(400).json({
        status: 'error',
        message: 'Please specify category name when selecting "other"'
      });
    }

    // Handle new photo uploads
    if (req.files && req.files.length > 0) {
      const newPhotos = [];
      
      for (const file of req.files) {
        try {
          const publicId = `marketplace_${req.user._id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const result = await uploadToCloudinary(
            file.buffer,
            'nomadnet/marketplace',
            publicId
          );
          newPhotos.push(result.secure_url);
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
        }
      }

      if (newPhotos.length > 0) {
        updates.photos = [...listing.photos, ...newPhotos];
      }
    }

    const updatedListing = await MarketplaceItem.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'username displayName avatar currentCity');

    res.json({
      status: 'success',
      message: 'Listing updated successfully',
      data: { listing: updatedListing }
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete photo from listing
// @route   DELETE /api/marketplace/:id/photos
// @access  Private (owner only)
exports.deletePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide photo URL to delete'
      });
    }

    const listing = await MarketplaceItem.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete photos from your own listings'
      });
    }

    // Remove from array
    listing.photos = listing.photos.filter(photo => photo !== photoUrl);
    await listing.save();

    // Delete from Cloudinary
    const publicId = extractPublicId(photoUrl);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (err) {
        console.error('Cloudinary deletion error:', err);
      }
    }

    res.json({
      status: 'success',
      message: 'Photo deleted successfully',
      data: { photos: listing.photos }
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete listing
// @route   DELETE /api/marketplace/:id
// @access  Private (owner only)
exports.deleteListing = async (req, res) => {
  try {
    const listing = await MarketplaceItem.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own listings'
      });
    }

    // Delete all photos from Cloudinary
    if (listing.photos && listing.photos.length > 0) {
      for (const photoUrl of listing.photos) {
        const publicId = extractPublicId(photoUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
          } catch (err) {
            console.error('Error deleting photo:', err);
          }
        }
      }
    }

    await MarketplaceItem.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Request item/service (with email notification)
// @route   POST /api/marketplace/:id/request
// @access  Private
exports.requestItem = async (req, res) => {
  try {
    const { message } = req.body;

    const listing = await MarketplaceItem.findById(req.params.id)
      .populate('owner', 'username email displayName');

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    if (!listing.available) {
      return res.status(400).json({
        status: 'error',
        message: 'This listing is no longer available'
      });
    }

    // Check if user is the owner
    if (listing.owner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot request your own listing'
      });
    }

    // Check if already requested
    const existingRequest = listing.requests.find(
      req => req.user.toString() === req.user._id.toString()
    );

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already requested this listing'
      });
    }

    // Add request
    listing.requests.push({
      user: req.user._id,
      message: message || '',
      status: 'pending'
    });

    await listing.save();

    // ✅ Send email notification to listing owner
    try {
      await sendMarketplaceRequestEmail(
        listing.owner.email,
        listing.owner.username,
        req.user.username,
        req.user.displayName,
        listing.title,
        listing.type,
        message || 'No message provided',
        listing._id
      );
      console.log(`✅ Request notification sent to: ${listing.owner.email}`);
    } catch (emailError) {
      console.error('Failed to send request email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      status: 'success',
      message: 'Request sent successfully. The owner will be notified via email.'
    });
  } catch (error) {
    console.error('Request item error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update request status
// @route   PATCH /api/marketplace/:id/request/:requestId
// @access  Private (owner only)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be: accepted, declined, or completed'
      });
    }

    const listing = await MarketplaceItem.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the listing owner can update request status'
      });
    }

    // Find and update request
    const request = listing.requests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    request.status = status;

    // If completed, mark listing as unavailable
    if (status === 'completed') {
      listing.available = false;
    }

    await listing.save();

    res.json({
      status: 'success',
      message: `Request ${status} successfully`,
      data: { request }
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's requests (items they requested from others)
// @route   GET /api/marketplace/my/requests
// @access  Private
exports.getMyRequests = async (req, res) => {
  try {
    const listings = await MarketplaceItem.find({
      'requests.user': req.user._id
    })
    .populate('owner', 'username displayName avatar currentCity')
    .sort({ 'requests.createdAt': -1 });

    // Filter to only show user's own requests
    const myRequests = listings.map(listing => {
      const userRequest = listing.requests.find(
        req => req.user.toString() === req.user._id.toString()
      );

      return {
        listing: {
          _id: listing._id,
          title: listing.title,
          type: listing.type,
          category: listing.category,
          photos: listing.photos,
          owner: listing.owner
        },
        request: userRequest
      };
    });

    res.json({
      status: 'success',
      results: myRequests.length,
      data: { requests: myRequests }
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get nearby marketplace listings
// @route   GET /api/marketplace/nearby
// @access  Public
exports.getNearbyListings = async (req, res) => {
  try {
    const { longitude, latitude, radius = 50000, type, category } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide longitude and latitude'
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDistance = parseInt(radius);

    const query = {
      isActive: true,
      available: true,
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

    if (type) query.type = type;
    if (category) query.category = category;

    const listings = await MarketplaceItem.find(query)
      .populate('owner', 'username displayName avatar currentCity isOnline')
      .limit(50);

    res.json({
      status: 'success',
      results: listings.length,
      data: { listings }
    });
  } catch (error) {
    console.error('Get nearby listings error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = exports;