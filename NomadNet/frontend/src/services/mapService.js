// src/services/mapService.js
import api from './api';

// ======================
// 🗺️ Map API Service
// ======================

// Get all nearby items (users, venues, marketplace, check-ins)
export const getNearbyAll = async (longitude, latitude, radius = 300, types = 'users,venues,marketplace,checkins', limit = 50) => {
  try {
    const params = new URLSearchParams({
      longitude,
      latitude,
      radius,
      types,
      limit
    });

    const response = await api.get(`/api/map/nearby?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get nearby all error:', error);
    throw error;
  }
};

// Get detailed user info for map marker
export const getUserDetailsForMap = async (userId, longitude = null, latitude = null) => {
  try {
    const params = new URLSearchParams();
    if (longitude) params.append('longitude', longitude);
    if (latitude) params.append('latitude', latitude);

    const queryString = params.toString();
    const url = `/api/map/user/${userId}/details${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Get user details for map error:', error);
    throw error;
  }
};

// Get detailed venue info for map marker
export const getVenueDetailsForMap = async (venueId, longitude = null, latitude = null) => {
  try {
    const params = new URLSearchParams();
    if (longitude) params.append('longitude', longitude);
    if (latitude) params.append('latitude', latitude);

    const queryString = params.toString();
    const url = `/api/map/venue/${venueId}/details${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Get venue details for map error:', error);
    throw error;
  }
};

// Get detailed marketplace item info for map marker
export const getMarketplaceDetailsForMap = async (itemId, longitude = null, latitude = null) => {
  try {
    const params = new URLSearchParams();
    if (longitude) params.append('longitude', longitude);
    if (latitude) params.append('latitude', latitude);

    const queryString = params.toString();
    const url = `/api/map/marketplace/${itemId}/details${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Get marketplace details for map error:', error);
    throw error;
  }
};

// Get detailed check-in info for map marker
export const getCheckInDetailsForMap = async (checkinId, longitude = null, latitude = null) => {
  try {
    const params = new URLSearchParams();
    if (longitude) params.append('longitude', longitude);
    if (latitude) params.append('latitude', latitude);

    const queryString = params.toString();
    const url = `/api/map/checkin/${checkinId}/details${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Get check-in details for map error:', error);
    throw error;
  }
};