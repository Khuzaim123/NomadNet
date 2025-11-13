const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/database');

// ⭐ Load environment variables FIRST
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: process.env.CLIENT_URL,  // ✅ Updated
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'NomadNet API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;  // ✅ Updated

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;