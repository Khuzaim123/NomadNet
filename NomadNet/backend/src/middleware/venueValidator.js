const { body, query, validationResult } = require('express-validator');

// ======================
//  VENUE VALIDATIONS
// ======================

const createVenueValidation = [
  //  Skip validation if multipart (multer handles it differently)
  (req, res, next) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      console.log(' Multipart request - adapting validation');
      return next();
    }
    next();
  },

  body('name')
    .notEmpty()
    .withMessage('Venue name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Venue name must be between 2 and 100 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['cafe', 'coworking', 'restaurant', 'bar', 'park', 'library', 'hotel', 'other'])
    .withMessage('Invalid category'),

  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('address.street')
    .optional()
    .trim(),

  body('address.city')
    .optional()
    .trim(),

  body('address.country')
    .optional()
    .trim(),

  body('contact.phone')
    .optional()
    .trim(),

  body('contact.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),

  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email'),

  body('amenities')
    .optional()
    .custom((value) => {
      // Handle both JSON string and array
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          return false;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Amenities must be an array'),

  body('amenities.*')
    .optional()
    .isIn(['wifi', 'power_outlets', 'coffee', 'quiet', 'air_conditioning', 'outdoor_seating', 'parking'])
    .withMessage('Invalid amenity')
];

const updateVenueValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Venue name must be between 2 and 100 characters'),

  body('category')
    .optional()
    .isIn(['cafe', 'coworking', 'restaurant', 'bar', 'park', 'library', 'hotel', 'other'])
    .withMessage('Invalid category'),

  body('contact.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),

  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array')
];

const nearbySearchValidation = [
  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),

  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),

  query('radius')
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage('Radius must be between 100 and 50000 meters'),

  query('category')
    .optional()
    .isIn(['cafe', 'coworking', 'restaurant', 'bar', 'park', 'library', 'hotel', 'other'])
    .withMessage('Invalid category'),

  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5')
];

// ======================
//  Validation Handler
// ======================
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }

  next();
};

module.exports = {
  createVenueValidation,
  updateVenueValidation,
  nearbySearchValidation,
  validate
};