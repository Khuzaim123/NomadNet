// src/services/checkInService.js
import api from './api';

// ======================
// 📍 Check-In Service
// ======================

// Create check-in
export const createCheckIn = async (checkInData) => {
  try {
    const response = await api.post('/api/checkins', checkInData);
    return response.data;
  } catch (error) {
    console.error('❌ Create check-in error:', error);
    throw error;
  }
};

// Get check-in by ID
export const getCheckInById = async (id) => {
  try {
    const response = await api.get(`/api/checkins/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get check-in error:', error);
    throw error;
  }
};

// Get user's check-in history
export const getUserCheckIns = async (userId, includeExpired = false, limit = 20, page = 1) => {
  try {
    const params = new URLSearchParams({
      includeExpired,
      limit,
      page
    });

    const response = await api.get(`/api/checkins/user/${userId}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get user check-ins error:', error);
    throw error;
  }
};

// Get nearby check-ins
export const getNearbyCheckIns = async (longitude, latitude, radius = 5000, limit = 50) => {
  try {
    const params = new URLSearchParams({
      longitude,
      latitude,
      radius,
      limit
    });

    const response = await api.get(`/api/checkins/nearby/search?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get nearby check-ins error:', error);
    throw error;
  }
};

// Get check-ins at a venue
export const getVenueCheckIns = async (venueId, activeOnly = true, limit = 20) => {
  try {
    const params = new URLSearchParams({
      activeOnly,
      limit
    });

    const response = await api.get(`/api/checkins/venue/${venueId}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get venue check-ins error:', error);
    throw error;
  }
};

// Get current user's active check-in
export const getMyActiveCheckIn = async () => {
  try {
    const response = await api.get('/api/checkins/me/active');
    return response.data;
  } catch (error) {
    console.error('❌ Get my active check-in error:', error);
    throw error;
  }
};

// Update check-in
export const updateCheckIn = async (id, updateData) => {
  try {
    const response = await api.patch(`/api/checkins/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error('❌ Update check-in error:', error);
    throw error;
  }
};

// Delete check-in
export const deleteCheckIn = async (id) => {
  try {
    const response = await api.delete(`/api/checkins/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Delete check-in error:', error);
    throw error;
  }
};