// src/pages/venues/VenueDetails.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Mail,
  Wifi,
  Plug,
  Coffee,
  Volume2,
  Wind,
  TreeDeciduous,
  Car,
  Share2,
  Heart,
  Navigation,
  MessageCircle,
  Users,
  CheckCircle,
  Camera,
  ExternalLink,
  X
} from 'lucide-react';

import { useVenueDetails } from '../../hooks/useVenues';
import NearbyNomads from '../../components/venues/NearbyNomads';
import CheckInModal from '../../components/venues/CheckInModal';
import { useAuth } from '../../context/AuthContext';

import '../../styles/VenueDetail.css';

const amenityInfo = {
  wifi: { icon: Wifi, label: 'WiFi' },
  power_outlets: { icon: Plug, label: 'Power Outlets' },
  coffee: { icon: Coffee, label: 'Coffee' },
  quiet: { icon: Volume2, label: 'Quiet Zone' },
  air_conditioning: { icon: Wind, label: 'Air Conditioning' },
  outdoor_seating: { icon: TreeDeciduous, label: 'Outdoor Seating' },
  parking: { icon: Car, label: 'Parking' }
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

const VenueDetails = () => {
  const { id } = useParams(); // /venues/:id
  const navigate = useNavigate();

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { venue, checkIns, loading, error } = useVenueDetails(id);

  const [activeTab, setActiveTab] = useState('overview');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  if (loading || authLoading) {
    return (
      <div className="venue-details-loading">
        <div className="loading-spinner" />
        <p>Loading venue details...</p>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="venue-details-error">
        <p>{error || 'Venue not found'}</p>
        <button onClick={() => navigate('/venues')}>
          <ArrowLeft size={18} />
          Back to Venues
        </button>
      </div>
    );
  }

  const categoryColor =
    categoryColors[venue.category] || categoryColors.other;
  const isOwner = user && venue.createdBy?._id === user._id;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: venue.name,
          text: `Check out ${venue.name} on NomadNet!`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const handleGetDirections = () => {
    if (!venue.location?.coordinates) return;
    const [lng, lat] = venue.location.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  const handleCheckInClick = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    setShowCheckInModal(true);
  };

  return (
    <div className="venue-details-page">
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate('/venues')}>
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Hero Section */}
      <div className="venue-hero">
        <div className="venue-photos">
          {venue.photos && venue.photos.length > 0 ? (
            <>
              <div
                className="main-photo"
                onClick={() => setShowGallery(true)}
              >
                <img
                  src={venue.photos[selectedPhoto]?.url}
                  alt={venue.name}
                />
              </div>
              {venue.photos.length > 1 && (
                <div className="photo-thumbnails">
                  {venue.photos.map((photo, index) => (
                    <div
                      key={index}
                      className={`thumbnail ${
                        selectedPhoto === index ? 'active' : ''
                      }`}
                      onClick={() => setSelectedPhoto(index)}
                    >
                      <img
                        src={photo.url}
                        alt={`${venue.name} ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-photos">
              <Camera size={48} />
              <p>No photos yet</p>
            </div>
          )}
        </div>

        <div className="venue-hero-overlay" />

        <div
          className="venue-category-tag"
          style={{ backgroundColor: categoryColor }}
        >
          {venue.category}
        </div>
      </div>

      {/* Main Content */}
      <div className="venue-details-content">
        {/* Header */}
        <div className="venue-header-section">
          <div className="venue-title-row">
            <h1>{venue.name}</h1>
            <div className="venue-actions">
              <button
                className={`action-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart
                  size={20}
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
              </button>
              <button className="action-btn" onClick={handleShare}>
                <Share2 size={20} />
              </button>
              {/* Venues are read-only now; hide edit/delete in UI
              {isOwner && (
                <>
                  <button
                    className="action-btn"
                    onClick={() => navigate(`/venues/${id}/edit`)}
                  >
                    <Edit2 size={20} />
                  </button>
                  <button className="action-btn danger">
                    <Trash2 size={20} />
                  </button>
                </>
              )}
              */}
            </div>
          </div>

          {venue.address && (
            <p className="venue-location">
              <MapPin size={16} />
              {venue.address.formatted ||
                `${venue.address.street || ''} ${
                  venue.address.city || ''
                }, ${venue.address.country || ''}`}
            </p>
          )}

          {/* Quick Stats */}
          <div className="venue-quick-stats">
            <div className="stat-item highlight">
              <Star size={18} fill="currentColor" />
              <span className="stat-value">
                {venue.ratings?.overall
                  ? venue.ratings.overall.toFixed(1)
                  : '—'}
              </span>
              <span className="stat-label">
                ({venue.ratings?.totalReviews || 0} reviews)
              </span>
            </div>

            {venue.ratings?.wifi > 0 && (
              <div className="stat-item">
                <Wifi size={16} />
                <span className="stat-value">
                  {venue.ratings.wifi.toFixed(1)}
                </span>
                <span className="stat-label">WiFi</span>
              </div>
            )}

            <div className="stat-item">
              <Users size={16} />
              <span className="stat-value">{checkIns.length}</span>
              <span className="stat-label">Check-ins</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="venue-cta-buttons">
            <button
              className="cta-btn primary"
              onClick={handleCheckInClick}
            >
              <CheckCircle size={18} />
              Check In
            </button>
            <button
              className="cta-btn secondary"
              onClick={handleGetDirections}
            >
              <Navigation size={18} />
              Directions
            </button>
            {venue.contact?.phone && (
              <a
                href={`tel:${venue.contact.phone}`}
                className="cta-btn secondary"
              >
                <Phone size={18} />
                Call
              </a>
            )}

            {venue.contact?.website && (
              <a
                href={venue.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn secondary"
              >
                <Globe size={18} />
                Website
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="venue-tabs">
          <button
            className={`tab ${
              activeTab === 'overview' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${
              activeTab === 'nomads' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('nomads')}
          >
            <Users size={16} />
            Nearby Nomads
          </button>
          <button
            className={`tab ${
              activeTab === 'reviews' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            <MessageCircle size={16} />
            Reviews
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Amenities */}
              {venue.amenities && venue.amenities.length > 0 && (
                <div className="detail-section">
                  <h3>Amenities</h3>
                  <div className="amenities-grid">
                    {venue.amenities.map(amenity => {
                      const info = amenityInfo[amenity];
                      if (!info) return null;
                      const Icon = info.icon;
                      return (
                        <div
                          key={amenity}
                          className="amenity-item"
                        >
                          <Icon size={20} />
                          <span>{info.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ratings */}
              {venue.ratings?.totalReviews > 0 && (
                <div className="detail-section">
                  <h3>Ratings</h3>

                  {['wifi', 'noise', 'crowdedness'].map(key => (
                    venue.ratings[key] && (
                      <div key={key} className="rating-row">
                        <span className="rating-label">
                          {key}
                        </span>
                        <div className="rating-bar">
                          <div
                            className="rating-fill"
                            style={{
                              width: `${
                                (venue.ratings[key] / 5) * 100
                              }%`
                            }}
                          />
                        </div>
                        <span className="rating-score">
                          {venue.ratings[key].toFixed(1)}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Recent visitors */}
              {checkIns.length > 0 && (
                <div className="detail-section">
                  <h3>
                    <Users size={18} /> Recent Visitors
                  </h3>

                  <div className="recent-visitors">
                    {checkIns.slice(0, 5).map(checkIn => (
                      <div
                        key={checkIn._id}
                        className="visitor"
                      >
                        <img
                          src={
                            checkIn.user?.avatar ||
                            '/default-avatar.png'
                          }
                          alt={
                            checkIn.user?.displayName ||
                            checkIn.user?.username
                          }
                        />
                        <div>
                          <span>
                            {checkIn.user?.displayName ||
                              checkIn.user?.username}
                          </span>
                          <small>
                            {new Date(
                              checkIn.createdAt
                            ).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {venue.contact && (
                <div className="detail-section">
                  <h3>Contact</h3>
                  <div className="contact-list">
                    {venue.contact.phone && (
                      <a
                        href={`tel:${venue.contact.phone}`}
                        className="contact-item"
                      >
                        <Phone size={16} />
                        {venue.contact.phone}
                      </a>
                    )}
                    {venue.contact.website && (
                      <a
                        href={venue.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-item"
                      >
                        <Globe size={16} />
                        Visit Website
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {venue.contact.email && (
                      <a
                        href={`mailto:${venue.contact.email}`}
                        className="contact-item"
                      >
                        <Mail size={16} />
                        {venue.contact.email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Hours */}
              {venue.hours && (
                <div className="detail-section">
                  <h3>
                    <Clock size={18} />
                    Hours
                  </h3>
                  <div className="hours-list">
                    {Object.entries(venue.hours).map(
                      ([day, hours]) => (
                        <div
                          key={day}
                          className="hours-item"
                        >
                          <span className="day">{day}</span>
                          <span className="time">
                            {hours.open && hours.close
                              ? `${hours.open} - ${hours.close}`
                              : 'Closed'}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Added By */}
              {venue.createdBy && (
                <div className="detail-section added-by">
                  <p>
                    Added by{' '}
                    <span
                      className="creator-link"
                      onClick={() =>
                        navigate(
                          `/profile/${venue.createdBy._id}`
                        )
                      }
                    >
                      @
                      {venue.createdBy.username ||
                        venue.createdBy.displayName}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'nomads' && (
            <NearbyNomads venueId={id} checkIns={checkIns} />
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <div className="coming-soon">
                <MessageCircle size={48} />
                <h3>Reviews coming soon!</h3>
                <p>Be the first to leave a review</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Check In Modal (only opens if user is authenticated) */}
      {showCheckInModal && (
        <CheckInModal
          venue={venue}
          onClose={() => setShowCheckInModal(false)}
        />
      )}

      {/* Photo Gallery Overlay */}
      {showGallery && venue.photos?.length > 0 && (
        <div
          className="venue-gallery"
          onClick={() => setShowGallery(false)}
        >
          <button
            className="gallery-close"
            onClick={e => {
              e.stopPropagation();
              setShowGallery(false);
            }}
          >
            <X size={28} />
          </button>

          <div
            className="gallery-content"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={venue.photos[selectedPhoto]?.url}
              alt={`${venue.name} photo ${selectedPhoto + 1}`}
            />

            {venue.photos.length > 1 && (
              <>
                <button
                  className="gallery-prev"
                  onClick={() =>
                    setSelectedPhoto(prev =>
                      prev === 0
                        ? venue.photos.length - 1
                        : prev - 1
                    )
                  }
                >
                  ‹
                </button>

                <button
                  className="gallery-next"
                  onClick={() =>
                    setSelectedPhoto(prev =>
                      prev === venue.photos.length - 1
                        ? 0
                        : prev + 1
                    )
                  }
                >
                  ›
                </button>
              </>
            )}
          </div>

          <div className="gallery-dots">
            {venue.photos.map((_, index) => (
              <button
                key={index}
                className={`dot ${
                  index === selectedPhoto ? 'active' : ''
                }`}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedPhoto(index);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueDetails;