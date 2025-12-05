const nodemailer = require('nodemailer');

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS.replace(/\s/g, '')
    // Remove any spaces from app password
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

// ✅ Send Registration OTP
const sendRegistrationOTP = async (email, username, otp) => {
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Verify Your Email - NomadNet',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 30px; background: white; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
          .message { color: #666; margin-bottom: 30px; line-height: 1.8; }
          .otp-box { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed #667eea; }
          .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
          .otp-validity { font-size: 12px; color: #999; margin-top: 10px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .warning-title { font-weight: bold; color: #856404; margin-bottom: 5px; }
          .warning-text { color: #856404; font-size: 14px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .footer-text { margin: 5px 0; }
          .footer-link { color: #667eea; text-decoration: none; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #ddd, transparent); margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🌍 Welcome to NomadNet</h1>
            <p>Connect with nomads around the world</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hi <strong>${username}</strong>,</p>
            
            <p class="message">
              Thank you for joining NomadNet! To complete your registration and verify your email address, 
              please use the One-Time Password (OTP) below:
            </p>
            
            <div class="otp-box">
              <div class="otp-label">Your Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-validity">⏰ Valid for 10 minutes</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="warning">
              <div class="warning-title">🔒 Security Notice</div>
              <div class="warning-text">
                Never share this OTP with anyone. NomadNet staff will never ask for your verification code.
                If you didn't request this code, please ignore this email.
              </div>
            </div>
            
            <p class="message">
              Once verified, you'll be able to:
            </p>
            <ul style="color: #666; margin-left: 20px; margin-bottom: 20px;">
              <li>Connect with fellow nomads</li>
              <li>Share your travel experiences</li>
              <li>Discover amazing locations</li>
              <li>Join the global community</li>
            </ul>
          </div>
          
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} NomadNet. All rights reserved.</p>
            <p class="footer-text">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${username},

Thank you for joining NomadNet!

Your verification code is: ${otp}

This code is valid for 10 minutes.

Never share this OTP with anyone.

© ${new Date().getFullYear()} NomadNet
    `
  };

  await transporter.sendMail(message);
};

// ✅ Send Password Reset OTP
const sendPasswordResetOTP = async (email, username, otp) => {
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Password Reset Request - NomadNet',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .content { padding: 40px 30px; background: white; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
          .message { color: #666; margin-bottom: 30px; line-height: 1.8; }
          .otp-box { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed #f5576c; }
          .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; }
          .otp-code { font-size: 36px; font-weight: bold; color: #f5576c; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
          .otp-validity { font-size: 12px; color: #999; margin-top: 10px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .warning-title { font-weight: bold; color: #856404; margin-bottom: 5px; }
          .warning-text { color: #856404; font-size: 14px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #ddd, transparent); margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Reset your NomadNet password</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hi <strong>${username}</strong>,</p>
            
            <p class="message">
              We received a request to reset your password. Use the OTP below to proceed with resetting your password:
            </p>
            
            <div class="otp-box">
              <div class="otp-label">Password Reset Code</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-validity">⏰ Valid for 10 minutes</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="warning">
              <div class="warning-title">⚠️ Didn't Request This?</div>
              <div class="warning-text">
                If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                Consider changing your password if you suspect unauthorized access.
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} NomadNet. All rights reserved.</p>
            <p class="footer-text">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${username},

We received a request to reset your password.

Your password reset code is: ${otp}

This code is valid for 10 minutes.

If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} NomadNet
    `
  };

  await transporter.sendMail(message);
};

// ✅ Send Password Change OTP
const sendPasswordChangeOTP = async (email, username, otp) => {
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Verify Password Change - NomadNet',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .content { padding: 40px 30px; background: white; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
          .message { color: #666; margin-bottom: 30px; line-height: 1.8; }
          .otp-box { background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed #fa709a; }
          .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; }
          .otp-code { font-size: 36px; font-weight: bold; color: #d63031; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
          .otp-validity { font-size: 12px; color: #999; margin-top: 10px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🔑 Password Change Request</h1>
            <p>Verify your identity to change password</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hi <strong>${username}</strong>,</p>
            
            <p class="message">
              You requested to change your account password. Please verify this action with the OTP below:
            </p>
            
            <div class="otp-box">
              <div class="otp-label">Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-validity">⏰ Valid for 10 minutes</div>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} NomadNet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${username},

You requested to change your password.

Your verification code is: ${otp}

This code is valid for 10 minutes.

© ${new Date().getFullYear()} NomadNet
    `
  };

  await transporter.sendMail(message);
};

// ✅ Send Welcome Email
const sendWelcomeEmail = async (email, username) => {
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Welcome to NomadNet! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 32px; margin-bottom: 10px; }
          .content { padding: 40px 30px; background: white; }
          .message { color: #666; margin-bottom: 20px; line-height: 1.8; font-size: 16px; }
          .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features h3 { color: #667eea; margin-bottom: 15px; }
          .features ul { list-style: none; }
          .features li { padding: 8px 0; color: #666; }
          .features li:before { content: "✓ "; color: #667eea; font-weight: bold; margin-right: 10px; }
          .cta { text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 Welcome Aboard!</h1>
          </div>
          
          <div class="content">
            <p class="message">Hi <strong>${username}</strong>,</p>
            
            <p class="message">
              Congratulations! Your email has been verified successfully. You're now part of the NomadNet community!
            </p>
            
            <div class="features">
              <h3>What you can do now:</h3>
              <ul>
                <li>Connect with fellow nomads around the world</li>
                <li>Share your travel experiences and stories</li>
                <li>Discover amazing destinations</li>
                <li>Find co-working spaces and meetups</li>
                <li>Join discussions and events</li>
              </ul>
            </div>
            
            <p class="message">
              Ready to start your adventure? Login to your account and complete your profile to get the most out of NomadNet!
            </p>
            
            <p class="message" style="color: #667eea; font-weight: bold;">
              Happy travels! ✈️🌍
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} NomadNet. All rights reserved.</p>
            <p class="footer-text">Questions? Contact us at support@nomadnet.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${username},

Welcome to NomadNet!

Your email has been verified successfully. You're now part of our community!

What you can do now:
- Connect with fellow nomads
- Share your travel experiences
- Discover amazing destinations
- Find co-working spaces
- Join discussions and events

Happy travels! ✈️🌍

© ${new Date().getFullYear()} NomadNet
    `
  };

  await transporter.sendMail(message);
};

// ✅ Send Marketplace Request Notification
const sendMarketplaceRequestEmail = async (
  ownerEmail,
  ownerUsername,
  requesterUsername,
  requesterDisplayName,
  listingTitle,
  listingType,
  message,
  listingId
) => {
  const emailMessage = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: ownerEmail,
    subject: `New Request for Your ${listingType.charAt(0).toUpperCase() + listingType.slice(1)} - ${listingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .content { padding: 40px 30px; background: white; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
          .message { color: #666; margin-bottom: 20px; line-height: 1.8; }
          .listing-box { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #11998e; }
          .listing-title { font-size: 20px; font-weight: bold; color: #11998e; margin-bottom: 10px; }
          .listing-type { display: inline-block; background: #11998e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-bottom: 15px; }
          .requester-message { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .message-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
          .message-content { color: #333; font-style: italic; }
          .requester-info { margin: 15px 0; }
          .requester-name { font-weight: bold; color: #11998e; }
          .cta { text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎯 New Request Received!</h1>
            <p>Someone is interested in your listing</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hi <strong>${ownerUsername}</strong>,</p>
            
            <p class="message">
              Great news! <strong>${requesterDisplayName}</strong> (@${requesterUsername}) is interested in your marketplace listing:
            </p>
            
            <div class="listing-box">
              <div class="listing-type">${listingType.toUpperCase()}</div>
              <div class="listing-title">${listingTitle}</div>
              
              <div class="requester-info">
                <div class="message-label">Requested by:</div>
                <div class="requester-name">${requesterDisplayName} (@${requesterUsername})</div>
              </div>
              
              ${message ? `
              <div class="requester-message">
                <div class="message-label">Message from requester:</div>
                <div class="message-content">"${message}"</div>
              </div>
              ` : ''}
            </div>
            
            <p class="message">
              Log in to your NomadNet account to view the request details and respond to ${requesterDisplayName}.
            </p>
            
            <div class="cta">
              <a href="${process.env.CLIENT_URL}/marketplace/my-listings" class="cta-button">View Request</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} NomadNet. All rights reserved.</p>
            <p class="footer-text">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${ownerUsername},

${requesterDisplayName} (@${requesterUsername}) is interested in your ${listingType}: ${listingTitle}

${message ? `Message: "${message}"` : ''}

Log in to view and respond to this request.

Visit: ${process.env.CLIENT_URL}/marketplace/my-listings

© ${new Date().getFullYear()} NomadNet
    `
  };

  await transporter.sendMail(emailMessage);
};

// Add to exports
module.exports = {
  sendRegistrationOTP,
  sendPasswordResetOTP,
  sendPasswordChangeOTP,
  sendWelcomeEmail,
  sendMarketplaceRequestEmail
};