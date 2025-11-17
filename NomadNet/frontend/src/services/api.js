// src/services/api.js
import axios from 'axios';

// Read Vite env variable correctly
const baseURL = import.meta.env.VITE_API_URL;

console.log('🌐 API Base URL:', baseURL); // Debug log

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
  console.log('🔑 Token:', token ? 'Present ✅' : 'Missing ❌');
  console.log('🌐 Full URL:', `${config.baseURL}${config.url}`);
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
    
    if (error.response?.status === 401) {
      console.log('🚪 Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;