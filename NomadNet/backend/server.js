const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const { Server } = require("socket.io");

// ====================== 
// Initialize
// ====================== 
dotenv.config();
connectDB();

const app = express();

// ✅ CREATE HTTP SERVER FIRST (before Socket.IO)
const server = http.createServer(app);

// ✅ NOW Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.IO Event Handlers
io.on("connection", socket => {
  console.log("⚡ User connected:", socket.id);

  socket.on("joinConversation", (id) => {
    socket.join(id);
  });

  socket.on("leaveConversation", (id) => {
    socket.leave(id);
  });

  socket.on("typing", (data) => {
    socket.to(data.conversationId).emit("typing", data);
  });

  socket.on("newMessage", (msg) => {
    io.to(msg.conversation).emit("newMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// Make io accessible in routes if needed
app.set('io', io);

// ====================== 
// CORS (Must be BEFORE routes)
// ====================== 
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // allow cookies/auth headers
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});


// ====================== 
// Body Parsing Middleware
// ⚠️ IMPORTANT: Don't use express.json() for multipart routes
// ====================== 
const jsonParser = express.json();
const urlencodedParser = express.urlencoded({ extended: true });

app.use((req, res, next) => {
  // Skip body parsing for multipart/form-data (multer will handle it)
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    console.log('📦 Multipart request detected - skipping body parser');
    return next();
  }
  jsonParser(req, res, next);
});

app.use(urlencodedParser);

// ====================== 
// Request Logger (Debug Mode)
// ====================== 
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] 📨 ${req.method.padEnd(6)} ${req.path}`);
  if (req.headers['content-type']) {
    console.log(`  Content-Type: ${req.headers['content-type']}`);
  }
  next();
});

// ====================== 
// Load Routes
// ====================== 
console.log('\n' + '='.repeat(60));
console.log('🔄 LOADING ROUTES...');
console.log('='.repeat(60) + '\n');

let authRoutes, userRoutes, venueRoutes, checkInRoutes;
let conversationRoutes, messageRoutes, statusRoutes, marketplaceRoutes;

// Load Auth Routes
try {
  console.log('🔍 Loading authRoutes from:', __dirname + '/src/routes/authRoutes.js');
  authRoutes = require('./src/routes/authRoutes');
  console.log('✅ Auth routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load authRoutes');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  process.exit(1);
}

// Load User Routes
try {
  console.log('🔍 Loading userRoutes from:', __dirname + '/src/routes/userRoutes.js');
  userRoutes = require('./src/routes/userRoutes');
  console.log('✅ User routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load userRoutes');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  console.error('\n💡 Troubleshooting:');
  console.error('  1. Check if src/routes/userRoutes.js exists');
  console.error('  2. Check if userController.js exists');
  console.error('  3. Run: node -c src/routes/userRoutes.js');
  process.exit(1);
}
try {
  console.log('🔍 Loading marketplaceRoutes from:', __dirname + '/src/routes/marketplaceRoutes.js');
  marketplaceRoutes = require('./src/routes/marketplaceRoutes');
  console.log('✅ Marketplace routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load marketplaceRoutes');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  process.exit(1);
}

// Load Venue Routes
try {
  console.log('🔍 Loading venueRoutes from:', __dirname + '/src/routes/venueRoutes.js');
  venueRoutes = require('./src/routes/venueRoutes');
  console.log('✅ Venue routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load venueRoutes');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  console.error('\n💡 Troubleshooting:');
  console.error('  1. Check if src/routes/venueRoutes.js exists');
  console.error('  2. Check if venueController.js exists');
  console.error('  3. Check if venueValidator.js exists');
  process.exit(1);
}

// Load Check-in Routes
try {
  console.log('🔍 Loading checkInRoutes from:', __dirname + '/src/routes/checkInRoutes.js');
  checkInRoutes = require('./src/routes/checkInRoutes');
  console.log('✅ Check-in routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load checkInRoutes');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  console.error('\n💡 Troubleshooting:');
  console.error('  1. Check if src/routes/checkInRoutes.js exists');
  console.error('  2. Check if checkInController.js exists');
  console.error('  3. Check if checkInValidator.js exists');
  process.exit(1);
}

// Load Conversation Routes
try {
  console.log('🔍 Loading conversationRoutes from:', __dirname + '/src/routes/conversationRoutes.js');
  conversationRoutes = require('./src/routes/conversationRoutes');
  console.log('✅ Conversation routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load conversationRoutes');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  process.exit(1);
}

// Load Message Routes
try {
  console.log('🔍 Loading messageRoutes from:', __dirname + '/src/routes/messageRoutes.js');
  messageRoutes = require('./src/routes/messageRoutes');
  console.log('✅ Message routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load messageRoutes');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  process.exit(1);
}

// Load Status Routes
try {
  console.log('🔍 Loading statusRoutes from:', __dirname + '/src/routes/statusRoutes.js');
  statusRoutes = require('./src/routes/statusRoutes');
  console.log('✅ Status routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load statusRoutes');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  process.exit(1);
}

// ====================== 
// Mount Routes
// ====================== 
console.log('='.repeat(60));
console.log('🔧 MOUNTING ROUTES...');
console.log('='.repeat(60) + '\n');

app.use('/api/auth', authRoutes);
console.log('✅ Auth routes mounted at /api/auth');

app.use('/api/users', userRoutes);
console.log('✅ User routes mounted at /api/users');

app.use('/api/venues', venueRoutes);
console.log('✅ Venue routes mounted at /api/venues');

app.use('/api/checkins', checkInRoutes);
console.log('✅ Check-in routes mounted at /api/checkins');

app.use('/api/conversations', conversationRoutes);
console.log('✅ Conversation routes mounted at /api/conversations');

app.use('/api/messages', messageRoutes);
console.log('✅ Message routes mounted at /api/messages');

app.use('/api/statuses', statusRoutes);
console.log('✅ Status routes mounted at /api/statuses\n');

app.use('/api/marketplace', marketplaceRoutes);
console.log('✅ Marketplace routes mounted at /api/marketplace');

// ====================== 
// Health Check
// ====================== 
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'NomadNet API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socketio: 'enabled',
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
    },
    routes: {
      auth: true,
      users: true,
      venues: true,
      checkins: true,
      conversations: true,
      messages: true,
      statuses: true
    },
    endpoints: {
      auth: '/api/auth/test',
      users: '/api/users/test',
      venues: '/api/venues/test',
      checkins: '/api/checkins/test'
    }
  });
});

// ====================== 
// List All Routes (Debug Endpoint)
// ====================== 
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/')
            .replace('^', '');
          routes.push({
            path: path + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    status: 'success',
    totalRoutes: routes.length,
    routes: routes
  });
});

// ====================== 
// 404 Handler (Must be AFTER all routes)
// ====================== 
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      health: '/api/health',
      routes: '/api/debug/routes',
      authTest: '/api/auth/test',
      usersTest: '/api/users/test',
      venuesTest: '/api/venues/test',
      checkinsTest: '/api/checkins/test'
    }
  });
});

// ====================== 
// Global Error Handler
// ====================== 
app.use((err, req, res, next) => {
  console.error('\n❌ ============ ERROR HANDLER ============');
  console.error('Message:', err.message);
  console.error('Status:', err.status || 500);
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Stack:', err.stack);
  console.error('=========================================\n');
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ====================== 
// MongoDB Index Management (After connection)
// ====================== 
mongoose.connection.once('open', async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 MONGODB MAINTENANCE');
  console.log('='.repeat(60) + '\n');
  
  try {
    const User = require('./src/models/User');
    const Venue = require('./src/models/Venue');
    const CheckIn = require('./src/models/CheckIn');
    
    // Use syncIndexes in production, dropIndexes only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Development mode: Dropping and recreating indexes...\n');
      
      console.log('🔄 Checking User indexes...');
      try {
        await User.collection.dropIndexes();
      } catch (err) {
        if (!err.message.includes('ns not found')) {
          console.log('⚠️  Drop user indexes:', err.message);
        }
      }
      await User.createIndexes();
      const userIndexes = await User.collection.indexes();
      console.log('✅ User indexes:', userIndexes.map(i => i.name).join(', '));
      
      console.log('\n🔄 Checking Venue indexes...');
      try {
        await Venue.collection.dropIndexes();
      } catch (err) {
        if (!err.message.includes('ns not found')) {
          console.log('⚠️  Drop venue indexes:', err.message);
        }
      }
      await Venue.createIndexes();
      const venueIndexes = await Venue.collection.indexes();
      console.log('✅ Venue indexes:', venueIndexes.map(i => i.name).join(', '));
      
      console.log('\n🔄 Checking CheckIn indexes...');
      try {
        await CheckIn.collection.dropIndexes();
      } catch (err) {
        if (!err.message.includes('ns not found')) {
          console.log('⚠️  Drop checkin indexes:', err.message);
        }
      }
      await CheckIn.createIndexes();
      const checkinIndexes = await CheckIn.collection.indexes();
      console.log('✅ CheckIn indexes:', checkinIndexes.map(i => i.name).join(', '));
      
    } else {
      console.log('🔄 Production mode: Syncing indexes...\n');
      
      await User.syncIndexes();
      console.log('✅ User indexes synced');
      
      await Venue.syncIndexes();
      console.log('✅ Venue indexes synced');
      
      await CheckIn.syncIndexes();
      console.log('✅ CheckIn indexes synced');
    }
    
    console.log('');
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('ℹ️  No existing collections (will be created on first document)');
    } else {
      console.error('⚠️  Index operation failed:', error.message);
    }
  }
});

// ====================== 
// Start Server
// ====================== 
const PORT = process.env.PORT || 39300;


server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log('='.repeat(60));
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Debug Routes: http://localhost:${PORT}/api/debug/routes`);
  console.log('');
  console.log('📍 Available Endpoints:');
  console.log(`  🔐 Auth:        http://localhost:${PORT}/api/auth/test`);
  console.log(`  👤 Users:       http://localhost:${PORT}/api/users/test`);
  console.log(`  🏢 Venues:      http://localhost:${PORT}/api/venues/test`);
  console.log(`  📍 Check-ins:   http://localhost:${PORT}/api/checkins/test`);
  console.log(`  💬 Conversations: http://localhost:${PORT}/api/conversations`);
  console.log(`  📨 Messages:    http://localhost:${PORT}/api/messages`);
  console.log(`  📊 Statuses:    http://localhost:${PORT}/api/statuses`);
  console.log('='.repeat(60));
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`⚡ Socket.IO: Enabled`);
  console.log('='.repeat(60) + '\n');
  console.log('✅ Server is ready to accept requests\n');
});

// ====================== 
// Graceful Shutdown
// ====================== 
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} signal received: closing HTTP server`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ====================== 
// Uncaught Exception Handler
// ====================== 
process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
  console.error('\n🛑 Server will shut down...\n');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION:');
  console.error('  Reason:', reason);
  console.error('  Promise:', promise);
  console.error('\n🛑 Server will shut down...\n');
  process.exit(1);
});

module.exports = app;