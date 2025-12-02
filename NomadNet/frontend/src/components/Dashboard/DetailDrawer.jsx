// src/components/Dashboard/DetailDrawer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiMapPin, FiUser, FiShoppingBag, FiClock, FiDollarSign, FiMessageSquare } from 'react-icons/fi';

const DetailDrawer = ({ isOpen, marker, userLocation, onClose }) => {
  if (!marker) return null;

  const renderContent = () => {
    switch (marker.markerType) {
      case 'user':
        return <UserDetails marker={marker} />;
      case 'venue':
        return <VenueDetails marker={marker} />;
      case 'marketplace':
        return <MarketplaceDetails marker={marker} />;
      case 'checkin':
        return <CheckInDetails marker={marker} />;
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && <div className="drawer-backdrop" onClick={onClose} />}
      
      <div className={`detail-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">
            {marker.markerType === 'user' && '👤 User Profile'}
            {marker.markerType === 'venue' && '🏢 Venue Details'}
            {marker.markerType === 'marketplace' && '🛍️ Marketplace Item'}
            {marker.markerType === 'checkin' && '📍 Check-in'}
          </h2>
          <button className="drawer-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="drawer-content">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

const UserDetails = ({ marker }) => (
  <div className="detail-user">
    <div className="detail-avatar-section">
      <img src={marker.avatar} alt={marker.displayName} className="detail-avatar" />
      <div className="detail-user-info">
        <h3>{marker.displayName}</h3>
        <p className="detail-username">@{marker.username}</p>
        {marker.profession && <p className="detail-profession">{marker.profession}</p>}
      </div>
    </div>

    {marker.distance !== undefined && (
      <div className="detail-distance">
        <FiMapPin /> {marker.distanceFormatted || `${marker.distance}m away`}
      </div>
    )}

    {marker.skills && marker.skills.length > 0 && (
      <div className="detail-section">
        <h4>Skills</h4>
        <div className="detail-tags">
          {marker.skills.map((skill, idx) => (
            <span key={idx} className="detail-tag skill-tag">{skill}</span>
          ))}
        </div>
      </div>
    )}

    <div className="detail-actions">
      <Link to={`/profile/${marker.username}`} className="detail-btn primary">
        <FiUser /> View Profile
      </Link>
      <button className="detail-btn secondary">
        <FiMessageSquare /> Message
      </button>
    </div>
  </div>
);

const VenueDetails = ({ marker }) => (
  <div className="detail-venue">
    {marker.photos && marker.photos.length > 0 && (
      <div className="detail-image">
        <img src={marker.photos[0].url || marker.photos[0]} alt={marker.name} />
      </div>
    )}

    <h3>{marker.name}</h3>
    <p className="detail-category">{marker.category}</p>

    {marker.distance !== undefined && (
      <div className="detail-distance">
        <FiMapPin /> {marker.distanceFormatted || `${marker.distance}m away`}
      </div>
    )}

    {marker.address && (
      <div className="detail-section">
        <h4>Address</h4>
        <p>{marker.address.street || ''} {marker.address.city || ''}</p>
      </div>
    )}

    {marker.amenities && marker.amenities.length > 0 && (
      <div className="detail-section">
        <h4>Amenities</h4>
        <div className="detail-tags">
          {marker.amenities.map((amenity, idx) => (
            <span key={idx} className="detail-tag">{amenity.replace(/_/g, ' ')}</span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const MarketplaceDetails = ({ marker }) => (
  <div className="detail-marketplace">
    {marker.photos && marker.photos.length > 0 && (
      <div className="detail-image">
        <img src={marker.photos[0]} alt={marker.title} />
      </div>
    )}

    <h3>{marker.title}</h3>
    
    <div className="detail-price">
      <FiDollarSign />
      {marker.priceType === 'free' && 'FREE'}
      {marker.priceType === 'barter' && 'Open to Barter'}
      {marker.priceType === 'paid' && marker.price && `$${marker.price.amount}`}
    </div>

    {marker.distance !== undefined && (
      <div className="detail-distance">
        <FiMapPin /> {marker.distanceFormatted || `${marker.distance}m away`}
      </div>
    )}

    <div className="detail-actions">
      <Link to={`/marketplace/${marker._id}`} className="detail-btn primary">
        <FiShoppingBag /> View Details
      </Link>
    </div>
  </div>
);

const CheckInDetails = ({ marker }) => (
  <div className="detail-checkin">
    {marker.user && (
      <div className="detail-avatar-section">
        <img src={marker.user.avatar} alt={marker.user.displayName} className="detail-avatar" />
        <div className="detail-user-info">
          <h3>{marker.user.displayName}</h3>
          <p className="detail-username">@{marker.user.username}</p>
        </div>
      </div>
    )}

    {marker.venue && (
      <div className="detail-section">
        <h4>📍 Location</h4>
        <p className="detail-venue-name">{marker.venue.name}</p>
      </div>
    )}

    {marker.note && (
      <div className="detail-section">
        <h4>Note</h4>
        <p className="detail-note">"{marker.note}"</p>
      </div>
    )}

    {marker.expiresAt && (
      <div className="detail-expires">
        <FiClock /> Expires {new Date(marker.expiresAt).toLocaleTimeString()}
      </div>
    )}
  </div>
);

export default DetailDrawer;