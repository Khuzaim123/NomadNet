// src/components/Dashboard/DetailDrawer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiX,
  FiMapPin,
  FiUser,
  FiShoppingBag,
  FiClock,
  FiDollarSign,
  FiMessageSquare,
  FiNavigation
} from 'react-icons/fi';

const DetailDrawer = ({ isOpen, marker, userLocation, onClose }) => {
  if (!marker) return null;

  /* -------------------- HELPERS -------------------- */

  const calculateDistance = () => {
    if (
      marker.distanceFormatted ||
      marker.distance !== undefined
    ) {
      return marker.distanceFormatted || `${marker.distance}m away`;
    }

    if (!userLocation || !marker.location?.coordinates) return null;

    const [lng, lat] = marker.location.coordinates;
    const R = 6371e3;
    const φ1 = (userLocation.latitude * Math.PI) / 180;
    const φ2 = (lat * Math.PI) / 180;
    const Δφ = ((lat - userLocation.latitude) * Math.PI) / 180;
    const Δλ = ((lng - userLocation.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d < 1000
      ? `${Math.round(d)}m away`
      : `${(d / 1000).toFixed(1)}km away`;
  };

  const formatTimeAgo = (date) => {
    if (!date) return null;
    const diff = Date.now() - new Date(date);
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);

    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };

  const getDirections = () => {
    if (!marker.location?.coordinates) return;
    const [lng, lat] = marker.location.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  /* -------------------- CONTENT -------------------- */

  const renderContent = () => {
    switch (marker.markerType) {
      case 'user':
        return <UserDetails marker={marker} distance={calculateDistance()} />;

      case 'venue':
        return (
          <VenueDetails
            marker={marker}
            distance={calculateDistance()}
            onDirections={getDirections}
          />
        );

      case 'marketplace':
        return (
          <MarketplaceDetails
            marker={marker}
            distance={calculateDistance()}
          />
        );

      case 'checkin':
        return (
          <CheckInDetails
            marker={marker}
            distance={calculateDistance()}
            timeAgo={formatTimeAgo(marker.createdAt)}
          />
        );

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

        <div className="drawer-content">{renderContent()}</div>
      </div>
    </>
  );
};

/* ==================== SUB COMPONENTS ==================== */

const Distance = ({ value }) =>
  value ? (
    <div className="detail-distance">
      <FiMapPin /> {value}
    </div>
  ) : null;

/* ---------- USER ---------- */

const UserDetails = ({ marker, distance }) => (
  <div className="detail-user">
    <div className="detail-avatar-section">
      <img
        src={marker.avatar}
        alt={marker.displayName}
        className="detail-avatar"
      />
      <div className="detail-user-info">
        <h3>{marker.displayName}</h3>
        <p className="detail-username">@{marker.username}</p>
        {marker.profession && (
          <p className="detail-profession">{marker.profession}</p>
        )}
      </div>
    </div>

    <Distance value={distance} />

    {marker.skills?.length > 0 && (
      <div className="detail-section">
        <h4>Skills</h4>
        <div className="detail-tags">
          {marker.skills.map((s, i) => (
            <span key={i} className="detail-tag skill-tag">
              {s}
            </span>
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

/* ---------- VENUE ---------- */

const VenueDetails = ({ marker, distance, onDirections }) => (
  <div className="detail-venue">
    {marker.photos?.length > 0 && (
      <div className="detail-image">
        <img src={marker.photos[0].url || marker.photos[0]} alt={marker.name} />
      </div>
    )}

    <h3>{marker.name}</h3>
    <p className="detail-category">{marker.category}</p>

    <Distance value={distance} />

    {marker.address && (
      <div className="detail-section">
        <h4>Address</h4>
        <p>
          {marker.address.street || ''} {marker.address.city || ''}
        </p>
      </div>
    )}

    {marker.amenities?.length > 0 && (
      <div className="detail-section">
        <h4>Amenities</h4>
        <div className="detail-tags">
          {marker.amenities.map((a, i) => (
            <span key={i} className="detail-tag">
              {a.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    )}

    <div className="detail-actions">
      <button className="detail-btn secondary" onClick={onDirections}>
        <FiNavigation /> Directions
      </button>
    </div>
  </div>
);

/* ---------- MARKETPLACE ---------- */

const MarketplaceDetails = ({ marker, distance }) => (
  <div className="detail-marketplace">
    {marker.photos?.length > 0 && (
      <div className="detail-image">
        <img src={marker.photos[0]} alt={marker.title} />
      </div>
    )}

    <h3>{marker.title}</h3>

    <div className="detail-price">
      <FiDollarSign />
      {marker.priceType === 'free' && 'FREE'}
      {marker.priceType === 'barter' && 'Open to Barter'}
      {marker.priceType === 'paid' && `$${marker.price?.amount}`}
    </div>

    <Distance value={distance} />

    <div className="detail-actions">
      <Link
        to={`/marketplace/${marker._id}`}
        className="detail-btn primary"
      >
        <FiShoppingBag /> View Details
      </Link>
    </div>
  </div>
);

/* ---------- CHECK-IN ---------- */

const CheckInDetails = ({ marker, distance, timeAgo }) => (
  <div className="detail-checkin">
    {marker.user && (
      <div className="detail-avatar-section">
        <img
          src={marker.user.avatar}
          alt={marker.user.displayName}
          className="detail-avatar"
        />
        <div className="detail-user-info">
          <h3>{marker.user.displayName}</h3>
          <p className="detail-username">@{marker.user.username}</p>
        </div>
      </div>
    )}

    {marker.venue && (
      <div className="detail-section">
        <h4>📍 Location</h4>
        <p>{marker.venue.name}</p>
      </div>
    )}

    {marker.note && (
      <div className="detail-section">
        <h4>Note</h4>
        <p className="detail-note">"{marker.note}"</p>
      </div>
    )}

    {timeAgo && (
      <div className="detail-expires">
        <FiClock /> {timeAgo}
      </div>
    )}

    <Distance value={distance} />
  </div>
);

export default DetailDrawer;
