// middleware/messageMiddleware.js
const MarketplaceItem = require('../models/MarketplaceItem');
const CheckIn = require('../models/CheckIn');
const Venue = require('../models/Venue');

/**
 * Validate that user owns the marketplace item they're sharing
 */
exports.validateMarketplaceOwnership = async (req, res, next) => {
  try {
    const { marketplaceItemId } = req.body;
    
    if (!marketplaceItemId) {
      return res.status(400).json({
        success: false,
        message: 'Marketplace item ID is required'
      });
    }

    const item = await MarketplaceItem.findById(marketplaceItemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Marketplace item not found'
      });
    }

    // Check if item is active and available
    if (!item.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This item is no longer active'
      });
    }

    if (!item.available) {
      return res.status(400).json({
        success: false,
        message: 'This item is no longer available'
      });
    }

    // Check ownership - user must own the item to offer it
    if (item.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only share/offer items that you own'
      });
    }

    // Attach item to request for use in controller
    req.marketplaceItem = item;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating marketplace item',
      error: error.message
    });
  }
};

/**
 * Validate that user owns the check-in they're sharing
 */
exports.validateCheckInOwnership = async (req, res, next) => {
  try {
    const { checkInId } = req.body;
    
    // If sharing an existing check-in
    if (checkInId) {
      const checkIn = await CheckIn.findById(checkInId).populate('venue');
      
      if (!checkIn) {
        return res.status(404).json({
          success: false,
          message: 'Check-in not found'
        });
      }

      // Check ownership
      if (checkIn.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only share your own check-ins'
        });
      }

      // Check if check-in has expired
      if (checkIn.expiresAt && new Date(checkIn.expiresAt) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'This check-in has expired'
        });
      }

      req.checkIn = checkIn;
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating check-in',
      error: error.message
    });
  }
};

/**
 * Validate location coordinates
 */
exports.validateCoordinates = (req, res, next) => {
  try {
    const { coordinates, location } = req.body;
    
    // Get coordinates from either direct field or nested location object
    const coords = coordinates || location?.coordinates;
    
    if (!coords) {
      // Coordinates might not be required for all cases
      return next();
    }

    // Validate array format
    if (!Array.isArray(coords) || coords.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be an array of [longitude, latitude]'
      });
    }

    const [longitude, latitude] = coords;

    // Validate types
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be numbers'
      });
    }

    // Validate ranges
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    // Attach validated coordinates to request
    req.validatedCoordinates = coords;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating coordinates',
      error: error.message
    });
  }
};

/**
 * Validate message type and required fields
 */
exports.validateMessageType = (req, res, next) => {
  try {
    const { messageType } = req.body;
    
    const validTypes = ['text', 'image', 'location', 'marketplace_item', 'marketplace_offer', 'checkin'];
    
    if (messageType && !validTypes.includes(messageType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid message type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Type-specific validation
    switch (messageType) {
      case 'image':
        if (!req.body.imageUrl && (!req.body.attachments || req.body.attachments.length === 0)) {
          return res.status(400).json({
            success: false,
            message: 'Image URL or attachments required for image messages'
          });
        }
        break;

      case 'location':
        if (!req.body.coordinates && !req.body.location?.coordinates) {
          return res.status(400).json({
            success: false,
            message: 'Coordinates are required for location messages'
          });
        }
        break;

      case 'marketplace_item':
      case 'marketplace_offer':
        if (!req.body.marketplaceItemId) {
          return res.status(400).json({
            success: false,
            message: 'Marketplace item ID is required'
          });
        }
        break;

      case 'checkin':
        if (!req.body.checkInId && !req.body.coordinates) {
          return res.status(400).json({
            success: false,
            message: 'Check-in ID or coordinates are required for check-in messages'
          });
        }
        break;

      case 'text':
      default:
        if (!req.body.content || req.body.content.trim() === '') {
          // Allow empty content if there are attachments
          if (!req.body.attachments || req.body.attachments.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'Message content is required for text messages'
            });
          }
        }
        break;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating message type',
      error: error.message
    });
  }
};

/**
 * Validate venue exists (optional middleware)
 */
exports.validateVenue = async (req, res, next) => {
  try {
    const { venueId } = req.body;
    
    if (!venueId) {
      return next();
    }

    const venue = await Venue.findById(venueId);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    req.venue = venue;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating venue',
      error: error.message
    });
  }
};

/**
 * Check if user can respond to offer (must be item owner, not sender)
 */
exports.canRespondToOffer = async (req, res, next) => {
  try {
    const Message = require('../models/Message');
    const message = await Message.findById(req.params.id)
      .populate('marketplaceItem.item');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Must be a marketplace offer
    if (message.type !== 'marketplace_offer' && !message.marketplaceItem?.isOffer) {
      return res.status(400).json({
        success: false,
        message: 'This message is not a marketplace offer'
      });
    }

    // Must be the receiver (item owner) to respond
    if (message.receiver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the item owner can respond to offers'
      });
    }

    // Check if already responded
    if (message.marketplaceItem.offerStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This offer has already been ${message.marketplaceItem.offerStatus}`
      });
    }

    req.offerMessage = message;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating offer response',
      error: error.message
    });
  }
};

/**
 * Check if user can respond to invitation
 */
exports.canRespondToInvitation = async (req, res, next) => {
  try {
    const Message = require('../models/Message');
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Must be a check-in invitation
    if (message.type !== 'checkin' || !message.sharedCheckIn?.isInvitation) {
      return res.status(400).json({
        success: false,
        message: 'This message is not a check-in invitation'
      });
    }

    // Must be the receiver to respond
    if (message.receiver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the receiver can respond to invitations'
      });
    }

    // Check if already responded
    if (message.sharedCheckIn.invitationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${message.sharedCheckIn.invitationStatus}`
      });
    }

    req.invitationMessage = message;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating invitation response',
      error: error.message
    });
  }
};