// src/context/ChatContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import chatService from '../services/chatService';
import socketService from '../services/socketService';
import { getToken, getUser } from '../services/authService';

const ChatContext = createContext(null); // ✅ give it a default null

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  // ✅ useLocation is ONLY called inside the component
  const location = useLocation();
  const user = getUser();
  const token = getToken();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [listingContext, setListingContext] = useState(null);

  // ================== LOAD CONVERSATIONS ==================
  const loadConversations = useCallback(async (archived = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getConversations({ archived });

      const conversationsData =
        response.data?.conversations || response.data || [];

      setConversations(conversationsData);

      const total = conversationsData.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(total);
    } catch (err) {
      console.error('Load conversations error:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // ================== LOAD MESSAGES ==================
  const loadMessages = useCallback(async (conversationId, page = 1) => {
    try {
      setMessagesLoading(true);
      setError(null);
      const response = await chatService.getMessages(conversationId, {
        page,
        limit: 50,
      });

      const messagesData = response.data?.messages || response.data || [];

      if (page === 1) {
        setMessages(messagesData);
      } else {
        setMessages((prev) => [...messagesData, ...prev]);
      }

      // Mark as read
      await chatService.markConversationAsRead(conversationId);

      // Reset unread locally
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      socketService.joinConversation(conversationId);
    } catch (err) {
      console.error('Load messages error:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // ================== SEND MESSAGE ==================
  const sendMessage = useCallback(
    async (messageData) => {
      try {
        const response = await chatService.sendMessage(messageData);
        const newMessage = response.data?.message || response.data;

        setMessages((prev) => [...prev, newMessage]);

        // Optionally refresh conversations or update lastMessage locally
        await loadConversations();

        return newMessage;
      } catch (err) {
        setError(err.message || 'Failed to send message');
        throw err;
      }
    },
    [loadConversations]
  );

  // ================== SOCKET: NEW MESSAGE ==================
  const handleNewMessage = useCallback(
    (message) => {
      if (activeConversation && message.conversation === activeConversation._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        chatService.markConversationAsRead(activeConversation._id);
      } else {
        setUnreadCount((prev) => prev + 1);
      }

      loadConversations();
    },
    [activeConversation, loadConversations]
  );

  // ================== SOCKET: MESSAGE READ ==================
  const handleMessageRead = useCallback((data) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === data.messageId
          ? { ...msg, isRead: true, readAt: data.readAt }
          : msg
      )
    );
  }, []);

  // ================== CREATE/GET CONVERSATION ==================
  const createConversation = useCallback(
    async (participantId) => {
      try {
        setLoading(true);
        const response = await chatService.createOrGetConversation(participantId);
        const conversation = response.data?.conversation || response.data;

        setActiveConversation(conversation);
        await loadMessages(conversation._id);
        await loadConversations();
        return conversation;
      } catch (err) {
        setError(err.message || 'Failed to create conversation');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadMessages, loadConversations]
  );

  // ================== SELECT CONVERSATION ==================
  const selectConversation = useCallback(
    async (conversation) => {
      if (activeConversation?._id) {
        socketService.leaveConversation(activeConversation._id);
      }

      setActiveConversation(conversation);
      setListingContext(null); // clear listing context when user picks one
      await loadMessages(conversation._id);
    },
    [activeConversation, loadMessages]
  );

  // ================== ARCHIVE / DELETE CONVERSATION ==================
  const archiveConversation = useCallback(
    async (conversationId) => {
      try {
        await chatService.toggleArchiveConversation(conversationId);
        await loadConversations();
        if (activeConversation?._id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to archive conversation');
        throw err;
      }
    },
    [activeConversation, loadConversations]
  );

  const deleteConversation = useCallback(
    async (conversationId) => {
      try {
        await chatService.deleteConversation(conversationId);
        await loadConversations();
        if (activeConversation?._id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to delete conversation');
        throw err;
      }
    },
    [activeConversation, loadConversations]
  );

  // ================== DELETE MESSAGE ==================
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (err) {
      setError(err.message || 'Failed to delete message');
      throw err;
    }
  }, []);

  // ================== TYPING ==================
  const emitTyping = useCallback((conversationId) => {
    socketService.emitTyping(conversationId);
  }, []);

  // ================== HANDLE NAV FROM LISTING ==================
  useEffect(() => {
    const state = location.state;
    if (!state?.conversationId) return;

    (async () => {
      try {
        setLoading(true);
        const conversationId = state.conversationId;

        let conversation = conversations.find(
          (c) => c._id === conversationId || c.id === conversationId
        );

        if (!conversation && state.otherUser) {
          const currentUser = getUser();
          const currentUserId = currentUser?._id || currentUser?.id;

          conversation = {
            _id: conversationId,
            participants: [
              { _id: currentUserId, ...currentUser },
              {
                _id: state.otherUser._id || state.otherUser.id,
                ...state.otherUser,
              },
            ],
            otherParticipant: state.otherUser,
          };

          setConversations((prev) => {
            if (prev.some((c) => c._id === conversationId)) return prev;
            return [conversation, ...prev];
          });
        }

        if (conversation) {
          setActiveConversation(conversation);
        } else {
          setActiveConversation({ _id: conversationId });
        }

        if (state.listingContext) {
          setListingContext(state.listingContext);
        }

        await loadMessages(conversationId);
      } catch (error) {
        console.error('Error in handleNavigationState:', error);
        setError('Failed to open conversation');
      } finally {
        setLoading(false);
        window.history.replaceState({}, document.title);
      }
    })();
  }, [location.state, conversations, loadMessages]);

  // ================== SOCKET SETUP ==================
  useEffect(() => {
    if (!token) return;

    socketService.connect(token);

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageRead(handleMessageRead);
    socketService.onTyping((data) => {
      setTypingUsers((prev) => ({ ...prev, [data.conversationId]: data.userId }));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[data.conversationId];
          return updated;
        });
      }, 3000);
    });

    return () => {
      socketService.disconnect();
    };
  }, [token, handleNewMessage, handleMessageRead]);

  const value = {
    user,
    token,
    conversations,
    activeConversation,
    messages,
    loading,
    messagesLoading,
    error,
    unreadCount,
    typingUsers,
    listingContext,
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    selectConversation,
    archiveConversation,
    deleteConversation,
    deleteMessage,
    emitTyping,
    setError,
    setListingContext,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;