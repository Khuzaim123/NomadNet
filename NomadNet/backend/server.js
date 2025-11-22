// Minimal, clean, production-ready Express server

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./src/config/database');

// Load env
dotenv.config();
connectDB();

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));

// Body parsing + logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ======================
// 🔥 ROUTES
// ======================
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/marketplace', require('./src/routes/marketplaceRoutes'));

// ✅ NEW: Venue & Check-in Routes
app.use('/api/venues', require('./src/routes/venueRoutes'));
app.use('/api/checkins', require('./src/routes/checkInRoutes'));

// ======================
// 🏥 HEALTH CHECK
// ======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    routes: {
      auth: true,
      users: true,
      marketplace: true,
      venues: true,
      checkins: true
    },
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      marketplace: '/api/marketplace',
      venues: '/api/venues/test',
      checkins: '/api/checkins/test'
    }
  });
});

// ======================
// 🔍 DEBUG: List All Routes
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
// 🚫 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    availableEndpoints: {
      health: '/api/health',
      routes: '/api/debug/routes',
      auth: '/api/auth',
      users: '/api/users',
      marketplace: '/api/marketplace',
      venues: '/api/venues/test',
      checkins: '/api/checkins/test'
    }
  });
});

// ======================
// ⚠️ ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const status = err.message === 'Not allowed by CORS' ? 403 : 500;
  res.status(status).json({ 
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ======================
// 🚀 START SERVER
// ======================
const PORT = process.env.PORT || 39300;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('='.repeat(50));
  console.log('📍 Available Routes:');
  console.log(`   🔐 Auth:        http://localhost:${PORT}/api/auth`);
  console.log(`   👤 Users:       http://localhost:${PORT}/api/users`);
  console.log(`   🛒 Marketplace: http://localhost:${PORT}/api/marketplace`);
  console.log(`   🏢 Venues:      http://localhost:${PORT}/api/venues/test`);
  console.log(`   📍 Check-ins:   http://localhost:${PORT}/api/checkins/test`);
  console.log('='.repeat(50));
  console.log(`🏥 Health:       http://localhost:${PORT}/api/health`);
  console.log(`🔍 Debug Routes: http://localhost:${PORT}/api/debug/routes`);
  console.log('='.repeat(50) + '\n');
});

module.exports = app;