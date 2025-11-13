const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

const FROM_EMAIL = process.env.FROM_EMAIL;
const FROM_NAME = process.env.FROM_NAME;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Create reusable transporter
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  Email not configured. Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport(EMAIL_CONFIG);
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    // If no transporter (email not configured), just log
    if (!transporter) {
      console.log('\n📧 ========== EMAIL (DEV MODE) ==========');
      console.log('To:', options.email);
      console.log('Subject:', options.subject);
      console.log('Message:', options.message || options.html);
      console.log('=========================================\n');
      return { success: true, messageId: 'dev-mode' };
    }

    const mailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Email templates
const emailTemplates = {
  // Email Verification Template
  emailVerification: (username, verificationUrl) => ({
    subject: 'Verify Your NomadNet Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 Welcome to NomadNet!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}! 👋</h2>
            <p>Thanks for joining NomadNet - the hyper-local network for digital nomads.</p>
            <p>Please verify your email address to activate your account and start connecting with nomads nearby.</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p style="margin-top: 30px;">This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you didn't create this account, please ignore this email.</p>
            <p>&copy; 2024 NomadNet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Password Reset Template
  passwordReset: (username, resetUrl) => ({
    subject: 'Reset Your NomadNet Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>We received a request to reset your password for your NomadNet account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>If you're having trouble, contact us at support@nomadnet.com</p>
            <p>&copy; 2024 NomadNet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Welcome Email
  welcome: (username) => ({
    subject: '🎉 Welcome to the NomadNet Community!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're All Set!</h1>
          </div>
          <div class="content">
            <h2>Welcome aboard, ${username}! 🌍</h2>
            <p>Your email has been verified and your account is now active.</p>
            <h3>Here's what you can do now:</h3>
            <div class="feature">
              <strong>📍 Check-in to your location</strong><br>
              Let nearby nomads know where you're working from
            </div>
            <div class="feature">
              <strong>💬 Start conversations</strong><br>
              Connect with digital nomads in your area
            </div>
            <div class="feature">
              <strong>🎯 Update your status</strong><br>
              Share what you're up to and find collaboration opportunities
            </div>
            <div class="feature">
              <strong>🔄 Share resources</strong><br>
              Lend, borrow, and exchange skills with the community
            </div>
            <p style="margin-top: 30px;">Ready to explore? Log in and start connecting!</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send verification email
const sendVerificationEmail = async (email, username, verificationToken) => {
  const verificationUrl = `${CLIENT_URL}/verify-email/${verificationToken}`;
  const template = emailTemplates.emailVerification(username, verificationUrl);
  
  return await sendEmail({
    email,
    subject: template.subject,
    html: template.html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, username, resetToken) => {
  const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;
  const template = emailTemplates.passwordReset(username, resetUrl);
  
  return await sendEmail({
    email,
    subject: template.subject,
    html: template.html
  });
};

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  const template = emailTemplates.welcome(username);
  
  return await sendEmail({
    email,
    subject: template.subject,
    html: template.html
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};