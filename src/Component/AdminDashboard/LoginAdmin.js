import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginAdmin.css";

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ============================================
  // HANDLE ADMIN LOGIN
  // ============================================
  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Admin credentials
      if (email === 'admin@proskillhub.com' && password === 'admin123') {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', 'admin');
        navigate('/admin-dashboard');
        setLoading(false);
        return;
      }

      setError('❌ Invalid admin credentials! Please try again.');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-admin-page">
      <div className="login-admin-container">
        
        {/* ===== LOGO ===== */}
        <div className="login-admin-logo">
          <div className="logo-icon">🛡️</div>
          <h1>Admin<span>Panel</span></h1>
          <p className="login-admin-subtitle">ProSkill Hub Management</p>
        </div>

        {/* ===== LOGIN FORM ===== */}
        <div className="login-admin-form-wrapper">
          <h2>Admin Login 🔐</h2>
          <p className="login-admin-desc">Access the admin dashboard to manage users, courses, and more.</p>

          <form onSubmit={handleLogin} className="login-admin-form">
            {/* ===== EMAIL ===== */}
            <div className="form-group">
              <label>📧 Admin Email</label>
              <input
                type="email"
                required
                placeholder="admin@proskillhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* ===== PASSWORD ===== */}
            <div className="form-group">
              <label>🔑 Admin Password</label>
              <input
                type="password"
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* ===== ERROR ===== */}
            {error && <div className="error-message">{error}</div>}

            {/* ===== SUBMIT ===== */}
            <button type="submit" className="login-admin-submit" disabled={loading}>
              {loading ? '⏳ Logging in...' : '🚀 Admin Login'}
            </button>
          </form>

          {/* ===== BACK LINK ===== */}
          <div className="login-admin-footer">
            <Link to="/login" className="back-to-user-login">
              ← Back to User Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginAdmin;