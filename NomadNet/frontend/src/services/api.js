// src/services/api.js
import axios from "axios";

// Read Vite env variable
const baseURL = import.meta.env.VITE_API_URL;

console.log("🌐 Loaded Base URL:", baseURL);

const api = axios.create({
  baseURL,
  withCredentials: true,
});


// Add a request interceptor to include the auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
  console.log('🔑 Token:', token ? 'Present ✅' : 'Missing ❌');
  console.log('🌐 Full URL:', `${config.baseURL}${config.url}`);
  
  // ✅ Log request data
  if (config.data) {
    if (config.data instanceof FormData) {
      console.log('📦 Request Type: FormData');
      console.log('📋 FormData contents:');
      for (let pair of config.data.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}:`, `[File: ${pair[1].name}, ${pair[1].type}, ${pair[1].size} bytes]`);
        } else {
          console.log(`  ${pair[0]}:`, pair[1]);
        }
      }
    } else {
      console.log('📦 Request Type: JSON');
      console.log('📋 Request Data:', JSON.stringify(config.data, null, 2));
    }
  }
  
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);
    console.error('❌ Error message:', error.response?.data?.message);
    console.error('❌ Full error data:', error.response?.data);
    
    // ✅ Log detailed validation errors
    if (error.response?.data?.errors) {
      console.error('❌ Validation errors:', error.response.data.errors);
    }
    if (error.response?.data?.details) {
      console.error('❌ Error details:', error.response.data.details);
    }
    if (error.response?.data?.error) {
      console.error('❌ Error:', error.response.data.error);
    }
    
    if (error.response?.status === 401) {
      console.log('🚪 Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Redirect to login/auth page
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;