// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import MapContainer from '../components/Dashboard/MapContainer';
import DetailDrawer from '../components/Dashboard/DetailDrawer';
import FilterPanel from '../components/Dashboard/FilterPanel';
import socketService from '../services/socketService';
import { getNearbyAll } from '../services/mapService';
import { getToken } from '../utils/authUtils';
import '../styles/dashboard.css';

const DashboardPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Map data
  const [nearbyData, setNearbyData] = useState({
    users: [],
    venues: [],
    marketplace: [],
    checkIns: []
  });

  // Filters
  const [filters, setFilters] = useState({
    users: true,
    venues: true,
    marketplace: true,
    checkIns: true
  });
  
  const [radius, setRadius] = useState(1000); // 1km default

  // Selected marker for detail drawer
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Get user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      console.log('📍 Requesting location permission...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          console.log('✅ Location obtained:', { longitude, latitude });
          
          setUserLocation({ longitude, latitude });
          setLocationError(null);
          setLoading(false);
        },
        (error) => {
          console.error('❌ Location error:', error.message);
          setLocationError(error.message);
          
          // Fallback to default location (e.g., New York)
          setUserLocation({ longitude: -74.006, latitude: 40.7128 });
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.error('❌ Geolocation not supported');
      setLocationError('Geolocation not supported');
      setUserLocation({ longitude: -74.006, latitude: 40.7128 });
      setLoading(false);
    }
  }, []);

  // Fetch nearby data when location is available
  useEffect(() => {
    if (!userLocation) return;

    const fetchNearbyData = async () => {
      try {
        console.log('🔍 Fetching nearby data...', { userLocation, radius });
        
        const types = Object.keys(filters)
          .filter(key => filters[key])
          .join(',');

        const data = await getNearbyAll(
          userLocation.longitude,
          userLocation.latitude,
          radius,
          types,
          50
        );

        console.log('✅ Nearby data received:', data.summary);
        setNearbyData(data.data);
      } catch (error) {
        console.error('❌ Error fetching nearby data:', error);
      }
    };

    fetchNearbyData();
  }, [userLocation, radius, filters]);

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    if (!userLocation) return;

    const token = getToken();
    if (!token) {
      console.warn('⚠️ No auth token, skipping socket connection');
      return;
    }

    console.log('🔌 Connecting to Socket.IO...');
    socketService.connect(token);

    // Join map area
    socketService.joinMapArea(
      userLocation.longitude,
      userLocation.latitude,
      radius
    );

    // Listen for real-time events
    socketService.on('map:checkin-created', (data) => {
      console.log('📍 New check-in:', data);
      setNearbyData(prev => ({
        ...prev,
        checkIns: [...prev.checkIns, data.data]
      }));
    });

    socketService.on('map:checkin-deleted', (data) => {
      console.log('🗑️ Check-in deleted:', data.checkInId);
      setNearbyData(prev => ({
        ...prev,
        checkIns: prev.checkIns.filter(c => c._id !== data.checkInId)
      }));
    });

    socketService.on('map:checkin-expired', (data) => {
      console.log('⏰ Check-in expired:', data.checkInId);
      setNearbyData(prev => ({
        ...prev,
        checkIns: prev.checkIns.filter(c => c._id !== data.checkInId)
      }));
    });

    socketService.on('map:marketplace-created', (data) => {
      console.log('🛍️ New marketplace item:', data);
      setNearbyData(prev => ({
        ...prev,
        marketplace: [...prev.marketplace, data.data]
      }));
    });

    socketService.on('map:venue-created', (data) => {
      console.log('🏢 New venue:', data);
      setNearbyData(prev => ({
        ...prev,
        venues: [...prev.venues, data.data]
      }));
    });

    socketService.on('map:user-entered', (data) => {
      console.log('👤 User entered area:', data);
      // Add user to map if not already present
      setNearbyData(prev => {
        const exists = prev.users.some(u => u._id === data.userId);
        if (exists) return prev;
        
        return {
          ...prev,
          users: [...prev.users, {
            _id: data.userId,
            type: 'user',
            username: data.username,
            displayName: data.displayName,
            avatar: data.avatar,
            profession: data.profession,
            location: data.location
          }]
        };
      });
    });

    socketService.on('map:user-left', (data) => {
      console.log('👋 User left area:', data.userId);
      setNearbyData(prev => ({
        ...prev,
        users: prev.users.filter(u => u._id !== data.userId)
      }));
    });

    // Cleanup
    return () => {
      console.log('🔌 Disconnecting socket...');
      socketService.disconnect();
    };
  }, [userLocation, radius]);

  const handleMarkerClick = (marker) => {
    console.log('🖱️ Marker clicked:', marker);
    setSelectedMarker(marker);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedMarker(null), 300);
  };

  const handleFilterChange = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    
    // Rejoin map area with new radius
    if (userLocation) {
      socketService.joinMapArea(
        userLocation.longitude,
        userLocation.latitude,
        newRadius
      );
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Getting your location...</p>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h2>Location Access Required</h2>
        <p>{locationError}</p>
        <p>Using default location (New York). Please enable location services for better experience.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <FilterPanel
        filters={filters}
        radius={radius}
        onFilterChange={handleFilterChange}
        onRadiusChange={handleRadiusChange}
        summary={{
          users: nearbyData.users.length,
          venues: nearbyData.venues.length,
          marketplace: nearbyData.marketplace.length,
          checkIns: nearbyData.checkIns.length
        }}
      />

      <MapContainer
        userLocation={userLocation}
        nearbyData={nearbyData}
        filters={filters}
        onMarkerClick={handleMarkerClick}
      />

      <DetailDrawer
        isOpen={isDrawerOpen}
        marker={selectedMarker}
        userLocation={userLocation}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default DashboardPage;