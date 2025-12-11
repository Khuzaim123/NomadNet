// src/components/chat/ChatList.jsx
import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import ConversationItem from './ConversationItem';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from './EmptyState';
import { getOtherParticipant } from '../../utils/helpers';
import { getUser } from '../../services/authService';

const ChatList = () => {
  const {
    conversations,
    activeConversation,
    loading,
    loadConversations,
    selectConversation,
    archiveConversation,
    deleteConversation,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const currentUser = getUser();
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    loadConversations(showArchived);
  }, [showArchived, loadConversations]);

  // Wrapper to ensure conversations reload with correct archive state
  const handleArchiveConversation = async (conversationId) => {
    await archiveConversation(conversationId);
    // Reload conversations with current tab's state
    await loadConversations(showArchived);
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = getOtherParticipant(conv, currentUserId);
    if (!otherUser) return false;

    const searchLower = searchQuery.toLowerCase();
    const name = (otherUser.displayName || otherUser.username || '').toLowerCase();
    const lastMessageContent = conv.lastMessage?.content?.toLowerCase() || '';

    return (
      name.includes(searchLower) ||
      lastMessageContent.includes(searchLower)
    );
  });

  return (
    <>
      {/* Header */}
      <div className="chat-sidebar-header">
        <h1 className="chat-sidebar-title">Messages</h1>

        {/* Search */}
        <div className="chat-search-container">
          <svg
            className="chat-search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input"
          />
        </div>

        {/* Tabs */}
        <div className="chat-tabs">
          <button
            onClick={() => setShowArchived(false)}
            className={`chat-tab ${!showArchived ? 'active' : ''}`}
          >
            <span>Active</span>
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`chat-tab ${showArchived ? 'active' : ''}`}
          >
            <span>Archived</span>
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="chat-conversations-list">
        {loading ? (
          <div className="chat-loading">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title={
              searchQuery
                ? 'No conversations found'
                : showArchived
                  ? 'No archived conversations'
                  : 'No conversations yet'
            }
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Start a conversation with someone nearby'
            }
          />
        ) : (
          <>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isActive={activeConversation?._id === conversation._id}
                onClick={() => selectConversation(conversation)}
                onArchive={handleArchiveConversation}
                onDelete={deleteConversation}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default ChatList;