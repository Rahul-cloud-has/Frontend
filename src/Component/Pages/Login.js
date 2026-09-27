import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from '../../Api';
import logo from "../../assets/image.png"; // ✅ Real Logo Imported
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isFranchise = location.pathname.includes("franchise");
  const role = isFranchise ? "franchise" : "admin";

  // ============================================
  // 🔐 ADMIN LOGIN
  // ============================================
  const handleAdminLogin = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          login_type: "admin",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("userType", "admin");
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userEmail", data.user?.email || username);
        localStorage.setItem("adminName", data.user?.first_name || "Admin");
        localStorage.setItem("isAuthenticated", "true");

        localStorage.removeItem("franchiseUser");
        localStorage.removeItem("franchisePermissions");
        localStorage.removeItem("franchiseCode");
        localStorage.removeItem("franchiseName");
        localStorage.removeItem("isFranchiseLoggedIn");

        return { success: true };
      } else {
        return {
          success: false,
          error: data.error || data.message || "Invalid credentials",
        };
      }
    } catch (err) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // ============================================
  // 🔐 FRANCHISE LOGIN
  // ============================================
  const handleFranchiseLogin = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          login_type: "franchise",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Invalid credentials",
        };
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      if (data.franchise_user) {
        const fu = data.franchise_user;

        let permissions = fu.permissions || {};
        if (Array.isArray(permissions)) {
          const obj = {};
          permissions.forEach(p => {
            obj[p.permission_key] = p.granted;
          });
          permissions = obj;
        }

        const userToStore = {
          id: fu.id,
          username: fu.username || username,
          franchise_code: fu.franchise_code || '',
          franchise_name: fu.franchise_name || '',
          applicant_name: fu.applicant_name || '',
          email: fu.email || '',
          mobile: fu.mobile || '',
          permissions: permissions,
          is_active: fu.is_active,
        };

        localStorage.setItem("franchiseUser", JSON.stringify(userToStore));
        localStorage.setItem("franchisePermissions", JSON.stringify(permissions));
        localStorage.setItem("franchiseCode", fu.franchise_code || '');
        localStorage.setItem("franchiseName", fu.franchise_name || '');
        localStorage.setItem("isFranchiseLoggedIn", "true");

      } else {
        const userResponse = await fetch(
          `${API_URL}/franchise-users/?search=${username}`,
          {
            headers: {
              Authorization: `Bearer ${data.access}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();

          if (userData && userData.length > 0) {
            const fu = userData[0];

            let permissions = fu.permissions || {};
            if (Array.isArray(permissions)) {
              const obj = {};
              permissions.forEach(p => {
                obj[p.permission_key] = p.granted;
              });
              permissions = obj;
            }

            const userToStore = {
              id: fu.id,
              username: fu.username || username,
              franchise_code: fu.franchise_code || '',
              franchise_name: fu.franchise_name || '',
              applicant_name: fu.applicant_name || '',
              email: fu.email || '',
              mobile: fu.mobile || '',
              permissions: permissions,
              is_active: fu.is_active,
            };

            localStorage.setItem("franchiseUser", JSON.stringify(userToStore));
            localStorage.setItem("franchisePermissions", JSON.stringify(permissions));
            localStorage.setItem("franchiseCode", fu.franchise_code || '');
            localStorage.setItem("franchiseName", fu.franchise_name || '');
            localStorage.setItem("isFranchiseLoggedIn", "true");
          }
        }
      }

      localStorage.setItem("userType", "franchise");
      localStorage.setItem("userEmail", username);
      localStorage.setItem("user", JSON.stringify(data.user || { username }));
      localStorage.setItem("isAuthenticated", "true");

      localStorage.removeItem("adminName");

      return { success: true };

    } catch (err) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // ============================================
  // 🔐 HANDLE SUBMIT
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;

    if (role === "admin") {
      result = await handleAdminLogin(username, password);
    } else {
      result = await handleFranchiseLogin(username, password);
    }

    if (result.success) {
      toast.success("Login Successful! Redirecting...");
      setTimeout(() => {
        setLoading(false);
        navigate("/admin-dashboard", { replace: true });
      }, 500);
    } else {
      toast.error(`❌ ${result.error}`);
      setLoading(false);
    }
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="login-page">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="login-bg-pattern"></div>

      <div className="login-container">

        <div className="login-form-wrapper">
          <div className="login-logo">
            {/* ✅ REAL LOGO IMAGE */}
            <div className="logo-icon">
              <img src={logo} alt="EduSkillVision Logo" className="login-logo-img" />
            </div>
            <h1>Edu<span>Skill</span>Vision</h1>
            <p className="login-subtitle">Empowering Skills, Shaping Futures</p>
          </div>

          <div className="login-role-badge">
            {role === "admin" ? "👑 Admin Login" : "🏢 Franchise Login"}
          </div>

          <h2>
            {role === "admin" ? "Welcome Back, Admin!" : "Welcome Back, Franchise!"}
          </h2>
          <p className="login-desc">
            {role === "admin"
              ? "Enter admin credentials to access the dashboard"
              : "Enter your franchise username and password"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder={
                  role === "admin"
                    ? "Enter admin username"
                    : "Enter your username"
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder={
                  role === "admin"
                    ? "Enter admin password"
                    : "Enter your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "⏳ Logging in..." : "🔐 Login"}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2026 EduSkillVision. All rights reserved.</p>
            <p className="login-developer">
              Developed by{" "}
              <a
                href="https://dimensioninfotech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="developer-link"
              >
                Dimension Infotech
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;