// src/components/Dashboard/MapContainer.jsx
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_ZOOM, MARKER_COLORS } from '../../config/mapbox';

mapboxgl.accessToken = MAPBOX_TOKEN;

const MapContainer = ({ userLocation, nearbyData, filters, onMarkerClick }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!userLocation || mapRef.current) return;

    console.log('🗺️ Initializing map...');

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES.DARK,
      center: [userLocation.longitude, userLocation.latitude],
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.addControl(geolocateControl, 'top-right');

    // Add scale
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.on('load', () => {
      console.log('✅ Map loaded');
      setMapLoaded(true);
      
      // Add user location marker
      addUserLocationMarker(map, userLocation);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userLocation]);

  // Add user location marker
  const addUserLocationMarker = (map, location) => {
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = `
      <div class="pulse-ring"></div>
      <div class="user-marker-dot"></div>
    `;

    new mapboxgl.Marker(el)
      .setLngLat([location.longitude, location.latitude])
      .addTo(map);
  };

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const map = mapRef.current;

    // Add user markers
    if (filters.users) {
      nearbyData.users.forEach(user => {
        const marker = createMarker(user, 'user', map);
        markersRef.current.push(marker);
      });
    }

    // Add venue markers
    if (filters.venues) {
      nearbyData.venues.forEach(venue => {
        const marker = createMarker(venue, 'venue', map);
        markersRef.current.push(marker);
      });
    }

    // Add marketplace markers
    if (filters.marketplace) {
      nearbyData.marketplace.forEach(item => {
        const marker = createMarker(item, 'marketplace', map);
        markersRef.current.push(marker);
      });
    }

    // Add check-in markers
    if (filters.checkIns) {
      nearbyData.checkIns.forEach(checkIn => {
        const marker = createMarker(checkIn, 'checkin', map);
        markersRef.current.push(marker);
      });
    }

    console.log(`📍 Added ${markersRef.current.length} markers to map`);
  }, [nearbyData, filters, mapLoaded]);

  // Create marker element
  const createMarker = (data, type, map) => {
    const el = document.createElement('div');
    el.className = `custom-marker ${type}-marker`;
    
    let icon = '';
    let color = '';
    
    switch (type) {
      case 'user':
        icon = '👤';
        color = MARKER_COLORS.USER;
        el.innerHTML = `
          <div class="marker-pin" style="background: ${color};">
            ${icon}
          </div>
          <div class="marker-label">${data.displayName}</div>
        `;
        break;
      case 'venue':
        icon = '🏢';
        color = MARKER_COLORS.VENUE;
        el.innerHTML = `
          <div class="marker-pin" style="background: ${color};">
            ${icon}
          </div>
          <div class="marker-label">${data.name}</div>
        `;
        break;
      case 'marketplace':
        icon = '🛍️';
        color = MARKER_COLORS.MARKETPLACE;
        el.innerHTML = `
          <div class="marker-pin" style="background: ${color};">
            ${icon}
          </div>
          <div class="marker-label">${data.title}</div>
        `;
        break;
      case 'checkin':
        icon = '📍';
        color = MARKER_COLORS.CHECKIN;
        const username = data.user?.displayName || data.user?.username || 'User';
        el.innerHTML = `
          <div class="marker-pin" style="background: ${color};">
            ${icon}
          </div>
          <div class="marker-label">${username}</div>
        `;
        break;
    }

    el.addEventListener('click', () => {
      onMarkerClick({ ...data, markerType: type });
    });

    const marker = new mapboxgl.Marker(el)
      .setLngLat([data.location.coordinates[0], data.location.coordinates[1]])
      .addTo(map);

    return marker;
  };

  return (
    <div className="map-container-wrapper">
      <div ref={mapContainerRef} className="map-container" />
      
      {!mapLoaded && (
        <div className="map-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default MapContainer;