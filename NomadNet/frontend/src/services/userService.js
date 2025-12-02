// src/services/userService.js
import api from './api';

export const getUserByUsername = (username) => {
  return api.get(`/users/username/${username}`);
};

export const updateProfile = (userId, profileData) => {
  return api.put(`/users/${userId}`, profileData);
};

export const uploadAvatar = (userId, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post(`/users/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const blockUser = (userId) => {
  return api.post(`/users/${userId}/block`);
};

export const reportUser = (userId, reason) => {
  return api.post(`/users/${userId}/report`, { reason });
};

export const deleteAccount = (userId) => {
  return api.delete(`/users/${userId}`);
};
