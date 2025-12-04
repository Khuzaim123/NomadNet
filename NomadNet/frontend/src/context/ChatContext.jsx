// src/context/ChatContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import chatService from '../services/chatService';
import socketService from '../services/socketService';
import { getToken, getUser } from '../services/authService';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
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
  const [isConnected, setIsConnected] = useState(false);

  // Refs to track current state in callbacks
  const activeConversationRef = useRef(activeConversation);
  const messagesRef = useRef(messages);

  // Keep refs in sync
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Get current user ID
  const currentUserId = user?._id || user?.id;

  // ================== SOCKET CONNECTION ==================
  useEffect(() => {
    if (!token) {
      console.log('No token, skipping socket connection');
      return;
    }

    console.log('🔌 Initializing socket connection...');
    const socket = socketService.connect(token);

    // Handle connection status
    const handleConnect = () => {
      console.log('✅ Socket connected in ChatContext');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected in ChatContext');
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial connection status
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socketService.disconnect();
    };
  }, [token]);

  // ================== SOCKET EVENT HANDLERS ==================
  useEffect(() => {
    if (!isConnected) return;

    console.log('📡 Setting up socket event listeners...');

    // Handle new messages
    const handleNewMessage = (message) => {
      console.log('📥 Received new message:', message._id);
      
      const currentConversation = activeConversationRef.current;
      const conversationId = message.conversation?._id || message.conversation;

      // Check if message is for active conversation
      if (currentConversation && currentConversation._id === conversationId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === message._id)) {
            console.log('Message already exists, skipping');
            return prev;
          }
          console.log('Adding message to state');
          return [...prev, message];
        });

        // Mark as read if we're the receiver
        const receiverId = message.receiver?._id || message.receiver;
        if (receiverId === currentUserId) {
          socketService.markAsRead(conversationId, [message._id]);
        }
      } else {
        // Message for different conversation - update unread count
        setUnreadCount((prev) => prev + 1);
      }

      // Update conversations list
      updateConversationWithMessage(message);
    };

    // Handle typing indicators
    const handleTyping = (data) => {
      const { conversationId, userId, isTyping } = data;
      
      if (isTyping) {
        setTypingUsers((prev) => ({
          ...prev,
          [conversationId]: userId
        }));

        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const updated = { ...prev };
            if (updated[conversationId] === userId) {
              delete updated[conversationId];
            }
            return updated;
          });
        }, 3000);
      } else {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      }
    };

    // Handle read receipts
    const handleMessageRead = (data) => {
      console.log('👀 Message read event:', data);
      const { messageIds, conversationId, readBy, readAt } = data;

      setMessages((prev) =>
        prev.map((msg) => {
          if (messageIds?.includes(msg._id) || msg._id === data.messageId) {
            return { ...msg, isRead: true, readAt: readAt || data.readAt };
          }
          return msg;
        })
      );
    };

    // Handle conversation updates
    const handleConversationUpdated = (conversation) => {
      console.log('🔄 Conversation updated:', conversation._id);
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === conversation._id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...conversation };
          // Sort by most recent
          return updated.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
          );
        }
        return [conversation, ...prev];
      });
    };

    // Register callbacks
    const unsubMessage = socketService.onNewMessage(handleNewMessage);
    const unsubTyping = socketService.onTyping(handleTyping);
    const unsubRead = socketService.onMessageRead(handleMessageRead);
    const unsubConversation = socketService.onConversationUpdated(handleConversationUpdated);

    return () => {
      unsubMessage();
      unsubTyping();
      unsubRead();
      unsubConversation();
    };
  }, [isConnected, currentUserId]);

  // ================== HELPER: UPDATE CONVERSATION WITH NEW MESSAGE ==================
  const updateConversationWithMessage = useCallback((message) => {
    const conversationId = message.conversation?._id || message.conversation;
    
    setConversations((prev) => {
      const conversationIndex = prev.findIndex((c) => c._id === conversationId);
      
      if (conversationIndex >= 0) {
        const updated = [...prev];
        updated[conversationIndex] = {
          ...updated[conversationIndex],
          lastMessage: message,
          updatedAt: message.createdAt
        };
        // Move to top
        const [conversation] = updated.splice(conversationIndex, 1);
        return [conversation, ...updated];
      }
      
      return prev;
    });
  }, []);

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

      // Join socket room for real-time updates
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
        const { conversationId, receiverId, content, messageType = 'text' } = messageData;

        if (!content?.trim()) {
          throw new Error('Message content is required');
        }

        // Optimistic update - add message immediately
        const optimisticMessage = {
          _id: `temp-${Date.now()}`,
          conversation: conversationId,
          sender: user,
          receiver: receiverId,
          content: content.trim(),
          type: messageType,
          createdAt: new Date().toISOString(),
          isRead: false,
          pending: true
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        // Send via API (which will also emit socket event)
        const response = await chatService.sendMessage(messageData);
        const newMessage = response.data?.message || response.data;

        // Replace optimistic message with real one
        setMessages((prev) => 
          prev.map((msg) => 
            msg._id === optimisticMessage._id ? newMessage : msg
          )
        );

        return newMessage;
      } catch (err) {
        // Remove optimistic message on error
        setMessages((prev) => 
          prev.filter((msg) => !msg.pending)
        );
        setError(err.message || 'Failed to send message');
        throw err;
      }
    },
    [user]
  );

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
      // Leave previous conversation room
      if (activeConversation?._id) {
        socketService.leaveConversation(activeConversation._id);
      }

      setActiveConversation(conversation);
      setListingContext(null);
      await loadMessages(conversation._id);
    },
    [activeConversation, loadMessages]
  );

  // ================== ARCHIVE CONVERSATION ==================
  const archiveConversation = useCallback(
    async (conversationId) => {
      try {
        await chatService.toggleArchiveConversation(conversationId);
        await loadConversations();
        if (activeConversation?._id === conversationId) {
          socketService.leaveConversation(conversationId);
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

  // ================== DELETE CONVERSATION ==================
  const deleteConversation = useCallback(
    async (conversationId) => {
      try {
        await chatService.deleteConversation(conversationId);
        await loadConversations();
        if (activeConversation?._id === conversationId) {
          socketService.leaveConversation(conversationId);
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

  const emitStopTyping = useCallback((conversationId) => {
    socketService.emitStopTyping(conversationId);
  }, []);

  // ================== HANDLE NAVIGATION STATE ==================
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
          conversation = {
            _id: conversationId,
            participants: [
              { _id: currentUserId, ...user },
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
  }, [location.state, conversations, loadMessages, currentUserId, user]);

  // ================== INITIAL LOAD ==================
  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token, loadConversations]);

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
    isConnected,
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    selectConversation,
    archiveConversation,
    deleteConversation,
    deleteMessage,
    emitTyping,
    emitStopTyping,
    setError,
    setListingContext,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;