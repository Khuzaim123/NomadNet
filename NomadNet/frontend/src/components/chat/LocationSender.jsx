// src/components/chat/LocationSender.jsx
import React, { useState } from 'react';

const LocationSender = ({ onClose, onSend }) => {
  const [coordinates, setCoordinates] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        setCoordinates(coords);
        setLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get your location. Please enable location access in your browser.');
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!coordinates) {
      alert('Please get your current location first');
      return;
    }

    const name = locationName.trim() || 'My Location';
    onSend({
      coordinates,
      locationName: name,
      content: `Shared location: ${name}`
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>📍 Share Location</h2>
          <button onClick={onClose} className="modal-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Get Location Button */}
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  background: coordinates ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  border: `2px solid ${coordinates ? 'var(--success)' : 'var(--primary)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: coordinates ? 'var(--success)' : 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: loadingLocation ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                {loadingLocation ? (
                  <>
                    <div className="chat-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                    Getting your location...
                  </>
                ) : coordinates ? (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Location Captured
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Get Current Location
                  </>
                )}
              </button>
            </div>

            {/* Location Name */}
            {coordinates && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Location Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., My Home, Office, Park"
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
                
                <div style={{ 
                  padding: '0.75rem',
                  background: 'rgba(30, 41, 59, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Coordinates:
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!coordinates}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: coordinates ? 'var(--gradient-primary)' : 'var(--gray-light)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: coordinates ? 'pointer' : 'not-allowed',
                  opacity: coordinates ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
              >
                📍 Send Location
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationSender;