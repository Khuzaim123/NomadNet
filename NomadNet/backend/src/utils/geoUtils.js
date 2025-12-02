// utils/geoUtils.js

/**
 * 🌍 Geospatial Utility Functions
 * Handles distance calculations, radius filtering, and clustering
 */

// ======================
// 📏 Distance Calculation (Haversine Formula)
// ======================
const calculateDistance = (coords1, coords2) => {
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
};

// ======================
// 📍 Format Coordinates
// ======================
const formatCoordinates = (location) => {
  if (!location || !location.coordinates) return null;
  
  const [lng, lat] = location.coordinates;
  return {
    longitude: lng,
    latitude: lat,
    coordinates: [lng, lat]
  };
};

// ======================
// 🎯 Build Geospatial Query
// ======================
const buildNearbyQuery = (longitude, latitude, radius = 300) => {
  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);
  const maxDistance = parseInt(radius);

  if (isNaN(lng) || isNaN(lat) || isNaN(maxDistance)) {
    throw new Error('Invalid coordinates or radius');
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw new Error('Coordinates out of range');
  }

  return {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      $maxDistance: maxDistance
    }
  };
};

// ======================
// 📊 Cluster Nearby Points
// ======================
const clusterPoints = (points, clusterRadius = 100) => {
  const clusters = [];
  const processed = new Set();

  points.forEach((point, index) => {
    if (processed.has(index)) return;

    const cluster = {
      center: point.location.coordinates,
      items: [point],
      count: 1
    };

    // Find nearby points to cluster
    points.forEach((otherPoint, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;

      const distance = calculateDistance(
        point.location.coordinates,
        otherPoint.location.coordinates
      );

      if (distance <= clusterRadius) {
        cluster.items.push(otherPoint);
        cluster.count++;
        processed.add(otherIndex);
      }
    });

    processed.add(index);
    clusters.push(cluster);
  });

  return clusters;
};

// ======================
// 🔍 Validate Location Data
// ======================
const validateLocation = (location) => {
  if (!location) return false;
  if (!location.coordinates || !Array.isArray(location.coordinates)) return false;
  if (location.coordinates.length !== 2) return false;
  
  const [lng, lat] = location.coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
  
  return true;
};

// ======================
// 📏 Format Distance for Display
// ======================
const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

// ======================
// 🌐 Get Bounding Box
// ======================
const getBoundingBox = (longitude, latitude, radiusInMeters) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const radius = parseFloat(radiusInMeters);

  // Earth's radius in meters
  const R = 6371000;

  // Convert radius to angular distance
  const latDelta = (radius / R) * (180 / Math.PI);
  const lngDelta = (radius / R) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
};

// ======================
// 📤 Exports
// ======================
module.exports = {
  calculateDistance,
  formatCoordinates,
  buildNearbyQuery,
  clusterPoints,
  validateLocation,
  formatDistance,
  getBoundingBox
};