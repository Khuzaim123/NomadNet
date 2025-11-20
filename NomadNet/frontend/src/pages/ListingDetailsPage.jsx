// src/pages/ListingDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getListingById, 
  requestItem, 
  deleteListing 
} from '../services/marketplaceService';
import { getToken, getUser } from '../utils/authUtils';
import Spinner from '../components/Spinner';
import '../styles/marketplace.css';

const ListingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const currentUserId = getUser()?.id || getUser()?._id || null;

  useEffect(() => {
    fetchListingDetails();
  }, [id]);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getListingById(id);
      setListing(data.data.listing);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError(err.response?.data?.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestItem = async (e) => {
    e.preventDefault();
    
    if (!getToken()) {
      navigate('/');
      return;
    }

    try {
      setRequestLoading(true);
      await requestItem(id, requestMessage);
      setRequestSuccess(true);
      setShowRequestModal(false);
      setRequestMessage('');
      
      // Refresh listing to show updated request
      fetchListingDetails();
      
      setTimeout(() => setRequestSuccess(false), 3000);
    } catch (err) {
      console.error('Request error:', err);
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await deleteListing(id);
      navigate('/marketplace');
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  const formatPrice = () => {
    if (!listing) return '';
    if (listing.priceType === 'free') return 'FREE';
    if (listing.priceType === 'barter') return 'Open to Barter';
    return `$${listing.price?.amount || 0} ${listing.price?.currency || 'USD'}`;
  };

  const getCategoryLabel = () => {
    if (!listing) return '';
    if (listing.category === 'other' && listing.otherCategoryName) {
      return listing.otherCategoryName;
    }
    return listing.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isOwner = currentUserId && listing?.owner?._id === currentUserId;
  const hasRequested = listing?.requests?.some(req => req.user._id === currentUserId);

  if (loading) {
    return (
      <div className="marketplace-page">
        <div className="loading-container">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="marketplace-page">
        <div className="marketplace-container">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h2 className="empty-state-title">Listing Not Found</h2>
            <p className="empty-state-text">{error || 'This listing does not exist'}</p>
            <Link to="/marketplace" className="create-listing-btn">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-page">
      <div className="marketplace-container">
        {/* Back Button */}
        <Link to="/marketplace" className="back-link">
          ← Back to Marketplace
        </Link>

        {requestSuccess && (
          <div className="success-message">
            ✅ Request sent successfully! The owner will be notified via email.
          </div>
        )}

        <div className="listing-details-container">
          {/* Image Gallery */}
          <div className="listing-gallery">
            {listing.photos && listing.photos.length > 0 ? (
              <>
                <div className="main-image">
                  <img 
                    src={listing.photos[currentImageIndex]} 
                    alt={listing.title}
                  />
                </div>
                {listing.photos.length > 1 && (
                  <div className="image-thumbnails">
                    {listing.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`${listing.title} ${index + 1}`}
                        className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="no-image-placeholder">
                <span className="placeholder-icon">
                  {listing.type === 'item' ? '📦' : listing.type === 'service' ? '🛠️' : '🎓'}
                </span>
                <p>No images available</p>
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div className="listing-info">
            <div className="listing-header-section">
              <div className="listing-badges">
                <span className="type-badge">
                  {listing.type?.charAt(0).toUpperCase() + listing.type?.slice(1)}
                </span>
                <span className="category-badge">
                  {getCategoryLabel()}
                </span>
              </div>

              <h1 className="details-title">{listing.title}</h1>
              
              <div className="price-section">
                <span className="price-label">Price:</span>
                <span className="price-value">{formatPrice()}</span>
              </div>

              {listing.type === 'item' && listing.condition && (
                <div className="condition-section">
                  <span className="condition-label">Condition:</span>
                  <span className="condition-value">
                    {listing.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="description-section">
              <h3 className="section-title">Description</h3>
              <p className="description-text">{listing.description}</p>
            </div>

            {/* Delivery Options */}
            {listing.deliveryOptions && listing.deliveryOptions.length > 0 && (
              <div className="delivery-section">
                <h3 className="section-title">Delivery Options</h3>
                <div className="delivery-tags">
                  {listing.deliveryOptions.map(option => (
                    <span key={option} className="delivery-tag">
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Info */}
            <div className="owner-section">
              <h3 className="section-title">Listed by</h3>
              <Link 
                to={`/profile/${listing.owner?.username}`} 
                className="owner-card"
              >
                <img 
                  src={listing.owner?.avatar || 'https://ui-avatars.com/api/?name=User'} 
                  alt={listing.owner?.displayName}
                  className="owner-avatar-large"
                />
                <div className="owner-info">
                  <h4 className="owner-name">{listing.owner?.displayName}</h4>
                  <p className="owner-username">@{listing.owner?.username}</p>
                  {listing.owner?.currentCity && (
                    <p className="owner-location">📍 {listing.owner.currentCity}</p>
                  )}
                </div>
              </Link>
            </div>

            {/* Stats */}
            <div className="stats-section">
              <div className="stat-item">
                <span className="stat-icon">👁️</span>
                <span className="stat-value">{listing.views || 0}</span>
                <span className="stat-label">Views</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💬</span>
                <span className="stat-value">{listing.requests?.length || 0}</span>
                <span className="stat-label">Requests</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {isOwner ? (
                <>
                  <Link 
                    to={`/marketplace/my-listings`} 
                    className="primary-action-btn"
                  >
                    Manage Listing
                  </Link>
                  <button 
                    className="danger-action-btn"
                    onClick={handleDeleteListing}
                  >
                    Delete Listing
                  </button>
                </>
              ) : listing.available ? (
                hasRequested ? (
                  <div className="already-requested">
                    ✅ You've already requested this listing
                  </div>
                ) : (
                  <button 
                    className="primary-action-btn"
                    onClick={() => setShowRequestModal(true)}
                  >
                    Request This {listing.type}
                  </button>
                )
              ) : (
                <div className="unavailable-badge">
                  ❌ No Longer Available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Request: {listing.title}</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowRequestModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRequestItem} className="request-form">
                <div className="form-group">
                  <label htmlFor="message">Message (optional)</label>
                  <textarea
                    id="message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Hi! I'm interested in this. Can we discuss?"
                    rows={5}
                    maxLength={500}
                  />
                  <span className="char-count">{requestMessage.length}/500</span>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowRequestModal(false)}
                    disabled={requestLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={requestLoading}
                  >
                    {requestLoading ? <Spinner /> : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDetailsPage;