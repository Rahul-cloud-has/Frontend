// FranchiseChangePassword.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, apiConfig } from '../../../Api';
import './FranchiseChangePassword.css';

const FranchiseChangePassword = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const redirectTimerRef = useRef(null);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.text) setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Validation 1: Empty Fields
    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      const msg = 'All fields are required!';
      setMessage({ text: msg, type: 'error' });
      toast.warning(msg, { toastId: 'fcp-empty-warning' });
      return;
    }

    // Validation 2: Length check
    if (formData.new_password.length < 6) {
      const msg = 'New password must be at least 6 characters!';
      setMessage({ text: msg, type: 'error' });
      toast.warning(msg, { toastId: 'fcp-length-warning' });
      return;
    }

    // Validation 3: Match check
    if (formData.new_password !== formData.confirm_password) {
      const msg = 'New passwords do not match!';
      setMessage({ text: msg, type: 'error' });
      toast.warning(msg, { toastId: 'fcp-match-warning' });
      return;
    }

    // Validation 4: Different from old
    if (formData.old_password === formData.new_password) {
      const msg = 'New password must be different from current password!';
      setMessage({ text: msg, type: 'error' });
      toast.warning(msg, { toastId: 'fcp-same-warning' });
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Updating password...');

    try {
      await axios.post(
        `${API_URL}/franchise/change-password/`,
        {
          old_password: formData.old_password,
          new_password: formData.new_password,
        },
        apiConfig()
      );

      const successMsg = 'Password changed successfully! Redirecting to login...';
      setMessage({ text: successMsg, type: 'success' });

      toast.update(toastId, {
        render: 'Password changed successfully! Redirecting...',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
        closeOnClick: true,
      });

      // Clear state
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });

      // Redirect after 2 seconds
      redirectTimerRef.current = setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Failed to change password. Please try again.';

      setMessage({ text: errMsg, type: 'error' });

      toast.update(toastId, {
        render: errMsg,
        type: 'error',
        isLoading: false,
        autoClose: 4000,
        closeOnClick: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="fcp-container">
      <div className="fcp-card">

        {/* Header */}
        <div className="fcp-header">
          <div className="fcp-icon">🔑</div>
          <h2 className="fcp-title">Change Password</h2>
          <p className="fcp-subtitle">Update your account password</p>
        </div>

        {/* Inline Message */}
        {message.text && (
          <div className={`fcp-alert fcp-alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="fcp-form">

          {/* Current Password */}
          <div className="fcp-form-group">
            <label className="fcp-label">CURRENT PASSWORD</label>
            <div className="fcp-input-wrapper">
              <input
                type={showPasswords.old ? 'text' : 'password'}
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                placeholder="Enter current password"
                className="fcp-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="fcp-eye-btn"
                onClick={() => togglePassword('old')}
                aria-label="Toggle Current Password Visibility"
              >
                {showPasswords.old ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="fcp-form-group">
            <label className="fcp-label">NEW PASSWORD</label>
            <div className="fcp-input-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Enter new password (min 6 chars)"
                className="fcp-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="fcp-eye-btn"
                onClick={() => togglePassword('new')}
                aria-label="Toggle New Password Visibility"
              >
                {showPasswords.new ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="fcp-form-group">
            <label className="fcp-label">CONFIRM PASSWORD</label>
            <div className="fcp-input-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm new password"
                className={`fcp-input ${
                  formData.confirm_password && formData.new_password !== formData.confirm_password
                    ? 'fcp-input-error' : ''
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="fcp-eye-btn"
                onClick={() => togglePassword('confirm')}
                aria-label="Toggle Confirm Password Visibility"
              >
                {showPasswords.confirm ? '🙈' : '👁️'}
              </button>
            </div>
            {formData.confirm_password && formData.new_password !== formData.confirm_password && (
              <small className="fcp-match no-match">
                ❌ Passwords do not match
              </small>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`fcp-submit-btn ${loading ? 'fcp-loading' : ''}`}
          >
            {loading ? '⏳ Changing...' : '🔑 CHANGE PASSWORD'}
          </button>
        </form>

        {/* Footer */}
        <div className="fcp-footer">
          <p>🔒 Your password is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
};

export default FranchiseChangePassword;