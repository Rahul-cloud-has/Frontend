// WalletDashboard.jsx - Final Version (Force White Background)
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, apiConfig } from '../../Api';
import './WalletDashboard.css';

const getUserAccess = () => {
  try {
    const userType = localStorage.getItem('userType');
    const franchiseUser = JSON.parse(
      localStorage.getItem('franchiseUser') || '{}'
    );
    if (userType === 'franchise') {
      return {
        type: 'franchise',
        franchiseCode: franchiseUser?.franchise_code || '',
        franchiseName:
          franchiseUser?.franchise_name ||
          franchiseUser?.applicant_name ||
          'Franchise',
      };
    }
    if (userType === 'admin')
      return {
        type: 'admin',
        franchiseCode: '',
        franchiseName: 'Admin',
      };
    return {
      type: 'guest',
      franchiseCode: '',
      franchiseName: 'Guest',
    };
  } catch {
    return {
      type: 'guest',
      franchiseCode: '',
      franchiseName: 'Guest',
    };
  }
};

const toastConfig = {
  position: 'top-right',
  autoClose: 3000,
  theme: 'light',
};

// ✅ WRAPPER STYLE - Force Light Background
const wrapperStyle = {
  background: '#f1f5f9',
  minHeight: '100vh',
  width: '100%',
  padding: 0,
  margin: 0,
  colorScheme: 'light',
};

