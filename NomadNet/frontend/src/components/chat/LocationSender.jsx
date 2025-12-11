// src/components/chat/LocationSender.jsx
import React, { useState, useEffect } from 'react';

const LocationSender = ({ onClose, onSend }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetLocation = () => {
    console.log('🔘 Get My Location button clicked');

    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    // Use SAME pattern as Dashboard - direct API call, no Promise wrapper
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Location obtained:', position.coords);
        const { longitude, latitude, accuracy } = position.coords;

        setCurrentLocation({
          longitude,
          latitude,
          accuracy
        });

        // Try to get location name
        reverseGeocode(longitude, latitude);

        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ Location error:', error);
        let message = 'Unable to get location';

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            message = 'Location permission denied. Please enable in browser settings.';
            break;
          case 2: // POSITION_UNAVAILABLE
            message = 'Location unavailable. Please try again.';
            break;
          case 3: // TIMEOUT
            message = 'Location request timed out. Please try again.';
            break;
        }

        setError(message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const reverseGeocode = async (longitude, latitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        {
          headers: {
            'User-Agent': 'NomadNet-Chat-App'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        const cityName = address.city || address.town || address.village || '';
        const countryName = address.country || '';

        if (cityName && countryName) {
          setLocationName(`${cityName}, ${countryName}`);
        }
      }
    } catch (err) {
      console.log('Geocoding failed, using coordinates only');
    }
  };

  const handleSend = () => {
    if (!currentLocation) {
      alert('Please get your location first');
      return;
    }

    onSend({
      location: {
        type: 'Point',
        coordinates: [currentLocation.longitude, currentLocation.latitude],
        name: locationName || 'Shared location'
      },
      content: locationName || 'Shared location'
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>📍 Share Location</h2>
          <button onClick={onClose} className="modal-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {!currentLocation ? (
            <div>
              <div
                style={{
                  border: '2px dashed var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '3rem',
                  textAlign: 'center',
                  background: 'rgba(30, 41, 59, 0.2)'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Share Your Location
                </p>
                <p style={{ fontSize: '0.875rem', color: error ? 'var(--error)' : 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {error || 'Get your current location to share with the conversation'}
                </p>
                <button
                  onClick={handleGetLocation}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: loading ? 'var(--gray-light)' : 'var(--gradient-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? '🔍 Getting Location...' : '📍 Get My Location'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <svg width="20" height="20" fill="none" stroke="var(--success)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--success)', fontWeight: 700 }}>
                    Location Ready
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                  {locationName || 'Location detected'}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
                </p>
                {currentLocation.accuracy && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Accuracy: ~{Math.round(currentLocation.accuracy)}m
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Location Name (Optional)
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Coffee Shop, Central Park..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleGetLocation}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: loading ? 'wait' : 'pointer',
                    flex: 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? 'Updating...' : '🔄 Update Location'}
                </button>
                <button
                  onClick={handleSend}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flex: 1,
                    transition: 'all 0.2s'
                  }}
                >
                  📤 Share Location
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSender;