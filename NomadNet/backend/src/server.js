const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ======================
// 🔧 Index Fix
// ======================
mongoose.connection.once('open', async () => {
  try {
    const User = require('./models/User');
    console.log('🔄 Checking indexes...');
    await User.collection.dropIndexes();
    console.log('✅ Old indexes dropped');
    await User.createIndexes();
    console.log('✅ New indexes created\n');
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('ℹ️  No existing indexes\n');
    } else {
      console.error('⚠️  Index error:', error.message);
    }
  }
});

// ======================
// ✅ CORS - MANUAL FIX
// ======================
app.use((req, res, next) => {
  // Allow any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Allow methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  // Allow headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  // Allow credentials
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight request handled for:', req.path);
    return res.status(200).end();
  }
  
  next();
});

console.log('✅ CORS: Fully open (all origins allowed)\n');

// ======================
// Basic Middleware
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.get('origin') || 'none'}`);
  next();
});

// ======================
// Routes
// ======================
console.log('🔄 Loading routes...\n');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

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
    port: process.env.PORT || 5000,
    cors: 'Open to all origins'
  });
});

// ======================
// 404 Handler
// ======================
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.path);
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ======================
// Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ status: 'error', message: err.message });
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`${'='.repeat(60)}`);
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Register: http://localhost:${PORT}/api/auth/register`);
  console.log(`🌐 CORS: OPEN (all origins)`);
  console.log(`${'='.repeat(60)}\n`);
});