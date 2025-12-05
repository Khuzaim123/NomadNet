// src/services/authService.js
import api from "./api";

// Get the API URL from the api instance
const API_URL = api.defaults.baseURL;

console.log('🔗 API URL:', API_URL);
console.log('🌍 Current page:', window.location.href);

// Test connection immediately
(async () => {
  try {
    console.log('Testing backend connection...');
    const res = await api.get('/api/health');
    console.log('Backend is online!', res.data);
  } catch (error) {
    console.error('Backend connection failed!', error.message);
  }
})();

// Helper function for fetch with debugging
const fetchWithDebug = async (url, options = {}) => {
  console.log('\n📤 Making request to:', url);
  console.log('📋 Options:', options);
  
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'include',
    });
    
    console.log('📥 Response received:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    
    const clonedResponse = response.clone();
    let data;
    
    try {
      data = await response.json();
      console.log('   Data:', data);
    } catch (jsonError) {
      const text = await clonedResponse.text();
      console.error('   Failed to parse JSON. Raw response:', text);
      throw new Error(`Server returned invalid JSON: ${text.substring(0, 100)}`);
    }
    
    return { response, data };
  } catch (error) {
    console.error('❌ Fetch failed:');
    console.error('   URL:', url);
    console.error('   Error:', error.message);
    console.error('   Type:', error.name);
    
    if (error.message === 'Failed to fetch') {
      console.error('\n🚨 FAILED TO FETCH - Possible causes:');
      console.error('   1. Backend not running on port 39300');
      console.error('   2. CORS blocking the request');
      console.error('   3. Firewall/antivirus blocking');
      console.error('   4. Wrong URL');
      console.error('\n🔍 Debug steps:');
      console.error('   1. Open http://localhost:39300/api/health in browser');
      console.error('   2. Check Network tab in DevTools');
      console.error('   3. Look for CORS errors in Console');
    }
    
    throw error;
  }
};

// Register new user
export const register = async (userData) => {
  try {
    console.log('\n🔐 REGISTER FUNCTION CALLED');
    console.log('📧 User data:', { ...userData, password: '***' });
    
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => err.message).join('\n');
        throw new Error(errorMessages);
      }
      throw new Error(data.message || `Registration failed (${response.status})`);
    }

    console.log('✅ Registration successful!');
    return data;
    
  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error);
    
    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Cannot connect to server.\n\n' +
        'Please check:\n' +
        '1. Backend is running: npm run dev\n' +
        '2. Server is on port 39300\n' +
        '3. Check browser console for errors'
      );
    }
    
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  try {
    console.log('\n🔐 VERIFY OTP CALLED');
    
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/verify-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    return data;
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Resend OTP
export const resendOTP = async (email) => {
  try {
    console.log('\n🔄 RESEND OTP CALLED');
    
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/resend-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend OTP');
    }

    return data;
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Login
export const login = async (email, password) => {
  try {
    console.log('\n🔐 LOGIN CALLED');
    
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('❌ Login error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (token) => {
  try {
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/me`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user');
    }

    return data;
  } catch (error) {
    console.error('❌ Get user error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Forgot Password
export const forgotPassword = async (email) => {
  try {
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/forgot-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reset email');
    }

    return data;
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Reset Password
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed');
    }

    return data;
  } catch (error) {
    console.error('❌ Reset password error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Change Password Request
export const changePasswordRequest = async (token, currentPassword, newPassword) => {
  try {
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/change-password/request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'Failed to request password change');
    }

    return data;
  } catch (error) {
    console.error('❌ Change password request error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Change Password Verify OTP
export const changePasswordVerify = async (token, otp) => {
  try {
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/change-password/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ otp }),
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    return data;
  } catch (error) {
    console.error('❌ Change password verify error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Logout
export const logout = async (token) => {
  try {
    const { response, data } = await fetchWithDebug(
      `${API_URL}/api/auth/logout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }

    return data;
  } catch (error) {
    console.error('❌ Logout error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
};

// Store token and user data
export const storeAuth = (token, user, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
};

// Get stored token
export const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Get stored user
export const getUser = () => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Clear auth data
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};