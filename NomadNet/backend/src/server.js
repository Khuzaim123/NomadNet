const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose'); // ✅ Added
const connectDB = require('./config/database');

// ⭐ Load environment variables FIRST
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ======================
// 🔧 Fix Indexes on Startup
// ======================
mongoose.connection.once('open', async () => {
  try {
    const User = require('./models/User');
    
    console.log('🔄 Checking and fixing database indexes...');
    
    // Drop all existing indexes (except _id)
    await User.collection.dropIndexes();
    console.log('✅ Old indexes dropped');
    
    // Recreate indexes based on current schema
    await User.createIndexes();
    console.log('✅ New indexes created successfully');
    
  } catch (error) {
    // Ignore error if no indexes exist yet
    if (error.message.includes('ns not found')) {
      console.log('ℹ️  No existing indexes to drop (first run)');
    } else {
      console.error('⚠️  Index recreation error:', error.message);
    }
  }
});

// ======================
// 🛡️ Middleware
// ======================
app.use(helmet());
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ======================
// 🛣️ Routes
// ======================
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ======================
// 💚 Health Check
// ======================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'NomadNet API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ======================
// 🚫 404 Handler
// ======================
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// ======================
// ⚠️ Global Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ======================
// 🚀 Start Server
// ======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ======================
// 🛑 Graceful Shutdown
// ======================
process.on('unhandledRejection', (err) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;