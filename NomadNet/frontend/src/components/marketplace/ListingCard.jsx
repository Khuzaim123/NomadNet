// src/components/marketplace/ListingCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/marketplace.css';

const ListingCard = ({ listing }) => {
  const formatPrice = () => {
    if (listing.priceType === 'free') return 'FREE';
    if (listing.priceType === 'barter') return 'BARTER';
    return `$${listing.price?.amount || 0}`;
  };

  const getCategoryLabel = () => {
    if (listing.category === 'other' && listing.otherCategoryName) {
      return listing.otherCategoryName;
    }
    return listing.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTypeEmoji = () => {
    switch (listing.type) {
      case 'item': return '📦';
      case 'service': return '🛠️';
      case 'skill': return '🎓';
      default: return '🏷️';
    }
  };

  return (
    <Link to={`/marketplace/${listing._id}`} className="listing-card">
      <div className="listing-image-container">
        {listing.photos && listing.photos.length > 0 ? (
          <img 
            src={listing.photos[0]} 
            alt={listing.title} 
            className="listing-image"
          />
        ) : (
          <div className="listing-image-placeholder">
            {getTypeEmoji()}
          </div>
        )}
        
        <span className="listing-type-badge">
          {listing.type?.charAt(0).toUpperCase() + listing.type?.slice(1)}
        </span>
        
        <span className={`listing-badge badge-${listing.priceType}`}>
          {formatPrice()}
        </span>
      </div>

      <div className="listing-content">
        <h3 className="listing-title">{listing.title}</h3>
        <p className="listing-description">{listing.description}</p>
        
        <span className="listing-category">
          {getCategoryLabel()}
        </span>

        <div className="listing-footer">
          <div className="listing-owner">
            <img 
              src={listing.owner?.avatar || 'https://ui-avatars.com/api/?name=User&background=random'} 
              alt={listing.owner?.displayName}
              className="owner-avatar"
            />
            <span>{listing.owner?.displayName || 'Unknown'}</span>
          </div>
          
          <div className="listing-stats">
            <svg className="stats-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{listing.views || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;