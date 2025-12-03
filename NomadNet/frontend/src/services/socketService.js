// src/services/socketService.js
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:39300/api').replace('/api', '');

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // ======================
  // 🔌 Connection Management
  // ======================

  connect(token) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting to Socket.IO server:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    this.setupDefaultListeners();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('👋 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.reconnectAttempts = 0;
      this.listeners.clear();
    }
  }

  setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connected = false;

      if (reason === 'io server disconnect') {
        setTimeout(() => this.socket?.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
      }
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
  // 📤 Emit Events
  // ======================

  sendMessage(message) {
    if (!this.ensureConnected()) return;
    this.socket.emit('newMessage', message);
  }

  emitTyping(conversationId) {
    if (!this.ensureConnected()) return;
    this.socket.emit('typing', { conversationId });
  }

  sendTyping(conversationId, userId, username) {
    if (!this.ensureConnected()) return;
    this.socket.emit('typing', { conversationId, userId, username });
  }

  markAsRead(conversationId, messageIds) {
    if (!this.ensureConnected()) return;
    this.socket.emit('markRead', { conversationId, messageIds });
  }

  // ======================
  // 📥 Event Listeners (Methods ChatContext expects)
  // ======================

  // ✅ Listen for new messages
  onNewMessage(callback) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized for onNewMessage');
      return;
    }
    this.socket.on('newMessage', (message) => {
      console.log('📥 New message received:', message);
      callback(message);
    });
  }

  // ✅ Listen for message read events
  onMessageRead(callback) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized for onMessageRead');
      return;
    }
    this.socket.on('messageRead', (data) => {
      console.log('👀 Message read:', data);
      callback(data);
    });
  }

  // ✅ Listen for typing events
  onTyping(callback) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized for onTyping');
      return;
    }
    this.socket.on('typing', (data) => {
      callback(data);
    });
    this.socket.on('userTyping', (data) => {
      callback(data);
    });
  }

  // ✅ Listen for user online status
  onUserOnline(callback) {
    if (!this.socket) return;
    this.socket.on('userOnline', (userId) => {
      console.log('🟢 User online:', userId);
      callback(userId);
    });
  }

  // ✅ Listen for user offline status
  onUserOffline(callback) {
    if (!this.socket) return;
    this.socket.on('userOffline', (userId) => {
      console.log('🔴 User offline:', userId);
      callback(userId);
    });
  }

  // ✅ Listen for conversation updates
  onConversationUpdated(callback) {
    if (!this.socket) return;
    this.socket.on('conversationUpdated', (conversation) => {
      console.log('🔄 Conversation updated:', conversation);
      callback(conversation);
    });
  }

  // ✅ Listen for errors
  onError(callback) {
    if (!this.socket) return;
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      callback(error);
    });
  }

  // ======================
  // 🗺️ Map Events
  // ======================

  joinMapArea(longitude, latitude, radius = 5000) {
    if (!this.ensureConnected()) return;
    console.log('📍 Joining map area:', { longitude, latitude, radius });
    this.socket.emit('map:join', { longitude, latitude, radius });
  }

  updateLocation(longitude, latitude) {
    if (!this.ensureConnected()) return;
    this.socket.emit('map:update-location', { longitude, latitude });
  }

  // ======================
  // 📡 Generic Event Listeners
  // ======================

  on(event, callback) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized');
      return;
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  removeAllListeners(event) {
    if (!this.socket) return;

    if (event) {
      this.socket.off(event);
      this.listeners.delete(event);
    } else {
      this.socket.removeAllListeners();
      this.listeners.clear();
    }
  }

  // ======================
  // 📊 Status & Utilities
  // ======================

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  ensureConnected() {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected');
      return false;
    }
    return true;
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