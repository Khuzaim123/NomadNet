const validateEnv = () => {
  const errors = [];

  // Required variables
  const required = {
    'NODE_ENV': process.env.NODE_ENV,
    'PORT': process.env.PORT,
    'MONGODB_URI': process.env.MONGODB_URI,
    'JWT_SECRET': process.env.JWT_SECRET,
    'CLIENT_URL': process.env.CLIENT_URL
  };

  // Check required variables
  Object.entries(required).forEach(([key, value]) => {
    if (!value) {
      errors.push(`❌ ${key} is required`);
    }
  });

  // Optional but recommended
  const optional = {
    'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
    'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
    'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET,
    'SMTP_USER': process.env.SMTP_USER,
    'SMTP_PASS': process.env.SMTP_PASS
  };

  const warnings = [];
  Object.entries(optional).forEach(([key, value]) => {
    if (!value) {
      warnings.push(`⚠️  ${key} not set (feature will be limited)`);
    }
  });

  // Validation checks
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('❌ JWT_SECRET should be at least 32 characters long');
  }

  if (process.env.PORT && isNaN(process.env.PORT)) {
    errors.push('❌ PORT must be a number');
  }

  // Print results
  console.log('\n🔍 Environment Variables Validation\n');
  
  if (errors.length > 0) {
    console.error('Errors:');
    errors.forEach(err => console.error(err));
    console.error('\n💡 Please check your .env file\n');
    return false;
  }

  console.log('✅ All required variables are set');

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warn => console.warn(warn));
  }

  console.log('');
  return true;
};

module.exports = validateEnv;