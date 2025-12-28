// src/services/mapService.js
import api from './api';

/**
 * Get nearby users, venues, marketplace items, and check-ins.
 * Combines:
 *   - /api/map/nearby            (users, marketplace, checkIns)
 *   - /api/venues/nearby/search  (venues with OSM/Overpass import)
 */
export const getNearbyAll = async (
  longitude,
  latitude,
  radius,
  types,
  limit,
  venueFilters = {}
) => {
  const typeString = types || 'users,venues,marketplace,checkins';

  // Call map/nearby for users/marketplace/checkins
  const mapPromise = api.get('/api/map/nearby', {
    params: {
      longitude,
      latitude,
      radius,
      types: typeString,
      limit
    }
  });

  // Call venues/nearby/search for venues (to trigger OSM import)
  const venuesPromise = api.get('/api/venues/nearby/search', {
    params: {
      longitude,
      latitude,
      radius,
      limit,
      category: venueFilters.category || undefined,
      amenities:
        venueFilters.amenities && venueFilters.amenities.length > 0
          ? venueFilters.amenities.join(',')
          : undefined,
      minRating:
        venueFilters.minRating && venueFilters.minRating > 0
          ? venueFilters.minRating
          : undefined
    }
  });

  const [mapRes, venuesRes] = await Promise.all([mapPromise, venuesPromise]);

  const mapData = mapRes.data?.data || mapRes.data || {};
  const venuesData =
    venuesRes.data?.data?.venues || venuesRes.data?.venues || [];

  return {
    data: {
      users: mapData.users || [],
      venues: venuesData,
      marketplace: mapData.marketplace || [],
      checkIns: mapData.checkIns || []
    }
  };
};