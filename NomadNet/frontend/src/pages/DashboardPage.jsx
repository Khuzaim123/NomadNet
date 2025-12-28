// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  List,
  Map as MapIcon,
  Search,
  Filter as FilterIcon,
  Loader,
  RefreshCw,
  Navigation
} from 'lucide-react';

import MapContainer from '../components/Dashboard/MapContainer';
import DetailDrawer from '../components/Dashboard/DetailDrawer';

import VenueCard from '../components/venues/VenueCard';
import VenueFilters from '../components/venues/VenueFilters';
import { useVenues, useCategories } from '../hooks/useVenues';
import useGeolocation from '../hooks/useGeolocation';

import socketService from '../services/socketService';
import { getNearbyAll } from '../services/mapService';
import { getToken } from '../utils/authUtils';
import { generateDummyUsers, generateDummyVenues } from '../services/dummyDataService';

import '../styles/venuePage.css';
import '../styles/dashboard.css';

const DashboardPage = () => {
  const navigate = useNavigate();

  // ---------- Venues UI state ----------
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'grid'
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    venues,
    loading: venuesLoading,
    error,
    filters,
    setFilters,
    refetch,
    fetchNearbyVenues
  } = useVenues();

  const { categories } = useCategories();

  // ---------- Location via useGeolocation ----------
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const {
    location,
    loading: geoLoading,
    error: geoError
  } = useGeolocation({ watch: true });

  useEffect(() => {
    if (location) {
      setUserLocation({
        longitude: location.longitude,
        latitude: location.latitude
      });
      setLocationError(null);
    } else if (geoError) {
      console.error('❌ Geolocation error:', geoError);
      setLocationError(geoError);
      // Don't set a fallback location - let userLocation remain null
      // This ensures we only show venues when we have the user's REAL location
    }
  }, [location, geoError]);

  const loading = geoLoading && !userLocation;

  // ---------- Map + nearby data ----------
  const [nearbyData, setNearbyData] = useState({
    users: [],
    venues: [],
    marketplace: [],
    checkIns: []
  });

  const [mapFilters] = useState({
    users: true,
    venues: true,
    marketplace: true,
    checkIns: true
  });

  const [radius] = useState(1000);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch nearby data (venues + check-ins + users/marketplace via mapService)
  useEffect(() => {
    if (!userLocation) return;

    const fetchNearbyData = async () => {
      try {
        const types = Object.keys(mapFilters)
          .filter(key => mapFilters[key])
          .map(key => (key === 'checkIns' ? 'checkins' : key))
          .join(',');

        const data = await getNearbyAll(
          userLocation.longitude,
          userLocation.latitude,
          radius,
          types,
          50
        );

        // Generate dummy users near the current location
        const dummyUsers = generateDummyUsers(
          userLocation.longitude,
          userLocation.latitude,
          8, // Generate 8 dummy users
          500 // Within 500 meters
        );

        // Generate dummy venues near the current location
        const dummyVenues = generateDummyVenues(
          userLocation.longitude,
          userLocation.latitude,
          12, // Generate 12 dummy venues
          1000 // Within 1000 meters
        );

        // Merge dummy users and venues with real data
        const mergedData = {
          ...data.data,
          users: [...(data.data.users || []), ...dummyUsers],
          venues: [...(data.data.venues || []), ...dummyVenues]
        };

        console.log(`📍 Added ${dummyUsers.length} dummy users to the map`);
        console.log(`🏢 Added ${dummyVenues.length} dummy venues to the map`);

        // Expecting data.data = { users, venues, marketplace, checkIns }
        setNearbyData(mergedData);
      } catch (error) {
        console.error('❌ Error fetching nearby data:', error);
      }
    };

    fetchNearbyData();
  }, [userLocation, radius, mapFilters]);

  // ---------- Socket.IO for realtime updates ----------
  useEffect(() => {
    if (!userLocation) return;

    const token = getToken();
    if (!token) {
      console.warn('⚠️ No auth token, skipping socket connection');
      return;
    }

    const socket = socketService.connect(token);
    if (!socket) {
      console.warn('⚠️ Socket connection failed');
      return;
    }

    const handleConnect = () => {
      socketService.joinMapArea(
        userLocation.longitude,
        userLocation.latitude,
        radius
      );
    };

    if (socketService.isConnected()) {
      handleConnect();
    }

    socket.on('connect', handleConnect);

    // Check-ins
    socket.on('map:checkin-created', data => {
      setNearbyData(prev => ({
        ...prev,
        checkIns: [...prev.checkIns, data.data || data]
      }));
    });

    socket.on('map:checkin-deleted', data => {
      setNearbyData(prev => ({
        ...prev,
        checkIns: prev.checkIns.filter(c => c._id !== data.checkInId)
      }));
    });

    socket.on('map:checkin-expired', data => {
      setNearbyData(prev => ({
        ...prev,
        checkIns: prev.checkIns.filter(c => c._id !== data.checkInId)
      }));
    });

    // Marketplace
    socket.on('map:marketplace-created', data => {
      setNearbyData(prev => ({
        ...prev,
        marketplace: [...prev.marketplace, data.data || data]
      }));
    });

    // Users entering/leaving/updating
    socket.on('map:user-entered', data => {
      setNearbyData(prev => {
        const exists = prev.users.some(u => u._id === data.userId);
        if (exists) return prev;
        return {
          ...prev,
          users: [
            ...prev.users,
            {
              _id: data.userId,
              type: 'user',
              username: data.username,
              displayName: data.displayName,
              avatar: data.avatar,
              profession: data.profession,
              location: data.location
            }
          ]
        };
      });
    });

    socket.on('map:user-left', data => {
      setNearbyData(prev => ({
        ...prev,
        users: prev.users.filter(u => u._id !== data.userId)
      }));
    });

    socket.on('map:location-updated', data => {
      setNearbyData(prev => ({
        ...prev,
        users: prev.users.map(u =>
          u._id === data.userId ? { ...u, location: data.location } : u
        )
      }));
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('map:checkin-created');
      socket.off('map:checkin-deleted');
      socket.off('map:checkin-expired');
      socket.off('map:marketplace-created');
      socket.off('map:user-entered');
      socket.off('map:user-left');
      socket.off('map:location-updated');
    };
  }, [userLocation, radius]);

  // ---------- Map handlers ----------
  const handleMarkerClick = marker => {
    setSelectedMarker(marker);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedMarker(null), 300);
  };

  // ---------- Navigation / view handlers ----------
  const handleViewVenue = venueId => navigate(`/venues/${venueId}`);
  const handleViewMarketplace = () => navigate('/marketplace');
  const handleViewProfile = username => navigate(`/profile/${username}`);
  const handleVenueClick = venueId => handleViewVenue(venueId);

  // "Nearby" for the Venues list hook
  const handleSearchNearby = () => {
    if (userLocation) {
      fetchNearbyVenues(userLocation.longitude, userLocation.latitude, {
        radius: filters.radius || 5000
      });
    }
  };

  // Filter venues list by search
  const filteredVenues = venues.filter(
    venue =>
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.address?.city
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Same UX as before: show "Getting your location...\" until geolocation finishes
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Getting your location...</p>
        {locationError && (
          <div style={{ marginTop: '1rem', color: '#ef4444' }}>
            <p>{locationError}</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Please enable location permissions to see nearby venues
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="venues-page">
      {/* Header */}
      <header className="venues-header">
        <div className="venues-header-content">
          <div className="venues-title-section">
            <h1>
              <MapPin className="title-icon" />
              Discover Places
            </h1>
            <p>
              Find the best spots to work, meet, and connect with fellow
              nomads
            </p>
          </div>

          {/* Removed "Add Venue" button – venues are read-only now */}
        </div>

        {/* Search + controls */}
        <div className="venues-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search venues, cities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="control-buttons">
            <button
              className={`control-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon size={18} />
              Filters
            </button>

            <button
              className="control-btn"
              onClick={handleSearchNearby}
              disabled={!userLocation || loading}
            >
              <Navigation size={18} />
              Nearby
            </button>

            <button className="control-btn" onClick={refetch}>
              <RefreshCw size={18} />
            </button>

            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <List size={18} />
              </button>
              <button
                className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
              >
                <MapIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Venues filters panel */}
      {showFilters && (
        <VenueFilters
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Main content */}
      <main className="venues-content">
        {viewMode === 'map' ? (
          <>
            {locationError && (
              <div className="location-warning">
                ⚠️ Using default location. Enable location services for
                accurate results.
              </div>
            )}

            <div className="venues-stats">
              <span>{nearbyData.venues?.length || 0} venues nearby</span>
              {userLocation && (
                <span className="location-badge">
                  <Navigation size={14} />
                  Location enabled
                </span>
              )}
            </div>

            {/* Map section */}
            <div className="dashboard-map-section">
              <MapContainer
                userLocation={userLocation}
                nearbyData={nearbyData}
                filters={mapFilters}
                onMarkerClick={handleMarkerClick}
              />
            </div>

            <DetailDrawer
              isOpen={isDrawerOpen}
              marker={selectedMarker}
              userLocation={userLocation}
              onClose={handleCloseDrawer}
              onViewVenue={handleViewVenue}
              onViewProfile={handleViewProfile}
              onNavigateToMarketplace={handleViewMarketplace}
            />
          </>
        ) : (
          <>
            {venuesLoading ? (
              <div className="loading-state">
                <Loader className="spinner" size={40} />
                <p>Finding amazing places...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={refetch}>Try Again</button>
              </div>
            ) : (
              <>
                <div className="venues-stats">
                  <span>{filteredVenues.length} venues found</span>
                  {userLocation && (
                    <span className="location-badge">
                      <Navigation size={14} />
                      Location enabled
                    </span>
                  )}
                </div>

                <div className={`venues-grid ${viewMode}`}>
                  {filteredVenues.length > 0 ? (
                    filteredVenues.map(venue => (
                      <VenueCard
                        key={venue._id}
                        venue={venue}
                        onClick={() => handleVenueClick(venue._id)}
                        userLocation={userLocation}
                      />
                    ))
                  ) : (
                    <div className="empty-state">
                      <MapPin size={48} />
                      <h3>No venues found</h3>
                      <p>
                        Try adjusting your filters or searching in a
                        different area.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;