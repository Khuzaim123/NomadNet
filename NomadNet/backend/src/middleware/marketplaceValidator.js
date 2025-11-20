const { body, validationResult } = require('express-validator');

// ======================
// 📝 Create Listing Validation
// ======================
const createListingValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['item', 'skill', 'service'])
    .withMessage('Type must be: item, skill, or service'),

  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'electronics',
      'furniture',
      'books',
      'sports',
      'musical_instruments',
      'web_development',
      'design',
      'photography',
      'writing',
      'consulting',
      'language_lessons',
      'fitness',
      'other'
    ])
    .withMessage('Invalid category'),

  body('otherCategoryName')
    .if(body('category').equals('other'))
    .notEmpty()
    .withMessage('Please specify category name when selecting "other"')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens and ampersands'),

  body('condition')
    .optional()
    .isIn(['new', 'like_new', 'good', 'fair', 'poor'])
    .withMessage('Condition must be: new, like_new, good, fair, or poor'),

  body('priceType')
    .optional()
    .isIn(['free', 'barter', 'paid'])
    .withMessage('Price type must be: free, barter, or paid'),

  body('price.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price amount must be a positive number'),

  body('price.currency')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3-letter code (e.g., USD, EUR)'),

  body('availableFrom')
    .optional()
    .isISO8601()
    .withMessage('Available from must be a valid date'),

  body('availableUntil')
    .optional()
    .isISO8601()
    .withMessage('Available until must be a valid date'),

  body('deliveryOptions')
    .optional()
    .isArray()
    .withMessage('Delivery options must be an array'),

  body('deliveryOptions.*')
    .optional()
    .isIn(['pickup', 'delivery', 'remote'])
    .withMessage('Delivery option must be: pickup, delivery, or remote')
];

// ======================
// 📝 Update Listing Validation
// ======================
const updateListingValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('otherCategoryName')
    .if(body('category').equals('other'))
    .notEmpty()
    .withMessage('Please specify category name when selecting "other"')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens and ampersands'),

  body('condition')
    .optional()
    .isIn(['new', 'like_new', 'good', 'fair', 'poor'])
    .withMessage('Condition must be: new, like_new, good, fair, or poor'),

  body('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be true or false'),

  body('priceType')
    .optional()
    .isIn(['free', 'barter', 'paid'])
    .withMessage('Price type must be: free, barter, or paid'),

  body('price.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price amount must be a positive number'),

  body('availableFrom')
    .optional()
    .isISO8601()
    .withMessage('Available from must be a valid date'),

  body('availableUntil')
    .optional()
    .isISO8601()
    .withMessage('Available until must be a valid date'),

  body('deliveryOptions')
    .optional()
    .isArray()
    .withMessage('Delivery options must be an array'),

  body('deliveryOptions.*')
    .optional()
    .isIn(['pickup', 'delivery', 'remote'])
    .withMessage('Delivery option must be: pickup, delivery, or remote')
];

// ======================
// 📝 Request Item Validation
// ======================
const requestItemValidation = [
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters')
];

// ======================
// 📝 Update Request Status Validation
// ======================
const updateRequestStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['accepted', 'declined', 'completed'])
    .withMessage('Status must be: accepted, declined, or completed')
];

// ======================
// 📝 Delete Photo Validation
// ======================
const deletePhotoValidation = [
  body('photoUrl')
    .notEmpty()
    .withMessage('Photo URL is required')
    .isURL()
    .withMessage('Photo URL must be a valid URL')
];

// ======================
// ✅ Validation Result Handler
// ======================
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};

// ======================
// 📤 Exports
// ======================
module.exports = {
  createListingValidation,
  updateListingValidation,
  requestItemValidation,
  updateRequestStatusValidation,
  deletePhotoValidation,
  validate
};