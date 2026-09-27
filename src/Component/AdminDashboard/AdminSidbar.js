// AdminSidebar.jsx - Complete with Interactive Toastify Logout Confirmation
import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaUsers,
  FaUserPlus,
  FaBookOpen,
  FaBriefcase,
  FaPlus,
  FaList,
  FaSignOutAlt,
  FaCreditCard,
  FaLayerGroup,
  FaChevronDown,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaChartLine,
  FaClipboardList,
  FaBuilding,
  FaCog,
  FaChartPie,
  FaFileContract,
  FaChartBar,
  FaUserCog,
  FaUserGraduate,
  FaAward,
  FaTools,
  FaCertificate,
  FaTrophy,
  FaGraduationCap,
  FaWallet,
  FaBoxOpen,
  FaHistory,
} from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AdminSidbar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [userType, setUserType] = useState('admin');
  const [franchiseCode, setFranchiseCode] = useState('');
  const [permissions, setPermissions] = useState({});
  const [userName, setUserName] = useState('');

  const [openMenus, setOpenMenus] = useState({
    franchisee: false,
    courses: false,
    jobs: false,
    payments: false,
    students: false,
    vocational: false,
    certificates: false,
    reports: false,
    settings: false,
    wallet: false,
  });

  // Helper utility to safely parse JSON from localStorage without throwing crashes
  const safeJsonParse = (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      toast.error(`Session error: Failed to parse account parameters for ${key}.`, {
        toastId: `err-parse-${key}`,
      });
      return null;
    }
  };

  // ============================================
  // 🔐 CHECK USER TYPE & PERMISSIONS
  // ============================================
  useEffect(() => {
    const userTypeStorage = localStorage.getItem('userType');
    const franchiseUser = safeJsonParse('franchiseUser');
    const currentUser = safeJsonParse('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (
      franchiseUser ||
      userTypeStorage === 'franchise' ||
      currentUser?.role === 'franchise'
    ) {
      setUserType('franchise');
      setFranchiseCode(
        franchiseUser?.franchise_code ||
        currentUser?.franchise_code ||
        ''
      );
      setUserName(
        franchiseUser?.applicant_name ||
        currentUser?.applicant_name ||
        'Franchise User'
      );

      const userPermissions =
        franchiseUser?.permissions ||
        currentUser?.permissions ||
        {};
      setPermissions(userPermissions);
    } else if (isAuthenticated === 'true') {
      setUserType('admin');
      setUserName('Admin');
      setPermissions({
        students: true,
        payments: true,
        certificates: true,
        reports: true,
        franchise: true,
        users: true,
        courses: true,
        jobs: true,
        vocational: true,
        settings: true,
        wallet: true,
        all: true,
      });
    } else {
      setUserType('admin');
      setUserName('Admin');
    }
  }, []);

  // ============================================
  // 🔄 MUTEX ACCORDION SYNC BASED ON PATH
  // ============================================
  useEffect(() => {
    const path = location.pathname;
    const newOpenMenus = {
      franchisee: false,
      courses: false,
      jobs: false,
      payments: false,
      students: false,
      vocational: false,
      certificates: false,
      reports: false,
      settings: false,
      wallet: false,
    };

    if (path.includes('/franchisee')) newOpenMenus.franchisee = true;
    else if (path.includes('/courses')) newOpenMenus.courses = true;
    else if (path.includes('/jobs')) newOpenMenus.jobs = true;
    else if (path.includes('/payments')) newOpenMenus.payments = true;
    else if (path.includes('/students')) newOpenMenus.students = true;
    else if (path.includes('/vocational')) newOpenMenus.vocational = true;
    else if (path.includes('/certificates')) newOpenMenus.certificates = true;
    else if (path.includes('/reports')) newOpenMenus.reports = true;
    else if (path.includes('/settings')) newOpenMenus.settings = true;
    else if (path.includes('/wallet')) newOpenMenus.wallet = true;

    setOpenMenus(newOpenMenus);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.innerWidth > 992) {
      setIsOpen(true);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================
  // 🎯 PERMISSION CHECK FUNCTIONS
  // ============================================
  const hasPermission = (permission) => {
    if (userType === 'admin') return true;
    return permissions[permission] === true;
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => {
      const resetMenus = {
        franchisee: false,
        courses: false,
        jobs: false,
        payments: false,
        students: false,
        vocational: false,
        certificates: false,
        reports: false,
        settings: false,
        wallet: false,
      };

      return {
        ...resetMenus,
        [menu]: !prev[menu],
      };
    });
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const isSubActive = (paths) => {
    return paths.some((path) => location.pathname.includes(path))
      ? 'active'
      : '';
  };

  // ============================================
  // 🚪 EXECUTE LOGOUT ON CONFIRMATION
  // ============================================
  const executeLogout = () => {
    toast.success('Logged out successfully! Redirecting...', {
      position: 'top-right',
      autoClose: 1500,
    });

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('franchiseUser');
    localStorage.removeItem('franchisePermissions');
    localStorage.removeItem('franchiseCode');
    localStorage.removeItem('isFranchiseLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');

    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  // ============================================
  // ❓ TOAST BASED CONFIRMATION (NO BLOCKING POPUPS)
  // ============================================
  const handleLogout = () => {
    toast.warn(
      ({ closeToast }) => (
        <div style={{ padding: '6px 2px' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
            ⚠️ Are you sure you want to logout?
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                closeToast();
                executeLogout();
              }}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                transition: '0.2s ease'
              }}
              onMouseEnter={(e) => (e.target.style.background = '#dc2626')}
              onMouseLeave={(e) => (e.target.style.background = '#ef4444')}
            >
              Yes, Logout
            </button>
            <button
              onClick={closeToast}
              style={{
                background: '#94a3b8',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px',
                transition: '0.2s ease'
              }}
              onMouseEnter={(e) => (e.target.style.background = '#64748b')}
              onMouseLeave={(e) => (e.target.style.background = '#94a3b8')}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        position: 'top-center',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        toastId: 'logout-confirm-dialog',
      }
    );
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const isFranchise = userType === 'franchise';

  const getPermissionCount = () => {
    if (userType === 'admin') return 'All Access';
    const count = Object.values(permissions).filter(
      (v) => v === true
    ).length;
    return `${count}`;
  };

  return (
    <>
      <button
        className="admin-sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle Navigation Sidebar"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isMobile && isOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={toggleSidebar}
        ></div>
      )}

      <div
        className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}
      >
        {/* ===== LOGO HEADER ===== */}
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="esv-logo-wrapper">
              <div className="esv-emblem">
                <span className="esv-emblem-text">ESV</span>
                <span className="esv-grad-cap">🎓</span>
              </div>
              <div className="esv-brand-details">
                <div className="esv-brand-title">
                  <span className="title-edu">Edu</span>
                  <span className="title-skill">Skill</span>
                  <span className="title-vision">Vision</span>
                </div>
                <div className="esv-brand-slogan">
                  EMPOWERING SKILLS, SHAPING FUTURES
                </div>
              </div>
            </div>
            <span className="admin-brand-role">
              {isFranchise ? 'Franchise' : 'Admin'}
            </span>
          </div>
        </div>

        {/* ===== FRANCHISE INFO ===== */}
        {isFranchise && (
          <div className="admin-franchise-info">
            <div className="af-left">
              <span className="af-name">{userName}</span>
              <span className="af-code">
                Code: {franchiseCode}
              </span>
            </div>
            <span className="af-badge">
              🔐 {getPermissionCount()}
            </span>
          </div>
        )}

        <div className="admin-sidebar-menu">
          {/* ===== DASHBOARD ===== */}
          <div className="admin-menu-section">
            <div className="admin-section-label">Main</div>
            <div className="admin-menu-item">
              <Link
                to="/admin-dashboard"
                className={`admin-menu-link ${isActive('/admin-dashboard')}`}
                onClick={handleLinkClick}
              >
                <FaHome className="admin-menu-icon" />
                <span className="admin-menu-text">Home</span>
              </Link>
            </div>
          </div>

          {/* ===== FRANCHISE MANAGEMENT - ADMIN ONLY ===== */}
          {(hasPermission('franchise') ||
            hasPermission('users')) &&
            !isFranchise && (
              <div className="admin-menu-section">
                <div className="admin-section-label">
                  Franchise
                </div>
                <div className="admin-menu-dropdown">
                  <div
                    className={`admin-menu-dropdown-header ${isSubActive(['/franchisee'])}`}
                    onClick={() => toggleMenu('franchisee')}
                  >
                    <FaUsers className="admin-menu-icon" />
                    <span className="admin-menu-text">
                      Franchise Management
                    </span>
                    {openMenus.franchisee ? (
                      <FaChevronDown className="admin-dropdown-icon" />
                    ) : (
                      <FaChevronRight className="admin-dropdown-icon" />
                    )}
                  </div>

                  {openMenus.franchisee && (
                    <div className="admin-dropdown-content">
                      <Link
                        to="/admin-dashboard/franchisee/generate"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/franchisee/generate')}`}
                        onClick={handleLinkClick}
                      >
                        <FaFileContract className="admin-sub-icon" />
                        <span>Generate Franchise</span>
                      </Link>

                      <Link
                        to="/admin-dashboard/franchisee/generate-report"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/franchisee/generate-report')}`}
                        onClick={handleLinkClick}
                      >
                        <FaChartBar className="admin-sub-icon" />
                        <span>Generate Report</span>
                      </Link>

                      <Link
                        to="/admin-dashboard/franchisee/list"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/franchisee/list')}`}
                        onClick={handleLinkClick}
                      >
                        <FaClipboardList className="admin-sub-icon" />
                        <span>Franchise Requests</span>
                      </Link>

                      <Link
                        to="/admin-dashboard/franchisee/request-report"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/franchisee/request-report')}`}
                        onClick={handleLinkClick}
                      >
                        <FaChartPie className="admin-sub-icon" />
                        <span>Request Report</span>
                      </Link>

                      <Link
                        to="/admin-dashboard/franchisee/user-management"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/franchisee/user-management')}`}
                        onClick={handleLinkClick}
                      >
                        <FaUserCog className="admin-sub-icon" />
                        <span>User Management</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ===== COURSES ===== */}
          {(hasPermission('courses') ||
            hasPermission('all')) && (
            <div className="admin-menu-section">
              <div className="admin-section-label">
                Academics
              </div>
              <div className="admin-menu-dropdown">
                <div
                  className={`admin-menu-dropdown-header ${isSubActive(['/courses'])}`}
                  onClick={() => toggleMenu('courses')}
                >
                  <FaBookOpen className="admin-menu-icon" />
                  <span className="admin-menu-text">
                    Courses
                  </span>
                  {openMenus.courses ? (
                    <FaChevronDown className="admin-dropdown-icon" />
                  ) : (
                    <FaChevronRight className="admin-dropdown-icon" />
                  )}
                </div>
                {openMenus.courses && (
                  <div className="admin-dropdown-content">
                    {!isFranchise &&
                      hasPermission('courses') && (
                        <Link
                          to="/admin-dashboard/courses/add"
                          className={`admin-sub-menu-link ${isActive('/admin-dashboard/courses/add')}`}
                          onClick={handleLinkClick}
                        >
                          <FaPlus className="admin-sub-icon" />
                          <span>Add Course</span>
                        </Link>
                      )}

                    {(hasPermission('courses') ||
                      hasPermission('reports')) && (
                      <Link
                        to="/admin-dashboard/courses/list"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/courses/list')}`}
                        onClick={handleLinkClick}
                      >
                        <FaList className="admin-sub-icon" />
                        <span>Course Report</span>
                      </Link>
                    )}

                    {!isFranchise &&
                      hasPermission('courses') && (
                        <Link
                          to="/admin-dashboard/course-manager"
                          className={`admin-sub-menu-link ${isActive('/admin-dashboard/course-manager')}`}
                          onClick={handleLinkClick}
                        >
                          <FaLayerGroup className="admin-sub-icon" />
                          <span>Website Courses</span>
                        </Link>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== JOBS ===== */}
          {(hasPermission('jobs') ||
            hasPermission('job_report') ||
            hasPermission('job_post') ||
            hasPermission('job_applications') ||
            !isFranchise) && (
            <div className="admin-menu-section">
              <div className="admin-menu-dropdown">
                <div
                  className={`admin-menu-dropdown-header ${isSubActive(['/jobs'])}`}
                  onClick={() => toggleMenu('jobs')}
                >
                  <FaBriefcase className="admin-menu-icon" />
                  <span className="admin-menu-text">Jobs</span>
                  {openMenus.jobs ? (
                    <FaChevronDown className="admin-dropdown-icon" />
                  ) : (
                    <FaChevronRight className="admin-dropdown-icon" />
                  )}
                </div>
                {openMenus.jobs && (
                  <div className="admin-dropdown-content">
                    {(!isFranchise ||
                      hasPermission('job_post')) && (
                      <Link
                        to="/admin-dashboard/jobs/add"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/jobs/add')}`}
                        onClick={handleLinkClick}
                      >
                        <FaPlus className="admin-sub-icon" />
                        <span>Add Job</span>
                      </Link>
                    )}

                    {(hasPermission('job_report') ||
                      hasPermission('jobs') ||
                      !isFranchise) && (
                      <Link
                        to="/admin-dashboard/jobs/report"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/jobs/report')}`}
                        onClick={handleLinkClick}
                      >
                        <FaChartLine className="admin-sub-icon" />
                        <span>Job Report</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== STUDENTS ===== */}
          {(hasPermission('students') ||
            hasPermission('all')) && (
            <div className="admin-menu-section">
              <div className="admin-menu-dropdown">
                <div
                  className={`admin-menu-dropdown-header ${isSubActive(['/students'])}`}
                  onClick={() => toggleMenu('students')}
                >
                  <FaUserGraduate className="admin-menu-icon" />
                  <span className="admin-menu-text">
                    Students
                  </span>
                  {openMenus.students ? (
                    <FaChevronDown className="admin-dropdown-icon" />
                  ) : (
                    <FaChevronRight className="admin-dropdown-icon" />
                  )}
                </div>
                {openMenus.students && (
                  <div className="admin-dropdown-content">
                    <Link
                      to="/admin-dashboard/students/admission"
                      className={`admin-sub-menu-link ${isActive('/admin-dashboard/students/admission')}`}
                      onClick={handleLinkClick}
                    >
                      <FaUserPlus className="admin-sub-icon" />
                      <span>Admission Form</span>
                    </Link>
                    <Link
                      to="/admin-dashboard/students/report"
                      className={`admin-sub-menu-link ${isActive('/admin-dashboard/students/report')}`}
                      onClick={handleLinkClick}
                    >
                      <FaChartLine className="admin-sub-icon" />
                      <span>Student Report</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== VOCATIONAL ===== */}
          {(hasPermission('vocational') ||
            hasPermission('all')) && (
            <div className="admin-menu-section">
              <div className="admin-menu-dropdown">
                <div
                  className={`admin-menu-dropdown-header ${isSubActive(['/vocational'])}`}
                  onClick={() => toggleMenu('vocational')}
                >
                  <FaTools className="admin-menu-icon" />
                  <span className="admin-menu-text">
                    Vocational
                  </span>
                  {openMenus.vocational ? (
                    <FaChevronDown className="admin-dropdown-icon" />
                  ) : (
                    <FaChevronRight className="admin-dropdown-icon" />
                  )}
                </div>
                {openMenus.vocational && (
                  <div className="admin-dropdown-content">
                    <Link
                      to="/admin-dashboard/vocational"
                      className={`admin-sub-menu-link ${isActive('/admin-dashboard/vocational')}`}
                      onClick={handleLinkClick}
                    >
                      <FaPlus className="admin-sub-icon" />
                      <span>Registration</span>
                    </Link>
                    <Link
                      to="/admin-dashboard/vocational/report"
                      className={`admin-sub-menu-link ${isActive('/admin-dashboard/vocational/report')}`}
                      onClick={handleLinkClick}
                    >
                      <FaList className="admin-sub-icon" />
                      <span>Vocational Report</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== CERTIFICATES ===== */}
          {(hasPermission('certificates') ||
            hasPermission('all')) && (
            <div className="admin-menu-section">
              <div className="admin-menu-dropdown">
                <div
                  className={`admin-menu-dropdown-header ${isSubActive(['/certificates'])}`}
                  onClick={() => toggleMenu('certificates')}
                >
                  <FaAward className="admin-menu-icon" />
                  <span className="admin-menu-text">
                    Certificates
                  </span>
                  {openMenus.certificates ? (
                    <FaChevronDown className="admin-dropdown-icon" />
                  ) : (
                    <FaChevronRight className="admin-dropdown-icon" />
                  )}
                </div>
                {openMenus.certificates && (
                  <div className="admin-dropdown-content">
                    <Link
                      to="/admin-dashboard/certificates"
                      className={`admin-sub-menu-link ${isActive('/admin-dashboard/certificates')}`}
                      onClick={handleLinkClick}
                    >
                      <FaGraduationCap className="admin-sub-icon" />
                      <span>Student Certificate</span>
                    </Link>

                    {!isFranchise && (
                      <Link
                        to="/admin-dashboard/franchise-certificate"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/franchise-certificate')}`}
                        onClick={handleLinkClick}
                      >
                        <FaBuilding className="admin-sub-icon" />
                        <span>Franchise Certificate</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== REPORTS ===== */}
          {(hasPermission('reports') ||
            hasPermission('all')) && (
            <div className="admin-menu-section">
              <div className="admin-menu-dropdown">
                <div
                  className={`admin-menu-dropdown-header ${isSubActive(['/reports'])}`}
                  onClick={() => toggleMenu('reports')}
                >
                  <FaChartLine className="admin-menu-icon" />
                  <span className="admin-menu-text">
                    Reports
                  </span>
                  {openMenus.reports ? (
                    <FaChevronDown className="admin-dropdown-icon" />
                  ) : (
                    <FaChevronRight className="admin-dropdown-icon" />
                  )}
                </div>
                {openMenus.reports && (
                  <div className="admin-dropdown-content">
                    <Link
                      to="/admin-dashboard/certificates-report"
                      className={`admin-sub-menu-link ${isActive('/admin-dashboard/certificates-report')}`}
                      onClick={handleLinkClick}
                    >
                      <FaCertificate className="admin-sub-icon" />
                      <span>Certificate Report</span>
                    </Link>

                    {!isFranchise && (
                      <Link
                        to="/admin-dashboard/franchise-certificate-report"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/franchise-certificate-report')}`}
                        onClick={handleLinkClick}
                      >
                        <FaTrophy className="admin-sub-icon" />
                        <span>
                          Franchise Certificate Report
                        </span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== PAYMENTS ===== */}
          {(hasPermission('payments') ||
            hasPermission('payment_entry') ||
            hasPermission('payment_report') ||
            hasPermission('student_vocational_payment') ||
            !isFranchise) && (
            <div className="admin-menu-section">
              <div className="admin-menu-dropdown">
                <div
                  className={`admin-menu-dropdown-header ${isSubActive(['/payments'])}`}
                  onClick={() => toggleMenu('payments')}
                >
                  <FaCreditCard className="admin-menu-icon" />
                  <span className="admin-menu-text">
                    Payments
                  </span>
                  {openMenus.payments ? (
                    <FaChevronDown className="admin-dropdown-icon" />
                  ) : (
                    <FaChevronRight className="admin-dropdown-icon" />
                  )}
                </div>
                {openMenus.payments && (
                  <div className="admin-dropdown-content">
                    {(!isFranchise ||
                      hasPermission('payment_entry')) && (
                      <Link
                        to="/admin-dashboard/payments"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/payments')}`}
                        onClick={handleLinkClick}
                      >
                        <FaPlus className="admin-sub-icon" />
                        <span>Payment Entry</span>
                      </Link>
                    )}

                    {(!isFranchise ||
                      hasPermission('payment_report')) && (
                      <Link
                        to="/admin-dashboard/payments/report"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/payments/report')}`}
                        onClick={handleLinkClick}
                      >
                        <FaList className="admin-sub-icon" />
                        <span>Payment Report</span>
                      </Link>
                    )}

                    {(!isFranchise ||
                      hasPermission(
                        'student_vocational_payment'
                      )) && (
                      <Link
                        to="/admin-dashboard/student-vocational-payments"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/student-vocational-payments')}`}
                        onClick={handleLinkClick}
                      >
                        <FaUserGraduate className="admin-sub-icon" />
                        <span>Student & Vocational</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== WALLET SECTION ===== */}
          {(hasPermission('wallet') ||
            hasPermission('certificates') ||
            hasPermission('all')) && (
            <div className="admin-menu-section">
              <div className="admin-section-label">
                💰 Wallet
              </div>
              <div className="admin-menu-dropdown">
                <div
                  className={`admin-menu-dropdown-header ${isSubActive(['/wallet'])}`}
                  onClick={() => toggleMenu('wallet')}
                >
                  <FaWallet className="admin-menu-icon" />
                  <span className="admin-menu-text">
                    Certificate Wallet
                  </span>
                  {openMenus.wallet ? (
                    <FaChevronDown className="admin-dropdown-icon" />
                  ) : (
                    <FaChevronRight className="admin-dropdown-icon" />
                  )}
                </div>
                {openMenus.wallet && (
                  <div className="admin-dropdown-content">
                    {/* 💰 FRANCHISE: My Wallet */}
                    {isFranchise && (
                      <Link
                        to="/admin-dashboard/wallet"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/wallet')}`}
                        onClick={handleLinkClick}
                      >
                        <FaWallet className="admin-sub-icon" />
                        <span>My Wallet</span>
                      </Link>
                    )}

                    {/* 📦 FRANCHISE: View Packages */}
                    {isFranchise && (
                      <Link
                        to="/admin-dashboard/wallet/packages"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/wallet/packages')}`}
                        onClick={handleLinkClick}
                      >
                        <FaBoxOpen className="admin-sub-icon" />
                        <span>View Packages</span>
                      </Link>
                    )}

                    {/* 🧾 FRANCHISE: My Transactions */}
                    {isFranchise && (
                      <Link
                        to="/admin-dashboard/wallet/transactions"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/wallet/transactions')}`}
                        onClick={handleLinkClick}
                      >
                        <FaHistory className="admin-sub-icon" />
                        <span>My Transactions</span>
                      </Link>
                    )}

                    {/* 👑 ADMIN: Wallet Management */}
                    {!isFranchise && (
                      <Link
                        to="/admin-dashboard/wallet/management"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/wallet/management')}`}
                        onClick={handleLinkClick}
                      >
                        <FaUserCog className="admin-sub-icon" />
                        <span>Wallet Management</span>
                      </Link>
                    )}

                    {/* 📦 ADMIN: Manage Packages */}
                    {!isFranchise && (
                      <Link
                        to="/admin-dashboard/wallet/packages-manage"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/wallet/packages-manage')}`}
                        onClick={handleLinkClick}
                      >
                        <FaBoxOpen className="admin-sub-icon" />
                        <span>Manage Packages</span>
                      </Link>
                    )}

                    {/* 🧾 ADMIN: All Transactions */}
                    {!isFranchise && (
                      <Link
                        to="/admin-dashboard/wallet/all-transactions"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/wallet/all-transactions')}`}
                        onClick={handleLinkClick}
                      >
                        <FaHistory className="admin-sub-icon" />
                        <span>All Transactions</span>
                      </Link>
                    )}

                    {/* ➕ ADMIN: Assign Package */}
                    {!isFranchise && (
                      <Link
                        to="/admin-dashboard/wallet/assign"
                        className={`admin-sub-menu-link ${isActive('/admin-dashboard/wallet/assign')}`}
                        onClick={handleLinkClick}
                      >
                        <FaPlus className="admin-sub-icon" />
                        <span>Assign Package</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== CHANGE PASSWORD - FRANCHISE ONLY ===== */}
          {isFranchise &&
            hasPermission('change_password') && (
              <div className="admin-menu-section">
                <div className="admin-menu-item">
                  <Link
                    to="/admin-dashboard/change-password"
                    className={`admin-menu-link ${isActive('/admin-dashboard/change-password')}`}
                    onClick={handleLinkClick}
                  >
                    <FaCog className="admin-menu-icon" />
                    <span className="admin-menu-text">
                      🔑 Change Password
                    </span>
                  </Link>
                </div>
              </div>
            )}

          {/* ===== SETTINGS ===== */}
          {(hasPermission('settings') ||
            hasPermission('all')) && (
            <div className="admin-menu-section">
              <div className="admin-menu-item">
                <Link
                  to="/admin-dashboard/settings"
                  className={`admin-menu-link ${isActive('/admin-dashboard/settings')}`}
                  onClick={handleLinkClick}
                >
                  <FaCog className="admin-menu-icon" />
                  <span className="admin-menu-text">
                    Settings
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* ===== LOGOUT ===== */}
          <div className="admin-menu-item admin-logout">
            <div
              className="admin-menu-link"
              onClick={handleLogout}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleLogout();
                }
              }}
            >
              <FaSignOutAlt className="admin-menu-icon" />
              <span className="admin-menu-text">Logout</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;