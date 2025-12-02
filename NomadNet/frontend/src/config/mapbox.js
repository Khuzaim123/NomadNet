// src/config/mapbox.js

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const MAP_STYLES = {
  DARK: 'mapbox://styles/mapbox/dark-v11',
  LIGHT: 'mapbox://styles/mapbox/light-v11',
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  SATELLITE: 'mapbox://styles/mapbox/satellite-streets-v12'
};

export const DEFAULT_CENTER = [-74.006, 40.7128]; // New York (fallback)
export const DEFAULT_ZOOM = 13;

export const MARKER_COLORS = {
  USER: '#3b82f6',      // Blue
  VENUE: '#10b981',     // Green
  MARKETPLACE: '#f59e0b', // Orange
  CHECKIN: '#ef4444'    // Red
};

export const RADIUS_OPTIONS = [
  { value: 300, label: '300m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 2000, label: '2km' },
  { value: 5000, label: '5km' }
];