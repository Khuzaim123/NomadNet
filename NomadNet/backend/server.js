const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./src/config/database');

// ======================
// Initialize
// ======================
dotenv.config();
connectDB();

const app = express();

// ======================
// Security & CORS (Before Routes)
// ======================
app.use(helmet()); // Security headers

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',      // Vite default
  'http://localhost:3000',      // React default
  'http://127.0.0.1:5173',      // Localhost alternative
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL        // Production URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ======================
// Body Parsing & Logging
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Request logging

// ======================
// Request Logger (Debug Mode)
// ======================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] 📨 ${req.method.padEnd(6)} ${req.path}`);
  if (req.method === 'OPTIONS') {
    console.log(`           ✈️  Preflight request from: ${req.headers.origin || 'unknown'}`);
  }
  next();
});

// ======================
// Load Routes
// ======================
console.log('\n' + '='.repeat(60));
console.log('🔄 LOADING ROUTES...');
console.log('='.repeat(60) + '\n');

let authRoutes, userRoutes, marketplaceRoutes;

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
  console.error('   2. Check if src/controllers/userController.js exists');
  console.error('   3. Run: node -c src/routes/userRoutes.js');
  process.exit(1);
}

// Load Marketplace Routes
try {
  console.log('🔍 Loading marketplaceRoutes from:', __dirname + '/src/routes/marketplaceRoutes.js');
  marketplaceRoutes = require('./src/routes/marketplaceRoutes');
  console.log('✅ Marketplace routes loaded successfully\n');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load marketplaceRoutes');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Check if src/routes/marketplaceRoutes.js exists');
  console.error('   2. Check if src/controllers/marketplaceController.js exists');
  console.error('   3. Run: node -c src/routes/marketplaceRoutes.js');
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

app.use('/api/marketplace', marketplaceRoutes);
console.log('✅ Marketplace routes mounted at /api/marketplace\n');

// ======================
// Health Check
// ======================
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'success',
    message: 'NomadNet API is running',
    timestamp: new Date().toISOString(),
    mongodb: {
      status: mongoStateMap[mongoStatus],
      ready: mongoStatus === 1
    },
    cors: {
      allowedOrigins: allowedOrigins,
      credentials: true
    },
    routes: {
      auth: true,
      users: true,
      marketplace: true
    },
    endpoints: {
      auth: '/api/auth/test',
      users: '/api/users/test',
      marketplace: '/api/marketplace'
    }
  });
});

// ======================
// CORS Test Endpoint
// ======================
app.get('/api/cors-test', (req, res) => {
  res.json({
    status: 'success',
    message: 'CORS is working correctly!',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
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
    routes: routes,
    allowedOrigins: allowedOrigins
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
      corsTest: '/api/cors-test',
      routes: '/api/debug/routes',
      authTest: '/api/auth/test',
      usersTest: '/api/users/test',
      marketplace: '/api/marketplace'
    }
  });
});

// ======================
// Global Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('   Stack:', err.stack);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      status: 'error',
      message: 'CORS policy violation',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins,
      hint: 'Make sure your frontend is running on an allowed origin'
    });
  }
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ======================
// MongoDB Connection Handlers
// ======================
mongoose.connection.on('connected', () => {
  console.log('\n✅ MongoDB Connected Successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('\n❌ MongoDB Connection Error:', err.message);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Make sure MongoDB is running');
  console.error('   2. Windows: net start MongoDB');
  console.error('   3. macOS/Linux: sudo systemctl start mongod');
  console.error('   4. Or use MongoDB Atlas cloud database');
  console.error('   5. Check your MONGODB_URI in .env file\n');
});

mongoose.connection.on('disconnected', () => {
  console.log('\n⚠️  MongoDB Disconnected');
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
    const MarketplaceItem = require('./src/models/MarketplaceItem');
    
    console.log('🔄 Checking User indexes...');
    try {
      await User.collection.dropIndexes();
      console.log('✅ Old User indexes dropped');
    } catch (err) {
      if (err.message.includes('ns not found')) {
        console.log('ℹ️  No existing User collection');
      }
    }
    
    await User.createIndexes();
    console.log('✅ New User indexes created');
    
    const userIndexes = await User.collection.indexes();
    console.log('📋 Active User indexes:', userIndexes.map(i => i.name).join(', '));
    
    console.log('\n🔄 Checking MarketplaceItem indexes...');
    try {
      await MarketplaceItem.collection.dropIndexes();
      console.log('✅ Old MarketplaceItem indexes dropped');
    } catch (err) {
      if (err.message.includes('ns not found')) {
        console.log('ℹ️  No existing MarketplaceItem collection (will be created on first listing)');
      }
    }
    
    await MarketplaceItem.createIndexes();
    console.log('✅ New MarketplaceItem indexes created');
    
    const marketplaceIndexes = await MarketplaceItem.collection.indexes();
    console.log('📋 Active MarketplaceItem indexes:', marketplaceIndexes.map(i => i.name).join(', '));
    console.log('');
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('ℹ️  No existing collection (will be created on first use)');
    } else {
      console.error('⚠️  Index operation failed:', error.message);
    }
  }
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 39300;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log('='.repeat(60));
  console.log(`📡 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`🔍 CORS Test:     http://localhost:${PORT}/api/cors-test`);
  console.log(`🔍 Debug Routes:  http://localhost:${PORT}/api/debug/routes`);
  console.log(`🔐 Auth Test:     http://localhost:${PORT}/api/auth/test`);
  console.log(`👤 Users Test:    http://localhost:${PORT}/api/users/test`);
  console.log(`🛍️  Marketplace:   http://localhost:${PORT}/api/marketplace`);
  console.log('='.repeat(60));
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log('='.repeat(60) + '\n');
  
  if (mongoose.connection.readyState !== 1) {
    console.log('⚠️  WARNING: MongoDB is not connected yet!');
    console.log('   Server is running but database operations will fail.');
    console.log('   Please start MongoDB and restart the server.\n');
  } else {
    console.log('✅ Server is ready to accept requests\n');
  }
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
  
  // Don't crash on MongoDB connection errors during startup
  if (reason && reason.message && reason.message.includes('ECONNREFUSED')) {
    console.error('\n⚠️  MongoDB connection failed. Please start MongoDB.');
    console.error('   Server will continue running but database operations will fail.\n');
  } else {
    console.error('\n🛑 Server will shut down...\n');
    process.exit(1);
  }
});

module.exports = app;