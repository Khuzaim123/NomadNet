// src/services/chatService.js
import api from './api';

const chatService = {
  // ==================== CONVERSATIONS ====================
  
  // Get all conversations
  getConversations: async (params = {}) => {
    try {
      const { page = 1, limit = 20, archived = false } = params;
      const response = await api.get('/api/conversations', {  // ✅ Removed /api
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
      const response = await api.post('/api/conversations', { participantId });  // ✅ Removed /api
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single conversation
  getConversation: async (conversationId) => {
    try {
      const response = await api.get(`/api/conversations/${conversationId}`);  // ✅ Removed /api
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle archive conversation
  toggleArchiveConversation: async (conversationId) => {
    try {
      const response = await api.patch(`/api/conversations/${conversationId}/archive`);  // ✅ Removed /api
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await api.delete(`/api/conversations/${conversationId}`);  // ✅ Removed /api
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId) => {
    try {
      const response = await api.post(`/api/conversations/${conversationId}/read`);  // ✅ Removed /api
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ==================== MESSAGES ====================

  // Send message
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/api/messages', messageData);  // ✅ Already correct
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get messages for conversation
  getMessages: async (conversationId, params = {}) => {
    try {
      const { page = 1, limit = 50 } = params;
      const response = await api.get(`/api/messages/${conversationId}`, {  // ✅ Already correct
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
      const response = await api.put(`/api/messages/${messageId}/read`);  // ✅ Already correct
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/api/messages/${messageId}`);  // ✅ Already correct
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/messages/unread/count');  // ✅ Already correct
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default chatService;