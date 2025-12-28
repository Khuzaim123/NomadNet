// src/components/chat/ChatWindow.jsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import MessageTypeMenu from './MessageTypeMenu';
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

  const [showMessageTypeMenu, setShowMessageTypeMenu] = useState(false);

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

  const handleSendSpecialMessage = async (type, data) => {
    if (!otherUserId) return;

    try {
      console.log('🔍 handleSendSpecialMessage - type:', type);
      console.log('🔍 handleSendSpecialMessage - data:', JSON.stringify(data, null, 2));

      const messageData = {
        conversationId: activeConversation._id,
        receiverId: otherUserId,
        content: data.content || '',
        messageType: type,
      };

      console.log('📦 messageData before switch:', messageData);

      // Add type-specific data
      switch (type) {
        case 'image':
          messageData.imageUrl = data.imageUrl;
          messageData.content = data.caption || ''; // Use caption as content
          break;
        case 'marketplace_item':
          messageData.messageType = 'marketplace';
          messageData.marketplaceItemId = data.marketplaceItemId;
          break;
        case 'venue':
          messageData.venueId = data.venueId;
          break;
        case 'checkin':
          console.log('📍 Check-in case entered');
          console.log('  - data.checkInId:', data.checkInId);
          console.log('  - data.coordinates:', data.coordinates);

          // If we don't have a checkInId yet, create the check-in first
          if (!data.checkInId && data.coordinates) {
            console.log('🆕 Creating new check-in with coordinates...');
            const { createCheckIn } = await import('../../services/checkInService');
            const checkInData = {
              longitude: data.coordinates[0],
              latitude: data.coordinates[1],
              address: data.address,
              note: data.note,
              venueId: data.venueId
            };

            console.log('📤 checkInData:', checkInData);
            const checkInResponse = await createCheckIn(checkInData);
            console.log('📥 checkInResponse:', checkInResponse);

            const checkInId = checkInResponse.data?._id || checkInResponse.data?.checkIn?._id;
            console.log('✅ Extracted checkInId:', checkInId);
            messageData.checkInId = checkInId;
          } else {
            console.log('✅ Using provided checkInId:', data.checkInId);
            messageData.checkInId = data.checkInId;
          }

          console.log('📦 messageData.checkInId set to:', messageData.checkInId);
          break;
        case 'location':
          messageData.location = data.location;
          break;
      }

      await sendMessage(messageData);
    } catch (error) {
      console.error('Failed to send special message:', error);
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
          
              {/* Connection indicator */}
              {!isConnected && (
                <span className="chat-connection-status disconnected">
                  • Reconnecting...
                </span>
              )}
            </div>
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
        onAttachClick={() => setShowMessageTypeMenu(true)}
        disabled={messagesLoading || !isConnected}
        placeholder={
          !isConnected
            ? 'Connecting...'
            : listingContext
              ? `Message about "${listingContext.title}"...`
              : `Message ${otherUserName}...`
        }
      />


      {/* Message Type Menu Modal - Triggered by + button in MessageInput */}
      {showMessageTypeMenu && (
        <MessageTypeMenu
          onClose={() => setShowMessageTypeMenu(false)}
          onSelect={(type, data) => {
            handleSendSpecialMessage(type, data);
            setShowMessageTypeMenu(false);
          }}
        />
      )}
    </>
  );
};

export default ChatWindow;