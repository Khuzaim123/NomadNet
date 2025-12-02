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
    if (filters.amenities) params.append('amenities', filters.amenities);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/api/venues?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get venues error:', error);
    throw error;
  }
};

// Get nearby venues
export const getNearbyVenues = async (longitude, latitude, radius = 5000, category = null, amenities = null, minRating = null, limit = 50) => {
  try {
    const params = new URLSearchParams({
      longitude,
      latitude,
      radius,
      limit
    });

    if (category) params.append('category', category);
    if (amenities) params.append('amenities', amenities);
    if (minRating) params.append('minRating', minRating);

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
export const createVenue = async (venueData) => {
  try {
    // If there are photos, use FormData
    if (venueData.photos && venueData.photos.length > 0) {
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
      venueData.photos.forEach((photo) => {
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

// Category constants
export const VENUE_CATEGORIES = [
  { value: 'cafe', label: 'Cafe', icon: '☕' },
  { value: 'coworking', label: 'Coworking Space', icon: '💼' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'bar', label: 'Bar', icon: '🍺' },
  { value: 'park', label: 'Park', icon: '🌳' },
  { value: 'library', label: 'Library', icon: '📚' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'other', label: 'Other', icon: '📍' }
];

export const AMENITIES = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'power_outlets', label: 'Power Outlets' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'outdoor_seating', label: 'Outdoor Seating' },
  { value: 'parking', label: 'Parking' }
];