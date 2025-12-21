// src/components/venues/VenueFilters.jsx
import React, { useState } from 'react';
import {
  X,
  Filter,
  MapPin,
  Star,
  Wifi,
  Plug,
  Coffee,
  Volume2,
  Wind,
  TreeDeciduous,
  Car,
  RotateCcw
} from 'lucide-react';
import '../../styles/VenueFilters.css';

const categoryOptions = [
  { value: '', label: 'All Categories', icon: '🏢' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
  { value: 'coworking', label: 'Coworking', icon: '💼' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'bar', label: 'Bar', icon: '🍺' },
  { value: 'park', label: 'Park', icon: '🌳' },
  { value: 'library', label: 'Library', icon: '📚' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'other', label: 'Other', icon: '📍' }
];

const amenityOptions = [
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'power_outlets', label: 'Power Outlets', icon: Plug },
  { value: 'coffee', label: 'Coffee', icon: Coffee },
  { value: 'quiet', label: 'Quiet Zone', icon: Volume2 },
  { value: 'air_conditioning', label: 'A/C', icon: Wind },
  { value: 'outdoor_seating', label: 'Outdoor', icon: TreeDeciduous },
  { value: 'parking', label: 'Parking', icon: Car }
];

const radiusOptions = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' }
];

const VenueFilters = ({ 
  filters, 
  setFilters, 
  categories = categoryOptions,
  onClose 
}) => {
  const [localFilters, setLocalFilters] = useState({
    category: filters.category || '',
    amenities: filters.amenities || [],
    minRating: filters.minRating || 0,
    radius: filters.radius || 5000
  });

  const handleCategoryChange = (category) => {
    setLocalFilters(prev => ({
      ...prev,
      category
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setLocalFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleRatingChange = (rating) => {
    setLocalFilters(prev => ({
      ...prev,
      minRating: rating
    }));
  };

  const handleRadiusChange = (radius) => {
    setLocalFilters(prev => ({
      ...prev,
      radius
    }));
  };

  const handleApply = () => {
    setFilters(localFilters);
    onClose?.();
  };

  const handleReset = () => {
    const resetFilters = {
      category: '',
      amenities: [],
      minRating: 0,
      radius: 5000
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
  };

  const hasActiveFilters = 
    localFilters.category || 
    localFilters.amenities.length > 0 || 
    localFilters.minRating > 0 ||
    localFilters.radius !== 5000;

  return (
    <div className="venue-filters">
      <div className="venue-filters__header">
        <div className="venue-filters__title">
          <Filter size={20} />
          <h3>Filters</h3>
        </div>
        <button className="venue-filters__close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="venue-filters__content">
        {/* Category Filter */}
        <div className="filter-section">
          <h4>Category</h4>
          <div className="category-options">
            {(categories.length > 0 ? categories : categoryOptions).map(cat => (
              <button
                key={cat.value}
                className={`category-option ${localFilters.category === cat.value ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.value)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amenities Filter */}
        <div className="filter-section">
          <h4>Amenities</h4>
          <div className="amenity-options">
            {amenityOptions.map(amenity => {
              const Icon = amenity.icon;
              const isActive = localFilters.amenities.includes(amenity.value);
              return (
                <button
                  key={amenity.value}
                  className={`amenity-option ${isActive ? 'active' : ''}`}
                  onClick={() => handleAmenityToggle(amenity.value)}
                >
                  <Icon size={16} />
                  <span>{amenity.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rating Filter */}
        <div className="filter-section">
          <h4>Minimum Rating</h4>
          <div className="rating-options">
            {[0, 3, 3.5, 4, 4.5].map(rating => (
              <button
                key={rating}
                className={`rating-option ${localFilters.minRating === rating ? 'active' : ''}`}
                onClick={() => handleRatingChange(rating)}
              >
                {rating === 0 ? (
                  'Any'
                ) : (
                  <>
                    <Star size={14} fill="currentColor" />
                    {rating}+
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Distance Filter */}
        <div className="filter-section">
          <h4>
            <MapPin size={16} />
            Distance
          </h4>
          <div className="radius-options">
            {radiusOptions.map(option => (
              <button
                key={option.value}
                className={`radius-option ${localFilters.radius === option.value ? 'active' : ''}`}
                onClick={() => handleRadiusChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="venue-filters__actions">
        {hasActiveFilters && (
          <button className="reset-btn" onClick={handleReset}>
            <RotateCcw size={16} />
            Reset All
          </button>
        )}
        <button className="apply-btn" onClick={handleApply}>
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default VenueFilters;