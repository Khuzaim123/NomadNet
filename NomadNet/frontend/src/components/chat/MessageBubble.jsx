// src/components/chat/MessageBubble.jsx
import React, { useState } from 'react';
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
          {/* Message Image if exists */}
          {message.image && (
            <img
              src={message.image}
              alt="Message attachment"
              className="message-image"
            />
          )}

          {/* Message Text */}
          {message.content && (
            <p className="message-text">
              {message.content}
              {message.isEdited && (
                <span className="message-edited-label"> (edited)</span>
              )}
            </p>
          )}

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
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
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