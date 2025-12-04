// src/components/chat/LocationSearchInput.jsx (NEW FILE)
import React, { useState, useEffect, useRef } from 'react';

const LocationSearchInput = ({ onLocationSelect, initialValue = '', mapboxToken }) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const searchLocations = async (searchQuery) => {
    if (!mapboxToken) {
      console.error('Mapbox token not provided');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&types=place,locality,address,poi&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (feature) => {
    const location = {
      coordinates: feature.geometry.coordinates,
      name: feature.text,
      address: feature.place_name,
      placeType: feature.place_type?.[0]
    };
    
    setQuery(feature.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search for a location..."
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 0.75rem',
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.9375rem'
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            <div className="chat-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.5rem',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
          backdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {suggestions.map((feature, index) => (
            <button
              key={feature.id || index}
              type="button"
              onClick={() => handleSelectLocation(feature)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                border: 'none',
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                {feature.text}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {feature.place_name}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close suggestions */}
      {showSuggestions && (
        <div
          onClick={() => setShowSuggestions(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
};

export default LocationSearchInput;