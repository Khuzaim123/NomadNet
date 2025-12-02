// src/services/socketService.js
import { io as socketIOClient } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:39300';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.token = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (!token) {
      console.warn('⚠️ SocketService: No token provided. Will retry later.');
      return;
    }

    this.token = token;

    // Prevent multiple connections
    if (this.socket && this.connected) return;

    this.socket = socketIOClient(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Socket connected:', this.socket.id);

      // Re-register all listeners after reconnect
      this.listeners.forEach((callback, event) => {
        this.socket.on(event, callback);
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.warn('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, need to manually reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.connected = false;
      console.error('⚠️ Socket connect error:', error.message);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts += 1;
        console.log(`🔄 Retrying connection (${this.reconnectAttempts})...`);
      } else {
        console.error('❌ Max reconnect attempts reached.');
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.connected = false;
      console.log('⚡ Socket disconnected manually');
    }
  }

  addListener(event, callback) {
    if (!event || typeof callback !== 'function') return;
    this.listeners.set(event, callback);
    if (this.socket) this.socket.on(event, callback);
  }

  removeListener(event) {
    const callback = this.listeners.get(event);
    if (this.socket && callback) {
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  removeAllListeners() {
    this.listeners.forEach((callback, event) => {
      if (this.socket) this.socket.off(event, callback);
    });
    this.listeners.clear();
  }

  // Shortcut methods
  onNewMessage(cb) { this.addListener('newMessage', cb); }
  onMessageRead(cb) { this.addListener('messageRead', cb); }
  onTyping(cb) { this.addListener('typing', cb); }
  onUserOnline(cb) { this.addListener('userOnline', cb); }
  onUserOffline(cb) { this.addListener('userOffline', cb); }

  emitTyping(conversationId) { this.socket?.emit('typing', { conversationId }); }
  emitStopTyping(conversationId) { this.socket?.emit('stopTyping', { conversationId }); }
  joinConversation(conversationId) { this.socket?.emit('joinConversation', conversationId); }
  leaveConversation(conversationId) { this.socket?.emit('leaveConversation', conversationId); }
}

export default new SocketService();
