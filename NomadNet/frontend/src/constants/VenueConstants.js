// src/constants/venueConstants.js

// Venue Categories
export const VENUE_CATEGORIES = [
  { 
    value: 'cafe', 
    label: 'Cafe', 
    icon: '☕', 
    description: 'Coffee shops & cafes',
    color: '#f59e0b'
  },
  { 
    value: 'coworking', 
    label: 'Coworking Space', 
    icon: '💼', 
    description: 'Shared workspaces',
    color: '#6366f1'
  },
  { 
    value: 'restaurant', 
    label: 'Restaurant', 
    icon: '🍽️', 
    description: 'Dining spots',
    color: '#ef4444'
  },
  { 
    value: 'bar', 
    label: 'Bar', 
    icon: '🍺', 
    description: 'Bars & pubs',
    color: '#8b5cf6'
  },
  { 
    value: 'park', 
    label: 'Park', 
    icon: '🌳', 
    description: 'Outdoor spaces',
    color: '#22c55e'
  },
  { 
    value: 'library', 
    label: 'Library', 
    icon: '📚', 
    description: 'Public libraries',
    color: '#3b82f6'
  },
  { 
    value: 'hotel', 
    label: 'Hotel', 
    icon: '🏨', 
    description: 'Hotels & hostels',
    color: '#ec4899'
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: '📍', 
    description: 'Other venues',
    color: '#64748b'
  }
];

// Venue Amenities
export const VENUE_AMENITIES = [
  { value: 'wifi', label: 'Free WiFi', icon: '📶' },
  { value: 'power_outlets', label: 'Power Outlets', icon: '🔌' },
  { value: 'coffee', label: 'Coffee Available', icon: '☕' },
  { value: 'quiet', label: 'Quiet Space', icon: '🤫' },
  { value: 'air_conditioning', label: 'Air Conditioning', icon: '❄️' },
  { value: 'outdoor_seating', label: 'Outdoor Seating', icon: '🌤️' },
  { value: 'parking', label: 'Parking Available', icon: '🅿️' },
  { value: 'accessible', label: 'Wheelchair Accessible', icon: '♿' },
  { value: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
  { value: 'kitchen', label: 'Kitchen Available', icon: '🍳' },
];

// Check-in Duration Options
export const DURATION_OPTIONS = [
  { value: '0-1', label: 'Less than 1 hour' },
  { value: '1-2', label: '1-2 hours' },
  { value: '2-4', label: '2-4 hours' },
  { value: '4+', label: '4+ hours' }
];

// Rating Categories
export const RATING_CATEGORIES = {
  wifi: { label: 'WiFi Quality', icon: '📶' },
  noise: { label: 'Noise Level', icon: '🔊' },
  crowdedness: { label: 'Crowdedness', icon: '👥' },
  overall: { label: 'Overall', icon: '⭐' }
};

// Distance Filter Options (in meters)
export const DISTANCE_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' }
];

// Minimum Rating Options
export const RATING_OPTIONS = [
  { value: 0, label: 'Any Rating' },
  { value: 3, label: '3+ Stars' },
  { value: 3.5, label: '3.5+ Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 4.5, label: '4.5+ Stars' }
];

// Sort Options
export const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' }
];

// View Mode Options
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  MAP: 'map'
};

// Default Filters
export const DEFAULT_FILTERS = {
  category: '',
  amenities: [],
  minRating: 0,
  radius: 5000,
  search: '',
  sortBy: 'distance'
};

// Map Style Options
export const MAP_STYLES = {
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  DARK: 'mapbox://styles/mapbox/dark-v11',
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  SATELLITE: 'mapbox://styles/mapbox/satellite-streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12'
};

// Default Map Config
export const DEFAULT_MAP_CONFIG = {
  center: [-74.006, 40.7128], // NYC
  zoom: 13,
  pitch: 0,
  bearing: 0
};

// Photo Upload Constraints
export const PHOTO_CONSTRAINTS = {
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
};

// Error Messages
export const ERROR_MESSAGES = {
  LOCATION_DENIED: 'Location access denied. Please enable location services.',
  LOCATION_UNAVAILABLE: 'Location information unavailable.',
  LOCATION_TIMEOUT: 'Location request timed out.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VENUE_NOT_FOUND: 'Venue not found.',
  FETCH_FAILED: 'Failed to load venues. Please try again.',
  CREATE_FAILED: 'Failed to create venue. Please try again.',
  UPDATE_FAILED: 'Failed to update venue. Please try again.',
  DELETE_FAILED: 'Failed to delete venue. Please try again.',
  CHECKIN_FAILED: 'Failed to check in. Please try again.',
  PHOTO_TOO_LARGE: 'Photo size must be less than 5MB.',
  TOO_MANY_PHOTOS: 'Maximum 5 photos allowed.',
  INVALID_FORMAT: 'Only image files are allowed.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  VENUE_CREATED: 'Venue created successfully!',
  VENUE_UPDATED: 'Venue updated successfully!',
  VENUE_DELETED: 'Venue deleted successfully!',
  CHECKIN_SUCCESS: 'Checked in successfully!',
  PHOTO_ADDED: 'Photo added successfully!',
  FAVORITE_ADDED: 'Added to favorites!',
  FAVORITE_REMOVED: 'Removed from favorites!',
  RATING_SUBMITTED: 'Rating submitted successfully!'
};

// Geolocation Options
export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

// Pagination Defaults
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100
};

// Animation Durations (ms)
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  MODAL: 300,
  TOAST: 3000
};

// Breakpoints (px)
export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
};

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 100,
  STICKY: 200,
  MODAL_BACKDROP: 900,
  MODAL: 1000,
  POPOVER: 1100,
  TOOLTIP: 1200,
  NOTIFICATION: 1300
};

// Helper Functions
export const getCategoryColor = (category) => {
  const cat = VENUE_CATEGORIES.find(c => c.value === category);
  return cat?.color || '#64748b';
};

export const getCategoryIcon = (category) => {
  const cat = VENUE_CATEGORIES.find(c => c.value === category);
  return cat?.icon || '📍';
};

export const getCategoryLabel = (category) => {
  const cat = VENUE_CATEGORIES.find(c => c.value === category);
  return cat?.label || 'Venue';
};

export const formatDistance = (distance) => {
  if (!distance) return null;
  return distance < 1000 
    ? `${Math.round(distance)}m` 
    : `${(distance / 1000).toFixed(1)}km`;
};

export const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return `${months}mo ago`;
};

export const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' &&
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180
  );
};

export const validatePhotoFile = (file) => {
  if (!PHOTO_CONSTRAINTS.acceptedFormats.includes(file.type)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_FORMAT };
  }
  if (file.size > PHOTO_CONSTRAINTS.maxFileSize) {
    return { valid: false, error: ERROR_MESSAGES.PHOTO_TOO_LARGE };
  }
  return { valid: true };
};

export default {
  VENUE_CATEGORIES,
  VENUE_AMENITIES,
  DURATION_OPTIONS,
  RATING_CATEGORIES,
  DISTANCE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  VIEW_MODES,
  DEFAULT_FILTERS,
  MAP_STYLES,
  DEFAULT_MAP_CONFIG,
  PHOTO_CONSTRAINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  GEOLOCATION_OPTIONS,
  PAGINATION_DEFAULTS,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  Z_INDEX,
  getCategoryColor,
  getCategoryIcon,
  getCategoryLabel,
  formatDistance,
  formatTimeAgo,
  isValidCoordinate,
  validatePhotoFile
};