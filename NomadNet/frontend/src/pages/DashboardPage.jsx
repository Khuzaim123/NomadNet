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
  
  const [nearbyData, setNearbyData] = useState({
    users: [],
    venues: [],
    marketplace: [],
    checkIns: []
  });

  const [filters, setFilters] = useState({
    users: true,
    venues: true,
    marketplace: true,
    checkIns: true
  });
  
  const [radius, setRadius] = useState(1000);
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
      setLocationError('Geolocation not supported');
      setUserLocation({ longitude: -74.006, latitude: 40.7128 });
      setLoading(false);
    }
  }, []);

  // Fetch nearby data
  useEffect(() => {
    if (!userLocation) return;

    const fetchNearbyData = async () => {
      try {
        console.log('🔍 Fetching nearby data...', { userLocation, radius });
        
        const types = Object.keys(filters)
          .filter(key => filters[key])
          .map(key => key === 'checkIns' ? 'checkins' : key)
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

  // Connect to Socket.IO
  useEffect(() => {
    if (!userLocation) return;

    const token = getToken();
    if (!token) {
      console.warn('⚠️ No auth token, skipping socket connection');
      return;
    }

    console.log('🔌 Connecting to Socket.IO...');
    const socket = socketService.connect(token);

    if (!socket) {
      console.warn('⚠️ Socket connection failed');
      return;
    }

    // Wait for connection then join map area
    const handleConnect = () => {
      console.log('✅ Socket connected, joining map area...');
      socketService.joinMapArea(
        userLocation.longitude,
        userLocation.latitude,
        radius
      );
    };

    // If already connected
    if (socketService.isConnected()) {
      handleConnect();
    }

    // Listen for socket events directly on the socket instance
    socket.on('connect', handleConnect);

    socket.on('map:checkin-created', (data) => {
      console.log('📍 New check-in:', data);
      setNearbyData(prev => ({
        ...prev,
        checkIns: [...prev.checkIns, data.data || data]
      }));
    });

    socket.on('map:checkin-deleted', (data) => {
      console.log('🗑️ Check-in deleted:', data.checkInId);
      setNearbyData(prev => ({
        ...prev,
        checkIns: prev.checkIns.filter(c => c._id !== data.checkInId)
      }));
    });

    socket.on('map:checkin-expired', (data) => {
      console.log('⏰ Check-in expired:', data.checkInId);
      setNearbyData(prev => ({
        ...prev,
        checkIns: prev.checkIns.filter(c => c._id !== data.checkInId)
      }));
    });

    socket.on('map:marketplace-created', (data) => {
      console.log('🛍️ New marketplace item:', data);
      setNearbyData(prev => ({
        ...prev,
        marketplace: [...prev.marketplace, data.data || data]
      }));
    });

    socket.on('map:venue-created', (data) => {
      console.log('🏢 New venue:', data);
      setNearbyData(prev => ({
        ...prev,
        venues: [...prev.venues, data.data || data]
      }));
    });

    socket.on('map:user-entered', (data) => {
      console.log('👤 User entered area:', data);
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

    socket.on('map:user-left', (data) => {
      console.log('👋 User left area:', data.userId);
      setNearbyData(prev => ({
        ...prev,
        users: prev.users.filter(u => u._id !== data.userId)
      }));
    });

    socket.on('map:location-updated', (data) => {
      console.log('📍 User location updated:', data);
      setNearbyData(prev => ({
        ...prev,
        users: prev.users.map(u => 
          u._id === data.userId 
            ? { ...u, location: data.location }
            : u
        )
      }));
    });

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up socket listeners...');
      socket.off('connect', handleConnect);
      socket.off('map:checkin-created');
      socket.off('map:checkin-deleted');
      socket.off('map:checkin-expired');
      socket.off('map:marketplace-created');
      socket.off('map:venue-created');
      socket.off('map:user-entered');
      socket.off('map:user-left');
      socket.off('map:location-updated');
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
    
    if (userLocation && socketService.isConnected()) {
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

  return (
    <div className="dashboard-page">
      {locationError && (
        <div className="location-warning">
          ⚠️ Using default location. Enable location services for accurate results.
        </div>
      )}

      <FilterPanel
        filters={filters}
        radius={radius}
        onFilterChange={handleFilterChange}
        onRadiusChange={handleRadiusChange}
        summary={{
          users: nearbyData.users?.length || 0,
          venues: nearbyData.venues?.length || 0,
          marketplace: nearbyData.marketplace?.length || 0,
          checkIns: nearbyData.checkIns?.length || 0
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