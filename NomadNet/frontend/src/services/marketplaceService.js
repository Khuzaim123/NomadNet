// src/services/api/marketplaceService.js
import api from './api';

// ======================
// 📋 Get Listings
// ======================

// Get all listings with filters
export const getAllListings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.priceType) params.append('priceType', filters.priceType);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/api/marketplace?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get listings error:', error);
    throw error;
  }
};

// Get nearby listings
export const getNearbyListings = async (longitude, latitude, radius = 50000, type = null, category = null) => {
  try {
    const params = new URLSearchParams({
      longitude,
      latitude,
      radius,
    });
    
    if (type) params.append('type', type);
    if (category) params.append('category', category);
    
    const response = await api.get(`/api/marketplace/nearby?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get nearby listings error:', error);
    throw error;
  }
};

// Get single listing by ID
export const getListingById = async (id) => {
  try {
    const response = await api.get(`/api/marketplace/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get listing by ID error:', error);
    throw error;
  }
};

// Get user's own listings
export const getMyListings = async (status = 'active') => {
  try {
    const response = await api.get(`/api/marketplace/my/listings?status=${status}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get my listings error:', error);
    throw error;
  }
};

// Get listings by user ID
export const getListingsByUser = async (userId) => {
  try {
    const response = await api.get(`/api/marketplace/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get user listings error:', error);
    throw error;
  }
};

// ======================
// ✏️ Create & Update
// ======================

// Create new listing
export const createListing = async (listingData) => {
  try {
    // If there are photos, use FormData
    if (listingData.photos && listingData.photos.length > 0) {
      const formData = new FormData();
      
      // Add all fields
      formData.append('type', listingData.type);
      formData.append('title', listingData.title);
      formData.append('description', listingData.description);
      formData.append('category', listingData.category);
      
      if (listingData.otherCategoryName) {
        formData.append('otherCategoryName', listingData.otherCategoryName);
      }
      
      if (listingData.condition) {
        formData.append('condition', listingData.condition);
      }
      
      formData.append('priceType', listingData.priceType);
      
      if (listingData.price && listingData.price.amount) {
        formData.append('price[amount]', listingData.price.amount);
        formData.append('price[currency]', listingData.price.currency || 'USD');
      }
      
      // ✅ FIX: Add delivery options with [] suffix (not [0], [1], etc.)
      listingData.deliveryOptions.forEach((option) => {
        formData.append('deliveryOptions[]', option);
      });
      
      // Add photos
      listingData.photos.forEach((photo) => {
        formData.append('photos', photo);
      });
      
      const response = await api.post('/api/marketplace', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } else {
      // No photos, send JSON
      const response = await api.post('/api/marketplace', listingData);
      return response.data;
    }
  } catch (error) {
    console.error('❌ Create listing error:', error);
    throw error;
  }
};

// Update listing
export const updateListing = async (id, updateData) => {
  try {
    // If there are new photos, use FormData
    if (updateData.photos && updateData.photos.length > 0) {
      const formData = new FormData();
      
      Object.keys(updateData).forEach(key => {
        if (key === 'photos') {
          updateData.photos.forEach((photo) => {
            formData.append('photos', photo);
          });
        } else if (key === 'price' && updateData.price) {
          if (updateData.price.amount) {
            formData.append('price[amount]', updateData.price.amount);
            formData.append('price[currency]', updateData.price.currency || 'USD');
          }
        } else if (key === 'deliveryOptions') {
          // ✅ FIX: Use [] suffix
          updateData.deliveryOptions.forEach((option) => {
            formData.append('deliveryOptions[]', option);
          });
        } else {
          formData.append(key, updateData[key]);
        }
      });
      
      const response = await api.put(`/api/marketplace/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } else {
      const response = await api.put(`/api/marketplace/${id}`, updateData);
      return response.data;
    }
  } catch (error) {
    console.error('❌ Update listing error:', error);
    throw error;
  }
};

// Delete photo from listing
export const deletePhoto = async (id, photoUrl) => {
  try {
    const response = await api.delete(`/api/marketplace/${id}/photos`, {
      data: { photoUrl }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Delete photo error:', error);
    throw error;
  }
};

// Delete listing
export const deleteListing = async (id) => {
  try {
    const response = await api.delete(`/api/marketplace/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Delete listing error:', error);
    throw error;
  }
};

// ======================
// 💬 Requests
// ======================

// Request item/service
export const requestItem = async (id, message) => {
  try {
    const response = await api.post(`/api/marketplace/${id}/request`, { message });
    return response.data;
  } catch (error) {
    console.error('❌ Request item error:', error);
    throw error;
  }
};

// Update request status
export const updateRequestStatus = async (listingId, requestId, status) => {
  try {
    const response = await api.patch(`/api/marketplace/${listingId}/request/${requestId}`, { status });
    return response.data;
  } catch (error) {
    console.error('❌ Update request status error:', error);
    throw error;
  }
};

// Get user's requests
export const getMyRequests = async () => {
  try {
    const response = await api.get('/api/marketplace/my/requests');
    return response.data;
  } catch (error) {
    console.error('❌ Get my requests error:', error);
    throw error;
  }
};

// ======================
// 📊 Helpers
// ======================

// Categories
export const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' },
  { value: 'sports', label: 'Sports' },
  { value: 'musical_instruments', label: 'Musical Instruments' },
  { value: 'web_development', label: 'Web Development' },
  { value: 'design', label: 'Design' },
  { value: 'photography', label: 'Photography' },
  { value: 'writing', label: 'Writing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'language_lessons', label: 'Language Lessons' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'other', label: 'Other' },
];

export const TYPES = [
  { value: 'item', label: 'Item' },
  { value: 'service', label: 'Service' },
  { value: 'skill', label: 'Skill' },
];

export const PRICE_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'barter', label: 'Barter' },
  { value: 'paid', label: 'Paid' },
];

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'remote', label: 'Remote' },
];