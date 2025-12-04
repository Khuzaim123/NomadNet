// src/components/chat/ChatWindow.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import LoadingSpinner from '../LoadingSpinner';
import { 
  getOtherParticipant, 
  getUserDisplayName, 
  getUserAvatar,
  getUserId 
} from '../../utils/helpers';
import { groupMessagesByDate } from '../../utils/dateFormat';
import { getUser } from '../../services/authService';

const ChatWindow = () => {
  const user = getUser();
  const {
    activeConversation,
    messages,
    messagesLoading,
    loading,
    sendMessage,
    deleteMessage,
    emitTyping,
    emitStopTyping,
    typingUsers,
    listingContext,
    isConnected,
  } = useChat();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto' 
      });
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom(true);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Initial scroll on conversation load
  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messagesLoading, activeConversation?._id]);

  // Loading state
  if (loading) {
    return (
      <div className="chat-empty-state">
        <LoadingSpinner size="lg" />
        <p className="chat-empty-description">Loading conversation...</p>
      </div>
    );
  }

  // Empty state when no conversation is selected
  if (!activeConversation) {
    return (
      <div className="chat-empty-state">
        <div className="chat-empty-icon">💬</div>
        <h2 className="chat-empty-title">No conversation selected</h2>
        <p className="chat-empty-description">
          Select a conversation from the list or start a new one
        </p>
      </div>
    );
  }

  // Get current user ID safely
  const currentUserId = getUserId(user);

  // Get other user with safety checks
  const otherUser = getOtherParticipant(activeConversation, currentUserId);

  if (!otherUser) {
    return (
      <div className="chat-empty-state">
        <div className="chat-empty-icon">⚠️</div>
        <h2 className="chat-empty-title">Unable to load conversation</h2>
        <p className="chat-empty-description">
          There was an issue loading this conversation. Please try selecting it again.
        </p>
      </div>
    );
  }

  // Safe getters for other user properties
  const otherUserName = getUserDisplayName(otherUser);
  const otherUserAvatar = getUserAvatar(otherUser);
  const otherUserId = getUserId(otherUser);

  // Group messages by date
  const groupedMessages = messages && messages.length > 0
    ? groupMessagesByDate(messages)
    : {};

  const isOtherUserTyping = typingUsers[activeConversation._id];

  const handleSendMessage = async (content) => {
    if (!content?.trim() || !otherUserId) return;

    try {
      await sendMessage({
        conversationId: activeConversation._id,
        receiverId: otherUserId,
        content: content.trim(),
        messageType: 'text',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (activeConversation?._id) {
      emitTyping(activeConversation._id);
    }
  };

  const handleStopTyping = () => {
    if (activeConversation?._id) {
      emitStopTyping?.(activeConversation._id);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="chat-window-header">
        <div className="chat-header-user-info">
          <img
            src={otherUserAvatar}
            alt={otherUserName}
            className="chat-header-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=6366f1&color=fff`;
            }}
          />
          <div className="chat-header-details">
            <h2>{otherUserName}</h2>
            <div className="chat-header-status">
              {otherUser.isOnline ? (
                <span className="chat-online-status">
                  <span className="chat-online-dot"></span>
                  Online
                </span>
              ) : (
                <span className="chat-offline-status">Offline</span>
              )}
              {/* Connection indicator */}
              {!isConnected && (
                <span className="chat-connection-status disconnected">
                  • Reconnecting...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="chat-action-btn" title="Voice call">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="chat-action-btn" title="Video call">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="chat-action-btn" title="More options">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Listing Context Banner */}
      {listingContext && (
        <div className="chat-listing-context">
          <div className="listing-context-info">
            <span className="listing-context-label">Regarding:</span>
            <Link
              to={`/marketplace/${listingContext.id}`}
              className="listing-context-title"
            >
              {listingContext.title}
            </Link>
            {listingContext.price && (
              <span className="listing-context-price">{listingContext.price}</span>
            )}
          </div>
          {listingContext.type && (
            <span className="listing-context-type">{listingContext.type}</span>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="chat-messages-container">
        {messagesLoading ? (
          <div className="chat-loading">
            <LoadingSpinner size="lg" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="chat-empty-state chat-empty-messages">
            <div className="chat-empty-icon">👋</div>
            <h2 className="chat-empty-title">Start the conversation</h2>
            <p className="chat-empty-description">
              {listingContext
                ? `Send a message about "${listingContext.title}"`
                : `Say hello to ${otherUserName}!`}
            </p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="chat-date-separator">
                  <div className="chat-date-label">{date}</div>
                </div>

                {msgs.map((message) => (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    currentUserId={currentUserId}
                    onDelete={deleteMessage}
                  />
                ))}
              </div>
            ))}

            {/* Typing indicator */}
            {isOtherUserTyping && (
              <div className="typing-indicator">
                <img
                  src={otherUserAvatar}
                  alt={otherUserName}
                  className="message-avatar"
                />
                <div className="typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        disabled={messagesLoading || !isConnected}
        placeholder={
          !isConnected 
            ? 'Connecting...'
            : listingContext
              ? `Message about "${listingContext.title}"...`
              : `Message ${otherUserName}...`
        }
      />
    </>
  );
};

export default ChatWindow;