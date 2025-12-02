import api from './api';

const chatService = {
  // ==================== CONVERSATIONS ====================
  
  // Get all conversations
  getConversations: async (params = {}) => {
    try {
      const { page = 1, limit = 20, archived = false } = params;
      const response = await api.get('/conversations', {
        params: { page, limit, archived }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get or create conversation
  createOrGetConversation: async (participantId) => {
    try {
      const response = await api.post('/conversations', { participantId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single conversation
  getConversation: async (conversationId) => {
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle archive conversation (changed from PUT to PATCH)
  toggleArchiveConversation: async (conversationId) => {
    try {
      const response = await api.patch(`/conversations/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await api.delete(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark conversation as read (changed from PUT to POST)
  markConversationAsRead: async (conversationId) => {
    try {
      const response = await api.post(`/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ==================== MESSAGES ====================

  // Send message
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/messages', messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get messages for conversation
  getMessages: async (conversationId, params = {}) => {
    try {
      const { page = 1, limit = 50 } = params;
      const response = await api.get(`/messages/${conversationId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread/count');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default chatService;