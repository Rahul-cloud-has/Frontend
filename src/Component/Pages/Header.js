import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL, apiConfig } from "../../Api";
import "./Header.css";
import logo from "../../assets/image.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFranchiseOpen, setIsFranchiseOpen] = useState(false);
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);
  const [isMobileFranchiseOpen, setIsMobileFranchiseOpen] = useState(false);
  const [isMobileLoginOpen, setIsMobileLoginOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // ============================================
  // 📤 FETCH CATEGORIES FROM API WITH TOASTIFY
  // ============================================
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);

        const response = await axios.get(`${API_URL}/website/categories/`, {
          ...(apiConfig() || {}),
          signal: controller.signal,
        });

        if (!isMounted) return;

        const data = Array.isArray(response.data) ? response.data : [];
        setCategories(data);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        if (!isMounted) return;

        setCategories([]);
        // Display elegant Toast instead of blocking console.errors
        toast.error("Failed to load course categories. Please refresh or try again later.", {
          toastId: "header-cat-error",
          autoClose: 4000,
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // ============================================
  // 🔄 CLOSE ALL ON ROUTE CHANGE
  // ============================================
  useEffect(() => {
    setIsMenuOpen(false);
    setIsCoursesOpen(false);
    setIsFranchiseOpen(false);
    setIsLoginOpen(false);
    setIsMobileCoursesOpen(false);
    setIsMobileFranchiseOpen(false);
    setIsMobileLoginOpen(false);
  }, [location]);

  // ============================================
  // 🔒 BODY SCROLL LOCK
  // ============================================
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // ============================================
  // 🖱️ CLOSE DESKTOP DROPDOWN ON OUTSIDE CLICK
  // ============================================
  useEffect(() => {
    const closeDropdowns = () => {
      setIsCoursesOpen(false);
      setIsFranchiseOpen(false);
      setIsLoginOpen(false);
    };
    if (isCoursesOpen || isFranchiseOpen || isLoginOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("click", closeDropdowns);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", closeDropdowns);
      };
    }
  }, [isCoursesOpen, isFranchiseOpen, isLoginOpen]);

  // ============================================
  // 🎯 HELPERS
  // ============================================
  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsMobileCoursesOpen(false);
    setIsMobileFranchiseOpen(false);
    setIsMobileLoginOpen(false);
  };

  const handleDropdownClick = (path) => {
    setIsCoursesOpen(false);
    setIsFranchiseOpen(false);
    setIsLoginOpen(false);
    if (path && path !== "#") navigate(path);
  };

  const navigateToCourses = (categoryId = "all") => {
    setIsCoursesOpen(false);
    setIsMobileCoursesOpen(false);
    closeMenu();
    navigate(`/courses?category=${categoryId}`);
  };

  return (
    <>
      {/* ===== TOP BAR ===== */}
      <div className="esv-top-bar">
        <div className="esv-container">
          <div className="esv-top-bar-content">
            <div className="esv-contact-info">
              <a href="tel:+918463065317">
                <span className="esv-icon">📞</span>
                <span>+91 84630 65317</span>
              </a>
              <a href="mailto:eduskillvision@gmail.com">
                <span className="esv-icon">✉️</span>
                <span>eduskillvision@gmail.com</span>
              </a>
            </div>
            <Link to="/verify-certificate" className="esv-verify-link">
              <span>✅</span>
              <span>Verify Certificate</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ===== MAIN HEADER ===== */}
      <header className="esv-header">
        <div className="esv-container">
          <div className="esv-header-content">
            {/* Logo */}
            <Link to="/" className="esv-logo">
              <div className="esv-logo-img-wrapper">
                <img src={logo} alt="EduSkillVision" className="esv-logo-img" />
              </div>
              <div className="esv-logo-text">
                <h1>
                  <span className="esv-blue">Edu</span>
                  <span className="esv-gold">Skill</span>
                  <span className="esv-blue">Vision</span>
                </h1>
                <p>Empowering Skills, Shaping Futures</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="esv-nav-menu">
              <Link
                to="/"
                className={`esv-nav-link ${location.pathname === "/" ? "esv-active" : ""}`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`esv-nav-link ${location.pathname === "/about" ? "esv-active" : ""}`}
              >
                About
              </Link>

              {/* Courses Dropdown */}
              <div className="esv-dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                <span
                  className={`esv-nav-link esv-dropdown-trigger ${isCoursesOpen ? "esv-open" : ""} ${location.pathname === "/courses" ? "esv-active" : ""}`}
                  onClick={() => {
                    setIsCoursesOpen(!isCoursesOpen);
                    setIsFranchiseOpen(false);
                    setIsLoginOpen(false);
                  }}
                >
                  Courses <span className={`esv-arrow ${isCoursesOpen ? "esv-rotate" : ""}`}>▼</span>
                </span>
                {isCoursesOpen && (
                  <div className="esv-dropdown-menu">
                    <button
                      className="esv-dd-item"
                      onClick={() => navigateToCourses("all")}
                    >
                      📚 All Courses
                    </button>

                    {loading ? (
                      <div className="esv-dd-item" style={{ color: "#94a3b8", cursor: "default" }}>
                        Loading...
                      </div>
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat.id}
                          className="esv-dd-item"
                          onClick={() => navigateToCourses(cat.id)}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Franchise Dropdown */}
              <div className="esv-dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                <span
                  className={`esv-nav-link esv-dropdown-trigger ${isFranchiseOpen ? "esv-open" : ""}`}
                  onClick={() => {
                    setIsFranchiseOpen(!isFranchiseOpen);
                    setIsCoursesOpen(false);
                    setIsLoginOpen(false);
                  }}
                >
                  Franchise <span className={`esv-arrow ${isFranchiseOpen ? "esv-rotate" : ""}`}>▼</span>
                </span>
                {isFranchiseOpen && (
                  <div className="esv-dropdown-menu">
                    <button
                      className="esv-dd-item"
                      onClick={() => handleDropdownClick("/franchisee")}
                    >
                      🏢 About Franchise
                    </button>
                    <button
                      className="esv-dd-item"
                      onClick={() => handleDropdownClick("/franchise-apply")}
                    >
                      📝 Apply Franchise
                    </button>
                  </div>
                )}
              </div>

              <Link
                to="/contact"
                className={`esv-nav-link ${location.pathname === "/contact" ? "esv-active" : ""}`}
              >
                Contact
              </Link>

              {/* Login Dropdown */}
              <div className="esv-dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                <span
                  className={`esv-nav-link esv-login-btn ${isLoginOpen ? "esv-open" : ""}`}
                  onClick={() => {
                    setIsLoginOpen(!isLoginOpen);
                    setIsCoursesOpen(false);
                    setIsFranchiseOpen(false);
                  }}
                >
                  Login <span className={`esv-arrow ${isLoginOpen ? "esv-rotate" : ""}`}>▼</span>
                </span>
                {isLoginOpen && (
                  <div className="esv-dropdown-menu">
                    <button
                      className="esv-dd-item"
                      onClick={() => handleDropdownClick("/login-admin")}
                    >
                      🔐 Admin Login
                    </button>
                    <button
                      className="esv-dd-item"
                      onClick={() => handleDropdownClick("/login-franchise")}
                    >
                      🏢 Franchise Login
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Hamburger Button */}
            <button
              className={`esv-hamburger ${isMenuOpen ? "esv-active" : ""}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER + BACKDROP */}
      {isMenuOpen && <div className="esv-backdrop" onClick={closeMenu}></div>}

      <aside className={`esv-drawer ${isMenuOpen ? "esv-drawer-open" : ""}`}>
        <div className="esv-drawer-header">
          <div className="esv-drawer-brand">
            <img src={logo} alt="ESV" className="esv-drawer-logo" />
            <div>
              <h3>EduSkillVision</h3>
              <p>Menu</p>
            </div>
          </div>
          <button className="esv-drawer-close" onClick={closeMenu} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="esv-drawer-body">
          <Link to="/" className="esv-drawer-link" onClick={closeMenu}>
            <span className="esv-drawer-ico">🏠</span>
            <span>Home</span>
          </Link>

          <Link to="/about" className="esv-drawer-link" onClick={closeMenu}>
            <span className="esv-drawer-ico">ℹ️</span>
            <span>About</span>
          </Link>

          {/* Courses Accordion */}
          <div className="esv-accordion">
            <button
              className={`esv-accordion-title ${isMobileCoursesOpen ? "esv-acc-open" : ""}`}
              onClick={() => setIsMobileCoursesOpen(!isMobileCoursesOpen)}
            >
              <span className="esv-accordion-label">
                <span className="esv-drawer-ico">📚</span>
                <span>Courses</span>
              </span>
              <span className="esv-accordion-arrow">▼</span>
            </button>
            <div className={`esv-accordion-body ${isMobileCoursesOpen ? "esv-acc-body-open" : ""}`}>
              <button
                className="esv-accordion-sub"
                onClick={() => navigateToCourses("all")}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                📚 All Courses
              </button>

              {loading ? (
                <div className="esv-accordion-sub" style={{ color: "#94a3b8" }}>
                  Loading...
                </div>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat.id}
                    className="esv-accordion-sub"
                    onClick={() => navigateToCourses(cat.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Franchise Accordion */}
          <div className="esv-accordion">
            <button
              className={`esv-accordion-title ${isMobileFranchiseOpen ? "esv-acc-open" : ""}`}
              onClick={() => setIsMobileFranchiseOpen(!isMobileFranchiseOpen)}
            >
              <span className="esv-accordion-label">
                <span className="esv-drawer-ico">🏢</span>
                <span>Franchise</span>
              </span>
              <span className="esv-accordion-arrow">▼</span>
            </button>
            <div className={`esv-accordion-body ${isMobileFranchiseOpen ? "esv-acc-body-open" : ""}`}>
              <Link to="/franchisee" className="esv-accordion-sub" onClick={closeMenu}>
                🏢 About Franchise
              </Link>
              <Link to="/franchise-apply" className="esv-accordion-sub" onClick={closeMenu}>
                📝 Apply Franchise
              </Link>
            </div>
          </div>

          <Link to="/contact" className="esv-drawer-link" onClick={closeMenu}>
            <span className="esv-drawer-ico">📞</span>
            <span>Contact</span>
          </Link>

          {/* Login Accordion */}
          <div className="esv-accordion">
            <button
              className={`esv-accordion-title ${isMobileLoginOpen ? "esv-acc-open" : ""}`}
              onClick={() => setIsMobileLoginOpen(!isMobileLoginOpen)}
            >
              <span className="esv-accordion-label">
                <span className="esv-drawer-ico">🔐</span>
                <span>Login</span>
              </span>
              <span className="esv-accordion-arrow">▼</span>
            </button>
            <div className={`esv-accordion-body ${isMobileLoginOpen ? "esv-acc-body-open" : ""}`}>
              <Link to="/login-admin" className="esv-accordion-sub" onClick={closeMenu}>
                🔐 Admin Login
              </Link>
              <Link to="/login-franchise" className="esv-accordion-sub" onClick={closeMenu}>
                🏢 Franchise Login
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Header;