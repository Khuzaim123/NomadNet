// src/pages/MyListingsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getMyListings, 
  updateRequestStatus, 
  deleteListing 
} from '../services/marketplaceService';
import Spinner from '../components/Spinner';
import '../styles/marketplace.css';

const MyListingsPage = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [expandedRequests, setExpandedRequests] = useState({});

  useEffect(() => {
    fetchMyListings();
  }, [statusFilter]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyListings(statusFilter);
      setListings(data.data.listings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err.response?.data?.message || 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (listingId, requestId, status) => {
    try {
      await updateRequestStatus(listingId, requestId, status);
      // Refresh listings
      fetchMyListings();
      alert(`Request ${status} successfully!`);
    } catch (err) {
      console.error('Update request error:', err);
      alert(err.response?.data?.message || 'Failed to update request');
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await deleteListing(listingId);
      fetchMyListings();
      alert('Listing deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  const toggleRequestsExpand = (listingId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [listingId]: !prev[listingId]
    }));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'declined': return 'status-declined';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const formatPrice = (listing) => {
    if (listing.priceType === 'free') return 'FREE';
    if (listing.priceType === 'barter') return 'BARTER';
    return `$${listing.price?.amount || 0}`;
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-container">
        <div className="my-listings-header">
          <div>
            <h1 className="marketplace-title">My Listings</h1>
            <p className="marketplace-subtitle">
              Manage your items, services, and skills
            </p>
          </div>
          <Link to="/marketplace/create" className="create-listing-btn">
            + Create New Listing
          </Link>
        </div>

        {/* Status Filter */}
        <div className="status-filter">
          <button
            className={`status-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({listings.filter(l => l.isActive && l.available).length})
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'unavailable' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unavailable')}
          >
            Unavailable
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <Spinner />
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h2 className="empty-state-title">Error Loading Listings</h2>
            <p className="empty-state-text">{error}</p>
            <button onClick={fetchMyListings} className="create-listing-btn">
              Try Again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h2 className="empty-state-title">No Listings Yet</h2>
            <p className="empty-state-text">
              Create your first listing to get started!
            </p>
            <Link to="/marketplace/create" className="create-listing-btn">
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="my-listings-grid">
            {listings.map(listing => (
              <div key={listing._id} className="my-listing-card">
                {/* Listing Header */}
                <div className="my-listing-header">
                  <div className="listing-image-small">
                    {listing.photos && listing.photos.length > 0 ? (
                      <img src={listing.photos[0]} alt={listing.title} />
                    ) : (
                      <div className="image-placeholder-small">
                        {listing.type === 'item' ? '📦' : listing.type === 'service' ? '🛠️' : '🎓'}
                      </div>
                    )}
                  </div>
                  
                  <div className="listing-info-small">
                    <h3 className="listing-title-small">{listing.title}</h3>
                    <div className="listing-meta">
                      <span className="meta-item">
                        {listing.type?.charAt(0).toUpperCase() + listing.type?.slice(1)}
                      </span>
                      <span className="meta-divider">•</span>
                      <span className="meta-item">{formatPrice(listing)}</span>
                      <span className="meta-divider">•</span>
                      <span className="meta-item">👁️ {listing.views || 0} views</span>
                    </div>
                  </div>

                  <div className="listing-actions-small">
                    <Link 
                      to={`/marketplace/${listing._id}`}
                      className="action-icon-btn"
                      title="View Details"
                    >
                      👁️
                    </Link>
                    <button 
                      className="action-icon-btn delete-btn"
                      onClick={() => handleDeleteListing(listing._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Requests Section */}
                {listing.requests && listing.requests.length > 0 && (
                  <div className="requests-section">
                    <button
                      className="requests-toggle"
                      onClick={() => toggleRequestsExpand(listing._id)}
                    >
                      <span>
                        💬 {listing.requests.length} Request{listing.requests.length !== 1 ? 's' : ''}
                      </span>
                      <span>{expandedRequests[listing._id] ? '▲' : '▼'}</span>
                    </button>

                    {expandedRequests[listing._id] && (
                      <div className="requests-list">
                        {listing.requests.map(request => (
                          <div key={request._id} className="request-item">
                            <div className="request-header">
                              <div className="requester-info">
                                <img 
                                  src={request.user?.avatar || 'https://ui-avatars.com/api/?name=User'} 
                                  alt={request.user?.displayName}
                                  className="requester-avatar"
                                />
                                <div>
                                  <p className="requester-name">
                                    {request.user?.displayName || 'Unknown User'}
                                  </p>
                                  <p className="request-date">
                                    {new Date(request.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                                {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                              </span>
                            </div>

                            {request.message && (
                              <div className="request-message">
                                <p>"{request.message}"</p>
                              </div>
                            )}

                            {request.status === 'pending' && (
                              <div className="request-actions">
                                <button
                                  className="accept-btn"
                                  onClick={() => handleUpdateRequestStatus(listing._id, request._id, 'accepted')}
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  className="decline-btn"
                                  onClick={() => handleUpdateRequestStatus(listing._id, request._id, 'declined')}
                                >
                                  ❌ Decline
                                </button>
                              </div>
                            )}

                            {request.status === 'accepted' && (
                              <div className="request-actions">
                                <button
                                  className="complete-btn"
                                  onClick={() => handleUpdateRequestStatus(listing._id, request._id, 'completed')}
                                >
                                  ✔️ Mark as Completed
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListingsPage;