// src/services/venueService.js
import api from './api';

// ======================
// 🏢 Venue Service
// ======================

// Get all venues with filters
export const getAllVenues = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.amenities) {
      if (Array.isArray(filters.amenities)) {
        params.append('amenities', filters.amenities.join(','));
      } else {
        params.append('amenities', filters.amenities);
      }
    }
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.radius) params.append('radius', filters.radius);
    if (filters.longitude) params.append('longitude', filters.longitude);
    if (filters.latitude) params.append('latitude', filters.latitude);

    const response = await api.get(`/api/venues?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get venues error:', error);
    throw error;
  }
};

// Get nearby venues
export const getNearbyVenues = async (longitude, latitude, filters = {}) => {
  try {
    const params = new URLSearchParams({
      longitude,
      latitude,
      radius: filters.radius || 5000,
      limit: filters.limit || 50
    });

    if (filters.category) params.append('category', filters.category);
    if (filters.amenities) {
      if (Array.isArray(filters.amenities)) {
        params.append('amenities', filters.amenities.join(','));
      } else {
        params.append('amenities', filters.amenities);
      }
    }
    if (filters.minRating) params.append('minRating', filters.minRating);

    const response = await api.get(`/api/venues/nearby/search?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get nearby venues error:', error);
    throw error;
  }
};

// Get venue by ID
export const getVenueById = async (id) => {
  try {
    const response = await api.get(`/api/venues/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get venue error:', error);
    throw error;
  }
};

// Create venue
export const createVenue = async (venueData, photos = []) => {
  try {
    // If there are photos, use FormData
    if (photos && photos.length > 0) {
      const formData = new FormData();

      formData.append('name', venueData.name);
      formData.append('category', venueData.category);
      formData.append('longitude', venueData.longitude);
      formData.append('latitude', venueData.latitude);

      if (venueData.address) {
        formData.append('address', JSON.stringify(venueData.address));
      }

      if (venueData.contact) {
        formData.append('contact', JSON.stringify(venueData.contact));
      }

      if (venueData.amenities) {
        formData.append('amenities', JSON.stringify(venueData.amenities));
      }

      if (venueData.hours) {
        formData.append('hours', JSON.stringify(venueData.hours));
      }

      // Add photos
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await api.post('/api/venues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } else {
      const response = await api.post('/api/venues', venueData);
      return response.data;
    }
  } catch (error) {
    console.error('❌ Create venue error:', error);
    throw error;
  }
};

// Update venue
export const updateVenue = async (id, updateData) => {
  try {
    const response = await api.put(`/api/venues/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error('❌ Update venue error:', error);
    throw error;
  }
};

// Delete venue
export const deleteVenue = async (id) => {
  try {
    const response = await api.delete(`/api/venues/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Delete venue error:', error);
    throw error;
  }
};

// Add photo to venue
export const addVenuePhoto = async (id, photoFile) => {
  try {
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await api.post(`/api/venues/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Add venue photo error:', error);
    throw error;
  }
};

// Delete venue photo
export const deleteVenuePhoto = async (venueId, photoId) => {
  try {
    const response = await api.delete(`/api/venues/${venueId}/photos/${photoId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Delete venue photo error:', error);
    throw error;
  }
};

// Get venue categories
export const getVenueCategories = async () => {
  try {
    const response = await api.get('/api/venues/categories/list');
    return response.data;
  } catch (error) {
    console.error('❌ Get venue categories error:', error);
    throw error;
  }
};

// Check in to a venue
export const checkIn = async (venueId, checkInData) => {
  try {
    const response = await api.post(`/api/venues/${venueId}/checkin`, checkInData);
    return response.data;
  } catch (error) {
    console.error('❌ Check in error:', error);
    throw error;
  }
};

// Get venue check-ins
export const getVenueCheckIns = async (venueId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    const response = await api.get(`/api/venues/${venueId}/checkins?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get check-ins error:', error);
    throw error;
  }
};

// Get user's check-ins
export const getUserCheckIns = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    const response = await api.get(`/api/checkins?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get user check-ins error:', error);
    throw error;
  }
};

// Rate a venue
export const rateVenue = async (venueId, ratings) => {
  try {
    const response = await api.post(`/api/venues/${venueId}/rate`, ratings);
    return response.data;
  } catch (error) {
    console.error('❌ Rate venue error:', error);
    throw error;
  }
};

// Add venue to favorites
export const addToFavorites = async (venueId) => {
  try {
    const response = await api.post(`/api/venues/${venueId}/favorite`);
    return response.data;
  } catch (error) {
    console.error('❌ Add to favorites error:', error);
    throw error;
  }
};

// Remove venue from favorites
export const removeFromFavorites = async (venueId) => {
  try {
    const response = await api.delete(`/api/venues/${venueId}/favorite`);
    return response.data;
  } catch (error) {
    console.error('❌ Remove from favorites error:', error);
    throw error;
  }
};

// Get user's favorite venues
export const getFavoriteVenues = async () => {
  try {
    const response = await api.get('/api/venues/favorites');
    return response.data;
  } catch (error) {
    console.error('❌ Get favorites error:', error);
    throw error;
  }
};

// Search venues
export const searchVenues = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams({ search: query });
    
    if (filters.category) params.append('category', filters.category);
    if (filters.amenities) params.append('amenities', filters.amenities);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/api/venues/search?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Search venues error:', error);
    throw error;
  }
};

// Category constants
export const VENUE_CATEGORIES = [
  { value: 'cafe', label: 'Cafe', icon: '☕', description: 'Coffee shops & cafes' },
  { value: 'coworking', label: 'Coworking Space', icon: '💼', description: 'Shared workspaces' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️', description: 'Dining spots' },
  { value: 'bar', label: 'Bar', icon: '🍺', description: 'Bars & pubs' },
  { value: 'park', label: 'Park', icon: '🌳', description: 'Outdoor spaces' },
  { value: 'library', label: 'Library', icon: '📚', description: 'Public libraries' },
  { value: 'hotel', label: 'Hotel', icon: '🏨', description: 'Hotels & hostels' },
  { value: 'other', label: 'Other', icon: '📍', description: 'Other venues' }
];

export const AMENITIES = [
  { value: 'wifi', label: 'Free WiFi', icon: '📶' },
  { value: 'power_outlets', label: 'Power Outlets', icon: '🔌' },
  { value: 'coffee', label: 'Coffee Available', icon: '☕' },
  { value: 'quiet', label: 'Quiet Space', icon: '🤫' },
  { value: 'air_conditioning', label: 'Air Conditioning', icon: '❄️' },
  { value: 'outdoor_seating', label: 'Outdoor Seating', icon: '🌤️' },
  { value: 'parking', label: 'Parking Available', icon: '🅿️' }
];

// Export default object with all functions
const venueService = {
  getAllVenues,
  getNearbyVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  addVenuePhoto,
  deleteVenuePhoto,
  getVenueCategories,
  checkIn,
  getVenueCheckIns,
  getUserCheckIns,
  rateVenue,
  addToFavorites,
  removeFromFavorites,
  getFavoriteVenues,
  searchVenues,
  VENUE_CATEGORIES,
  AMENITIES
};

export default venueService;