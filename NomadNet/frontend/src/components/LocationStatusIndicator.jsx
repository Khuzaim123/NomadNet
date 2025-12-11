// src/components/LocationStatusIndicator.jsx
import React from 'react';
import { useLocation } from '../context/LocationContext';

const LocationStatusIndicator = () => {
    const {
        isTracking,
        locationPermission,
        currentLocation,
        locationInfo,
        requestLocationPermission
    } = useLocation();

    if (locationPermission === 'denied') {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                zIndex: 9999,
                fontSize: '14px',
                fontWeight: 600
            }}>
                <span>📍</span>
                <span>Location Disabled</span>
            </div>
        );
    }

    if (!isTracking) {
        return null; // Don't show if not tracking yet (during initial load)
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(16, 185, 129, 0.95)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
        }}
            onClick={() => {
                if (currentLocation && locationInfo) {
                    alert(`Current Location:\n${locationInfo.city}, ${locationInfo.country}\n\nCoordinates: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}\nAccuracy: ~${Math.round(currentLocation.accuracy)}m`);
                }
            }}
            title="Click for location details">
            <span style={{
                width: '8px',
                height: '8px',
                background: 'white',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
            }} />
            <span>📍 Location Active</span>
            {locationInfo && (
                <span style={{ opacity: 0.9, fontSize: '12px' }}>
                    ({locationInfo.city})
                </span>
            )}
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
};

export default LocationStatusIndicator;
