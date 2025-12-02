// src/components/chat/ConversationItem.jsx
import React, { useState } from 'react';
import { formatMessageTime } from '../../utils/dateFormat';
import { 
  getOtherParticipant, 
  truncateText, 
  getUserDisplayName, 
  getUserAvatar,
  getUserId 
} from '../../utils/helpers';
import { getUser } from '../../services/authService';

const ConversationItem = ({
  conversation,
  isActive,
  onClick,
  onArchive,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const user = getUser();
  const currentUserId = getUserId(user);

  // Get other user safely
  const otherUser = getOtherParticipant(conversation, currentUserId);

  // If we can't find the other user, don't render
  if (!otherUser) {
    console.warn('ConversationItem: Could not find other participant', conversation);
    return null;
  }

  const otherUserName = getUserDisplayName(otherUser);
  const otherUserAvatar = getUserAvatar(otherUser);

  const handleArchive = (e) => {
    e.stopPropagation();
    onArchive(conversation._id);
    setShowMenu(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDelete(conversation._id);
    }
    setShowMenu(false);
  };

  return (
    <div
      onClick={onClick}
      className={`conversation-item ${isActive ? 'active' : ''}`}
    >
      {/* Avatar */}
      <div className="conversation-avatar-wrapper">
        <img
          src={otherUserAvatar}
          alt={otherUserName}
          className="conversation-avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=6366f1&color=fff`;
          }}
        />
        {otherUser.isOnline && (
          <span className="conversation-online-indicator" />
        )}
      </div>

      {/* Info */}
      <div className="conversation-info">
        <div className="conversation-header">
          <h3 className="conversation-name">{otherUserName}</h3>
          {conversation.lastMessage?.createdAt && (
            <span className="conversation-time">
              {formatMessageTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>

        <div className="conversation-footer">
          <p className="conversation-last-message">
            {conversation.lastMessage?.content
              ? truncateText(conversation.lastMessage.content, 40)
              : 'Start a conversation'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="conversation-unread-badge">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          )}
        </div>

        {/* User status if available */}
        {otherUser.status?.message && (
          <div className="conversation-status">
            <span className="status-text">
              {otherUser.status.emoji && <span>{otherUser.status.emoji} </span>}
              {otherUser.status.message}
            </span>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="conversation-menu-wrapper">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="conversation-menu-btn"
        >
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              className="conversation-menu-overlay"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="conversation-menu">
              <button
                onClick={handleArchive}
                className="conversation-menu-item"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {conversation.isArchived ? 'Unarchive' : 'Archive'}
              </button>
              <button
                onClick={handleDelete}
                className="conversation-menu-item danger"
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
  );
};

export default ConversationItem;