const WalletDashboard = () => {
  const access = getUserAccess();
  const franchiseCode = access.franchiseCode;
  const franchiseName = access.franchiseName;
  const location = useLocation();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ Force body background on mount
  useEffect(() => {
    document.body.style.background = '#f1f5f9';
    document.body.style.backgroundColor = '#f1f5f9';
    document.documentElement.style.background = '#f1f5f9';
    document.documentElement.style.backgroundColor = '#f1f5f9';
    
    return () => {
      // Cleanup on unmount (optional)
    };
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/wallet/transactions'))
      setActiveTab('history');
    else if (path.includes('/wallet/packages'))
      setActiveTab('packages');
    else setActiveTab('overview');
  }, [location.pathname]);

  const loadWallet = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/wallet/balance/?_t=${Date.now()}`,
        apiConfig()
      );
      setWallet(res.data?.wallet || null);
    } catch {
      setWallet(null);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/wallet/transactions/?_t=${Date.now()}`,
        apiConfig()
      );
      setTransactions(
        Array.isArray(res.data)
          ? res.data
          : res.data?.results || []
      );
    } catch {
      setTransactions([]);
    }
  };

  const loadPackages = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/wallet/packages/`,
        apiConfig()
      );
      setPackages(
        Array.isArray(res.data)
          ? res.data
          : res.data?.results || []
      );
    } catch {
      setPackages([]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadWallet(),
      loadTransactions(),
      loadPackages(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContactAdmin = pkg => {
    toast.info(
      <div>
        <strong>📞 Contact Admin</strong>
        <br />
        📚 {pkg.course_name || pkg.name} •{' '}
        {pkg.certificate_count} Certs • ₹
        {Number(pkg.price).toLocaleString()}
        <br />
        <br />
        📱 +91 91111 37575
        <br />📧 info@eduskillvision.com
      </div>,
      { ...toastConfig, autoClose: 8000 }
    );
  };

  // Values
  const total = wallet?.total_certificates || 0;
  const remaining = wallet?.remaining_certificates || 0;
  const used = wallet?.used_certificates || 0;
  const totalPaid = wallet?.total_amount_paid || 0;
  const percentage = total > 0 ? (remaining / total) * 100 : 0;

  // Course wise balance calculation
  const courseBalance = {};
  transactions.forEach(txn => {
    const course = txn.course_name || 'Unknown';
    if (!courseBalance[course]) {
      courseBalance[course] = {
        total: 0,
        used: 0,
        remaining: 0,
        amount: 0,
      };
    }
    if (
      txn.transaction_type === 'purchase' ||
      txn.transaction_type === 'admin_add'
    ) {
      courseBalance[course].total += txn.certificate_count || 0;
      courseBalance[course].amount += Number(txn.amount || 0);
    } else if (txn.transaction_type === 'deduction') {
      courseBalance[course].used += txn.certificate_count || 0;
    }
  });
  Object.keys(courseBalance).forEach(course => {
    courseBalance[course].remaining =
      courseBalance[course].total - courseBalance[course].used;
  });

  // Separate transactions
  const recharges = transactions
    .filter(
      t =>
        t.transaction_type === 'purchase' ||
        t.transaction_type === 'admin_add'
    )
    .sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

  const downloads = transactions
    .filter(t => t.transaction_type === 'deduction')
    .sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

  // Unique students
  const uniqueDownloads = [];
  const seen = new Set();
  downloads.forEach(d => {
    const key = (d.remarks || '').trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueDownloads.push(d);
    } else if (!key) {
      uniqueDownloads.push(d);
    }
  });

  const parseStudent = remarks => {
    let name = remarks || '—';
    let cert = '';

    if (remarks && remarks.includes(':')) {
      const detail = remarks
        .split(':')
        .slice(1)
        .join(':')
        .trim();
      const match = detail.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        name = match[1].trim();
        cert = match[2].trim();
      } else {
        name = detail;
      }
    }

    if (remarks && remarks.startsWith('Cert:')) {
      const parts = remarks
        .replace('Cert:', '')
        .trim()
        .split(' - ');
      if (parts.length >= 2) {
        cert = parts[0].trim();
        name = parts[1].trim();
      } else {
        name = parts[0];
      }
    }

    return { name, cert };
  };

  let statusClass = 'wd-status-active';
  let statusText = '✅ Active';
  if (remaining <= 0) {
    statusClass = 'wd-status-empty';
    statusText = '❌ Empty';
  } else if (remaining <= 5) {
    statusClass = 'wd-status-low';
    statusText = '⚠️ Low';
  }

  if (loading) {
    return (
      <div style={wrapperStyle}>
        <div className="wd-loading">
          <div className="wd-spinner" />
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div className="wd-container">
        <ToastContainer
          {...toastConfig}
          style={{ zIndex: 99999 }}
        />

        {/* STICKY HEADER */}
        <div className="wd-sticky-header">
          <div className="wd-header">
            <div className="wd-header-left">
              <span className="wd-header-icon">💰</span>
              <h1 className="wd-title">
                Certificate <span>Wallet</span>
              </h1>
            </div>
            <div className="wd-header-right">
              {franchiseCode && (
                <span className="wd-franchise-badge">
                  🏷️ {franchiseCode}
                </span>
              )}
              <button
                className="wd-btn-refresh"
                onClick={() => {
                  loadAll();
                  toast.success('🔄 Refreshed!', toastConfig);
                }}
              >
                🔄
              </button>
            </div>
          </div>

          {/* SMALL STATS */}
          <div className="wd-stats-mini">
            <div className="wd-sm-card wd-sm-purple">
              <span className="wd-sm-val">{remaining}</span>
              <span className="wd-sm-lbl">Available</span>
              <div className="wd-sm-bar">
                <div
                  className="wd-sm-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <div className="wd-sm-card">
              <span className="wd-sm-val wd-color-navy">
                {total}
              </span>
              <span className="wd-sm-lbl">Total</span>
            </div>
            <div className="wd-sm-card">
              <span className="wd-sm-val wd-color-green">
                {used}
              </span>
              <span className="wd-sm-lbl">Used</span>
            </div>
            <div className="wd-sm-card">
              <span className="wd-sm-val wd-color-amber">
                ₹{Number(totalPaid).toLocaleString()}
              </span>
              <span className="wd-sm-lbl">Paid</span>
            </div>
          </div>

          {/* TABS */}
          <div className="wd-tabs">
            {[
              {
                key: 'overview',
                label: '📊 Overview',
                path: '/admin-dashboard/wallet',
              },
              {
                key: 'history',
                label: `📜 Downloads (${uniqueDownloads.length})`,
                path: '/admin-dashboard/wallet/transactions',
              },
              {
                key: 'packages',
                label: '📚 Courses',
                path: '/admin-dashboard/wallet/packages',
              },
            ].map(tab => (
              <button
                key={tab.key}
                className={`wd-tab ${
                  activeTab === tab.key ? 'active' : ''
                }`}
                onClick={() => {
                  setActiveTab(tab.key);
                  navigate(tab.path);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================ */}
        {/* TAB: OVERVIEW - Course wise Balance */}
        {/* ============================================ */}
        {activeTab === 'overview' && (
          <div>
            {/* STATUS ROW */}
            <div className="wd-status-row">
              <div className="wd-status-item">
                <span className="wd-status-label">Franchise</span>
                <span className="wd-status-val">
                  {franchiseName || 'N/A'}
                </span>
              </div>
              <div className="wd-status-item">
                <span className="wd-status-label">Code</span>
                <span className="wd-status-val">
                  {franchiseCode || 'N/A'}
                </span>
              </div>
              <div className={`wd-status-item ${statusClass}`}>
                <span className="wd-status-label">Status</span>
                <span className="wd-status-val">{statusText}</span>
              </div>
              <div className="wd-status-item">
                <span className="wd-status-label">
                  Total Courses
                </span>
                <span className="wd-status-val">
                  {Object.keys(courseBalance).length}
                </span>
              </div>
            </div>

            {/* LOW BALANCE ALERT */}
            {remaining <= 5 && (
              <div className="wd-alert">
                <span>⚠️</span>
                <div className="wd-alert-content">
                  <strong>
                    {remaining <= 0 ? '❌ Empty!' : '⚠️ Low!'}
                  </strong>
                  <p>
                    Only <strong>{remaining}</strong> certificates
                    left
                  </p>
                </div>
                <button
                  className="wd-alert-btn"
                  onClick={() => {
                    toast.info(
                      <div>
                        <strong>📞</strong> +91 91111 37575
                      </div>,
                      toastConfig
                    );
                  }}
                >
                  📞 Contact
                </button>
              </div>
            )}

            {/* COURSE WISE BALANCE CARDS */}
            <div className="wd-card">
              <h3 className="wd-card-title">
                📚 Course-wise Balance (
                {Object.keys(courseBalance).length})
              </h3>
              {Object.keys(courseBalance).length === 0 ? (
                <div className="wd-empty">
                  <span>📚</span>
                  <p>No courses assigned yet</p>
                  <small>
                    Contact admin to get certificates.
                  </small>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '16px',
                    padding: '16px',
                  }}
                >
                  {Object.entries(courseBalance).map(
                    ([course, bal]) => {
                      const pct =
                        bal.total > 0
                          ? (bal.remaining / bal.total) * 100
                          : 0;
                      let color = '#10b981';
                      if (bal.remaining <= 0) color = '#ef4444';
                      else if (bal.remaining <= 5)
                        color = '#f59e0b';

                      return (
                        <div
                          key={course}
                          style={{
                            background: 'white',
                            border: `2px solid ${color}30`,
                            borderRadius: '12px',
                            padding: '16px',
                            borderLeftWidth: '5px',
                            borderLeftColor: color,
                            boxShadow:
                              '0 2px 8px rgba(0,0,0,0.05)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '15px',
                                fontWeight: '800',
                                color: '#1a2a5e',
                              }}
                            >
                              📚 {course}
                            </div>
                            <div
                              style={{
                                fontSize: '20px',
                                fontWeight: '900',
                                color: color,
                              }}
                            >
                              {bal.remaining}
                            </div>
                          </div>

                          <div
                            style={{
                              background: '#f1f5f9',
                              borderRadius: '10px',
                              height: '8px',
                              overflow: 'hidden',
                              marginBottom: '10px',
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: color,
                                borderRadius: '10px',
                              }}
                            />
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '11px',
                              color: '#64748b',
                            }}
                          >
                            <span>
                              📦 Total:{' '}
                              <strong
                                style={{ color: '#1a2a5e' }}
                              >
                                {bal.total}
                              </strong>
                            </span>
                            <span>
                              ✅ Used:{' '}
                              <strong
                                style={{ color: '#059669' }}
                              >
                                {bal.used}
                              </strong>
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: '8px',
                              fontSize: '11px',
                              color: '#64748b',
                              textAlign: 'center',
                            }}
                          >
                            💰 Paid: ₹
                            {bal.amount.toLocaleString()}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* RECHARGE HISTORY */}
            <div className="wd-card">
              <h3 className="wd-card-title">
                📦 Recharge History ({recharges.length})
              </h3>
              {recharges.length === 0 ? (
                <div className="wd-empty">
                  <span>📦</span>
                  <p>No recharges yet</p>
                  <small>
                    Contact admin to get certificates.
                  </small>
                </div>
              ) : (
                <div className="wd-txn-table-wrap">
                  <table className="wd-txn-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>DATE</th>
                        <th>COURSE</th>
                        <th>CERTS</th>
                        <th>AMOUNT</th>
                        <th>PAYMENT</th>
                        <th>REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recharges.map((txn, i) => (
                        <tr key={txn.id || i}>
                          <td className="wd-txn-num">
                            {i + 1}
                          </td>
                          <td>
                            <div className="wd-txn-date">
                              {txn.created_at
                                ? new Date(
                                    txn.created_at
                                  ).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '700',
                              }}
                            >
                              📚 {txn.course_name || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className="wd-txn-count green">
                              +{txn.certificate_count}
                            </span>
                          </td>
                          <td>
                            <span className="wd-txn-amount">
                              ₹
                              {Number(
                                txn.amount || 0
                              ).toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className="wd-txn-payment">
                              {(
                                txn.payment_method || 'cash'
                              ).toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="wd-txn-details">
                              {txn.remarks || '—'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: DOWNLOADS HISTORY */}
        {/* ============================================ */}
        {activeTab === 'history' && (
          <div className="wd-card">
            <h3 className="wd-card-title">
              📜 Certificate Downloads (
              {uniqueDownloads.length} students)
            </h3>
            {uniqueDownloads.length === 0 ? (
              <div className="wd-empty">
                <span>📜</span>
                <p>No certificates downloaded yet</p>
                <small>
                  Download certificates to see history.
                </small>
              </div>
            ) : (
              <div className="wd-txn-table-wrap">
                <table className="wd-txn-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>DATE</th>
                      <th>STUDENT NAME</th>
                      <th>COURSE</th>
                      <th>CERTIFICATE NO</th>
                      <th>DEDUCTED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueDownloads.map((txn, i) => {
                      const { name, cert } = parseStudent(
                        txn.remarks
                      );
                      return (
                        <tr key={txn.id || i}>
                          <td className="wd-txn-num">
                            {i + 1}
                          </td>
                          <td>
                            <div className="wd-txn-date">
                              {txn.created_at
                                ? new Date(
                                    txn.created_at
                                  ).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </div>
                          </td>
                          <td>
                            <div className="wd-student-name">
                              👤 {name}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '700',
                              }}
                            >
                              📚 {txn.course_name || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {cert ? (
                              <span className="wd-cert-badge">
                                📜 {cert}
                              </span>
                            ) : (
                              <span className="wd-txn-free">
                                —
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="wd-txn-count red">
                              −{txn.certificate_count || 1}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: PACKAGES */}
        {activeTab === 'packages' && (
          <div className="wd-card">
            <h3 className="wd-card-title">
              📚 Available Courses
            </h3>
            {packages.length === 0 ? (
              <div className="wd-empty">
                <span>📚</span>
                <p>No courses available</p>
              </div>
            ) : (
              <div className="wd-packages-grid">
                {packages.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`wd-package-card ${
                      pkg.is_popular ? 'popular' : ''
                    }`}
                  >
                    {pkg.is_popular && (
                      <div className="wd-popular-tag">⭐</div>
                    )}
                    <div className="wd-pkg-name-row">
                      <span className="wd-pkg-icon">📚</span>
                      <h3 className="wd-pkg-name">
                        {pkg.course_name || pkg.name}
                      </h3>
                    </div>
                    <div className="wd-pkg-body">
                      <div className="wd-pkg-count-block">
                        <div className="wd-pkg-count-num">
                          {pkg.certificate_count}
                        </div>
                        <div className="wd-pkg-count-txt">
                          Certs
                        </div>
                      </div>
                      <div className="wd-pkg-price-block">
                        <div className="wd-pkg-price-num">
                          ₹
                          {Number(pkg.price).toLocaleString()}
                        </div>
                        <div className="wd-pkg-per-txt">
                          ₹
                          {Number(
                            pkg.per_certificate_price
                          ).toFixed(0)}
                          /cert
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleContactAdmin(pkg)}
                      className="wd-pkg-btn"
                    >
                      📞 Contact Admin
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDashboard;