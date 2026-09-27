// WalletManagement.jsx - Course Based Packages
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, apiConfig } from '../../Api';
import './WalletManagement.css';

const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
};

const WalletManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [wallets, setWallets] = useState([]);
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [franchiseUsers, setFranchiseUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('wallets');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageLoading, setPackageLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  // ✅ Course Package Form
  const [packageForm, setPackageForm] = useState({
    course_name: '',
    certificate_count: '',
    price: '',
    description: '',
    is_popular: false,
    status: 'active',
  });

  const [assignData, setAssignData] = useState({
    franchise_code: '',
    franchise_name: '',
    package_id: '',
    payment_method: 'cash',
    payment_reference: '',
    certificate_count: 0,
    amount: 0,
    per_cert: 0,
    course_name: '',
  });

  const [franchiseSearch, setFranchiseSearch] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [showFranchiseDropdown, setShowFranchiseDropdown] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/wallet/all-transactions')) {
      setActiveTab('transactions');
      setShowAssignForm(false);
    } else if (path.includes('/wallet/packages-manage')) {
      setActiveTab('packages');
      setShowAssignForm(false);
    } else if (path.includes('/wallet/assign')) {
      setActiveTab('wallets');
      setShowAssignForm(true);
    } else {
      setActiveTab('wallets');
      setShowAssignForm(false);
    }
  }, [location.pathname]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        walletsRes,
        packagesRes,
        transactionsRes,
        franchiseRes,
      ] = await Promise.allSettled([
        axios.get(
          `${API_URL}/wallet/balance/?all=true&_t=${Date.now()}`,
          apiConfig()
        ),
        axios.get(`${API_URL}/wallet/packages/`, apiConfig()),
        axios.get(
          `${API_URL}/wallet/transactions/?_t=${Date.now()}`,
          apiConfig()
        ),
        axios.get(`${API_URL}/franchise-users/`, apiConfig()),
      ]);

      if (walletsRes.status === 'fulfilled') {
        const d = walletsRes.value.data;
        if (Array.isArray(d)) setWallets(d);
        else if (d?.results) setWallets(d.results);
        else if (d?.wallet) setWallets([d.wallet]);
        else if (d?.wallets) setWallets(d.wallets);
        else setWallets([]);
      }
      if (packagesRes.status === 'fulfilled') {
        setPackages(
          Array.isArray(packagesRes.value.data)
            ? packagesRes.value.data
            : packagesRes.value.data?.results || []
        );
      }
      if (transactionsRes.status === 'fulfilled') {
        setTransactions(
          Array.isArray(transactionsRes.value.data)
            ? transactionsRes.value.data
            : transactionsRes.value.data?.results || []
        );
      }
      if (franchiseRes.status === 'fulfilled') {
        setFranchiseUsers(
          Array.isArray(franchiseRes.value.data)
            ? franchiseRes.value.data
            : franchiseRes.value.data?.results || []
        );
      }
    } catch (err) {
      toast.error('⚠️ Error loading data', toastConfig);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const getFranchiseDetails = (code) => {
    return franchiseUsers.find(f => f.franchise_code === code) || {};
  };

  const getRechargeHistory = (code) => {
    return transactions
      .filter(
        t =>
          t.franchise_code === code &&
          (t.transaction_type === 'purchase' ||
            t.transaction_type === 'admin_add')
      )
      .sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
  };

  // ✅ Get course-wise balance for franchise
  const getCourseBalance = (code) => {
    const rechargesForFranchise = transactions.filter(
      t =>
        t.franchise_code === code &&
        (t.transaction_type === 'purchase' ||
          t.transaction_type === 'admin_add')
    );

    const deductionsForFranchise = transactions.filter(
      t =>
        t.franchise_code === code &&
        t.transaction_type === 'deduction'
    );

    const courseBalance = {};

    rechargesForFranchise.forEach(txn => {
      const course = txn.course_name || 'Unknown';
      if (!courseBalance[course]) {
        courseBalance[course] = {
          total: 0,
          used: 0,
          remaining: 0,
          amount: 0,
        };
      }
      courseBalance[course].total += txn.certificate_count || 0;
      courseBalance[course].amount += Number(txn.amount || 0);
    });

    deductionsForFranchise.forEach(txn => {
      const course = txn.course_name || 'Unknown';
      if (courseBalance[course]) {
        courseBalance[course].used += txn.certificate_count || 0;
      }
    });

    Object.keys(courseBalance).forEach(course => {
      courseBalance[course].remaining =
        courseBalance[course].total - courseBalance[course].used;
    });

    return courseBalance;
  };

  const closeAssignModal = () => {
    setShowAssignForm(false);
    setAssignData({
      franchise_code: '',
      franchise_name: '',
      package_id: '',
      payment_method: 'cash',
      payment_reference: '',
      certificate_count: 0,
      amount: 0,
      per_cert: 0,
      course_name: '',
    });
    setSelectedFranchise(null);
    setFranchiseSearch('');
    setShowFranchiseDropdown(false);
    navigate('/admin-dashboard/wallet/management');
  };

  const filteredFranchises = franchiseUsers.filter(f => {
    if (!franchiseSearch.trim()) return true;
    const term = franchiseSearch.toLowerCase();
    return (
      f.franchise_code?.toLowerCase().includes(term) ||
      f.franchise_name?.toLowerCase().includes(term) ||
      f.applicant_name?.toLowerCase().includes(term)
    );
  });

  const handleSelectFranchise = (f) => {
    setSelectedFranchise(f);
    setAssignData(prev => ({
      ...prev,
      franchise_code: f.franchise_code || '',
      franchise_name: f.franchise_name || '',
    }));
    setFranchiseSearch(f.franchise_name || f.franchise_code || '');
    setShowFranchiseDropdown(false);
  };

  const handlePackageSelect = (pkgId) => {
    if (!pkgId) {
      setAssignData(prev => ({
        ...prev,
        package_id: '',
        certificate_count: 0,
        amount: 0,
        per_cert: 0,
        course_name: '',
      }));
      return;
    }
    const pkg = packages.find(p => p.id === parseInt(pkgId));
    if (pkg) {
      setAssignData(prev => ({
        ...prev,
        package_id: pkg.id,
        certificate_count: pkg.certificate_count,
        amount: pkg.price,
        per_cert: pkg.per_certificate_price,
        course_name: pkg.course_name || pkg.name,
      }));
    }
  };

  const handleAssignPackage = async () => {
    if (!assignData.franchise_code.trim()) {
      toast.warning('⚠️ Select a franchise!', toastConfig);
      return;
    }
    if (!assignData.package_id) {
      toast.warning('⚠️ Select a course package!', toastConfig);
      return;
    }

    setAssignLoading(true);
    const loadingId = toast.loading('⏳ Assigning...', {
      position: 'top-right',
    });

    try {
      await axios.post(
        `${API_URL}/wallet/purchase/`,
        {
          franchise_code: assignData.franchise_code,
          franchise_name: assignData.franchise_name,
          package_id: assignData.package_id,
          payment_method: assignData.payment_method,
          payment_reference: assignData.payment_reference,
        },
        apiConfig()
      );

      const pkg = packages.find(
        p => p.id === parseInt(assignData.package_id)
      );
      toast.update(loadingId, {
        render: `🎉 ${pkg?.certificate_count || ''} ${
          pkg?.course_name || pkg?.name
        } certs assigned!`,
        type: 'success',
        isLoading: false,
        autoClose: 4000,
      });

      await loadAllData();
      closeAssignModal();
    } catch (error) {
      toast.update(loadingId, {
        render: `⚠️ ${error.response?.data?.error || 'Error'}`,
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const resetPackageForm = () => {
    setPackageForm({
      course_name: '',
      certificate_count: '',
      price: '',
      description: '',
      is_popular: false,
      status: 'active',
    });
    setEditingPackage(null);
  };

  const openPackageForm = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageForm({
        course_name: pkg.course_name || pkg.name || '',
        certificate_count: pkg.certificate_count || '',
        price: pkg.price || '',
        description: pkg.description || '',
        is_popular: pkg.is_popular || false,
        status: pkg.status || 'active',
      });
    } else {
      resetPackageForm();
    }
    setShowPackageForm(true);
  };

  const handleSavePackage = async () => {
    if (!packageForm.course_name.trim())
      return toast.warning('⚠️ Course name required!', toastConfig);
    if (
      !packageForm.certificate_count ||
      packageForm.certificate_count <= 0
    )
      return toast.warning('⚠️ Count > 0!', toastConfig);
    if (!packageForm.price || packageForm.price <= 0)
      return toast.warning('⚠️ Price > 0!', toastConfig);

    setPackageLoading(true);
    const loadingId = toast.loading(
      editingPackage ? '⏳ Updating...' : '⏳ Creating...',
      { position: 'top-right' }
    );

    try {
      const payload = {
        name: packageForm.course_name.trim(),
        course_name: packageForm.course_name.trim(),
        certificate_count: parseInt(packageForm.certificate_count),
        price: parseFloat(packageForm.price),
        description: packageForm.description.trim(),
        is_popular: packageForm.is_popular,
        status: packageForm.status,
      };

      if (editingPackage) {
        await axios.put(
          `${API_URL}/wallet/packages/${editingPackage.id}/`,
          payload,
          apiConfig()
        );
        toast.update(loadingId, {
          render: '✅ Updated!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        await axios.post(
          `${API_URL}/wallet/packages/`,
          payload,
          apiConfig()
        );
        toast.update(loadingId, {
          render: '✅ Created!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      }

      await loadAllData();
      setShowPackageForm(false);
      resetPackageForm();
    } catch (error) {
      toast.update(loadingId, {
        render: '⚠️ Error',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setPackageLoading(false);
    }
  };

  const handleDeletePackage = async (pkgId) => {
    if (!window.confirm('Delete this course package?')) return;
    const loadingId = toast.loading('⏳ Deleting...', {
      position: 'top-right',
    });
    try {
      await axios.delete(
        `${API_URL}/wallet/packages/${pkgId}/`,
        apiConfig()
      );
      toast.update(loadingId, {
        render: '✅ Deleted!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      await loadAllData();
    } catch (error) {
      toast.update(loadingId, {
        render: '⚠️ Error',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const filteredWallets = wallets.filter(w => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const details = getFranchiseDetails(w.franchise_code);
    return (
      w.franchise_code?.toLowerCase().includes(term) ||
      w.franchise_name?.toLowerCase().includes(term) ||
      details.applicant_name?.toLowerCase().includes(term) ||
      details.username?.toLowerCase().includes(term)
    );
  });

  const groupedTransactions = () => {
    const rechargeTxns = transactions.filter(
      t =>
        t.transaction_type === 'purchase' ||
        t.transaction_type === 'admin_add'
    );

    const grouped = rechargeTxns.reduce((acc, txn) => {
      const code = txn.franchise_code || 'UNKNOWN';
      if (!acc[code]) {
        acc[code] = {
          franchise_code: code,
          transactions: [],
          totalCerts: 0,
          totalAmount: 0,
          rechargeCount: 0,
          last_date: null,
        };
      }
      acc[code].transactions.push(txn);
      acc[code].totalCerts += txn.certificate_count || 0;
      acc[code].totalAmount += Number(txn.amount || 0);
      acc[code].rechargeCount += 1;
      if (
        !acc[code].last_date ||
        new Date(txn.created_at) > new Date(acc[code].last_date)
      ) {
        acc[code].last_date = txn.created_at;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) =>
        new Date(b.last_date || 0) - new Date(a.last_date || 0)
    );
  };

  const filteredGroupedTxns = groupedTransactions().filter(f => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const details = getFranchiseDetails(f.franchise_code);
    return (
      f.franchise_code.toLowerCase().includes(term) ||
      details.franchise_name?.toLowerCase().includes(term) ||
      details.applicant_name?.toLowerCase().includes(term)
    );
  });

  const totalRevenue = wallets.reduce(
    (s, w) => s + Number(w.total_amount_paid || 0),
    0
  );
  const totalCerts = wallets.reduce(
    (s, w) => s + Number(w.total_certificates || 0),
    0
  );
  const emptyWallets = wallets.filter(
    w => w.remaining_certificates <= 0
  ).length;
  const lowWallets = wallets.filter(
    w =>
      w.remaining_certificates > 0 && w.remaining_certificates <= 5
  ).length;
  const rechargeCount = transactions.filter(
    t =>
      t.transaction_type === 'purchase' ||
      t.transaction_type === 'admin_add'
  ).length;

  if (loading) {
    return (
      <div className="wm-loading">
        <div className="wm-spinner" />
        <p>Loading wallet data...</p>
      </div>
    );
  }

  return (
    <div className="wm-container">
      <ToastContainer {...toastConfig} style={{ zIndex: 99999 }} />

      <div className="wm-sticky-header">
        <div className="wm-header">
          <div className="wm-header-left">
            <span className="wm-header-icon">👑</span>
            <div>
              <h1 className="wm-title">
                Wallet <span>Management</span>
              </h1>
              <p className="wm-subtitle">
                Course-wise Franchise Wallet Control
              </p>
            </div>
          </div>
          <button
            className="wm-btn-refresh-sm"
            onClick={() => {
              loadAllData();
              toast.success('🔄 Refreshed!', toastConfig);
            }}
          >
            🔄 Refresh
          </button>
        </div>

        <div className="wm-stats">
          {[
            {
              icon: '🏪',
              label: 'Franchises',
              value: wallets.length,
              cls: 'wm-stat-purple',
            },
            {
              icon: '📦',
              label: 'Sold',
              value: totalCerts,
              cls: 'wm-stat-green',
            },
            {
              icon: '💰',
              label: 'Revenue',
              value: `₹${totalRevenue.toLocaleString()}`,
              cls: 'wm-stat-amber',
            },
            {
              icon: '🧾',
              label: 'Recharges',
              value: rechargeCount,
              cls: 'wm-stat-indigo',
            },
            {
              icon: '❌',
              label: 'Empty',
              value: emptyWallets,
              cls: 'wm-stat-red',
            },
            {
              icon: '⚠️',
              label: 'Low',
              value: lowWallets,
              cls: 'wm-stat-yellow',
            },
          ].map((card, i) => (
            <div key={i} className={`wm-stat-card ${card.cls}`}>
              <span className="wm-stat-icon">{card.icon}</span>
              <div>
                <span className="wm-stat-label">{card.label}</span>
                <span className="wm-stat-value">{card.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="wm-tabs">
          {[
            {
              key: 'wallets',
              label: `💰 Wallets (${wallets.length})`,
              path: '/admin-dashboard/wallet/management',
            },
            {
              key: 'transactions',
              label: `🧾 Recharges (${rechargeCount})`,
              path: '/admin-dashboard/wallet/all-transactions',
            },
            {
              key: 'packages',
              label: `📚 Courses (${packages.length})`,
              path: '/admin-dashboard/wallet/packages-manage',
            },
          ].map(tab => (
            <button
              key={tab.key}
              className={`wm-tab ${
                activeTab === tab.key ? 'active' : ''
              }`}
              onClick={() => {
                setActiveTab(tab.key);
                setExpandedRow(null);
                navigate(tab.path);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* TAB: WALLETS */}
      {/* ============================================ */}
      {activeTab === 'wallets' && (
        <div className="wm-card">
          <div className="wm-card-header">
            <h3 className="wm-card-title">💰 All Franchise Wallets</h3>
            <div className="wm-header-right-inline">
              <input
                type="text"
                className="wm-search"
                placeholder="🔍 Search franchise..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button
                className="wm-btn-primary"
                onClick={() =>
                  navigate('/admin-dashboard/wallet/assign')
                }
              >
                ➕ Assign Course
              </button>
            </div>
          </div>

          {filteredWallets.length === 0 ? (
            <div className="wm-empty">
              <span>💰</span>
              <p>No Wallets Found</p>
              <small>Assign a course package to create wallet.</small>
            </div>
          ) : (
            <div className="wm-table-scroll">
              <table className="wm-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}></th>
                    <th>#</th>
                    <th>USERNAME</th>
                    <th>FRANCHISE CODE</th>
                    <th>FRANCHISE NAME</th>
                    <th>APPLICANT</th>
                    <th>TOTAL CERTS</th>
                    <th>USED</th>
                    <th>REMAINING</th>
                    <th>PAID</th>
                    <th>COURSES</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWallets.map((w, i) => {
                    const details = getFranchiseDetails(
                      w.franchise_code
                    );
                    const rechargeHistory = getRechargeHistory(
                      w.franchise_code
                    );
                    const courseBalance = getCourseBalance(
                      w.franchise_code
                    );
                    const courseCount = Object.keys(courseBalance)
                      .length;
                    const rem = w.remaining_certificates || 0;
                    const tot = w.total_certificates || 0;
                    const pct =
                      tot > 0 ? Math.round((rem / tot) * 100) : 0;
                    const isExpanded =
                      expandedRow === w.franchise_code;

                    let statusCls = 'wm-badge-active';
                    let statusTxt = '✅ Active';
                    if (rem <= 0) {
                      statusCls = 'wm-badge-empty';
                      statusTxt = '❌ Empty';
                    } else if (rem <= 5) {
                      statusCls = 'wm-badge-low';
                      statusTxt = '⚠️ Low';
                    }

                    return (
                      <React.Fragment key={w.id || i}>
                        <tr
                          className={`wm-clickable-row ${
                            isExpanded ? 'expanded' : ''
                          }`}
                          onClick={() =>
                            setExpandedRow(
                              isExpanded ? null : w.franchise_code
                            )
                          }
                        >
                          <td>
                            <span className="wm-expand-icon">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          </td>
                          <td>{i + 1}</td>
                          <td>
                            <code className="wm-username">
                              {details.username || '-'}
                            </code>
                          </td>
                          <td>
                            <span className="wm-code-badge">
                              {w.franchise_code}
                            </span>
                          </td>
                          <td className="wm-text-bold">
                            {w.franchise_name ||
                              details.franchise_name ||
                              '-'}
                          </td>
                          <td>{details.applicant_name || '-'}</td>
                          <td className="wm-text-bold">{tot}</td>
                          <td>{w.used_certificates || 0}</td>
                          <td>
                            <div className="wm-remaining-cell">
                              <span
                                className={`wm-remaining-num ${
                                  rem <= 0
                                    ? 'red'
                                    : rem <= 5
                                    ? 'amber'
                                    : 'green'
                                }`}
                              >
                                {rem}
                              </span>
                              <div className="wm-mini-bar">
                                <div
                                  className={`wm-mini-fill ${
                                    rem <= 0
                                      ? 'red'
                                      : rem <= 5
                                      ? 'amber'
                                      : 'green'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="wm-text-bold wm-text-green">
                            ₹
                            {Number(
                              w.total_amount_paid || 0
                            ).toLocaleString()}
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
                              📚 {courseCount}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`wm-status-badge ${statusCls}`}
                            >
                              {statusTxt}
                            </span>
                          </td>
                          <td>
                            <button
                              className="wm-btn-recharge"
                              onClick={e => {
                                e.stopPropagation();
                                setAssignData(prev => ({
                                  ...prev,
                                  franchise_code:
                                    w.franchise_code,
                                  franchise_name:
                                    w.franchise_name ||
                                    details.franchise_name ||
                                    '',
                                }));
                                if (details.id)
                                  setSelectedFranchise(details);
                                setFranchiseSearch(
                                  w.franchise_name ||
                                    w.franchise_code
                                );
                                navigate(
                                  '/admin-dashboard/wallet/assign'
                                );
                              }}
                            >
                              ➕ Recharge
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="wm-expanded-row">
                            <td colSpan="13">
                              <div className="wm-sub-content">
                                {/* Course wise balance */}
                                <div className="wm-sub-header">
                                  <h4>
                                    📚 Course-wise Balance (
                                    {courseCount})
                                  </h4>
                                </div>

                                {courseCount === 0 ? (
                                  <div className="wm-sub-empty">
                                    No courses assigned yet
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns:
                                        'repeat(auto-fill, minmax(200px, 1fr))',
                                      gap: '12px',
                                      marginBottom: '20px',
                                    }}
                                  >
                                    {Object.entries(
                                      courseBalance
                                    ).map(([course, bal]) => (
                                      <div
                                        key={course}
                                        style={{
                                          background: 'white',
                                          border:
                                            '2px solid #e2e8f0',
                                          borderRadius: '10px',
                                          padding: '12px',
                                          borderLeftColor:
                                            bal.remaining <= 0
                                              ? '#ef4444'
                                              : bal.remaining <= 5
                                              ? '#f59e0b'
                                              : '#10b981',
                                          borderLeftWidth: '4px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: '13px',
                                            fontWeight: '800',
                                            color: '#1a2a5e',
                                            marginBottom: '8px',
                                          }}
                                        >
                                          📚 {course}
                                        </div>
                                        <div
                                          style={{
                                            display: 'flex',
                                            justifyContent:
                                              'space-between',
                                            fontSize: '11px',
                                            color: '#64748b',
                                          }}
                                        >
                                          <span>
                                            Total:{' '}
                                            <strong
                                              style={{
                                                color: '#1a2a5e',
                                              }}
                                            >
                                              {bal.total}
                                            </strong>
                                          </span>
                                          <span>
                                            Used:{' '}
                                            <strong
                                              style={{
                                                color: '#059669',
                                              }}
                                            >
                                              {bal.used}
                                            </strong>
                                          </span>
                                          <span>
                                            Left:{' '}
                                            <strong
                                              style={{
                                                color:
                                                  bal.remaining <=
                                                  0
                                                    ? '#dc2626'
                                                    : '#059669',
                                              }}
                                            >
                                              {bal.remaining}
                                            </strong>
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Recharge history */}
                                <div className="wm-sub-header">
                                  <h4>
                                    📊 Recharge History (
                                    {rechargeHistory.length})
                                  </h4>
                                </div>

                                {rechargeHistory.length === 0 ? (
                                  <div className="wm-sub-empty">
                                    No recharges yet
                                  </div>
                                ) : (
                                  <div className="wm-sub-table-wrap">
                                    <table className="wm-sub-table">
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
                                        {rechargeHistory.map(
                                          (txn, idx) => (
                                            <tr
                                              key={txn.id || idx}
                                            >
                                              <td>{idx + 1}</td>
                                              <td className="wm-text-bold">
                                                {txn.created_at
                                                  ? new Date(
                                                      txn.created_at
                                                    ).toLocaleDateString(
                                                      'en-IN',
                                                      {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                      }
                                                    )
                                                  : '—'}
                                              </td>
                                              <td>
                                                <span
                                                  style={{
                                                    background:
                                                      '#dbeafe',
                                                    color: '#1d4ed8',
                                                    padding:
                                                      '3px 8px',
                                                    borderRadius:
                                                      '12px',
                                                    fontSize:
                                                      '11px',
                                                    fontWeight:
                                                      '700',
                                                  }}
                                                >
                                                  📚{' '}
                                                  {txn.course_name ||
                                                    'N/A'}
                                                </span>
                                              </td>
                                              <td className="wm-text-bold wm-text-green">
                                                +
                                                {
                                                  txn.certificate_count
                                                }
                                              </td>
                                              <td className="wm-text-bold">
                                                ₹
                                                {Number(
                                                  txn.amount || 0
                                                ).toLocaleString()}
                                              </td>
                                              <td>
                                                <span className="wm-payment-badge">
                                                  {(
                                                    txn.payment_method ||
                                                    'cash'
                                                  ).toUpperCase()}
                                                </span>
                                              </td>
                                              <td className="wm-text-muted">
                                                {txn.remarks ||
                                                  '—'}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: TRANSACTIONS */}
      {/* ============================================ */}
      {activeTab === 'transactions' && (
        <div className="wm-card">
          <div className="wm-card-header">
            <h3 className="wm-card-title">
              🧾 Franchise Recharge History
            </h3>
            <div className="wm-header-right-inline">
              <input
                type="text"
                className="wm-search"
                placeholder="🔍 Search franchise..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredGroupedTxns.length === 0 ? (
            <div className="wm-empty">
              <span>🧾</span>
              <p>No recharges yet</p>
              <small>Assign courses to see history.</small>
            </div>
          ) : (
            <div className="wm-table-scroll">
              <table className="wm-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}></th>
                    <th>#</th>
                    <th>USERNAME</th>
                    <th>FRANCHISE CODE</th>
                    <th>FRANCHISE NAME</th>
                    <th>RECHARGES</th>
                    <th>TOTAL CERTS</th>
                    <th>TOTAL PAID</th>
                    <th>LAST RECHARGE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroupedTxns.map((franchise, i) => {
                    const details = getFranchiseDetails(
                      franchise.franchise_code
                    );
                    const isExpanded =
                      expandedRow === franchise.franchise_code;

                    return (
                      <React.Fragment
                        key={franchise.franchise_code}
                      >
                        <tr
                          className={`wm-clickable-row ${
                            isExpanded ? 'expanded' : ''
                          }`}
                          onClick={() =>
                            setExpandedRow(
                              isExpanded
                                ? null
                                : franchise.franchise_code
                            )
                          }
                        >
                          <td>
                            <span className="wm-expand-icon">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          </td>
                          <td>{i + 1}</td>
                          <td>
                            <code className="wm-username">
                              {details.username || '-'}
                            </code>
                          </td>
                          <td>
                            <span className="wm-code-badge">
                              {franchise.franchise_code}
                            </span>
                          </td>
                          <td className="wm-text-bold">
                            {details.franchise_name || '-'}
                          </td>
                          <td>
                            <span className="wm-recharge-badge">
                              {franchise.rechargeCount}x
                            </span>
                          </td>
                          <td className="wm-text-bold wm-text-green">
                            +{franchise.totalCerts}
                          </td>
                          <td className="wm-text-bold">
                            ₹
                            {franchise.totalAmount.toLocaleString()}
                          </td>
                          <td>
                            {franchise.last_date
                              ? new Date(
                                  franchise.last_date
                                ).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="wm-expanded-row">
                            <td colSpan="9">
                              <div className="wm-sub-content">
                                <div className="wm-sub-header">
                                  <h4>
                                    📊 All Recharges (
                                    {
                                      franchise.transactions
                                        .length
                                    }
                                    )
                                  </h4>
                                </div>

                                <div className="wm-sub-table-wrap">
                                  <table className="wm-sub-table">
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
                                      {franchise.transactions.map(
                                        (txn, idx) => (
                                          <tr key={txn.id || idx}>
                                            <td>{idx + 1}</td>
                                            <td className="wm-text-bold">
                                              {txn.created_at
                                                ? new Date(
                                                    txn.created_at
                                                  ).toLocaleDateString(
                                                    'en-IN',
                                                    {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                    }
                                                  )
                                                : '—'}
                                            </td>
                                            <td>
                                              <span
                                                style={{
                                                  background:
                                                    '#dbeafe',
                                                  color:
                                                    '#1d4ed8',
                                                  padding:
                                                    '3px 8px',
                                                  borderRadius:
                                                    '12px',
                                                  fontSize:
                                                    '11px',
                                                  fontWeight:
                                                    '700',
                                                }}
                                              >
                                                📚{' '}
                                                {txn.course_name ||
                                                  'N/A'}
                                              </span>
                                            </td>
                                            <td className="wm-text-bold wm-text-green">
                                              +
                                              {
                                                txn.certificate_count
                                              }
                                            </td>
                                            <td className="wm-text-bold">
                                              ₹
                                              {Number(
                                                txn.amount || 0
                                              ).toLocaleString()}
                                            </td>
                                            <td>
                                              <span className="wm-payment-badge">
                                                {(
                                                  txn.payment_method ||
                                                  'cash'
                                                ).toUpperCase()}
                                              </span>
                                            </td>
                                            <td className="wm-text-muted">
                                              {txn.remarks || '—'}
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: COURSES (Packages) */}
      {/* ============================================ */}
      {activeTab === 'packages' && (
        <div className="wm-card">
          <div className="wm-card-header">
            <h3 className="wm-card-title">
              📚 Course Packages ({packages.length})
            </h3>
            <button
              className="wm-btn-primary"
              onClick={() => openPackageForm()}
            >
              ➕ Add Course
            </button>
          </div>

          {packages.length === 0 ? (
            <div className="wm-empty">
              <span>📚</span>
              <p>No courses yet</p>
              <small>
                Add courses like Tally, Python, Web Dev with prices
              </small>
              <button
                className="wm-btn-primary wm-mt-16"
                onClick={() => openPackageForm()}
              >
                ➕ Add Course
              </button>
            </div>
          ) : (
            <div className="wm-packages-grid">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`wm-package-card ${
                    pkg.is_popular ? 'popular' : ''
                  }`}
                >
                  {pkg.is_popular && (
                    <div className="wm-popular-tag">⭐</div>
                  )}

                  <div className="wm-pkg-top">
                    <span className="wm-pkg-icon">📚</span>
                    <div className="wm-pkg-name-block">
                      <div className="wm-pkg-name">
                        {pkg.course_name || pkg.name}
                      </div>
                      <div
                        className={`wm-pkg-status ${
                          pkg.status === 'active'
                            ? 'active'
                            : 'inactive'
                        }`}
                      >
                        {pkg.status === 'active' ? '✅' : '❌'}{' '}
                        {pkg.status}
                      </div>
                    </div>
                  </div>

                  <div className="wm-pkg-body">
                    <div className="wm-pkg-body-item">
                      <div className="wm-pkg-num">
                        {pkg.certificate_count}
                      </div>
                      <div className="wm-pkg-txt">Certs</div>
                    </div>
                    <div className="wm-pkg-divider"></div>
                    <div className="wm-pkg-body-item wm-pkg-right">
                      <div className="wm-pkg-num-price">
                        ₹{Number(pkg.price).toLocaleString()}
                      </div>
                      <div className="wm-pkg-txt">
                        ₹
                        {Number(
                          pkg.per_certificate_price
                        ).toFixed(0)}
                        /cert
                      </div>
                    </div>
                  </div>

                  <div className="wm-pkg-actions">
                    <button
                      className="wm-btn-edit"
                      style={{ flex: 1 }}
                      onClick={() => openPackageForm(pkg)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="wm-btn-delete"
                      onClick={() =>
                        handleDeletePackage(pkg.id)
                      }
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssignForm && (
        <div className="wm-modal-overlay" onClick={closeAssignModal}>
          <div
            className="wm-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="wm-modal-header">
              <h2>➕ Assign Course Package</h2>
              <button
                className="wm-modal-close"
                onClick={closeAssignModal}
              >
                ✕
              </button>
            </div>
            <div className="wm-modal-body">
              <div className="wm-form-group">
                <label>🏪 Select Franchise *</label>
                <div className="wm-dropdown-wrapper">
                  <input
                    type="text"
                    className="wm-input"
                    placeholder="Search franchise..."
                    value={franchiseSearch}
                    onChange={e => {
                      setFranchiseSearch(e.target.value);
                      setShowFranchiseDropdown(true);
                      if (!e.target.value) {
                        setSelectedFranchise(null);
                        setAssignData(prev => ({
                          ...prev,
                          franchise_code: '',
                          franchise_name: '',
                        }));
                      }
                    }}
                    onFocus={() =>
                      setShowFranchiseDropdown(true)
                    }
                    style={{
                      borderColor: selectedFranchise
                        ? '#10b981'
                        : '',
                    }}
                  />
                  {showFranchiseDropdown && (
                    <div className="wm-dropdown-list">
                      {filteredFranchises.length === 0 ? (
                        <div className="wm-dropdown-empty">
                          No franchises
                        </div>
                      ) : (
                        filteredFranchises.map(f => (
                          <div
                            key={f.id}
                            className={`wm-dropdown-item ${
                              selectedFranchise?.id === f.id
                                ? 'selected'
                                : ''
                            }`}
                            onClick={() =>
                              handleSelectFranchise(f)
                            }
                          >
                            <div className="wm-dropdown-item-top">
                              <strong>{f.franchise_name}</strong>
                              <span className="wm-code-badge">
                                {f.franchise_code}
                              </span>
                            </div>
                            <div className="wm-dropdown-item-sub">
                              👤 {f.applicant_name} • 📱{' '}
                              {f.mobile}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedFranchise && (
                  <div className="wm-selected-badge">
                    <span>
                      ✅{' '}
                      <strong>
                        {selectedFranchise.franchise_name}
                      </strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFranchise(null);
                        setFranchiseSearch('');
                        setAssignData(prev => ({
                          ...prev,
                          franchise_code: '',
                          franchise_name: '',
                        }));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="wm-form-group">
                <label>📚 Select Course Package *</label>
                <div className="wm-quick-grid">
                  {packages.map(pkg => (
                    <div
                      key={pkg.id}
                      className={`wm-quick-card ${
                        assignData.package_id === pkg.id
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        handlePackageSelect(String(pkg.id))
                      }
                    >
                      <div className="wm-quick-count">
                        {pkg.certificate_count}
                      </div>
                      <div className="wm-quick-price">
                        ₹{Number(pkg.price).toLocaleString()}
                      </div>
                      <div className="wm-quick-name">
                        📚 {pkg.course_name || pkg.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="wm-form-group">
                <label>💳 Payment Method</label>
                <div className="wm-payment-grid">
                  {[
                    { value: 'cash', label: '💵 Cash' },
                    { value: 'upi', label: '📱 UPI' },
                    { value: 'bank_transfer', label: '🏦 Bank' },
                    { value: 'online', label: '🌐 Online' },
                  ].map(m => (
                    <div
                      key={m.value}
                      className={`wm-payment-btn ${
                        assignData.payment_method === m.value
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        setAssignData(prev => ({
                          ...prev,
                          payment_method: m.value,
                        }))
                      }
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="wm-form-group">
                <label>📝 Reference</label>
                <input
                  className="wm-input"
                  type="text"
                  placeholder="Transaction ID / Receipt"
                  value={assignData.payment_reference}
                  onChange={e =>
                    setAssignData(prev => ({
                      ...prev,
                      payment_reference: e.target.value,
                    }))
                  }
                />
              </div>

              {assignData.package_id &&
                assignData.franchise_code && (
                  <div className="wm-summary">
                    <div className="wm-summary-title">
                      📋 Summary
                    </div>
                    <div className="wm-summary-grid">
                      {[
                        {
                          l: '🏷️ Code',
                          v: assignData.franchise_code,
                        },
                        {
                          l: '📚 Course',
                          v: assignData.course_name,
                        },
                        {
                          l: '📦 Certs',
                          v: assignData.certificate_count,
                        },
                        {
                          l: '💰 Amount',
                          v: `₹${Number(
                            assignData.amount
                          ).toLocaleString()}`,
                        },
                        {
                          l: '💳 Payment',
                          v: assignData.payment_method.toUpperCase(),
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="wm-summary-item"
                        >
                          <span className="wm-summary-label">
                            {item.l}
                          </span>
                          <span className="wm-summary-value">
                            {item.v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <div className="wm-modal-footer">
              <button
                className="wm-btn-cancel"
                onClick={closeAssignModal}
              >
                ✕ Cancel
              </button>
              <button
                className="wm-btn-submit"
                onClick={handleAssignPackage}
                disabled={
                  assignLoading ||
                  !assignData.franchise_code ||
                  !assignData.package_id
                }
              >
                {assignLoading ? '⏳ Assigning...' : '✅ Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PACKAGE (COURSE) MODAL */}
      {showPackageForm && (
        <div
          className="wm-modal-overlay"
          onClick={() => {
            setShowPackageForm(false);
            resetPackageForm();
          }}
        >
          <div
            className="wm-modal wm-modal-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="wm-modal-header">
              <h2>
                {editingPackage
                  ? '✏️ Edit Course'
                  : '➕ Add Course Package'}
              </h2>
              <button
                className="wm-modal-close"
                onClick={() => {
                  setShowPackageForm(false);
                  resetPackageForm();
                }}
              >
                ✕
              </button>
            </div>
            <div className="wm-modal-body">
              <div className="wm-form-group">
                <label>📚 Course Name *</label>
                <input
                  className="wm-input"
                  placeholder="e.g. Tally, Python, Web Development"
                  value={packageForm.course_name}
                  onChange={e =>
                    setPackageForm(prev => ({
                      ...prev,
                      course_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="wm-form-row">
                <div className="wm-form-group">
                  <label>📊 Certificate Count *</label>
                  <input
                    className="wm-input"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={packageForm.certificate_count}
                    onChange={e =>
                      setPackageForm(prev => ({
                        ...prev,
                        certificate_count: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="wm-form-group">
                  <label>💰 Total Price ₹ *</label>
                  <input
                    className="wm-input"
                    type="number"
                    min="1"
                    placeholder="40000"
                    value={packageForm.price}
                    onChange={e =>
                      setPackageForm(prev => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              {packageForm.certificate_count > 0 &&
                packageForm.price > 0 && (
                  <div className="wm-auto-calc">
                    📊 Per Certificate: ₹
                    {(
                      packageForm.price /
                      packageForm.certificate_count
                    ).toFixed(0)}
                  </div>
                )}
              <div className="wm-form-group">
                <label>📌 Status</label>
                <select
                  className="wm-select"
                  value={packageForm.status}
                  onChange={e =>
                    setPackageForm(prev => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">❌ Inactive</option>
                </select>
              </div>
              <div className="wm-form-group">
                <label>📝 Description</label>
                <textarea
                  className="wm-textarea"
                  rows="2"
                  placeholder="Course details..."
                  value={packageForm.description}
                  onChange={e =>
                    setPackageForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="wm-form-group">
                <label className="wm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={packageForm.is_popular}
                    onChange={e =>
                      setPackageForm(prev => ({
                        ...prev,
                        is_popular: e.target.checked,
                      }))
                    }
                  />
                  <span>⭐ Mark as Popular</span>
                </label>
              </div>
            </div>
            <div className="wm-modal-footer">
              <button
                className="wm-btn-cancel"
                onClick={() => {
                  setShowPackageForm(false);
                  resetPackageForm();
                }}
              >
                ✕ Cancel
              </button>
              <button
                className="wm-btn-submit"
                onClick={handleSavePackage}
                disabled={packageLoading}
              >
                {packageLoading
                  ? '⏳ Saving...'
                  : editingPackage
                  ? '💾 Update'
                  : '➕ Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManagement;