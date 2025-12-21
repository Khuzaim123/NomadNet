// src/components/venues/VenueMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  Locate,
  Layers,
  X
} from 'lucide-react';
import '../../styles/VenueMap.css';
mapboxgl.accessToken ="pk.eyJ1Ijoia2h1emFpbSIsImEiOiJjbWh3em54YjQwNGJlMmtxdGl1c291cnIyIn0.DIIPNuDcjNaIT4NUZ_D0jQ";

console.log('REACT_APP_MAPBOX_TOKEN:', process.env.REACT_APP_MAPBOX_TOKEN);

if (!mapboxgl.accessToken) {
  console.error('REACT_APP_MAPBOX_TOKEN is missing. Check your .env file.');
}
const categoryColors = {
  cafe: '#f59e0b',
  coworking: '#6366f1',
  restaurant: '#ef4444',
  bar: '#8b5cf6',
  park: '#22c55e',
  library: '#3b82f6',
  hotel: '#ec4899',
  other: '#64748b'
};

const categoryIcons = {
  cafe: '☕',
  coworking: '💼',
  restaurant: '🍽️',
  bar: '🍺',
  park: '🌳',
  library: '📚',
  hotel: '🏨',
  other: '📍'
};

const VenueMap = ({ 
  venues = [], 
  userLocation, 
  onVenueClick, 
  selectedVenue,
  height = '100%'
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');
  const [previewVenue, setPreviewVenue] = useState(null);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    const initialCenter = userLocation 
      ? [userLocation.longitude, userLocation.latitude]
      : [-74.006, 40.7128]; // Default to NYC

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCenter,
      zoom: 13,
      pitch: 0,
      bearing: 0
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Create user location marker
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = `
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    `;

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);

  }, [userLocation, mapLoaded]);

  // Add venue markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each venue
    venues.forEach(venue => {
      if (!venue.location?.coordinates) return;

      const [lng, lat] = venue.location.coordinates;
      const color = categoryColors[venue.category] || categoryColors.other;
      const icon = categoryIcons[venue.category] || categoryIcons.other;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'venue-marker';
      el.style.backgroundColor = color;
      el.innerHTML = `<span class="marker-icon">${icon}</span>`;

      // Add click handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setPreviewVenue(venue);
        
        // Center map on venue
        map.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1000
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current);

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple venues
    if (venues.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      venues.forEach(venue => {
        if (venue.location?.coordinates) {
          bounds.extend(venue.location.coordinates);
        }
      });
      if (userLocation) {
        bounds.extend([userLocation.longitude, userLocation.latitude]);
      }
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }

  }, [venues, mapLoaded]);

  // Center on user location
  const centerOnUser = () => {
    if (!map.current || !userLocation) return;
    
    map.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 14,
      duration: 1000
    });
  };

  // Toggle map style
  const toggleMapStyle = () => {
    if (!map.current) return;
    
    const styles = {
      streets: 'mapbox://styles/mapbox/streets-v12',
      dark: 'mapbox://styles/mapbox/dark-v11',
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12'
    };

    const styleOrder = ['dark', 'streets', 'satellite'];
    const currentIndex = styleOrder.indexOf(mapStyle);
    const nextStyle = styleOrder[(currentIndex + 1) % styleOrder.length];
    
    setMapStyle(nextStyle);
    map.current.setStyle(styles[nextStyle]);
  };

  // Zoom controls
  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();

  // Handle venue preview click
  const handlePreviewClick = () => {
    if (previewVenue && onVenueClick) {
      onVenueClick(previewVenue._id);
    }
  };

  return (
    <div className="venue-map" style={{ height }}>
      <div ref={mapContainer} className="venue-map__container" />

      {/* Map Controls */}
      <div className="venue-map__controls">
        <button 
          className="map-control-btn"
          onClick={centerOnUser}
          disabled={!userLocation}
          title="Center on my location"
        >
          <Locate size={18} />
        </button>
        <button 
          className="map-control-btn"
          onClick={toggleMapStyle}
          title="Change map style"
        >
          <Layers size={18} />
        </button>
        <div className="zoom-controls">
          <button 
            className="map-control-btn"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            className="map-control-btn"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      </div>

      {/* Venue Preview Card */}
      {previewVenue && (
        <div className="venue-map__preview" onClick={handlePreviewClick}>
          <button 
            className="preview-close"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewVenue(null);
            }}
          >
            <X size={16} />
          </button>

          <div className="preview-content">
            {previewVenue.photos?.[0] ? (
              <img 
                src={previewVenue.photos[0].url} 
                alt={previewVenue.name}
                className="preview-image"
              />
            ) : (
              <div 
                className="preview-placeholder"
                style={{ backgroundColor: categoryColors[previewVenue.category] }}
              >
                {categoryIcons[previewVenue.category]}
              </div>
            )}

            <div className="preview-info">
              <span 
                className="preview-category"
                style={{ backgroundColor: categoryColors[previewVenue.category] }}
              >
                {categoryIcons[previewVenue.category]} {previewVenue.category}
              </span>
              <h4>{previewVenue.name}</h4>
              {previewVenue.address && (
                <p className="preview-address">
                  <MapPin size={12} />
                  {previewVenue.address.formatted || previewVenue.address.city}
                </p>
              )}
              {previewVenue.ratings?.overall > 0 && (
                <div className="preview-rating">
                  ⭐ {previewVenue.ratings.overall.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="venue-map__loading">
          <div className="map-loader" />
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default VenueMap;