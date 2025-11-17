// src/services/userService.js
import api from './api';

export const getUserByUsername = (username) => {
  return api.get(`/users/username/${username}`); // ✅ match backend route
};

// Update user profile
export const updateProfile = (userId, profileData) => {
  return api.put(`/users/${userId}`, profileData);
};

// Upload avatar
export const uploadAvatar = (userId, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post(`/users/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Block a user
export const blockUser = (userId) => {
  return api.post(`/users/${userId}/block`);
};

// Report a user
export const reportUser = (userId, reason) => {
  return api.post(`/users/${userId}/report`, { reason });
};

// Delete account
export const deleteAccount = (userId) => {
    return api.delete(`/users/${userId}`);
};