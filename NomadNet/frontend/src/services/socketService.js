// src/services/socketService.js
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:39300/api').replace('/api', '');

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.messageCallbacks = new Set();
    this.typingCallbacks = new Set();
    this.readCallbacks = new Set();
    this.conversationCallbacks = new Set();
  }

  // ======================
  // 🔌 Connection Management
  // ======================

  connect(token) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected:', this.socket.id);
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    console.log('🔌 Connecting to Socket.IO server:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      timeout: 20000
    });

    this.setupEventListeners();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('👋 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.reconnectAttempts = 0;
      this.clearAllCallbacks();
    }
  }

  clearAllCallbacks() {
    this.messageCallbacks.clear();
    this.typingCallbacks.clear();
    this.readCallbacks.clear();
    this.conversationCallbacks.clear();
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.reconnectAttempts++;
    });

    // Message events - call all registered callbacks
    this.socket.on('newMessage', (message) => {
      console.log('📥 New message received via socket:', message._id);
      this.messageCallbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Message callback error:', error);
        }
      });
    });

    // Typing events
    this.socket.on('userTyping', (data) => {
      this.typingCallbacks.forEach(callback => {
        try {
          callback({ ...data, isTyping: true });
        } catch (error) {
          console.error('Typing callback error:', error);
        }
      });
    });

    this.socket.on('userStoppedTyping', (data) => {
      this.typingCallbacks.forEach(callback => {
        try {
          callback({ ...data, isTyping: false });
        } catch (error) {
          console.error('Typing callback error:', error);
        }
      });
    });

    // Read receipts
    this.socket.on('messagesRead', (data) => {
      console.log('👀 Messages read:', data);
      this.readCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Read callback error:', error);
        }
      });
    });

    this.socket.on('messageRead', (data) => {
      this.readCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Read callback error:', error);
        }
      });
    });

    // Conversation updates
    this.socket.on('conversationUpdated', (conversation) => {
      console.log('🔄 Conversation updated:', conversation._id);
      this.conversationCallbacks.forEach(callback => {
        try {
          callback(conversation);
        } catch (error) {
          console.error('Conversation callback error:', error);
        }
      });
    });

    // User status
    this.socket.on('userOnline', (userId) => {
      console.log('🟢 User online:', userId);
    });

    this.socket.on('userOffline', (userId) => {
      console.log('🔴 User offline:', userId);
    });

    // Error handling
    this.socket.on('messageError', (error) => {
      console.error('❌ Message error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  // ======================
  // 💬 Conversation Management
  // ======================

  joinConversation(conversationId) {
    if (!this.ensureConnected()) return;
    console.log('💬 Joining conversation:', conversationId);
    this.socket.emit('joinConversation', conversationId);
  }

  leaveConversation(conversationId) {
    if (!this.ensureConnected()) return;
    console.log('👋 Leaving conversation:', conversationId);
    this.socket.emit('leaveConversation', conversationId);
  }

  // ======================
  // 📤 Send Message via Socket
  // ======================

  sendMessage(messageData) {
    if (!this.ensureConnected()) {
      console.error('Cannot send message: socket not connected');
      return false;
    }
    
    console.log('📤 Sending message via socket:', messageData);
    this.socket.emit('sendMessage', messageData);
    return true;
  }

  // ======================
  // ⌨️ Typing Indicators
  // ======================

  emitTyping(conversationId) {
    if (!this.ensureConnected()) return;
    this.socket.emit('typing', { conversationId });
  }

  emitStopTyping(conversationId) {
    if (!this.ensureConnected()) return;
    this.socket.emit('stopTyping', { conversationId });
  }

  // ======================
  // ✅ Mark as Read
  // ======================

  markAsRead(conversationId, messageIds) {
    if (!this.ensureConnected()) return;
    this.socket.emit('markAsRead', { conversationId, messageIds });
  }

  // ======================
  // 📥 Event Subscription Methods
  // ======================

  onNewMessage(callback) {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onTyping(callback) {
    this.typingCallbacks.add(callback);
    return () => this.typingCallbacks.delete(callback);
  }

  onMessageRead(callback) {
    this.readCallbacks.add(callback);
    return () => this.readCallbacks.delete(callback);
  }

  onConversationUpdated(callback) {
    this.conversationCallbacks.add(callback);
    return () => this.conversationCallbacks.delete(callback);
  }

  // Remove specific callback
  offNewMessage(callback) {
    this.messageCallbacks.delete(callback);
  }

  offTyping(callback) {
    this.typingCallbacks.delete(callback);
  }

  offMessageRead(callback) {
    this.readCallbacks.delete(callback);
  }

  offConversationUpdated(callback) {
    this.conversationCallbacks.delete(callback);
  }

  // ======================
  // 📍 Map Events
  // ======================

  joinMapArea(longitude, latitude, radius = 5000) {
    if (!this.ensureConnected()) return;
    this.socket.emit('map:join', { longitude, latitude, radius });
  }

  updateLocation(longitude, latitude) {
    if (!this.ensureConnected()) return;
    this.socket.emit('map:update-location', { longitude, latitude });
  }

  // ======================
  // 🔧 Utilities
  // ======================

  ensureConnected() {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return false;
    }
    return true;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  ping() {
    if (this.ensureConnected()) {
      this.socket.emit('ping');
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;