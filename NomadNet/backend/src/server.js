const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');

// ======================
// Initialize
// ======================
dotenv.config();
connectDB();

const app = express();

// ======================
// CORS (Must be BEFORE routes)
// ======================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// ======================
// Body Parsing Middleware
// ⚠️ IMPORTANT: Don't use express.json() for multipart routes
// ======================
app.use((req, res, next) => {
  // Skip body parsing for multipart/form-data (multer will handle it)
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    console.log('📦 Multipart request detected - skipping body parser');
    return next();
  }
  express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

// ======================
// Request Logger (Debug Mode)
// ======================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] 📨 ${req.method.padEnd(6)} ${req.path}`);
  if (req.headers['content-type']) {
    console.log(`           Content-Type: ${req.headers['content-type']}`);
  }
  next();
});

// ======================
// Load Routes
// ======================
console.log('\n' + '='.repeat(60));
console.log('🔄 LOADING ROUTES...');
console.log('='.repeat(60) + '\n');

let authRoutes, userRoutes;

// Load Auth Routes
try {
  console.log('🔍 Loading authRoutes from:', __dirname + '/src/routes/authRoutes.js');
  authRoutes = require('./src/routes/authRoutes');
  console.log('✅ Auth routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load authRoutes');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

// Load User Routes
try {
  console.log('🔍 Loading userRoutes from:', __dirname + '/src/routes/userRoutes.js');
  userRoutes = require('./src/routes/userRoutes');
  console.log('✅ User routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load userRoutes');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Check if src/routes/userRoutes.js exists');
  console.error('   2. Check if userController.js exists');
  console.error('   3. Run: node -c src/routes/userRoutes.js');
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
console.log('✅ User routes mounted at /api/users\n');

// ======================
// Health Check
// ======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'NomadNet API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
    },
    routes: {
      auth: true,
      users: true
    },
    endpoints: {
      auth: '/api/auth/test',
      users: '/api/users/test'
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
      usersTest: '/api/users/test'
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
// MongoDB Index Fix (After connection)
// ======================
mongoose.connection.once('open', async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 MONGODB MAINTENANCE');
  console.log('='.repeat(60) + '\n');
  
  try {
    const User = require('./src/models/User');
    console.log('🔄 Checking indexes...');
    
    await User.collection.dropIndexes();
    console.log('✅ Old indexes dropped');
    
    await User.createIndexes();
    console.log('✅ New indexes created');
    
    const indexes = await User.collection.indexes();
    console.log('📋 Active indexes:', indexes.map(i => i.name).join(', '));
    console.log('');
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('ℹ️  No existing collection (will be created on first user)');
    } else {
      console.error('⚠️  Index operation failed:', error.message);
    }
  }
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log('='.repeat(60));
  console.log(`📡 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`🔍 Debug Routes:  http://localhost:${PORT}/api/debug/routes`);
  console.log(`🔐 Auth Test:     http://localhost:${PORT}/api/auth/test`);
  console.log(`👤 Users Test:    http://localhost:${PORT}/api/users/test`);
  console.log('='.repeat(60));
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log('='.repeat(60) + '\n');
  
  console.log('✅ Server is ready to accept requests\n');
});

// ======================
// Graceful Shutdown
// ======================
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n\n⚠️  SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// ======================
// Uncaught Exception Handler
// ======================
process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  console.error('\n🛑 Server will shut down...\n');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION:');
  console.error('   Reason:', reason);
  console.error('   Promise:', promise);
  console.error('\n🛑 Server will shut down...\n');
  process.exit(1);
});