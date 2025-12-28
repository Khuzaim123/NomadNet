// src/context/LocationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { updateMyLocation, getCurrentBrowserLocation, reverseGeocode } from '../services/locationService';

const LocationContext = createContext();

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within LocationProvider');
    }
    return context;
};

export const LocationProvider = ({ children }) => {
    // Check authentication via localStorage
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState('prompt');
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState(null);
    const [locationInfo, setLocationInfo] = useState(null);

    const watchIdRef = useRef(null);
    const lastUpdateRef = useRef(null);
    const UPDATE_THRESHOLD = 100; // meters
    const UPDATE_INTERVAL = 60000; // 1 minute

    // Check authentication from localStorage
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const user = localStorage.getItem('user') || sessionStorage.getItem('user');
            setIsAuthenticated(!!token && !!user);
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    // Calculate distance between two coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    // Update location on backend
    const updateBackendLocation = useCallback(async (longitude, latitude) => {
        if (!isAuthenticated) {
            console.log('📍 Skipping backend update - not authenticated');
            return;
        }

        try {
            console.log('📍 Getting geocode for coordinates...');
            const geocode = await reverseGeocode(longitude, latitude);
            console.log('📍 Geocode result:', geocode);

            console.log('📍 Updating backend location...');
            await updateMyLocation({
                longitude,
                latitude,
                city: geocode.city,
                country: geocode.country
            });

            setLocationInfo(geocode);
            console.log(`📍 Location updated: ${geocode.city}, ${geocode.country}`);
        } catch (err) {
            console.error('📍 Failed to update backend location:', err);
        }
    }, [isAuthenticated]);

    // Handle position update
    const handlePositionUpdate = useCallback((position) => {
        console.log('📍 handlePositionUpdate called with:', position);
        const { longitude, latitude } = position.coords;

        setCurrentLocation({
            longitude,
            latitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
        });
        console.log(`📍 Current location set: [${longitude}, ${latitude}]`);

        let shouldUpdate = false;

        if (!lastUpdateRef.current) {
            shouldUpdate = true;
            console.log('📍 First update - will update backend');
        } else {
            const { longitude: lastLon, latitude: lastLat, timestamp: lastTime } = lastUpdateRef.current;
            const distance = calculateDistance(lastLat, lastLon, latitude, longitude);
            const timeSinceUpdate = Date.now() - lastTime;

            console.log(`📍 Distance moved: ${distance}m, Time since last: ${timeSinceUpdate}ms`);

            if (distance > UPDATE_THRESHOLD || timeSinceUpdate > UPDATE_INTERVAL) {
                shouldUpdate = true;
                console.log('📍 Threshold met - will update backend');
            }
        }

        if (shouldUpdate) {
            updateBackendLocation(longitude, latitude);
            lastUpdateRef.current = {
                longitude,
                latitude,
                timestamp: Date.now()
            };
        }

        setError(null);
    }, [updateBackendLocation]);

    // Handle position error
    const handlePositionError = useCallback((error) => {
        console.error('📍 Position error:', error);
        let message = 'Unable to get location';
        let permission = 'denied';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied';
                permission = 'denied';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable';
                permission = 'granted';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out';
                permission = 'granted';
                break;
        }

        setError(message);
        setLocationPermission(permission);
        console.warn('📍 Location error:', message);
    }, []);

    // Start tracking location
    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported by your browser');
            console.error('📍 Geolocation not supported');
            return;
        }

        if (watchIdRef.current) {
            console.log('📍 Location tracking already active');
            return;
        }

        console.log('📍 Starting location tracking...');
        setIsTracking(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            handlePositionError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
        console.log('📍 Watch ID:', watchIdRef.current);
    }, [handlePositionUpdate, handlePositionError]);

    // Stop tracking location
    const stopTracking = useCallback(() => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setIsTracking(false);
            console.log('📍 Location tracking stopped');
        }
    }, []);

    // Request location permission and start tracking
    const requestLocationPermission = useCallback(async () => {
        console.log('📍 requestLocationPermission called');
        try {
            console.log('📍 Calling getCurrentBrowserLocation...');
            const position = await getCurrentBrowserLocation();
            console.log('📍 Got position:', position);

            setLocationPermission('granted');
            console.log('📍 Permission set to granted');

            handlePositionUpdate({
                coords: position,
                timestamp: Date.now()
            });
            console.log('📍 Position update handled');

            startTracking();
            console.log('📍 Tracking started');
        } catch (err) {
            console.error('📍 Error in requestLocationPermission:', err);
            handlePositionError(err);
            throw err; // Re-throw so LocationSender can catch it
        }
    }, [startTracking, handlePositionUpdate, handlePositionError]);

    // Auto-start tracking when user logs in
    // DISABLED: Pages now handle their own location via useGeolocation hook
    // This prevents duplicate location requests and confusing error messages
    /*
    useEffect(() => {
        if (isAuthenticated && !isTracking) {
            const timer = setTimeout(() => {
                console.log('📍 Auto-starting location tracking for authenticated user');
                requestLocationPermission();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isTracking, requestLocationPermission]);
    */

    // Cleanup on unmount or logout
    useEffect(() => {
        if (!isAuthenticated) {
            stopTracking();
        }

        return () => {
            stopTracking();
        };
    }, [isAuthenticated, stopTracking]);

    const value = {
        currentLocation,
        locationPermission,
        isTracking,
        error,
        locationInfo,
        startTracking,
        stopTracking,
        requestLocationPermission
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

export default LocationContext;
