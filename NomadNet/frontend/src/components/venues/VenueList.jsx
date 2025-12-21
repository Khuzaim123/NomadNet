// src/components/venues/VenueList.jsx
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  MapPin,
  Loader,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import VenueCard from './VenueCard';
import './VenueList.css';

const CATEGORIES = [
  { value: '', label: 'All Categories', icon: '🏢' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
  { value: 'coworking', label: 'Coworking', icon: '💼' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'bar', label: 'Bar', icon: '🍺' },
  { value: 'park', label: 'Park', icon: '🌳' },
  { value: 'library', label: 'Library', icon: '📚' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'other', label: 'Other', icon: '📍' },
];

const AMENITIES = [
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'power_outlets', label: 'Power', icon: '🔌' },
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'quiet', label: 'Quiet', icon: '🤫' },
  { value: 'air_conditioning', label: 'A/C', icon: '❄️' },
  { value: 'outdoor_seating', label: 'Outdoor', icon: '🌤️' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
];

const VenueList = ({ 
  venues, 
  loading, 
  error, 
  onRefresh,
  onVenueSelect,
  onFilterChange,
  showFilters = true,
  emptyMessage = "No venues found"
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState('distance');

  // Filter venues locally
  const filteredVenues = useMemo(() => {
    let result = [...(venues || [])];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.address?.formatted?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((v) => v.category === selectedCategory);
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      result = result.filter((v) =>
        selectedAmenities.every((a) => v.amenities?.includes(a))
      );
    }

    // Sort
    switch (sortBy) {
      case 'distance':
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return result;
  }, [venues, searchQuery, selectedCategory, selectedAmenities, sortBy]);

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAmenities([]);
    setSortBy('distance');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedAmenities.length > 0;

  return (
    <div className="venue-list">
      {/* Header */}
      {showFilters && (
        <div className="venue-list__header">
          {/* Search Bar */}
          <div className="venue-list__search">
            <div className="input-wrapper">
              <Search className="input-icon" size={18} />
              <input
                type="text"
                placeholder="Search venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="venue-list__search-input"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="venue-list__controls">
            <button
              className={`venue-list__filter-btn ${showFilterPanel ? 'active' : ''}`}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <Filter size={18} />
              Filters
              {hasActiveFilters && (
                <span className="venue-list__filter-badge">
                  {(selectedCategory ? 1 : 0) + selectedAmenities.length}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="venue-list__sort"
            >
              <option value="distance">Nearest</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
              <option value="newest">Newest</option>
            </select>

            <div className="venue-list__view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="venue-list__filter-panel">
          {/* Categories */}
          <div className="venue-list__filter-section">
            <h4>Category</h4>
            <div className="venue-list__category-chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`venue-list__chip ${
                    selectedCategory === cat.value ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="venue-list__filter-section">
            <h4>Amenities</h4>
            <div className="venue-list__amenity-chips">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity.value}
                  className={`venue-list__chip ${
                    selectedAmenities.includes(amenity.value) ? 'active' : ''
                  }`}
                  onClick={() => handleAmenityToggle(amenity.value)}
                >
                  <span>{amenity.icon}</span>
                  {amenity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button className="venue-list__clear-filters" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="venue-list__results">
        <span>
          {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} found
        </span>
        {onRefresh && (
          <button className="venue-list__refresh" onClick={onRefresh}>
            <RefreshCw size={16} />
            Refresh
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="venue-list__loading">
          <Loader className="venue-list__spinner" size={40} />
          <p>Finding venues near you...</p>
        </div>
      ) : error ? (
        <div className="venue-list__error">
          <AlertCircle size={48} />
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          {onRefresh && (
            <button onClick={onRefresh}>Try Again</button>
          )}
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="venue-list__empty">
          <MapPin size={48} />
          <h3>{emptyMessage}</h3>
          <p>Try adjusting your filters or search query</p>
          {hasActiveFilters && (
            <button onClick={clearFilters}>Clear Filters</button>
          )}
        </div>
      ) : (
        <div className={`venue-list__grid ${viewMode}`}>
          {filteredVenues.map((venue) => (
            <VenueCard
              key={venue._id}
              venue={venue}
              onSelect={onVenueSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueList;