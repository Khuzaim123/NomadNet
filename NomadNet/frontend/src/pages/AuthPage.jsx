import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/nomadnet_logo.svg';
import '../styles/auth.css';
import {
  login,
  register,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  storeAuth,
  getToken,
  clearAuth
} from '../services/authService';

// =======================
// Icons
// =======================
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const EyeIcon = ({ visible }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

const LoaderIcon = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

// =======================
// Presentational Components (OUTSIDE AuthPage)
// =======================

const InputField = ({
  icon: Icon,
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  maxLength
}) => (
  <div className="input-group">
    <label htmlFor={id}>{label}</label>
    <div className="input-wrapper">
      <span className="input-icon">
        <Icon />
      </span>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
      />
    </div>
  </div>
);

const PasswordField = ({
  label,
  id,
  value,
  onChange,
  placeholder,
  showPasswordState,
  toggleVisibility,
  showStrength = false,
  strength // { level, text, checks }
}) => {
  const passwordStrength = strength || {
    level: '',
    text: '',
    checks: { length: false, lowercase: false, uppercase: false, number: false, special: false }
  };

  const showFeedback = showStrength && value && value.length > 0;

  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrapper">
        <span className="input-icon">
          <LockIcon />
        </span>
        <input
          type={showPasswordState ? 'text' : 'password'}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          minLength="8"
          required
        />
        <button type="button" className="toggle-password" onClick={toggleVisibility}>
          <EyeIcon visible={showPasswordState} />
        </button>
      </div>

      {showFeedback && (
        <>
          <div className="password-strength">
            <div className="strength-bar">
              <div className={`strength-fill ${passwordStrength.level}`}></div>
            </div>
            {passwordStrength.text && (
              <span className="strength-text">{passwordStrength.text}</span>
            )}
          </div>

          <div className="password-requirements">
            <div className="password-requirements-title">Requirements</div>
            <div className="password-requirements-list">
              <span
                className={`requirement-tag ${
                  passwordStrength.checks.length ? 'met' : ''
                }`}
              >
                <span className="check-icon">
                  {passwordStrength.checks.length ? '✓' : '○'}
                </span>{' '}
                8+ chars
              </span>
              <span
                className={`requirement-tag ${
                  passwordStrength.checks.uppercase ? 'met' : ''
                }`}
              >
                <span className="check-icon">
                  {passwordStrength.checks.uppercase ? '✓' : '○'}
                </span>{' '}
                Uppercase
              </span>
              <span
                className={`requirement-tag ${
                  passwordStrength.checks.lowercase ? 'met' : ''
                }`}
              >
                <span className="check-icon">
                  {passwordStrength.checks.lowercase ? '✓' : '○'}
                </span>{' '}
                Lowercase
              </span>
              <span
                className={`requirement-tag ${
                  passwordStrength.checks.number ? 'met' : ''
                }`}
              >
                <span className="check-icon">
                  {passwordStrength.checks.number ? '✓' : '○'}
                </span>{' '}
                Number
              </span>
              <span
                className={`requirement-tag ${
                  passwordStrength.checks.special ? 'met' : ''
                }`}
              >
                <span className="check-icon">
                  {passwordStrength.checks.special ? '✓' : '○'}
                </span>{' '}
                Special
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// =======================
// Main AuthPage Component
// =======================

const AuthPage = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [signupData, setSignupData] = useState({
    username: '',
    displayName: '',
    email: '',
    currentCity: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [otpData, setOtpData] = useState({
    email: '',
    otp: '',
    resendCooldown: 0
  });

  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    resendCooldown: 0
  });

  const [showPassword, setShowPassword] = useState({
    login: false,
    signup: false,
    confirm: false,
    newPassword: false,
    confirmNew: false
  });

  const [passwordStrength, setPasswordStrength] = useState({
    level: '',
    text: '',
    checks: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    }
  });

  const showAlert = (message, type = 'error') => {
    setAlert({ show: true, message, type });
  };

  const verifyToken = useCallback(
    async (token) => {
      try {
        const response = await getCurrentUser(token);
        const user = response?.data?.user || response?.user || response?.data || response;
        if (user?.username) {
          navigate(`/profile/${user.username}`);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Token verification error:', error);
        clearAuth();
      }
    },
    [navigate]
  );

  useEffect(() => {
    const token = getToken();
    if (token) {
      verifyToken(token);
    }
  }, [verifyToken]);

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(
        () => setAlert({ show: false, message: '', type: '' }),
        5000
      );
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  useEffect(() => {
    if (otpData.resendCooldown > 0) {
      const timer = setTimeout(
        () => setOtpData((prev) => ({ ...prev, resendCooldown: prev.resendCooldown - 1 })),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [otpData.resendCooldown]);

  useEffect(() => {
    if (forgotPasswordData.resendCooldown > 0) {
      const timer = setTimeout(
        () =>
          setForgotPasswordData((prev) => ({
            ...prev,
            resendCooldown: prev.resendCooldown - 1
          })),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [forgotPasswordData.resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(loginData.email, loginData.password);

      if (response.status === 'error' && response.requiresOTP) {
        setOtpData({ email: loginData.email, otp: '', resendCooldown: 60 });
        setShowOTPVerification(true);
        showAlert('Please verify your email first.', 'info');
        return;
      }

      const loggedInUser = response?.data?.user || response?.user;
      const token = response?.data?.token || response?.token;

      if (!loggedInUser?.username || !token) {
        throw new Error('Invalid login response from server.');
      }

      storeAuth(token, loggedInUser, loginData.rememberMe);
      showAlert('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        navigate(`/profile/${loggedInUser.username}`);
      }, 1000);
    } catch (error) {
      showAlert(
        error?.response?.data?.message ||
          error.message ||
          'Login failed. Please check your credentials.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const { username, displayName, email, currentCity, password, confirmPassword, agreeTerms } =
      signupData;

    if (!username || !displayName || !email || !currentCity || !password || !confirmPassword) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    if (username.length < 3 || username.length > 30) {
      showAlert('Username must be between 3 and 30 characters', 'error');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      showAlert('Username can only contain letters, numbers, and underscores', 'error');
      return;
    }

    if (displayName.length < 2) {
      showAlert('Display name must be at least 2 characters', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    if (currentCity.length < 2) {
      showAlert('Please enter a valid city name', 'error');
      return;
    }

    if (password.length < 8) {
      showAlert('Password must be at least 8 characters', 'error');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      showAlert(
        'Password must contain uppercase, lowercase, number, and special character',
        'error'
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }

    if (!agreeTerms) {
      showAlert('Please agree to the Terms of Service', 'error');
      return;
    }

    setLoading(true);

    try {
      const userData = { username, displayName, email, currentCity, password };
      const response = await register(userData);

      showAlert(
        response.message || 'Registration successful! Please check your email for OTP.',
        'success'
      );

      setOtpData({ email, otp: '', resendCooldown: 60 });
      setShowOTPVerification(true);

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
      showAlert(error.message || 'Signup failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();

    if (!otpData.otp || otpData.otp.length !== 6) {
      showAlert('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    setLoading(true);

    try {
      await verifyOTP(otpData.email, otpData.otp);
      showAlert('Email verified successfully! Please login to continue.', 'success');

      setTimeout(() => {
        setShowOTPVerification(false);
        setIsLogin(true);
        setLoginData({ email: otpData.email, password: '', rememberMe: false });
        setOtpData({ email: '', otp: '', resendCooldown: 0 });
      }, 2000);
    } catch (error) {
      showAlert(error.message || 'Invalid OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpData.resendCooldown > 0) return;

    setLoading(true);

    try {
      const response = await resendOTP(otpData.email);
      showAlert(response.message || 'OTP sent successfully!', 'success');
      setOtpData((prev) => ({ ...prev, resendCooldown: 60 }));
    } catch (error) {
      showAlert(error.message || 'Failed to resend OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({
        level: '',
        text: '',
        checks: { length: false, lowercase: false, uppercase: false, number: false, special: false }
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
      text = 'Weak password';
    } else if (passedChecks < 5) {
      level = 'medium';
      text = 'Getting stronger';
    } else {
      level = 'strong';
      text = 'Strong password ✓';
    }

    setPasswordStrength({ level, text, checks });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();

    if (!forgotPasswordData.email) {
      showAlert('Please enter your email address', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordData.email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword(forgotPasswordData.email);
      showAlert(response.message || 'Reset code sent! Check your email.', 'success');
      setForgotPasswordStep(2);
      setForgotPasswordData((prev) => ({ ...prev, resendCooldown: 60 }));
    } catch (error) {
      showAlert(error.message || 'Failed to send reset email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetOTP = async () => {
    if (forgotPasswordData.resendCooldown > 0) return;

    setLoading(true);

    try {
      const response = await forgotPassword(forgotPasswordData.email);
      showAlert(response.message || 'OTP sent successfully!', 'success');
      setForgotPasswordData((prev) => ({ ...prev, resendCooldown: 60 }));
    } catch (error) {
      showAlert(error.message || 'Failed to resend OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const { otp, newPassword, confirmPassword } = forgotPasswordData;

    if (!otp || otp.length !== 6) {
      showAlert('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      showAlert('Password must be at least 8 characters', 'error');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      showAlert(
        'Password must contain uppercase, lowercase, number, and special character',
        'error'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(forgotPasswordData.email, otp, newPassword);
      showAlert('Password reset successful! Please login.', 'success');

      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordStep(1);
        setIsLogin(true);
        setLoginData({ email: forgotPasswordData.email, password: '', rememberMe: false });
        setForgotPasswordData({
          email: '',
          otp: '',
          newPassword: '',
          confirmPassword: '',
          resendCooldown: 0
        });
      }, 2000);
    } catch (error) {
      showAlert(error.message || 'Failed to reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const Background = () => (
    <div className="bg-animation">
      <div className="circle circle-1"></div>
      <div className="circle circle-2"></div>
      <div className="circle circle-3"></div>
    </div>
  );

  // =======================
  // OTP Verification Screen
  // =======================
  if (showOTPVerification) {
    return (
      <div className="container">
        <Background />
        <div className="auth-card">
          <div className="brand">
            <div className="logo">
              <img src={logo} alt="Nomad Net Logo" />
            </div>
            <h1>Verify Email</h1>
            <p className="tagline">Enter the code sent to {otpData.email}</p>
          </div>

          <form onSubmit={handleOTPVerification} className="auth-form">
            {alert.show && <div className={`alert ${alert.type}`}>{alert.message}</div>}

            <div className="input-group">
              <label htmlFor="otp">Verification Code</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="otp"
                  className="otp-input"
                  placeholder="000000"
                  value={otpData.otp}
                  onChange={(e) =>
                    setOtpData({
                      ...otpData,
                      otp: e.target.value.replace(/\D/g, '').slice(0, 6)
                    })
                  }
                  maxLength="6"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loader">
                  <LoaderIcon />
                </span>
              ) : (
                <span className="btn-text">Verify Email</span>
              )}
            </button>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                className="resend-button"
                onClick={handleResendOTP}
                disabled={otpData.resendCooldown > 0 || loading}
              >
                {otpData.resendCooldown > 0
                  ? `Resend in ${otpData.resendCooldown}s`
                  : 'Resend Code'}
              </button>
            </div>

            <p className="switch-form">
              Wrong email?
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowOTPVerification(false);
                  setIsLogin(false);
                }}
              >
                Go back
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // =======================
  // Forgot Password Screen
  // =======================
  if (showForgotPassword) {
    return (
      <div className="container">
        <Background />
        <div className="auth-card">
          <div className="brand">
            <div className="logo">
              <img src={logo} alt="Nomad Net Logo" />
            </div>
            <h1>Reset Password</h1>
            <p className="tagline">
              {forgotPasswordStep === 1 && "We'll send you a reset code"}
              {forgotPasswordStep === 2 && 'Enter the code and new password'}
            </p>
          </div>

          {forgotPasswordStep === 1 && (
            <form onSubmit={handleForgotPasswordRequest} className="auth-form">
              {alert.show && <div className={`alert ${alert.type}`}>{alert.message}</div>}

              <InputField
                icon={EmailIcon}
                label="Email Address"
                id="forgotEmail"
                type="email"
                placeholder="your@email.com"
                value={forgotPasswordData.email}
                onChange={(e) =>
                  setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })
                }
              />

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <span className="btn-loader">
                    <LoaderIcon />
                  </span>
                ) : (
                  <span className="btn-text">Send Reset Code</span>
                )}
              </button>

              <p className="switch-form">
                Remember your password?
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPassword(false);
                    setIsLogin(true);
                  }}
                >
                  Back to login
                </a>
              </p>
            </form>
          )}

          {forgotPasswordStep === 2 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              {alert.show && <div className={`alert ${alert.type}`}>{alert.message}</div>}

              <div className="input-group">
                <label htmlFor="forgotOtp">Reset Code</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="forgotOtp"
                    className="otp-input"
                    placeholder="000000"
                    value={forgotPasswordData.otp}
                    onChange={(e) =>
                      setForgotPasswordData({
                        ...forgotPasswordData,
                        otp: e.target.value.replace(/\D/g, '').slice(0, 6)
                      })
                    }
                    maxLength="6"
                    required
                  />
                </div>
              </div>

              <PasswordField
                label="New Password"
                id="newPassword"
                value={forgotPasswordData.newPassword}
                onChange={(e) => {
                  setForgotPasswordData({
                    ...forgotPasswordData,
                    newPassword: e.target.value
                  });
                  checkPasswordStrength(e.target.value);
                }}
                placeholder="••••••••"
                showPasswordState={showPassword.newPassword}
                toggleVisibility={() => togglePasswordVisibility('newPassword')}
                showStrength={true}
                strength={passwordStrength}
              />

              <PasswordField
                label="Confirm Password"
                id="confirmNewPassword"
                value={forgotPasswordData.confirmPassword}
                onChange={(e) =>
                  setForgotPasswordData({
                    ...forgotPasswordData,
                    confirmPassword: e.target.value
                  })
                }
                placeholder="••••••••"
                showPasswordState={showPassword.confirmNew}
                toggleVisibility={() => togglePasswordVisibility('confirmNew')}
                showStrength={false}
                strength={passwordStrength}
              />

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <span className="btn-loader">
                    <LoaderIcon />
                  </span>
                ) : (
                  <span className="btn-text">Reset Password</span>
                )}
              </button>

              <div className="resend-section">
                <p>Didn't receive the code?</p>
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendResetOTP}
                  disabled={forgotPasswordData.resendCooldown > 0 || loading}
                >
                  {forgotPasswordData.resendCooldown > 0
                    ? `Resend in ${forgotPasswordData.resendCooldown}s`
                    : 'Resend Code'}
                </button>
              </div>

              <p className="switch-form">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setForgotPasswordStep(1);
                  }}
                >
                  Use different email
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // =======================
  // Main Login / Signup Screen
  // =======================
  return (
    <div className="container">
      <Background />
      <div className="auth-card">
        <div className="brand">
          <div className="logo">
            <img src={logo} alt="Nomad Net Logo" />
          </div>
          <h1>Nomad Net</h1>
          <p className="tagline">Connect with travelers worldwide</p>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Welcome Back</h2>
            <p className="subtitle">Sign in to continue your journey</p>

            {alert.show && <div className={`alert ${alert.type}`}>{alert.message}</div>}

            <InputField
              icon={EmailIcon}
              label="Email"
              id="loginEmail"
              type="email"
              placeholder="your@email.com"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />

            <PasswordField
              label="Password"
              id="loginPassword"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              placeholder="••••••••"
              showPasswordState={showPassword.login}
              toggleVisibility={() => togglePasswordVisibility('login')}
              showStrength={false}
              strength={passwordStrength}
            />

            <div className="form-options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) =>
                    setLoginData({ ...loginData, rememberMe: e.target.checked })
                  }
                />
                <span>Remember me</span>
              </label>
              <a
                href="#"
                className="link"
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgotPassword(true);
                  setForgotPasswordStep(1);
                  setForgotPasswordData({
                    email: loginData.email,
                    otp: '',
                    newPassword: '',
                    confirmPassword: '',
                    resendCooldown: 0
                  });
                }}
              >
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loader">
                  <LoaderIcon />
                </span>
              ) : (
                <span className="btn-text">Sign In</span>
              )}
            </button>

            <p className="switch-form">
              New to Nomad Net?
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLogin(false);
                }}
              >
                Create an account
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="auth-form">
            <h2>Join Nomad Net</h2>
            <p className="subtitle">Start connecting with travelers today</p>

            {alert.show && <div className={`alert ${alert.type}`}>{alert.message}</div>}

            <InputField
              icon={UserIcon}
              label="Username"
              id="signupUsername"
              placeholder="nomad123"
              value={signupData.username}
              onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
              minLength="3"
              maxLength="30"
            />

            <InputField
              icon={UsersIcon}
              label="Display Name"
              id="signupDisplayName"
              placeholder="John Doe"
              value={signupData.displayName}
              onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
            />

            <InputField
              icon={EmailIcon}
              label="Email"
              id="signupEmail"
              type="email"
              placeholder="your@email.com"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            />

            <InputField
              icon={MapPinIcon}
              label="Current City"
              id="signupCity"
              placeholder="New York"
              value={signupData.currentCity}
              onChange={(e) => setSignupData({ ...signupData, currentCity: e.target.value })}
            />

            <PasswordField
              label="Password"
              id="signupPassword"
              value={signupData.password}
              onChange={(e) => {
                setSignupData({ ...signupData, password: e.target.value });
                checkPasswordStrength(e.target.value);
              }}
              placeholder="••••••••"
              showPasswordState={showPassword.signup}
              toggleVisibility={() => togglePasswordVisibility('signup')}
              showStrength={true}
              strength={passwordStrength}
            />

            <PasswordField
              label="Confirm Password"
              id="signupConfirmPassword"
              value={signupData.confirmPassword}
              onChange={(e) =>
                setSignupData({ ...signupData, confirmPassword: e.target.value })
              }
              placeholder="••••••••"
              showPasswordState={showPassword.confirm}
              toggleVisibility={() => togglePasswordVisibility('confirm')}
              showStrength={false}
              strength={passwordStrength}
            />

            <label className="checkbox mb-4">
              <input
                type="checkbox"
                checked={signupData.agreeTerms}
                onChange={(e) =>
                  setSignupData({ ...signupData, agreeTerms: e.target.checked })
                }
                required
              />
              <span>
                I agree to the <a href="#" className="link">Terms of Service</a> and{' '}
                <a href="#" className="link">Privacy Policy</a>
              </span>
            </label>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loader">
                  <LoaderIcon />
                </span>
              ) : (
                <span className="btn-text">Create Account</span>
              )}
            </button>

            <p className="switch-form">
              Already have an account?
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLogin(true);
                }}
              >
                Sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;