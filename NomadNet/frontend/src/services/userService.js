// src/services/userService.js
import api from './api';

// ======================
// 👤 User Profile
// ======================

// Get user by username
export const getUserByUsername = (username) => {
  return api.get(`/api/users/username/${username}`);
};

// Get user by ID
export const getUserById = (userId) => {
  return api.get(`/api/users/${userId}`);
};

export const updateProfile = (userId, profileData) => {
  return api.put(`/api/users/${userId}`, profileData);
};

export const uploadAvatar = (userId, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post(`/api/users/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ======================
// 📍 Location (NEW)
// ======================

// Update user location
export const updateLocation = async (userId, longitude, latitude, city = null, country = null) => {
  try {
    const data = { longitude, latitude };
    if (city) data.city = city;
    if (country) data.country = country;

    const response = await api.patch(`/api/users/${userId}/location`, data);
    return response.data;
  } catch (error) {
    console.error('❌ Update location error:', error);
    throw error;
  }
};

// Get nearby users
export const getNearbyUsers = async (longitude, latitude, radius = 5000) => {
  try {
    const params = new URLSearchParams({
      longitude,
      latitude,
      radius
    });

    const response = await api.get(`/api/users/nearby/search?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get nearby users error:', error);
    throw error;
  }
};

// ======================
// ⚙️ Privacy
// ======================

// Update privacy settings
export const updatePrivacySettings = async (userId, settings) => {
  try {
    const response = await api.patch(`/api/users/${userId}/privacy`, settings);
    return response.data;
  } catch (error) {
    console.error('❌ Update privacy settings error:', error);
    throw error;
  }
};

// ======================
// 🚫 Safety
// ======================

// Block a user
export const blockUser = (userId) => {
  return api.post(`/api/users/${userId}/block`);
};

// Unblock a user
export const unblockUser = (userId) => {
  return api.delete(`/api/users/${userId}/block`);
};

// Get blocked users list
export const getBlockedUsers = async () => {
  try {
    const response = await api.get('/api/users/blocked/list');
    return response.data;
  } catch (error) {
    console.error('❌ Get blocked users error:', error);
    throw error;
  }
};

// Report a user
export const reportUser = (userId, reason) => {
  return api.post(`/api/users/${userId}/report`, { reason });
};

export const deleteAccount = (userId) => {
  return api.delete(`/api/users/${userId}`);
};
