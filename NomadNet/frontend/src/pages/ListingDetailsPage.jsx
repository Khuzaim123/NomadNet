// src/pages/ListingDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getListingById,
  requestItem,
  deleteListing,
} from '../services/marketplaceService';
import chatService from '../services/chatService';
import { getToken, getUser, isAuthenticated } from '../utils/authUtils';
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
  const [messageLoading, setMessageLoading] = useState(false);

  const currentUser = getUser();
  const currentUserId = currentUser?.id || currentUser?._id || null;

  useEffect(() => {
    fetchListingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getListingById(id);

      console.log('Listing API Response:', data);

      const listingData =
        data?.data?.listing || data?.listing || data?.data || data;

      console.log('Parsed listing data:', listingData);
      console.log('Listing owner:', listingData?.owner);

      setListing(listingData);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError(err.response?.data?.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  // Get owner ID safely
  const getOwnerId = () => {
    if (!listing) return null;

    if (listing.owner?._id) return listing.owner._id;
    if (listing.owner?.id) return listing.owner.id;
    if (typeof listing.owner === 'string') return listing.owner;
    if (listing.ownerId) return listing.ownerId;
    if (listing.userId) return listing.userId;
    if (listing.user?._id) return listing.user._id;
    if (listing.user?.id) return listing.user.id;
    if (typeof listing.user === 'string') return listing.user;
    if (listing.seller?._id) return listing.seller._id;
    if (listing.seller?.id) return listing.seller.id;
    if (typeof listing.seller === 'string') return listing.seller;

    return null;
  };

  // Get owner object safely
  const getOwner = () => {
    if (!listing) return null;

    if (
      listing.owner &&
      typeof listing.owner === 'object' &&
      (listing.owner._id || listing.owner.id)
    ) {
      return listing.owner;
    }

    if (listing.user && typeof listing.user === 'object') {
      return listing.user;
    }

    if (listing.seller && typeof listing.seller === 'object') {
      return listing.seller;
    }

    const ownerId = getOwnerId();
    if (ownerId) {
      return { _id: ownerId, displayName: 'Seller', username: 'seller' };
    }

    return null;
  };

  const handleMessageSeller = async () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/marketplace/${id}` } });
      return;
    }

    const ownerId = getOwnerId();
    const owner = getOwner();

    console.log('Listing object:', listing);
    console.log('Owner ID:', ownerId);
    console.log('Owner object:', owner);

    if (!ownerId) {
      console.error('Could not find owner ID. Listing structure:', listing);
      alert('Unable to contact seller. Owner information is missing.');
      return;
    }

    if (
      ownerId === currentUserId ||
      ownerId?.toString() === currentUserId?.toString()
    ) {
      alert('You cannot message yourself.');
      return;
    }

    try {
      setMessageLoading(true);

      const response = await chatService.createOrGetConversation(ownerId);
      console.log('Conversation response:', response);

      const conversation =
        response?.data?.conversation ||
        response?.conversation ||
        response?.data ||
        response;

      if (!conversation?._id && !conversation?.id) {
        throw new Error('Failed to create conversation - invalid response');
      }

      const conversationId = conversation._id || conversation.id;

      navigate('/chat', {
        state: {
          conversationId,
          otherUser: owner,
          listingContext: {
            id: listing._id || listing.id,
            title: listing.title,
            type: listing.type,
            price:
              listing.priceType === 'free'
                ? 'FREE'
                : listing.priceType === 'barter'
                ? 'Barter'
                : `$${listing.price?.amount || listing.price || 0}`,
          },
        },
      });
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert(err.message || 'Failed to start conversation. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleRequestItem = async (e) => {
    e.preventDefault();

    if (!getToken()) {
      navigate('/login');
      return;
    }

    try {
      setRequestLoading(true);
      await requestItem(id, requestMessage);
      setRequestSuccess(true);
      setShowRequestModal(false);
      setRequestMessage('');

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

    const amount = listing.price?.amount || listing.price || 0;
    const currency = listing.price?.currency || 'USD';
    return `$${amount} ${currency}`;
  };

  const getCategoryLabel = () => {
    if (!listing) return '';
    if (listing.category === 'other' && listing.otherCategoryName) {
      return listing.otherCategoryName;
    }
    return (
      listing.category
        ?.replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()) || ''
    );
  };

  const owner = getOwner();
  const ownerId = getOwnerId();
  const isOwner =
    currentUserId &&
    ownerId &&
    (ownerId === currentUserId ||
      ownerId?.toString() === currentUserId?.toString());

  const hasRequested = listing?.requests?.some((req) => {
    const reqUserId = req.user?._id || req.user?.id || req.user;
    return (
      reqUserId === currentUserId ||
      reqUserId?.toString() === currentUserId?.toString()
    );
  });

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
            <p className="empty-state-text">
              {error || 'This listing does not exist'}
            </p>
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
                        className={`thumbnail ${
                          index === currentImageIndex ? 'active' : ''
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="no-image-placeholder">
                <span className="placeholder-icon">
                  {listing.type === 'item'
                    ? '📦'
                    : listing.type === 'service'
                    ? '🛠️'
                    : '🎓'}
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
                  {listing.type
                    ?.charAt(0)
                    .toUpperCase() + listing.type?.slice(1)}
                </span>
                <span className="category-badge">{getCategoryLabel()}</span>
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
                    {listing.condition
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
              )}
            </div>

            <div className="description-section">
              <h3 className="section-title">Description</h3>
              <p className="description-text">{listing.description}</p>
            </div>

            {listing.deliveryOptions && listing.deliveryOptions.length > 0 && (
              <div className="delivery-section">
                <h3 className="section-title">Delivery Options</h3>
                <div className="delivery-tags">
                  {listing.deliveryOptions.map((option) => (
                    <span key={option} className="delivery-tag">
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Info */}
            {owner && (
              <div className="owner-section">
                <h3 className="section-title">Listed by</h3>
                <Link
                  to={owner.username ? `/profile/${owner.username}` : '#'}
                  className="owner-card"
                  onClick={(e) =>
                    !owner.username && e.preventDefault()
                  }
                >
                  <img
                    src={
                      owner.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        owner.displayName || owner.username || 'Seller'
                      )}&background=6366f1&color=fff`
                    }
                    alt={owner.displayName || owner.username || 'Seller'}
                    className="owner-avatar-large"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://ui-avatars.com/api/?name=S&background=6366f1&color=fff';
                    }}
                  />
                  <div className="owner-info">
                    <h4 className="owner-name">
                      {owner.displayName || owner.username || 'Seller'}
                    </h4>
                    {owner.username && (
                      <p className="owner-username">@{owner.username}</p>
                    )}
                    {owner.currentCity && (
                      <p className="owner-location">
                        📍 {owner.currentCity}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )}

            <div className="stats-section">
              <div className="stat-item">
                <span className="stat-icon">👁️</span>
                <span className="stat-value">{listing.views || 0}</span>
                <span className="stat-label">Views</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💬</span>
                <span className="stat-value">
                  {listing.requests?.length || 0}
                </span>
                <span className="stat-label">Requests</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {isOwner ? (
                <>
                  <Link
                    to={`/marketplace/edit/${listing._id || listing.id}`}
                    className="primary-action-btn"
                  >
                    ✏️ Edit Listing
                  </Link>

                  <Link
                    to="/marketplace/my-listings"
                    className="secondary-action-btn"
                  >
                    📋 View All My Listings
                  </Link>

                  {/* View Chats for owner */}
                  <Link to="/chat" className="secondary-action-btn">
                    💬 View Chats
                  </Link>

                  <button
                    className="danger-action-btn"
                    onClick={handleDeleteListing}
                  >
                    🗑️ Delete Listing
                  </button>
                </>
              ) : listing.available !== false ? (
                <>
                  {hasRequested ? (
                    <div className="already-requested">
                      ✅ You've already requested this listing
                    </div>
                  ) : (
                    <button
                      className="primary-action-btn"
                      onClick={() => setShowRequestModal(true)}
                    >
                      📩 Request This {listing.type || 'Item'}
                    </button>
                  )}

                  {isAuthenticated() && ownerId && (
                    <button
                      className="secondary-action-btn message-seller-btn"
                      onClick={handleMessageSeller}
                      disabled={messageLoading}
                    >
                      {messageLoading ? (
                        <>
                          <span className="btn-spinner"></span>
                          Starting chat...
                        </>
                      ) : (
                        <>💬 Message Seller</>
                      )}
                    </button>
                  )}

                  {isAuthenticated() && !ownerId && (
                    <div className="info-message">
                      ℹ️ Seller contact information is not available
                    </div>
                  )}

                  {!isAuthenticated() && (
                    <Link
                      to="/login"
                      state={{ from: `/marketplace/${id}` }}
                      className="secondary-action-btn"
                    >
                      🔐 Login to Message Seller
                    </Link>
                  )}
                </>
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
          <div
            className="modal-overlay"
            onClick={() => setShowRequestModal(false)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
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
                  <span className="char-count">
                    {requestMessage.length}/500
                  </span>
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