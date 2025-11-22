const { body, query, validationResult } = require('express-validator');

// ======================
// 📍 CHECK-IN VALIDATIONS
// ======================

const createCheckInValidation = [
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

  body('venueId')
    .optional()
    .isMongoId()
    .withMessage('Invalid venue ID'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note must not exceed 200 characters'),

  body('visibility')
    .optional()
    .isIn(['public', 'connections', 'private'])
    .withMessage('Visibility must be public, connections, or private')
];

const updateCheckInValidation = [
  body('note')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note must not exceed 200 characters'),

  body('visibility')
    .optional()
    .isIn(['public', 'connections', 'private'])
    .withMessage('Visibility must be public, connections, or private')
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
    .withMessage('Radius must be between 100 and 50000 meters')
];

// ======================
// ✅ Validation Handler
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
  createCheckInValidation,
  updateCheckInValidation,
  nearbySearchValidation,
  validate
};