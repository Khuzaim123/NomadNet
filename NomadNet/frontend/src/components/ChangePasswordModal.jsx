// src/components/ChangePasswordModal.jsx
import React, { useState, useEffect } from 'react';
import { changePasswordRequest, changePasswordVerify } from '../services/authService';
import { FiX, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import '../styles/modal.css';

const ChangePasswordModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Enter passwords, 2: Verify OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Step 1 state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 2 state
    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Password visibility
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
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

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

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

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(newPassword)) {
            setError('Password must contain:\n• At least 1 uppercase letter\n• At least 1 lowercase letter\n• At least 1 number\n• At least 1 special character (@$!%*?&)');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await changePasswordRequest(token, currentPassword, newPassword);

            setSuccess(response.message || 'OTP sent to your email!');
            setStep(2);
            setResendCooldown(60);
        } catch (err) {
            console.error('Password change request error:', err);
            setError(err.message || 'Failed to request password change');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPVerification = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await changePasswordVerify(token, otp);

            // Update token if provided
            if (response.data?.token) {
                const rememberMe = localStorage.getItem('token') ? true : false;
                if (rememberMe) {
                    localStorage.setItem('token', response.data.token);
                } else {
                    sessionStorage.setItem('token', response.data.token);
                }
            }

            setSuccess('Password changed successfully!');

            setTimeout(() => {
                onSuccess && onSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            console.error('OTP verification error:', err);
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) {
            setError(`Please wait ${resendCooldown} seconds before resending`);
            return;
        }

        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await changePasswordRequest(token, currentPassword, newPassword);
            setSuccess(response.message || 'OTP sent successfully!');
            setResendCooldown(60);
        } catch (err) {
            console.error('Resend OTP error:', err);
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <FiLock style={{ marginRight: '10px' }} />
                        Change Password
                    </h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {step === 1 ? (
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <div className="input-with-icon">
                                    <input
                                        type={showPassword.current ? 'text' : 'password'}
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter your current password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => togglePasswordVisibility('current')}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword.current ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <div className="input-with-icon">
                                    <input
                                        type={showPassword.new ? 'text' : 'password'}
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            checkPasswordStrength(e.target.value);
                                        }}
                                        placeholder="Enter your new password"
                                        minLength="8"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => togglePasswordVisibility('new')}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword.new ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                    </button>
                                </div>
                                <div className="password-strength">
                                    <div className="strength-bar">
                                        <div className={`strength-fill ${passwordStrength.level}`}></div>
                                    </div>
                                    <span className="strength-text">{passwordStrength.text}</span>
                                </div>
                                <div className="password-requirements">
                                    <small>Password must contain:</small>
                                    <ul>
                                        <li className={passwordStrength.checks.length ? 'valid' : ''}>
                                            {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                                        </li>
                                        <li className={passwordStrength.checks.uppercase ? 'valid' : ''}>
                                            {passwordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter
                                        </li>
                                        <li className={passwordStrength.checks.lowercase ? 'valid' : ''}>
                                            {passwordStrength.checks.lowercase ? '✓' : '○'} One lowercase letter
                                        </li>
                                        <li className={passwordStrength.checks.number ? 'valid' : ''}>
                                            {passwordStrength.checks.number ? '✓' : '○'} One number
                                        </li>
                                        <li className={passwordStrength.checks.special ? 'valid' : ''}>
                                            {passwordStrength.checks.special ? '✓' : '○'} One special character (@$!%*?&)
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <div className="input-with-icon">
                                    <input
                                        type={showPassword.confirm ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your new password"
                                        minLength="8"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword.confirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Sending OTP...' : 'Request OTP'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleOTPVerification}>
                            <p className="otp-instruction">
                                We've sent a 6-digit verification code to your email. Please enter it below to complete the password change.
                            </p>

                            <div className="form-group">
                                <label htmlFor="otp">Enter OTP</label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
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

                            <div style={{ textAlign: 'center', marginTop: '15px', marginBottom: '20px' }}>
                                <p style={{ fontSize: '14px', color: '#666' }}>Didn't receive the code?</p>
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={handleResendOTP}
                                    disabled={resendCooldown > 0 || loading}
                                    style={{
                                        color: resendCooldown > 0 ? '#999' : '#6366f1',
                                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                </button>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
