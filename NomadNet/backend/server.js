// server.js - FIXED VERSION
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ======================
// SOCKET.IO SETUP
// ======================
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173' , 'https://nomad-net.netlify.app'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store online users: { odomain lesuserId: Set of socketIds }
const onlineUsers = new Map();

// ======================
// SOCKET.IO AUTHENTICATION MIDDLEWARE
// ======================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.warn('⚠️ Socket connection without token');
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    socket.data.authenticated = true;
    
    console.log(`✅ Socket authenticated: ${user.username || user.email} (${socket.id})`);
    next();
  } catch (error) {
    console.error('❌ Socket auth error:', error.message);
    next(new Error('Authentication failed'));
  }
});

// ======================
// SOCKET.IO CONNECTION HANDLER
// ======================
io.on("connection", async (socket) => {
  const userId = socket.userId;
  console.log(`\n🔗 User connected: ${socket.user?.username || userId} (${socket.id})`);

  // ==================
  // User Online Status
  // ==================
  if (userId) {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, { 
      isOnline: true, 
      lastActive: new Date() 
    });

    socket.broadcast.emit('userOnline', userId);
    
    console.log(`👤 User ${userId} is now online. Total sockets: ${onlineUsers.get(userId).size}`);
  }

  // ==================
  // Conversation Room Management
  // ==================
  socket.on("joinConversation", (conversationId) => {
    if (!conversationId) return;
    
    socket.join(conversationId);
    console.log(`💬 Socket ${socket.id} joined conversation: ${conversationId}`);
    
    socket.to(conversationId).emit('userJoinedConversation', {
      userId: userId,  // ✅ FIXED
      conversationId
    });
  });

  socket.on("leaveConversation", (conversationId) => {
    if (!conversationId) return;
    
    socket.leave(conversationId);
    console.log(`👋 Socket ${socket.id} left conversation: ${conversationId}`);
  });

  // ==================
  // Real-Time Messaging
  // ==================
  socket.on("sendMessage", async (messageData) => {
    try {
      const { conversationId, receiverId, content, messageType = 'text' } = messageData;
      
      if (!content?.trim() || !conversationId) {
        socket.emit('messageError', { message: 'Invalid message data' });
        return;
      }

      console.log(`📤 Socket message from ${userId} to conversation ${conversationId}`);

      const Message = require('./src/models/Message');
      const Conversation = require('./src/models/conversation');

      let conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        socket.emit('messageError', { message: 'Conversation not found' });
        return;
      }

      const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        receiver: receiverId,
        content: content.trim(),
        type: messageType,
      });

      conversation.lastMessage = message._id;
      const currentUnreadCount = conversation.unreadCount.get(receiverId) || 0;
      conversation.unreadCount.set(receiverId, currentUnreadCount + 1);
      await conversation.save();

      await message.populate('sender', 'name email avatar username displayName');
      await message.populate('receiver', 'name email avatar username displayName');

      const messageResponse = {
        _id: message._id,
        conversation: message.conversation,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
        isRead: false
      };

      io.to(conversationId).emit('newMessage', messageResponse);
      io.to(`user:${receiverId}`).emit('newMessage', messageResponse);

      const updatedConversation = await Conversation.findById(conversationId)
        .populate('participants', 'name email avatar username displayName')
        .populate('lastMessage');

      io.to(`user:${receiverId}`).emit('conversationUpdated', updatedConversation);
      io.to(`user:${userId}`).emit('conversationUpdated', updatedConversation);

      console.log(`✅ Message sent and broadcasted: ${message._id}`);
    } catch (error) {
      console.error('❌ Socket sendMessage error:', error);
      socket.emit('messageError', { message: error.message });
    }
  });

  // ==================
  // Typing Indicator
  // ==================
  socket.on("typing", (data) => {
    const { conversationId } = data;
    if (!conversationId) return;
    
    socket.to(conversationId).emit("userTyping", {
      userId: userId,  // ✅ FIXED
      username: socket.user?.username,
      conversationId
    });
  });

  socket.on("stopTyping", (data) => {
    const { conversationId } = data;
    if (!conversationId) return;
    
    socket.to(conversationId).emit("userStoppedTyping", {
      userId: userId,  // ✅ FIXED
      conversationId
    });
  });

  // ==================
  // Mark Messages as Read
  // ==================
  socket.on("markAsRead", async ({ conversationId, messageIds }) => {
    try {
      if (!conversationId) return;

      const Message = require('./src/models/Message');
      const Conversation = require('./src/models/conversation');

      await Message.updateMany(
        { 
          _id: { $in: messageIds },
          receiver: userId,
          isRead: false 
        },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );

      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCount.${userId}`]: 0 }
      });

      socket.to(conversationId).emit('messagesRead', {
        conversationId,
        messageIds,
        readBy: userId,
        readAt: new Date()
      });

      console.log(`✅ Messages marked as read: ${messageIds.length}`);
    } catch (error) {
      console.error('❌ markAsRead error:', error);
    }
  });

  // ==================
  // Map Events
  // ==================
  socket.on("map:join", ({ longitude, latitude, radius = 5000 }) => {
    const roomName = `map:${Math.floor(latitude)}:${Math.floor(longitude)}`;
    socket.join(roomName);
    socket.data.mapRoom = roomName;
    socket.data.location = { longitude, latitude };
    
    console.log(`📍 Socket ${socket.id} joined map area: ${roomName}`);
    
    socket.to(roomName).emit("map:user-joined", {
      socketId: socket.id,
      userId: userId,  // ✅ FIXED
      location: { longitude, latitude }
    });
  });

  socket.on("map:update-location", ({ longitude, latitude }) => {
    socket.data.location = { longitude, latitude };
    
    if (socket.data.mapRoom) {
      socket.to(socket.data.mapRoom).emit("map:location-updated", {
        socketId: socket.id,
        userId: userId,  // ✅ FIXED
        location: { longitude, latitude }
      });
    }
  });

  // ==================
  // Health Check
  // ==================
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  // ==================
  // Disconnect Handler
  // ==================
  socket.on("disconnect", async (reason) => {
    console.log(`❌ Socket disconnected: ${socket.user?.username || userId} (${socket.id}) - ${reason}`);

    if (userId && onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);

      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        
        await User.findByIdAndUpdate(userId, { 
          isOnline: false, 
          lastActive: new Date() 
        });

        socket.broadcast.emit('userOffline', userId);
        
        console.log(`👤 User ${userId} is now offline`);
      }
    }

    if (socket.data.mapRoom) {
      socket.to(socket.data.mapRoom).emit("map:user-left", {
        socketId: socket.id,
        userId: userId  // ✅ FIXED
      });
    }
  });

  // ==================
  // Error Handler
  // ==================
  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });
});

// Make io available to routes
app.set('io', io);
app.set('getOnlineUsers', () => onlineUsers);

// ======================
// CORS
// ======================
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.sendStatus(200);

  next();
});

// ======================
// BODY PARSING
// ======================
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ======================
// REQUEST LOGGER
// ======================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ======================
// ROUTES
// ======================
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/venues', require('./src/routes/venueRoutes'));
app.use('/api/checkins', require('./src/routes/checkInRoutes'));
app.use('/api/conversations', require('./src/routes/conversationRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/statuses', require('./src/routes/statusRoutes'));
app.use('/api/marketplace', require('./src/routes/marketplaceRoutes'));
app.use('/api/map', require('./src/routes/mapRoutes'));

// ======================
// HEALTH CHECK
// ======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socketio: {
      enabled: true,
      connectedClients: io.sockets.sockets.size,
      onlineUsers: onlineUsers.size
    }
  });
});

// ======================
// DEBUG: SOCKET INFO
// ======================
app.get('/api/debug/sockets', (req, res) => {
  const sockets = [];
  io.sockets.sockets.forEach((socket) => {
    sockets.push({
      id: socket.id,
      userId: socket.userId,  // ✅ FIXED
      authenticated: socket.data.authenticated,
      location: socket.data.location,
      mapRoom: socket.data.mapRoom,
      rooms: Array.from(socket.rooms)
    });
  });

  res.json({
    total: sockets.length,
    sockets
  });
});

// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
});

// ======================
// GLOBAL ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'error',
      message: 'Payload too large. Please reduce image size or quality.'
    });
  }
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message
  });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 39300;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO enabled`);
  console.log(`💾 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
});

// ======================
// GRACEFUL SHUTDOWN
// ======================
const shutdown = () => {
  console.log('\n👋 Shutting down gracefully...');
  
  io.close(() => {
    console.log('🔌 Socket.IO closed');
    
    server.close(() => {
      console.log('🛑 HTTP server closed');
      
      mongoose.connection.close(false, () => {
        console.log('💾 MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  setTimeout(() => {
    console.error('⏱️ Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;