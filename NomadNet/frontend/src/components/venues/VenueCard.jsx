// src/components/venues/VenueCard.jsx
import React from 'react';
import { 
  MapPin, 
  Star, 
  Wifi, 
  Plug, 
  Coffee, 
  Volume2,
  Wind,
  TreeDeciduous,
  Car,
  Users,
  Clock,
  Navigation
} from 'lucide-react';
import '../../styles/VenueCard.css';

const amenityIcons = {
  wifi: Wifi,
  power_outlets: Plug,
  coffee: Coffee,
  quiet: Volume2,
  air_conditioning: Wind,
  outdoor_seating: TreeDeciduous,
  parking: Car
};

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

const VenueCard = ({ venue, onClick, userLocation }) => {
  const {
    name,
    category,
    photos,
    ratings,
    amenities,
    address,
    distance
  } = venue;

  const categoryColor = categoryColors[category] || categoryColors.other;
  const categoryIcon = categoryIcons[category] || categoryIcons.other;

  // Calculate distance if user location is available
  const displayDistance = distance 
    ? distance < 1000 
      ? `${distance}m` 
      : `${(distance / 1000).toFixed(1)}km`
    : null;

  return (
    <div className="venue-card" onClick={onClick}>
      {/* Image */}
      <div className="venue-card-image">
        {photos && photos.length > 0 ? (
          <img src={photos[0].url} alt={name} />
        ) : (
          <div className="venue-placeholder">
            <span className="category-emoji">{categoryIcon}</span>
          </div>
        )}
        
        <div 
          className="category-badge"
          style={{ backgroundColor: categoryColor }}
        >
          {categoryIcon} {category}
        </div>

        {displayDistance && (
          <div className="distance-badge">
            <Navigation size={12} />
            {displayDistance}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="venue-card-content">
        <h3 className="venue-name">{name}</h3>
        
        {address && (
          <p className="venue-address">
            <MapPin size={14} />
            {address.formatted || `${address.city}, ${address.country}`}
          </p>
        )}

        {/* Ratings */}
        <div className="venue-ratings">
          <div className="rating-item main">
            <Star size={16} fill="currentColor" />
            <span>{ratings?.overall?.toFixed(1) || '—'}</span>
          </div>
          
          {ratings?.wifi > 0 && (
            <div className="rating-item">
              <Wifi size={14} />
              <span>{ratings.wifi.toFixed(1)}</span>
            </div>
          )}
          
          {ratings?.totalReviews > 0 && (
            <div className="rating-item reviews">
              <Users size={14} />
              <span>{ratings.totalReviews} reviews</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {amenities && amenities.length > 0 && (
          <div className="venue-amenities">
            {amenities.slice(0, 4).map(amenity => {
              const Icon = amenityIcons[amenity];
              return Icon ? (
                <div key={amenity} className="amenity-icon" title={amenity}>
                  <Icon size={14} />
                </div>
              ) : null;
            })}
            {amenities.length > 4 && (
              <span className="more-amenities">+{amenities.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className="venue-card-glow" style={{ backgroundColor: categoryColor }} />
    </div>
  );
};

export default VenueCard;