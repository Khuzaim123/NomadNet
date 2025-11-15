const crypto = require('crypto');

// Generate random token
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash token (for storing in database)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateRandomToken,
  hashToken
};