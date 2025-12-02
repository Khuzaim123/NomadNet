// utils/checkInCleanup.js

const CheckIn = require('../models/CheckIn');
const { emitCheckInExpired } = require('./socketEmitters');

/**
 * 🧹 Auto-cleanup expired check-ins
 * Runs periodically to delete old check-ins
 */
const cleanupExpiredCheckIns = async () => {
  try {
    const now = Date.now();
    
    // Find expired check-ins before deleting (to emit socket events)
    const expiredCheckIns = await CheckIn.find({
      expiresAt: { $lt: now }
    }).select('_id location');

    if (expiredCheckIns.length > 0) {
      console.log(`🧹 Cleaning up ${expiredCheckIns.length} expired check-ins`);

      // Emit socket events for each expired check-in
      expiredCheckIns.forEach(checkIn => {
        emitCheckInExpired(checkIn._id, checkIn.location);
      });

      // Delete from database
      await CheckIn.deleteMany({
        expiresAt: { $lt: now }
      });

      console.log(`✅ ${expiredCheckIns.length} expired check-ins removed`);
    }

    return expiredCheckIns.length;
  } catch (error) {
    console.error('❌ Check-in cleanup error:', error);
    return 0;
  }
};

/**
 * Start cleanup job
 * Runs every 5 minutes
 */
const startCleanupJob = () => {
  console.log('🚀 Starting check-in cleanup job (runs every 5 minutes)');
  
  // Run immediately on start
  cleanupExpiredCheckIns();
  
  // Then run every 5 minutes
  const interval = 5 * 60 * 1000; // 5 minutes
  setInterval(cleanupExpiredCheckIns, interval);
};

module.exports = {
  cleanupExpiredCheckIns,
  startCleanupJob
};