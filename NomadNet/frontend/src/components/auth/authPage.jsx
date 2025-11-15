import React, { useState, useEffect } from 'react';
import './auth.css';
import {
  login,
  register,
  verifyOTP,
  resendOTP,
  getCurrentUser,
  storeAuth,
  getToken,
  clearAuth
} from '../../services/authService';

const AuthPage = () => {
  // State management
  const [isLogin, setIsLogin] = useState(true);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    username: '',
    displayName: '',
    email: '',
    currentCity: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  // OTP state
  const [otpData, setOtpData] = useState({
    email: '',
    otp: '',
    resendCooldown: 0
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState({
    login: false,
    signup: false,
    confirm: false
  });

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    level: '',
    text: 'Enter password',
    checks: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    }
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = getToken();
    if (token) {
      verifyToken(token);
    }
  }, []);

  // Auto-hide alerts
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  // OTP resend cooldown
  useEffect(() => {
    if (otpData.resendCooldown > 0) {
      const timer = setTimeout(() => {
        setOtpData(prev => ({ ...prev, resendCooldown: prev.resendCooldown - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpData.resendCooldown]);

  // Show alert function
  const showAlert = (message, type = 'error') => {
    setAlert({ show: true, message, type });
  };

  // Verify token
  const verifyToken = async (token) => {
    try {
      const data = await getCurrentUser(token);
      console.log('User already logged in:', data);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Token verification error:', error);
      clearAuth();
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await login(loginData.email, loginData.password);

      // Check if email verification is required
      if (response.status === 'error' && response.requiresOTP) {
        setOtpData({ ...otpData, email: loginData.email });
        setShowOTPVerification(true);
        showAlert('Please verify your email first', 'error');
        setLoading(false);
        return;
      }

      // Store token and user data
      storeAuth(response.data.token, response.data.user, loginData.rememberMe);

      showAlert('Login successful! Redirecting...', 'success');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();

    const { username, displayName, email, currentCity, password, confirmPassword, agreeTerms } = signupData;

    // Check all fields
    if (!username || !displayName || !email || !currentCity || !password || !confirmPassword) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    // Username validation
    if (username.length < 3 || username.length > 30) {
      showAlert('Username must be between 3 and 30 characters', 'error');
      return;
    }

    // Username format validation (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      showAlert('Username can only contain letters, numbers, and underscores', 'error');
      return;
    }

    // Display name validation
    if (displayName.length < 2) {
      showAlert('Display name must be at least 2 characters', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    // City validation
    if (currentCity.length < 2) {
      showAlert('Please enter a valid city name', 'error');
      return;
    }

    // ✅ UPDATED: Password validation (8+ chars with complexity)
    if (password.length < 8) {
      showAlert('Password must be at least 8 characters', 'error');
      return;
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      showAlert(
        'Password must contain:\n' +
        '• At least 1 uppercase letter (A-Z)\n' +
        '• At least 1 lowercase letter (a-z)\n' +
        '• At least 1 number (0-9)\n' +
        '• At least 1 special character (@$!%*?&)',
        'error'
      );
      return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }

    // Terms agreement
    if (!agreeTerms) {
      showAlert('Please agree to the Terms of Service', 'error');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        username,
        displayName,
        email,
        currentCity,
        password
      };

      const response = await register(userData);

      showAlert(response.message || 'Registration successful! Please check your email for OTP.', 'success');

      // Show OTP verification screen
      setOtpData({ email, otp: '', resendCooldown: 60 });
      setShowOTPVerification(true);

      // Clear signup form
      setSignupData({
        username: '',
        displayName: '',
        email: '',
        currentCity: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
      });

    } catch (error) {
      console.error('Signup error:', error);
      showAlert(error.message || 'Signup failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerification = async (e) => {
    e.preventDefault();

    if (!otpData.otp || otpData.otp.length !== 6) {
      showAlert('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOTP(otpData.email, otpData.otp);

      showAlert('Email verified successfully! Please login to continue.', 'success');

      // Always redirect to login form after successful verification
      setTimeout(() => {
        setShowOTPVerification(false);
        setIsLogin(true);
        setLoginData({ email: otpData.email, password: '', rememberMe: false });

        // Clear OTP data
        setOtpData({ email: '', otp: '', resendCooldown: 0 });
      }, 2000);

    } catch (error) {
      console.error('OTP verification error:', error);
      showAlert(error.message || 'Invalid OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    if (otpData.resendCooldown > 0) {
      showAlert(`Please wait ${otpData.resendCooldown} seconds before resending`, 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await resendOTP(otpData.email);
      showAlert(response.message || 'OTP sent successfully! Please check your email.', 'success');
      setOtpData(prev => ({ ...prev, resendCooldown: 60 }));
    } catch (error) {
      console.error('Resend OTP error:', error);
      showAlert(error.message || 'Failed to resend OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({
        level: '',
        text: 'Enter password',
        checks: {
          length: false,
          lowercase: false,
          uppercase: false,
          number: false,
          special: false
        }
      });
      return;
    }

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;

    let level = '';
    let text = '';

    if (passedChecks < 3) {
      level = 'weak';
      text = 'Weak - Need more complexity';
    } else if (passedChecks < 5) {
      level = 'medium';
      text = 'Medium - Almost there!';
    } else {
      level = 'strong';
      text = 'Strong password! ✓';
    }

    setPasswordStrength({ level, text, checks });
  };

  // Handle social auth
  const handleSocialAuth = (provider) => {
    showAlert(`${provider} authentication coming soon!`, 'error');
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // OTP Verification Screen
  if (showOTPVerification) {
    return (
      <div className="container">
        <div className="bg-animation">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>

        <div className="auth-card">
          <div className="brand">
            <div className="logo">
              <img src="./nomadnet.svg" alt="Nomad Net Logo" />
            </div>
            <h1>Verify Your Email</h1>
            <p className="tagline">Enter the OTP sent to {otpData.email}</p>
          </div>

          <form onSubmit={handleOTPVerification} className="auth-form active">
            <h2>Email Verification</h2>
            <p className="subtitle">Check your inbox for the 6-digit code</p>

            {alert.show && (
              <div className={`alert ${alert.type}`}>
                {alert.message}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="otp">Enter OTP</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="otp"
                  placeholder="000000"
                  value={otpData.otp}
                  onChange={(e) => setOtpData({ ...otpData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  maxLength="6"
                  style={{
                    fontSize: '24px',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontWeight: 'bold'
                  }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <span className="btn-text" style={{ display: loading ? 'none' : 'block' }}>Verify Email</span>
              <span className="btn-loader" style={{ display: loading ? 'block' : 'none' }}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p>Didn't receive the code?</p>
              <button
                type="button"
                className="link"
                onClick={handleResendOTP}
                disabled={otpData.resendCooldown > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: otpData.resendCooldown > 0 ? '#999' : '#6366f1',
                  cursor: otpData.resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {otpData.resendCooldown > 0
                  ? `Resend in ${otpData.resendCooldown}s`
                  : 'Resend OTP'
                }
              </button>
            </div>

            <p className="switch-form">
              Want to use a different email?
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setShowOTPVerification(false);
                setIsLogin(false);
              }}>Go back</a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Background Animation */}
      <div className="bg-animation">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      {/* Auth Card */}
      <div className="auth-card">
        {/* Logo & Branding */}
        <div className="brand">
          <div className="logo">
            <img src="./nomadnet.svg" alt="Nomad Net Logo" />
          </div>
          <h1>Nomad Net</h1>
          <p className="tagline">Connect with travelers worldwide</p>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form active">
            <h2>Welcome Back</h2>
            <p className="subtitle">Sign in to continue your journey</p>

            {alert.show && (
              <div className={`alert ${alert.type}`}>
                {alert.message}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="loginEmail">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="email"
                  id="loginEmail"
                  placeholder="your@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="loginPassword">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type={showPassword.login ? "text" : "password"}
                  id="loginPassword"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility('login')}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    {showPassword.login ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="link">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <span className="btn-text" style={{ display: loading ? 'none' : 'block' }}>Sign In</span>
              <span className="btn-loader" style={{ display: loading ? 'block' : 'none' }}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </button>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <div className="social-buttons">
              <button type="button" className="btn btn-social" onClick={() => handleSocialAuth('Google')}>
                <svg viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button type="button" className="btn btn-social" onClick={() => handleSocialAuth('Facebook')}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2" />
                </svg>
                Facebook
              </button>
            </div>

            <p className="switch-form">
              New to Nomad Net?
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>Create an account</a>
            </p>
          </form>
        ) : (
          // Signup Form
          <form onSubmit={handleSignup} className="auth-form active">
            <h2>Join Nomad Net</h2>
            <p className="subtitle">Start connecting with travelers today</p>

            {alert.show && (
              <div className={`alert ${alert.type}`}>
                {alert.message}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="signupUsername">Username</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type="text"
                  id="signupUsername"
                  placeholder="nomad123"
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  minLength="3"
                  maxLength="30"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signupDisplayName">Display Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type="text"
                  id="signupDisplayName"
                  placeholder="John Doe"
                  value={signupData.displayName}
                  onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signupEmail">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type="email"
                  id="signupEmail"
                  placeholder="your@email.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signupCity">Current City</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type="text"
                  id="signupCity"
                  placeholder="New York"
                  value={signupData.currentCity}
                  onChange={(e) => setSignupData({ ...signupData, currentCity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signupPassword">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type={showPassword.signup ? "text" : "password"}
                  id="signupPassword"
                  placeholder="••••••••"
                  value={signupData.password}
                  onChange={(e) => {
                    setSignupData({ ...signupData, password: e.target.value });
                    checkPasswordStrength(e.target.value);
                  }}
                  minLength="8"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility('signup')}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    {showPassword.signup ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              <div className="password-strength">
                <div className="strength-bar">
                  <div className={`strength-fill ${passwordStrength.level}`}></div>
                </div>
                <span className="strength-text">{passwordStrength.text}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                <div>Requirements:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  <span style={{ color: passwordStrength.checks.length ? '#22c55e' : '#666' }}>
                    {passwordStrength.checks.length ? '✓' : '○'} 8+ chars
                  </span>
                  <span style={{ color: passwordStrength.checks.uppercase ? '#22c55e' : '#666' }}>
                    {passwordStrength.checks.uppercase ? '✓' : '○'} Uppercase
                  </span>
                  <span style={{ color: passwordStrength.checks.lowercase ? '#22c55e' : '#666' }}>
                    {passwordStrength.checks.lowercase ? '✓' : '○'} Lowercase
                  </span>
                  <span style={{ color: passwordStrength.checks.number ? '#22c55e' : '#666' }}>
                    {passwordStrength.checks.number ? '✓' : '○'} Number
                  </span>
                  <span style={{ color: passwordStrength.checks.special ? '#22c55e' : '#666' }}>
                    {passwordStrength.checks.special ? '✓' : '○'} Special (@$!%*?&)
                  </span>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signupConfirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  id="signupConfirmPassword"
                  placeholder="••••••••"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  minLength="8"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    {showPassword.confirm ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={signupData.agreeTerms}
                onChange={(e) => setSignupData({ ...signupData, agreeTerms: e.target.checked })}
                required
              />
              <span>I agree to the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a></span>
            </label>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <span className="btn-text" style={{ display: loading ? 'none' : 'block' }}>Create Account</span>
              <span className="btn-loader" style={{ display: loading ? 'block' : 'none' }}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </button>

            <p className="switch-form">
              Already have an account?
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Sign in</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;