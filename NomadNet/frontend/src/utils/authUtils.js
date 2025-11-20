// src/utils/authUtils.js

// Get stored token
export const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Get stored user
export const getUser = () => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Store token and user data
export const storeAuth = (token, user, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
};

// Clear auth data
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

// Get current user ID
export const getCurrentUserId = () => {
  const user = getUser();
  return user?.id || user?._id || null;
};

// Check if user is verified
export const isEmailVerified = () => {
  const user = getUser();
  return user?.emailVerified || false;
};