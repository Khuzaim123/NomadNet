// src/services/locationService.js
import api from './api';

/**
 * Get current user's location
 */
export const getMyLocation = async () => {
    const response = await api.get('/map/my-location');
    return response.data;
};

/**
 * Update current user's location
 * @param {Object} locationData - { longitude, latitude, city, country }
 */
export const updateMyLocation = async (locationData) => {
    const response = await api.put('/map/my-location', locationData);
    return response.data;
};

/**
 * Toggle location sharing on/off
 * @param {boolean} shareLocation - true to enable, false to disable
 */
export const toggleShareLocation = async (shareLocation) => {
    const response = await api.patch('/map/share-location', { shareLocation });
    return response.data;
};

/**
 * Get another user's location (if they share it)
 * @param {string} userId - User ID
 * @param {Object} myCoordinates - Optional { longitude, latitude } for distance calculation
 */
export const getUserLocation = async (userId, myCoordinates = null) => {
    const params = myCoordinates
        ? { longitude: myCoordinates.longitude, latitude: myCoordinates.latitude }
        : {};

    const response = await api.get(`/map/user/${userId}/location`, { params });
    return response.data;
};

/**
 * Get multiple users' locations
 * @param {Array} userIds - Array of user IDs
 * @param {Object} myCoordinates - Optional { longitude, latitude } for distance calculation
 */
export const getMultipleUsersLocations = async (userIds, myCoordinates = null) => {
    const body = { userIds };

    if (myCoordinates) {
        body.longitude = myCoordinates.longitude;
        body.latitude = myCoordinates.latitude;
    }

    const response = await api.post('/map/users/locations', body);
    return response.data;
};

/**
 * Get current browser location using Geolocation API
 */
export const getCurrentBrowserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            const error = new Error('Geolocation is not supported by your browser');
            error.code = 0;
            reject(error);
            return;
        }

        console.log('🌍 Requesting browser location...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('🌍 Browser location received:', position);
                resolve({
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                console.error('🌍 Geolocation error:', error);
                console.error('🌍 Error code:', error.code);
                console.error('🌍 Error message:', error.message);

                // Create a new error with proper message and code
                const err = new Error(error.message || 'Unable to get location');
                err.code = error.code;

                // Add more specific messages
                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        err.message = 'Location permission denied. Please enable location in your browser settings.';
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        err.message = 'Location information unavailable. Please try again.';
                        break;
                    case 3: // TIMEOUT
                        err.message = 'Location request timed out. Please try again.';
                        break;
                    default:
                        err.message = error.message || 'Unable to get location';
                }

                reject(err);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};

/**
 * Reverse geocode coordinates to get city/country
 * Uses OpenStreetMap Nominatim API (free, no API key needed)
 */
export const reverseGeocode = async (longitude, latitude) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'NomadNet-Chat-App'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();
        const address = data.address || {};

        return {
            city: address.city || address.town || address.village || address.county || 'Unknown',
            country: address.country || 'Unknown',
            fullAddress: data.display_name
        };
    } catch (error) {
        console.error('Reverse geocode error:', error);
        return {
            city: 'Unknown',
            country: 'Unknown',
            fullAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        };
    }
};

export default {
    getMyLocation,
    updateMyLocation,
    toggleShareLocation,
    getUserLocation,
    getMultipleUsersLocations,
    getCurrentBrowserLocation,
    reverseGeocode
};
