// src/components/chat/MessageBubble.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMessageTimestamp } from '../../utils/dateFormat';
import { getUserDisplayName, getUserAvatar, getUserId, isSameUser } from '../../utils/helpers';

const MessageBubble = ({ message, currentUserId, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  if (!message) return null;

  // Determine if message is sent by current user
  const senderId = getUserId(message.sender);
  const isSent = isSameUser(senderId, currentUserId);
  const isPending = message.pending;

  // Get sender info safely
  const senderName = typeof message.sender === 'object'
    ? getUserDisplayName(message.sender)
    : 'User';
  const senderAvatar = typeof message.sender === 'object'
    ? getUserAvatar(message.sender)
    : `https://ui-avatars.com/api/?name=U&background=6366f1&color=fff`;

  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      onDelete(message._id);
    }
    setShowMenu(false);
  };

  // Render message content based on type
  const renderMessageContent = () => {
    const { type, content, imageUrl, marketplaceItem, venue, checkIn } = message;

    switch (type) {
      case 'image':
        console.log('🖼️ Rendering image message:', { type, imageUrl, content });
        return (
          <>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Message attachment"
                className="message-image"
                style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '8px' }}
              />
            )}
            {content && <p className="message-text">{content}</p>}
          </>
        );

      case 'marketplace':
        return marketplaceItem ? (
          <div className="message-marketplace" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {marketplaceItem.photos && marketplaceItem.photos[0] && (
                <img
                  src={marketplaceItem.photos[0]}
                  alt={marketplaceItem.title}
                  style={{ width: '80px', height: '80px', borderRadius: '6px', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600' }}>
                  {marketplaceItem.title}
                </h4>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                  {marketplaceItem.type} • {marketplaceItem.category?.replace(/_/g, ' ')}
                </p>
                {marketplaceItem.priceType === 'paid' && marketplaceItem.price && (
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>
                    ${marketplaceItem.price.amount} {marketplaceItem.price.currency}
                  </p>
                )}
                {marketplaceItem.priceType === 'free' && (
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                    Free
                  </p>
                )}
              </div>
            </div>
            {content && <p className="message-text" style={{ marginTop: '8px' }}>{content}</p>}
            <Link
              to={`/marketplace/${marketplaceItem._id}`}
              style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#6366f1' }}
            >
              View Item →
            </Link>
          </div>
        ) : (
          <p className="message-text">{content || 'Shared a marketplace item'}</p>
        );

      case 'venue':
        return venue ? (
          <div className="message-venue" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {venue.photos && venue.photos[0] && (
                <img
                  src={typeof venue.photos[0] === 'string' ? venue.photos[0] : venue.photos[0].url}
                  alt={venue.name}
                  style={{ width: '80px', height: '80px', borderRadius: '6px', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600' }}>
                  📍 {venue.name}
                </h4>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                  {venue.category?.replace(/_/g, ' ')}
                </p>
                {venue.address?.formatted && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                    {venue.address.formatted}
                  </p>
                )}
              </div>
            </div>
            {content && <p className="message-text" style={{ marginTop: '8px' }}>{content}</p>}
            <Link
              to={`/venues/${venue._id}`}
              style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#10b981' }}
            >
              View Venue →
            </Link>
          </div>
        ) : (
          <p className="message-text">{content || 'Shared a venue'}</p>
        );

      case 'checkin':
        const openCheckInInMaps = () => {
          if (checkIn?.location?.coordinates) {
            const [lng, lat] = checkIn.location.coordinates;
            window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
          }
        };

        return checkIn ? (
          <div
            className="message-checkin"
            onClick={openCheckInInMaps}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              cursor: checkIn?.location?.coordinates ? 'pointer' : 'default',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => checkIn?.location?.coordinates && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600' }}>
                ✅ Checked in {checkIn?.location?.coordinates && '🗺️'}
              </h4>
              {checkIn.venue && (
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#666' }}>
                  at {checkIn.venue.name || 'a location'}
                </p>
              )}
              {checkIn.address && (
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#999' }}>
                  📍 {checkIn.address}
                </p>
              )}
              {checkIn.note && (
                <p style={{ margin: '8px 0 0', fontSize: '13px', fontStyle: 'italic' }}>
                  "{checkIn.note}"
                </p>
              )}
              {checkIn?.location?.coordinates && (
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#ef4444', fontWeight: '500' }}>
                  Click to open in Google Maps →
                </p>
              )}
            </div>
            {content && <p className="message-text" style={{ marginTop: '8px' }}>{content}</p>}
          </div>
        ) : (
          <p className="message-text">{content || 'Shared a check-in'}</p>
        );

      case 'location':
        console.log('📍 LOCATION DEBUG:', JSON.stringify(message, null, 2));

        const handleLocationClick = () => {
          console.log('🖱️ Location clicked!');
          const coords = message.location?.coordinates;
          console.log('Coordinates:', coords);

          if (coords && coords.length === 2) {
            const [lng, lat] = coords;
            const url = `https://www.google.com/maps?q=${lat},${lng}`;
            console.log('Opening:', url);
            window.open(url, '_blank');
          } else {
            alert('Location coordinates not available');
          }
        };

        const locationCoords = message.location?.coordinates;
        const locationName = message.location?.name || content || 'Shared location';

        return (
          <div
            className="message-location"
            onClick={handleLocationClick}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              cursor: 'pointer',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600' }}>
                📍 Location Shared
              </h4>
              {locationName && (
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#666' }}>
                  {locationName}
                </p>
              )}
              {locationCoords && locationCoords.length === 2 && (
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  {typeof locationCoords[1] === 'number' ? locationCoords[1].toFixed(5) : locationCoords[1]}, {typeof locationCoords[0] === 'number' ? locationCoords[0].toFixed(5) : locationCoords[0]}
                </p>
              )}
              {!locationCoords && (
                <p style={{ margin: 0, fontSize: '12px', color: '#f59e0b' }}>
                  ⚠️ Coordinates not available
                </p>
              )}
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <>
            {/* Message Image if exists (legacy support) */}
            {message.image && (
              <img
                src={message.image}
                alt="Message attachment"
                className="message-image"
              />
            )}

            {/* Message Text */}
            {content && (
              <p className="message-text">
                {content}
                {message.isEdited && (
                  <span className="message-edited-label"> (edited)</span>
                )}
              </p>
            )}
          </>
        );
    }
  };

  return (
    <div className={`message-bubble-wrapper ${isSent ? 'sent' : 'received'} ${isPending ? 'pending' : ''}`}>
      <div className="message-bubble-content">
        {/* Avatar for received messages */}
        {!isSent && (
          <img
            src={senderAvatar}
            alt={senderName}
            className="message-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=6366f1&color=fff`;
            }}
          />
        )}

        <div className={`message-bubble ${isPending ? 'message-pending' : ''}`}>
          {/* Render message content based on type */}
          {renderMessageContent()}

          {/* Message Meta */}
          <div className="message-meta">
            <span className="message-time">
              {formatMessageTimestamp(message.createdAt)}
            </span>

            {/* Status indicator for sent messages */}
            {isSent && (
              <span className="message-status-indicator">
                {isPending ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="pending-icon">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  </svg>
                ) : message.isRead || message.read ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="read-icon">
                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sent-icon">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </span>
            )}
          </div>

          {/* Message Menu Button (only for own messages, not pending) */}
          {isSent && !isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="message-menu-btn"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          )}

          {/* Message Menu Dropdown */}
          {showMenu && (
            <>
              <div
                className="message-menu-overlay"
                onClick={() => setShowMenu(false)}
              />
              <div className="message-menu">
                <button
                  onClick={handleDelete}
                  className="message-menu-item danger"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;