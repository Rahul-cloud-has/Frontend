import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, apiConfig } from '../../Api';
import './DashboardOverview.css';

const DashboardOverview = () => {
  const navigate = useNavigate();

  // ===== STATE =====
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('admin');
  const [userName, setUserName] = useState('Administrator');
  const [franchiseCode, setFranchiseCode] = useState('');
  const [permissions, setPermissions] = useState({});
  const [statsData, setStatsData] = useState({
    totalFranchisees: 0,
    activeFranchisees: 0,
    pendingApprovals: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalPayments: 0,
    totalRevenue: 0,
    totalVocational: 0,
    totalCertificates: 0,
    totalJobs: 0,
    activeJobs: 0
  });

  // ============================================
  // 🔐 GET USER TYPE & PERMISSIONS — FIXED
  // ============================================
  useEffect(() => {
    const userTypeStorage = localStorage.getItem('userType');

    // ✅ ADMIN PRIORITY: Agar userType 'admin' hai, to admin hi rahe
    if (userTypeStorage === 'admin') {
      setUserType('admin');
      setUserName('Administrator');
      setFranchiseCode('');
      setPermissions({});
      return;
    }

    // Franchise user check
    const franchiseUser = JSON.parse(localStorage.getItem('franchiseUser') || '{}');

    if (userTypeStorage === 'franchise' && franchiseUser) {
      setUserType('franchise');
      setUserName(franchiseUser?.applicant_name || 'Franchise User');
      setFranchiseCode(franchiseUser?.franchise_code || '');
      setPermissions(franchiseUser?.permissions || {});
    } else {
      // Default admin agar koi specific type nahi hai
      setUserType('admin');
      setUserName('Administrator');
    }
  }, []);

  // ============================================
  // 📤 FETCH APPLICATIONS FROM API
  // ============================================
  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_URL}/applications/`, apiConfig());

      let data = [];
      if (response.data && response.data.data) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }

      const mappedData = data.map(item => ({
        id: item.id,
        applicantName: item.name || item.applicant_name || '',
        fatherName: item.father_name || '',
        mobile: item.mobile || '',
        email: item.email || '',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        pincode: item.pincode || '',
        franchiseName: item.franchise_name || '',
        message: item.message || '',
        status: item.status || 'Pending',
        adminNote: item.admin_note || '',
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        createdAt: item.created_at
      }));

      setRequests(mappedData);
      setFilteredRequests(mappedData);
      return mappedData; // ✅ Return karo taaki stale closure na ho

    } catch (error) {
      setError('Failed to load applications');
      toast.error('Failed to load applications.');
      setRequests([]);
      setFilteredRequests([]);
      return [];
    }
  };

  // ============================================
  // 📊 LOAD STATS — SARE ALAG ALAG API SE — FIXED
  // ============================================
  const loadStatsData = async (requestsData) => {
    // ✅ requestsData pass kiya gaya hai (stale closure fix)
    const reqs = requestsData || [];

    let totalFranchisees = 0;
    let activeFranchisees = 0;
    let pendingApprovals = 0;
    let totalCourses = 0;
    let activeCourses = 0;
    let totalStudents = 0;
    let totalPayments = 0;
    let totalRevenue = 0;
    let totalVocational = 0;
    let totalCertificates = 0;
    let totalJobs = 0;
    let activeJobs = 0;

    // 1. Franchises
    try {
      const res = await axios.get(`${API_URL}/franchises/`, apiConfig());
      let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
      totalFranchisees = data.length;
      activeFranchisees = data.filter(f =>
        f.status === 'Active Franchise' || f.status === 'Active'
      ).length;
      pendingApprovals = data.filter(f =>
        f.status === 'Pending' || f.status === 'Payment Pending'
      ).length;
    } catch (e) {
      // ✅ Debugging ke liye warning
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Franchises API failed:', e.response?.status || e.message);
      }
    }

    // 2. Courses
    try {
      const res = await axios.get(`${API_URL}/courses/`, apiConfig());
      let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
      totalCourses = data.length;
      activeCourses = data.filter(c => c.status !== 'Inactive').length;
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Courses API failed:', e.response?.status || e.message);
      }
    }

    // 3. Students
    try {
      const res = await axios.get(`${API_URL}/students/`, apiConfig());
      let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
      totalStudents = data.length;
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Students API failed:', e.response?.status || e.message);
      }
    }

    // 4. Payments (Franchise Payments)
    try {
      const res = await axios.get(`${API_URL}/franchise-payments/`, apiConfig());
      let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
      totalPayments = data.length;
      totalRevenue = data.reduce((sum, p) =>
        sum + (parseFloat(p.paid_amount) || parseFloat(p.amount) || 0), 0
      );
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Payments API failed:', e.response?.status || e.message);
      }
    }

    // 5. Vocational Students
    try {
      const res = await axios.get(`${API_URL}/vocational/students/`, apiConfig());
      let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
      totalVocational = data.length;
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Vocational API failed:', e.response?.status || e.message);
      }
    }

    // 6. Certificates
    try {
      const res = await axios.get(`${API_URL}/student-certificates/`, apiConfig());
      let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
      totalCertificates = data.length;
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Certificates API failed:', e.response?.status || e.message);
      }
    }

    // 7. Jobs
    try {
      const res = await axios.get(`${API_URL}/jobs/`, apiConfig());
      let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
      totalJobs = data.length;
      activeJobs = data.filter(j => j.is_active === true || j.status === 'Active').length;
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Jobs API failed:', e.response?.status || e.message);
      }
    }

    // 8. Pending Applications (pass kiya gaya data se)
    const pendingApplications = reqs.filter(r => r.status === 'Pending').length;

    setStatsData({
      totalFranchisees,
      activeFranchisees,
      pendingApprovals: pendingApprovals || pendingApplications,
      totalCourses,
      activeCourses,
      totalStudents,
      totalPayments,
      totalRevenue,
      totalVocational,
      totalCertificates,
      totalJobs,
      activeJobs
    });
  };

  // ============================================
  // 🔄 LOAD ALL DATA — FIXED
  // ============================================
  const loadAllData = async () => {
    setLoading(true);
    setError('');

    // ✅ Pehle applications fetch karo, result pass karo
    const appsData = await fetchApplications();

    // ✅ Phir stats load karo (requestsData pass kiya)
    await loadStatsData(appsData);

    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // 🔍 FILTER REQUESTS
  // ============================================
  useEffect(() => {
    let result = [...requests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.applicantName?.toLowerCase().includes(term) ||
        item.mobile?.includes(term) ||
        item.id?.toString().includes(term) ||
        item.franchiseName?.toLowerCase().includes(term) ||
        item.city?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(item => item.status === statusFilter);
    }

    setFilteredRequests(result);
  }, [searchTerm, statusFilter, requests]);

  // ============================================
  // ✅ UPDATE STATUS — TOAST CONFIRM
  // ============================================
  const executeStatusUpdate = async (id, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/applications/${id}/status/`,
        {
          status: newStatus,
          admin_note: `Status updated to ${newStatus} from dashboard`
        },
        apiConfig()
      );

      const updated = requests.map(req =>
        req.id === id ? { ...req, status: newStatus } : req
      );
      setRequests(updated);

      toast.success(`Request #${id} ${newStatus}!`);
      loadStatsData(requests);

    } catch (error) {
      toast.error('Failed to update status. Please try again.');
    }
  };

  const updateRequestStatus = (id, newStatus) => {
    toast(
      ({ closeToast }) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>
            {newStatus} Request #{id}?
          </div>
          <div style={{ fontSize: '14px', marginBottom: '14px' }}>
            Are you sure you want to {newStatus.toLowerCase()} this application?
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={closeToast}
              style={{
                border: 'none', borderRadius: '5px', padding: '7px 13px',
                cursor: 'pointer', backgroundColor: '#e5e7eb',
                color: '#111827', fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                closeToast();
                await executeStatusUpdate(id, newStatus);
              }}
              style={{
                border: 'none', borderRadius: '5px', padding: '7px 13px',
                cursor: 'pointer',
                backgroundColor: newStatus === 'Approved' ? '#16a34a' : '#dc2626',
                color: '#ffffff', fontWeight: '600'
              }}
            >
              {newStatus === 'Approved' ? '✅ Approve' : '❌ Reject'}
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        position: 'top-center'
      }
    );
  };

  // ============================================
  // 🎯 CARD NAVIGATION — ID BASED
  // ============================================
  const handleCardClick = (cardId) => {
    const routes = {
      1: '/admin-dashboard/franchisee/list',
      2: '/admin-dashboard/courses/list',
      3: '/admin-dashboard/courses/list',
      4: '/admin-dashboard/students/report',
      5: '/admin-dashboard/payments/report',
      6: '/admin-dashboard/payments/report',
      7: '/admin-dashboard/vocational/report',
      8: '/admin-dashboard/certificates',
      9: '/admin-dashboard/jobs/report'
    };

    const route = routes[cardId];
    if (route) {
      navigate(route);
    }
  };

  // ============================================
  // 🎯 PERMISSION CHECK — FIXED
  // ============================================
  const hasPermission = (permission) => {
    // ✅ Admin ke liye hamesha true
    if (userType === 'admin') return true;
    return permissions[permission] === true;
  };

  // ============================================
  // 🎨 9 CARDS — 3 PER ROW
  // ============================================
  const allStats = [
    { id: 1, title: 'Total Franchisees', value: statsData.totalFranchisees, icon: '🏢', color: '#2563eb', section: 'Franchise', permission: 'franchise' },
    { id: 2, title: 'Total Courses', value: statsData.totalCourses, icon: '📚', color: '#7c3aed', section: 'Academics', permission: 'courses' },
    { id: 3, title: 'Active Courses', value: statsData.activeCourses, icon: '📖', color: '#059669', section: 'Academics', permission: 'courses' },
    { id: 4, title: 'Total Students', value: statsData.totalStudents, icon: '👨‍🎓', color: '#14b8a6', section: 'Students', permission: 'students' },
    { id: 5, title: 'Total Revenue', value: `₹${statsData.totalRevenue.toLocaleString()}`, icon: '💰', color: '#ec4899', section: 'Finance', permission: 'payments' },
    { id: 6, title: 'Total Payments', value: statsData.totalPayments, icon: '💳', color: '#f97316', section: 'Finance', permission: 'payments' },
    { id: 7, title: 'Vocational Students', value: statsData.totalVocational, icon: '🔧', color: '#6366f1', section: 'Vocational', permission: 'vocational' },
    { id: 8, title: 'Total Certificates', value: statsData.totalCertificates, icon: '📜', color: '#f43f5e', section: 'Certificates', permission: 'certificates' },
    { id: 9, title: 'Total Jobs', value: statsData.totalJobs, icon: '💼', color: '#8b5cf6', section: 'Careers', permission: 'jobs' },
  ];

  const stats = allStats.filter(stat => {
    if (userType === 'admin') return true;
    return hasPermission(stat.permission);
  });

  // ============================================
  // 🏷️ STATUS BADGE
  // ============================================
  const StatusBadge = ({ status }) => {
    const colors = {
      Pending: { bg: '#fef3c7', text: '#92400e' },
      Approved: { bg: '#d1fae5', text: '#065f46' },
      Rejected: { bg: '#fee2e2', text: '#991b1b' }
    };
    const style = colors[status] || colors.Pending;
    return (
      <span style={{
        background: style.bg,
        color: style.text,
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {status}
      </span>
    );
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="admin-dashboard-overview">
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* ===== HEADER ===== */}
      <div className="admin-dash-header">
        <div className="admin-dash-header-left">
          <span className="admin-dash-icon">⚙️</span>
          <div>
            <h1>{userType === 'admin' ? 'Admin Dashboard' : 'Franchise Dashboard'}</h1>
            <p>
              {userType === 'admin'
                ? `Welcome back, ${userName}!`
                : `Welcome back, ${userName}! (${franchiseCode})`
              }
            </p>
          </div>
        </div>
        <div className="admin-dash-header-right">
          <span className="admin-dash-date">
            📅 {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <button className="refresh-btn-dash" onClick={loadAllData} title="Refresh Data">
            🔄
          </button>
        </div>
      </div>

      {/* ===== ERROR MESSAGE ===== */}
      {error && (
        <div className="dash-error" style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ===== STATS CARDS - 3 PER ROW ===== */}
      <div className="admin-dash-stats-grid">
        {stats.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#999' }}>
            ⚠️ No cards available. Please check your permissions.
          </div>
        ) : (
          stats.map((stat) => (
            <div
              key={stat.id}
              className="admin-dash-stat-card clickable"
              onClick={() => handleCardClick(stat.id)}
              title={`Click to view ${stat.title}`}
            >
              <div className="admin-dash-stat-icon" style={{ background: `${stat.color}15` }}>
                <span>{stat.icon}</span>
              </div>
              <div className="admin-dash-stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
                <span className="stat-section">{stat.section}</span>
              </div>
              <div className="card-arrow">→</div>
            </div>
          ))
        )}
      </div>

      {/* ============================================================
          FRANCHISE APPLICATIONS TABLE - ONLY FOR ADMIN
          ============================================================ */}
      {userType === 'admin' && (
        <div className="franchise-requests-section">

          <div className="franchise-requests-header">
            <h2>📋 Franchise Applications</h2>
            <span className="request-count">Total: {requests.length}</span>
          </div>

          {/* Search & Filter */}
          <div className="request-filters">
            <input
              type="text"
              placeholder="🔍 Search by name, mobile, franchise name..."
              className="search-box"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Table */}
          <div className="request-table-wrapper">
            <table className="request-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Applicant</th>
                  <th>Franchise Name</th>
                  <th>Mobile</th>
                  <th>City</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="no-requests">⏳ Loading...</td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-requests">
                      {requests.length === 0 ? '📭 No franchise applications' : 'No matching applications'}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.slice(0, 5).map((req) => (
                    <tr key={req.id}>
                      <td>#{req.id}</td>
                      <td><strong>{req.applicantName}</strong></td>
                      <td>{req.franchiseName || '—'}</td>
                      <td>{req.mobile}</td>
                      <td>{req.city || 'N/A'}</td>
                      <td>{req.date}</td>
                      <td><StatusBadge status={req.status} /></td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn view"
                            onClick={() => navigate(`/admin-dashboard/franchisee/details/${req.id}`)}
                            title="View"
                          >
                            👁️
                          </button>
                          {req.status === 'Pending' && (
                            <>
                              <button
                                className="action-btn approve"
                                onClick={() => updateRequestStatus(req.id, 'Approved')}
                                title="Approve"
                              >
                                ✅
                              </button>
                              <button
                                className="action-btn reject"
                                onClick={() => updateRequestStatus(req.id, 'Rejected')}
                                title="Reject"
                              >
                                ❌
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* View All */}
          {filteredRequests.length > 5 && (
            <div className="view-all-bottom">
              <button onClick={() => navigate('/admin-dashboard/franchisee/list')}>
                View All {filteredRequests.length} Applications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;