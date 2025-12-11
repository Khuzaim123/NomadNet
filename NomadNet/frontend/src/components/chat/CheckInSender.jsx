// src/components/chat/CheckInSender.jsx (Updated)
import React, { useState, useEffect } from 'react';
import { getMyActiveCheckIn } from '../../services/checkInService';
import { getNearbyVenues } from '../../services/venueService';
import LocationSearchInput from './LocationSearchInput';
import { MAPBOX_TOKEN } from '../../config/mapbox';

const CheckInSender = ({ onClose, onSend }) => {
  const [mode, setMode] = useState('new');
  const [searchMode, setSearchMode] = useState('current'); // 'current' or 'search'
  const [existingCheckIn, setExistingCheckIn] = useState(null);
  const [isInvitation, setIsInvitation] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [venueName, setVenueName] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    loadExistingCheckIn();
  }, []);

  const loadExistingCheckIn = async () => {
    try {
      setLoadingExisting(true);
      const response = await getMyActiveCheckIn();
      console.log('📥 getMyActiveCheckIn response:', response);
      console.log('📥 response.data:', response?.data);

      // Handle different response structures
      const checkInData = response?.data?.checkIn || response?.data;
      console.log('✅ Extracted checkIn:', checkInData);

      if (checkInData && checkInData._id) {
        setExistingCheckIn(checkInData);
      } else {
        console.log('⚠️ No valid check-in found in response');
      }
    } catch (error) {
      console.log('No active check-in found:', error);
    } finally {
      setLoadingExisting(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        setCoordinates(coords);
        setAddress(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        setLoadingLocation(false);

        loadNearbyVenues(coords[0], coords[1]);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Failed to get your location. ';

        if (error.code === 1) {
          errorMessage += 'Please enable location access in your browser settings.';
        } else if (error.code === 2) {
          errorMessage += 'Location information is unavailable.';
        } else if (error.code === 3) {
          errorMessage += 'Location request timed out.';
        }

        alert(errorMessage);
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleLocationSearch = (location) => {
    setCoordinates(location.coordinates);
    setVenueName(location.name);
    setAddress(location.address);
    loadNearbyVenues(location.coordinates[0], location.coordinates[1]);
  };

  const loadNearbyVenues = async (lng, lat) => {
    try {
      setLoadingVenues(true);
      const response = await getNearbyVenues(lng, lat, 500, null, null, null, 10);
      const venues = response?.data || response || [];
      setNearbyVenues(Array.isArray(venues) ? venues : []);
    } catch (error) {
      console.error('Failed to load nearby venues:', error);
      setNearbyVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleVenueSelect = (venue) => {
    if (selectedVenue?._id === venue._id) {
      setSelectedVenue(null);
      setVenueName('');
    } else {
      setSelectedVenue(venue);
      setVenueName(venue.name);
      if (venue.address?.formatted) {
        setAddress(venue.address.formatted);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'existing' && existingCheckIn) {
      const content = existingCheckIn.note || existingCheckIn.venue?.name || 'Shared check-in';
      const sendData = {
        checkInId: existingCheckIn._id,
        isInvitation,
        content
      };
      console.log('📍 CheckInSender - sending existing check-in:', sendData);
      onSend(sendData);
    } else {
      if (!coordinates) {
        alert('Please select a location first');
        return;
      }

      const content = note.trim() || venueName.trim() || selectedVenue?.name || 'Shared my location';

      const sendData = {
        coordinates,
        venueId: selectedVenue?._id,
        venueName: venueName.trim() || selectedVenue?.name,
        address: address.trim(),
        note: note.trim(),
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        isInvitation,
        content
      };
      console.log('📍 CheckInSender - sending new location:', sendData);
      onSend(sendData);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>📍 Share Check-in</h2>
          <button onClick={onClose} className="modal-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Mode Toggle */}
          {!loadingExisting && existingCheckIn && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(30, 41, 59, 0.4)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: mode === 'existing' ? 'var(--gradient-primary)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: mode === 'existing' ? 'white' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Share Existing
                </button>
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: mode === 'new' ? 'var(--gradient-primary)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: mode === 'new' ? 'white' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  New Location
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Existing Check-in Mode */}
            {mode === 'existing' && existingCheckIn && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Your Active Check-in
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {existingCheckIn.venue?.name || existingCheckIn.address || 'Current Location'}
                </div>
                {existingCheckIn.note && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    "{existingCheckIn.note}"
                  </div>
                )}
              </div>
            )}

            {/* New Location Mode */}
            {mode === 'new' && (
              <>
                {/* Location Selection Method Toggle */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(30, 41, 59, 0.4)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                    <button
                      type="button"
                      onClick={() => setSearchMode('current')}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        background: searchMode === 'current' ? 'var(--gradient-primary)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: searchMode === 'current' ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      📍 Current Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode('search')}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        background: searchMode === 'search' ? 'var(--gradient-primary)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: searchMode === 'search' ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      🔍 Search Location
                    </button>
                  </div>
                </div>

                {/* Current Location Button */}
                {searchMode === 'current' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Get Your Current Location
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={loadingLocation}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: coordinates ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        border: `2px solid ${coordinates ? 'var(--success)' : 'var(--primary)'}`,
                        borderRadius: 'var(--radius-md)',
                        color: coordinates ? 'var(--success)' : 'var(--primary)',
                        fontWeight: 600,
                        cursor: loadingLocation ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {loadingLocation ? (
                        <>
                          <div className="chat-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                          Getting location...
                        </>
                      ) : coordinates ? (
                        <>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Location captured
                        </>
                      ) : (
                        <>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Get Current Location
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Search Location */}
                {searchMode === 'search' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Search for a Location
                    </label>
                    <LocationSearchInput
                      onLocationSelect={handleLocationSearch}
                      mapboxToken={MAPBOX_TOKEN}
                    />
                  </div>
                )}

                {/* Nearby Venues */}
                {coordinates && nearbyVenues.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Nearby Venues (Optional)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {nearbyVenues.map((venue) => (
                        <button
                          key={venue._id}
                          type="button"
                          onClick={() => handleVenueSelect(venue)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: selectedVenue?._id === venue._id ? 'var(--gradient-primary)' : 'rgba(30, 41, 59, 0.4)',
                            border: `1px solid ${selectedVenue?._id === venue._id ? 'var(--primary)' : 'var(--border-light)'}`,
                            borderRadius: '20px',
                            color: selectedVenue?._id === venue._id ? 'white' : 'var(--text-primary)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {venue.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loadingVenues && (
                  <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <div className="chat-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', margin: '0 auto 0.5rem' }} />
                    Loading nearby venues...
                  </div>
                )}

                {/* Custom Venue Name */}
                {coordinates && !selectedVenue && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Place Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="e.g., Cool Café, My Apartment"
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
                )}

                {/* Note */}
                {coordinates && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What are you doing here?"
                      rows={2}
                      maxLength={200}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9375rem',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                      {note.length}/200
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Invitation Toggle */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                padding: '0.75rem',
                background: isInvitation ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                border: `1px solid ${isInvitation ? '#ec4899' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={isInvitation}
                  onChange={(e) => setIsInvitation(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: '#ec4899'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    🎉 Send as invitation to meet up
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Invite them to join you at this location
                  </div>
                </div>
              </label>
            </div>

            {/* Duration (if invitation) */}
            {isInvitation && (mode === 'new' ? coordinates : existingCheckIn) && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  How long will you be there?
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[30, 60, 120, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEstimatedDuration(mins.toString())}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: estimatedDuration === mins.toString() ? 'var(--gradient-primary)' : 'rgba(30, 41, 59, 0.4)',
                        border: `1px solid ${estimatedDuration === mins.toString() ? 'var(--primary)' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: estimatedDuration === mins.toString() ? 'white' : 'var(--text-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
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
                disabled={mode === 'new' ? !coordinates : !existingCheckIn}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: (mode === 'new' ? coordinates : existingCheckIn) ? 'var(--gradient-primary)' : 'var(--gray-light)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: (mode === 'new' ? coordinates : existingCheckIn) ? 'pointer' : 'not-allowed',
                  opacity: (mode === 'new' ? coordinates : existingCheckIn) ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
              >
                {isInvitation ? '🎉 Send Invitation' : '📍 Share Check-in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckInSender;