// utils/socketEmitters.js

const { getIO, getGeographicRoom } = require('../config/socket');
const { calculateDistance } = require('./geoUtils');

// ======================
// 📍 CHECK-IN EVENTS
// ======================

/**
 * Emit new check-in to nearby users
 */
const emitNewCheckIn = (checkIn, radius = 5000) => {
  try {
    const io = getIO();
    const [longitude, latitude] = checkIn.location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    console.log(`📍 Emitting new check-in to room: ${room}`);

    io.to(room).emit('map:checkin-created', {
      type: 'checkin',
      data: {
        _id: checkIn._id,
        user: {
          _id: checkIn.user._id,
          username: checkIn.user.username,
          displayName: checkIn.user.displayName,
          avatar: checkIn.user.avatar,
          profession: checkIn.user.profession
        },
        venue: checkIn.venue,
        location: checkIn.location,
        note: checkIn.note,
        visibility: checkIn.visibility,
        createdAt: checkIn.createdAt,
        expiresAt: checkIn.expiresAt
      }
    });
  } catch (error) {
    console.error('Emit new check-in error:', error.message);
  }
};

/**
 * Emit check-in update
 */
const emitCheckInUpdate = (checkIn) => {
  try {
    const io = getIO();
    const [longitude, latitude] = checkIn.location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    io.to(room).emit('map:checkin-updated', {
      type: 'checkin',
      data: {
        _id: checkIn._id,
        note: checkIn.note,
        visibility: checkIn.visibility
      }
    });
  } catch (error) {
    console.error('Emit check-in update error:', error.message);
  }
};

/**
 * Emit check-in deletion
 */
const emitCheckInDelete = (checkInId, location) => {
  try {
    const io = getIO();
    const [longitude, latitude] = location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    io.to(room).emit('map:checkin-deleted', {
      type: 'checkin',
      checkInId
    });
  } catch (error) {
    console.error('Emit check-in delete error:', error.message);
  }
};

/**
 * Emit check-in expiration
 */
const emitCheckInExpired = (checkInId, location) => {
  try {
    const io = getIO();
    const [longitude, latitude] = location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    console.log(`⏰ Check-in ${checkInId} expired`);

    io.to(room).emit('map:checkin-expired', {
      type: 'checkin',
      checkInId
    });
  } catch (error) {
    console.error('Emit check-in expired error:', error.message);
  }
};

// ======================
// 🏢 VENUE EVENTS
// ======================

/**
 * Emit new venue creation
 */
const emitNewVenue = (venue) => {
  try {
    const io = getIO();
    const [longitude, latitude] = venue.location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    console.log(`🏢 Emitting new venue to room: ${room}`);

    io.to(room).emit('map:venue-created', {
      type: 'venue',
      data: {
        _id: venue._id,
        name: venue.name,
        category: venue.category,
        location: venue.location,
        address: venue.address,
        photos: venue.photos,
        ratings: venue.ratings,
        amenities: venue.amenities,
        createdBy: venue.createdBy
      }
    });
  } catch (error) {
    console.error('Emit new venue error:', error.message);
  }
};

/**
 * Emit venue update
 */
const emitVenueUpdate = (venue) => {
  try {
    const io = getIO();
    const [longitude, latitude] = venue.location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    io.to(room).emit('map:venue-updated', {
      type: 'venue',
      data: venue
    });
  } catch (error) {
    console.error('Emit venue update error:', error.message);
  }
};

/**
 * Emit venue deletion
 */
const emitVenueDelete = (venueId, location) => {
  try {
    const io = getIO();
    const [longitude, latitude] = location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    io.to(room).emit('map:venue-deleted', {
      type: 'venue',
      venueId
    });
  } catch (error) {
    console.error('Emit venue delete error:', error.message);
  }
};

// ======================
// 🛍️ MARKETPLACE EVENTS
// ======================

/**
 * Emit new marketplace item
 */
const emitNewMarketplaceItem = (item) => {
  try {
    const io = getIO();
    
    if (!item.location || !item.location.coordinates) {
      console.warn('⚠️ Marketplace item has no location, skipping socket emit');
      return;
    }

    const [longitude, latitude] = item.location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    console.log(`🛍️ Emitting new marketplace item to room: ${room}`);

    io.to(room).emit('map:marketplace-created', {
      type: 'marketplace',
      data: {
        _id: item._id,
        type: item.type,
        title: item.title,
        category: item.category,
        displayCategory: item.displayCategory,
        photos: item.photos,
        priceType: item.priceType,
        price: item.price,
        condition: item.condition,
        location: item.location,
        owner: {
          _id: item.owner._id,
          username: item.owner.username,
          displayName: item.owner.displayName,
          avatar: item.owner.avatar
        }
      }
    });
  } catch (error) {
    console.error('Emit new marketplace item error:', error.message);
  }
};

/**
 * Emit marketplace item update
 */
const emitMarketplaceUpdate = (item) => {
  try {
    const io = getIO();
    
    if (!item.location || !item.location.coordinates) return;

    const [longitude, latitude] = item.location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    io.to(room).emit('map:marketplace-updated', {
      type: 'marketplace',
      data: item
    });
  } catch (error) {
    console.error('Emit marketplace update error:', error.message);
  }
};

/**
 * Emit marketplace item deletion
 */
const emitMarketplaceDelete = (itemId, location) => {
  try {
    const io = getIO();
    
    if (!location || !location.coordinates) return;

    const [longitude, latitude] = location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    io.to(room).emit('map:marketplace-deleted', {
      type: 'marketplace',
      itemId
    });
  } catch (error) {
    console.error('Emit marketplace delete error:', error.message);
  }
};

/**
 * Emit marketplace item status change (available/unavailable)
 */
const emitMarketplaceStatusChange = (itemId, available, location) => {
  try {
    const io = getIO();
    
    if (!location || !location.coordinates) return;

    const [longitude, latitude] = location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    io.to(room).emit('map:marketplace-status-changed', {
      type: 'marketplace',
      itemId,
      available
    });
  } catch (error) {
    console.error('Emit marketplace status change error:', error.message);
  }
};

// ======================
// 👤 USER EVENTS
// ======================

/**
 * Emit user online status
 */
const emitUserOnline = (userId, location) => {
  try {
    const io = getIO();
    
    if (!location || !location.coordinates) return;

    const [longitude, latitude] = location.coordinates;
    const room = getGeographicRoom(longitude, latitude);

    io.to(room).emit('map:user-online', {
      type: 'user',
      userId
    });
  } catch (error) {
    console.error('Emit user online error:', error.message);
  }
};

/**
 * Emit user offline status
 */
const emitUserOffline = (userId) => {
  try {
    const io = getIO();

    // Broadcast to all rooms (or maintain user's last known location)
    io.emit('map:user-offline', {
      type: 'user',
      userId
    });
  } catch (error) {
    console.error('Emit user offline error:', error.message);
  }
};

// ======================
// 📤 Exports
// ======================
module.exports = {
  // Check-in events
  emitNewCheckIn,
  emitCheckInUpdate,
  emitCheckInDelete,
  emitCheckInExpired,

  // Venue events
  emitNewVenue,
  emitVenueUpdate,
  emitVenueDelete,

  // Marketplace events
  emitNewMarketplaceItem,
  emitMarketplaceUpdate,
  emitMarketplaceDelete,
  emitMarketplaceStatusChange,

  // User events
  emitUserOnline,
  emitUserOffline
};