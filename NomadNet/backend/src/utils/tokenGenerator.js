const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET,  // ✅ Updated
    { expiresIn: process.env.JWT_EXPIRE || '7d' }  // ✅ Updated
  );
};

module.exports = generateToken;