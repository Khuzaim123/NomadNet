const crypto = require('crypto');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP for storage
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Verify OTP
const verifyOTP = (plainOTP, hashedOTP) => {
  const hash = crypto.createHash('sha256').update(plainOTP).digest('hex');
  return hash === hashedOTP;
};

// Check if OTP is expired
const isOTPExpired = (expireTime) => {
  return Date.now() > expireTime;
};

// Check rate limiting (prevent spam)
const canSendOTP = (lastSentTime, cooldownMinutes = 1) => {
  if (!lastSentTime) return true;
  
  const timeSinceLastSent = Date.now() - lastSentTime;
  const cooldownMs = cooldownMinutes * 60 * 1000;
  
  return timeSinceLastSent >= cooldownMs;
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  isOTPExpired,
  canSendOTP
};