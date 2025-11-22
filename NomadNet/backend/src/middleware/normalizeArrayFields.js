// middleware/normalizeArrayFields.js

/**
 * Middleware to normalize fields that should be arrays
 * Handles the case where FormData sends single values as strings
 */
const normalizeArrayFields = (req, res, next) => {
  console.log('📥 Raw request body:', req.body);
  
  // Handle deliveryOptions with or without [] suffix
  const deliveryOptionsKey = req.body['deliveryOptions[]'] ? 'deliveryOptions[]' : 'deliveryOptions';
  
  if (req.body[deliveryOptionsKey]) {
    const options = req.body[deliveryOptionsKey];
    req.body.deliveryOptions = Array.isArray(options) ? options : [options];
    
    // Clean up the [] version if it exists
    if (deliveryOptionsKey === 'deliveryOptions[]') {
      delete req.body['deliveryOptions[]'];
    }
  }

  // Remove empty price object if priceType is not 'paid'
  if (req.body.priceType !== 'paid') {
    delete req.body.price;
  }

  // Convert price amount to number if it exists
  if (req.body.price && req.body.price.amount) {
    req.body.price.amount = parseFloat(req.body.price.amount);
  }

  console.log('✅ Normalized request body:', req.body);
  
  next();
};

module.exports = normalizeArrayFields;