const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configure Brevo API
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Base send email function
const sendEmail = async (to, subject, htmlContent, textContent) => {
  try {
    const sendSmtpEmail = {
      sender: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully');
    return response;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw error;
  }
};

// ✅ Send Registration OTP
const sendRegistrationOTP = async (email, username, otp) => {
  const html = `
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
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} NomadNet. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${username}, Your verification code is: ${otp}. Valid for 10 minutes.`;

  await sendEmail(email, 'Verify Your Email - NomadNet', html, text);
};

// ✅ Send Password Reset OTP
const sendPasswordResetOTP = async (email, username, otp) => {
  const html = `
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
        .otp-code { font-size: 36px; font-weight: bold; color: #f5576c; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
        .otp-validity { font-size: 12px; color: #999; margin-top: 10px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        
        <div class="content">
          <p class="greeting">Hi <strong>${username}</strong>,</p>
          
          <p class="message">
            We received a request to reset your password. Use the OTP below:
          </p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-validity">⏰ Valid for 10 minutes</div>
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} NomadNet. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${username}, Your password reset code is: ${otp}. Valid for 10 minutes.`;

  await sendEmail(email, 'Password Reset Request - NomadNet', html, text);
};

// ✅ Send Password Change OTP
const sendPasswordChangeOTP = async (email, username, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
        .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 28px; }
        .content { padding: 40px 30px; background: white; }
        .otp-box { background: #ffeaa7; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #d63031; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔑 Password Change Request</h1>
        </div>
        
        <div class="content">
          <p>Hi <strong>${username}</strong>,</p>
          <p>Your verification code:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>Valid for 10 minutes.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} NomadNet</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${username}, Your verification code is: ${otp}. Valid for 10 minutes.`;

  await sendEmail(email, 'Verify Password Change - NomadNet', html, text);
};

// ✅ Send Welcome Email
const sendWelcomeEmail = async (email, username) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { font-size: 32px; }
        .content { padding: 40px 30px; background: white; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .features li { padding: 8px 0; color: #666; list-style: none; }
        .features li:before { content: "✓ "; color: #667eea; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🎉 Welcome Aboard!</h1>
        </div>
        
        <div class="content">
          <p>Hi <strong>${username}</strong>,</p>
          <p>Your email has been verified! You're now part of NomadNet!</p>
          
          <div class="features">
            <ul>
              <li>Connect with fellow nomads</li>
              <li>Share your travel experiences</li>
              <li>Discover amazing destinations</li>
            </ul>
          </div>
          
          <p>Happy travels! ✈️🌍</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} NomadNet</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${username}, Welcome to NomadNet! Your email has been verified.`;

  await sendEmail(email, 'Welcome to NomadNet! 🎉', html, text);
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
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; background: white; }
        .listing-box { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #11998e; }
        .listing-title { font-size: 20px; font-weight: bold; color: #11998e; }
        .requester-message { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 15px 0; font-style: italic; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🎯 New Request Received!</h1>
        </div>
        
        <div class="content">
          <p>Hi <strong>${ownerUsername}</strong>,</p>
          <p><strong>${requesterDisplayName}</strong> (@${requesterUsername}) is interested in your listing:</p>
          
          <div class="listing-box">
            <div class="listing-title">${listingTitle}</div>
            <p>Type: ${listingType}</p>
            ${message ? `<div class="requester-message">"${message}"</div>` : ''}
          </div>
          
          <p>Login to respond to this request.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} NomadNet</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${ownerUsername}, ${requesterDisplayName} is interested in your ${listingType}: ${listingTitle}. ${message ? `Message: "${message}"` : ''}`;

  await sendEmail(ownerEmail, `New Request for Your ${listingType} - ${listingTitle}`, html, text);
};

module.exports = {
  sendRegistrationOTP,
  sendPasswordResetOTP,
  sendPasswordChangeOTP,
  sendWelcomeEmail,
  sendMarketplaceRequestEmail
};