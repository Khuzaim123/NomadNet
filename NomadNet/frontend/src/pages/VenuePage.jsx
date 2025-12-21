// src/pages/venues/VenuesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  List, 
  Map, 
  Plus, 
  Search, 
  Filter,
  Loader,
  RefreshCw,
  Navigation
} from 'lucide-react';
import VenueCard from '../components/venues/VenueCard';
import VenueMap from '../components/venues/VenueMap';
import VenueFilters from '../components/venues/VenueFilters';
import { useVenues, useCategories } from '../hooks/useVenues';
import '../styles/venuePage.css';

const VenuesPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'map'
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const { 
    venues, 
    loading, 
    error, 
    filters, 
    setFilters, 
    refetch,
    fetchNearbyVenues 
  } = useVenues();
  
  const { categories } = useCategories();

  // Get user location
  const getUserLocation = useCallback(() => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Search nearby when location is available
  const handleSearchNearby = () => {
    if (userLocation) {
      fetchNearbyVenues(userLocation.longitude, userLocation.latitude, {
        radius: filters.radius || 5000
      });
    }
  };

  // Filter venues by search query
  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.address?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateVenue = () => {
    navigate('/venues/create');
  };

  const handleVenueClick = (venueId) => {
    navigate(`/venues/${venueId}`);
  };

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
            <p>Find the best spots to work, meet, and connect with fellow nomads</p>
          </div>

          <button className="create-venue-btn" onClick={handleCreateVenue}>
            <Plus size={20} />
            Add Venue
          </button>
        </div>

        {/* Search and Controls */}
        <div className="venues-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search venues, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="control-buttons">
            <button
              className={`control-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>

            <button
              className="control-btn"
              onClick={handleSearchNearby}
              disabled={!userLocation || locationLoading}
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
                <Map size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <VenueFilters
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Content */}
      <main className="venues-content">
        {loading ? (
          <div className="loading-state">
            <Loader className="spinner" size={40} />
            <p>Finding amazing places...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={refetch}>Try Again</button>
          </div>
        ) : viewMode === 'map' ? (
          <VenueMap
            venues={filteredVenues}
            userLocation={userLocation}
            onVenueClick={handleVenueClick}
          />
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
                  <p>Be the first to add a venue in this area!</p>
                  <button onClick={handleCreateVenue}>
                    <Plus size={18} />
                    Add Venue
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default VenuesPage;