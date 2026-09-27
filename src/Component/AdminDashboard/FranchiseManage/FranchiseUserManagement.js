// FranchiseUserManagement.js - Final Production Ready (Expiry/Validity Date Fixed)
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL, apiConfig } from '../../../Api';
import './FranchiseUserManagement.css';

// ============================================
// 🔐 COMPLETE PERMISSION LIST - ALL SECTIONS
// ============================================
const ALL_PERMISSIONS = [
  { key: 'dashboard', label: '🏠 Dashboard', category: 'Main', default: true },
  { key: 'students', label: '👨‍🎓 Students', category: 'Students' },
  { key: 'student_admission', label: '📝 Student Admission', category: 'Students' },
  { key: 'student_report', label: '📊 Student Report', category: 'Students' },
  { key: 'payments', label: '💳 Payments', category: 'Payments' },
  { key: 'payment_entry', label: '💰 Payment Entry', category: 'Payments' },
  { key: 'payment_report', label: '📊 Payment Report', category: 'Payments' },
  { key: 'student_vocational_payment', label: '💳 Student & Vocational Payment', category: 'Payments' },
  { key: 'certificates', label: '📜 Certificates', category: 'Certificates' },
  { key: 'certificate_generate', label: '🖨️ Generate Certificate', category: 'Certificates' },
  { key: 'certificate_report', label: '📊 Certificate Report', category: 'Certificates' },
  { key: 'vocational', label: '🔧 Vocational', category: 'Vocational' },
  { key: 'vocational_registration', label: '📝 Vocational Registration', category: 'Vocational' },
  { key: 'vocational_report', label: '📊 Vocational Report', category: 'Vocational' },
  { key: 'jobs', label: '💼 Jobs', category: 'Jobs' },
  { key: 'job_post', label: '📝 Post Job', category: 'Jobs' },
  { key: 'job_report', label: '📊 Job Report', category: 'Jobs' },
  { key: 'job_applications', label: '📋 Job Applications', category: 'Jobs' },
  { key: 'franchise_manage', label: '🏢 Franchise', category: 'Franchise' },
  { key: 'franchise_generate', label: '📄 Generate Franchise', category: 'Franchise' },
  { key: 'franchise_report', label: '📊 Franchise Report', category: 'Franchise' },
  { key: 'users', label: '👥 Users', category: 'Users' },
  { key: 'user_create', label: '👤 Create User', category: 'Users' },
  { key: 'user_permissions', label: '🔐 User Permissions', category: 'Users' },
  { key: 'courses', label: '📚 Courses', category: 'Courses' },
  { key: 'course_add', label: '📝 Add Course', category: 'Courses' },
  { key: 'course_report', label: '📊 Course Report', category: 'Courses' },
  { key: 'reports', label: '📊 Reports', category: 'Reports' },
  { key: 'analytics', label: '📈 Analytics', category: 'Reports' },
  { key: 'settings', label: '⚙️ Settings', category: 'Settings' },
  { key: 'profile', label: '👤 Profile', category: 'Settings' },
  { key: 'change_password', label: '🔑 Change Password', category: 'Settings' },
];
const TOAST_DURATION = 3000;

const getPermissionCount = (permissions) => {
  if (!permissions) return 0;
  if (Array.isArray(permissions)) {
    return permissions.filter((p) => p.granted === true).length;
  }
  return Object.values(permissions || {}).filter(Boolean).length;
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB');
  } catch {
    return null;
  }
};

const FranchiseUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [generatedFranchises, setGeneratedFranchises] = useState([]);
  const [filteredFranchises, setFilteredFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [isFranchiseUser, setIsFranchiseUser] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');

  const toastTimerRef = useRef(null);

  const [modals, setModals] = useState({
    create: false,
    edit: false,
    delete: false,
    permissions: false,
    success: false,
  });

  const [, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [selectedFranchise, setSelectedFranchise] = useState(null);

  const [formData, setFormData] = useState({
    franchise_id: '',
    expiry_date: '',
    permissions: { dashboard: true },
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
      toastTimerRef.current = null;
    }, TOAST_DURATION);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userType = localStorage.getItem('userType');

      if (!token) {
        showToast('Please login first!', 'error');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
        return;
      }

      if (userType === 'franchise') {
        setIsFranchiseUser(true);
        setLoading(false);
        return;
      }
      setIsFranchiseUser(false);

      const [usersRes, franchisesRes] = await Promise.all([
        axios.get(`${API_URL}/franchise-users/`, apiConfig()),
        axios.get(`${API_URL}/generated-franchises/`, apiConfig()),
      ]);

      const transformedUsers = usersRes.data.map((user) => {
        let permissions = user.permissions || {};
        if (Array.isArray(permissions)) {
          const obj = {};
          permissions.forEach((p) => { obj[p.permission_key] = p.granted; });
          permissions = obj;
        }
        return {
          id: user.id,
          username: user.username || user.user?.username || 'N/A',
          franchise_code: user.franchise_code || 'N/A',
          franchise_name: user.franchise_name || 'N/A',
          franchise_id: user.franchise_id || null,
          applicant_name: user.applicant_name || 'N/A',
          email: user.email || 'N/A',
          mobile: user.mobile || 'N/A',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          pincode: user.pincode || '',
          // ✅ FIX: Read validity_date OR expiry_date from API
          expiry_date: user.validity_date || user.expiry_date || '',
          permissions: permissions,
          is_active: user.is_active !== undefined ? user.is_active : true,
          created_at: user.created_at || new Date().toISOString(),
        };
      });
      setUsers(transformedUsers);

      let franchiseData = Array.isArray(franchisesRes.data) ? franchisesRes.data : franchisesRes.data?.data || [];
      const existingUserIds = transformedUsers.map((u) => u.franchise_id).filter(Boolean);

      const availableFranchises = franchiseData
        .filter((item) => !existingUserIds.includes(item.id))
        .map((item) => ({
          id: item.id,
          franchiseName: item.franchise_name || item.franchiseName || '',
          franchiseCode: item.franchise_code || item.franchiseCode || '',
          applicantName: item.applicant_name || item.applicantName || '',
          email: item.email || '',
          mobile: item.mobile || '',
          address: item.address || '',
          city: item.city || '',
          state: item.state || '',
          pincode: item.pincode || '',
          // ✅ FIX: Read validity_date or agreement validity
          validityDate: item.validity_date || item.validityDate || item.validity_date || '',
        }));

      setGeneratedFranchises(availableFranchises);
      setFilteredFranchises(availableFranchises);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [loadData]);

  useEffect(() => {
    if (!dropdownSearch.trim()) {
      setFilteredFranchises(generatedFranchises);
      return;
    }
    const term = dropdownSearch.toLowerCase().trim();
    const filtered = generatedFranchises.filter(
      (item) =>
        item.franchiseName?.toLowerCase().includes(term) ||
        item.applicantName?.toLowerCase().includes(term) ||
        item.franchiseCode?.toLowerCase().includes(term)
    );
    setFilteredFranchises(filtered);
  }, [dropdownSearch, generatedFranchises]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (user) =>
          user.username?.toLowerCase().includes(term) ||
          user.franchise_code?.toLowerCase().includes(term) ||
          user.franchise_name?.toLowerCase().includes(term) ||
          user.applicant_name?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [users, searchTerm]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

  const handleSelectFranchise = useCallback((franchise) => {
    if (!franchise) {
      setSelectedFranchise(null);
      setFormData((prev) => ({ franchise_id: '', expiry_date: '', permissions: prev.permissions }));
      return;
    }
    setSelectedFranchise(franchise);
    setDropdownSearch('');
    // ✅ Auto-fill expiry date from franchise validity_date
    setFormData((prev) => ({
      franchise_id: franchise.id,
      expiry_date: franchise.validityDate || '',
      permissions: prev.permissions || { dashboard: true },
    }));
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.franchise_id) return showToast('Please select a franchise', 'error');
    if (!formData.expiry_date) return showToast('Expiry/Validity date is required', 'error');

    setSubmitting(true);
    try {
      const payload = {
        franchise_id: parseInt(formData.franchise_id, 10),
        expiry_date: formData.expiry_date,
        validity_date: formData.expiry_date, // Send both keys for backend compatibility
        permissions: formData.permissions,
      };
      const response = await axios.post(`${API_URL}/franchise-users/`, payload, apiConfig());
      const data = response.data?.data || response.data;

      setSuccessData({
        username: data.username || 'N/A',
        password: data.password || 'N/A',
        franchise_code: data.franchise_code || 'N/A',
        franchise_name: data.franchise_name || 'N/A',
        expiry_date: data.validity_date || data.expiry_date || formData.expiry_date,
        permissionCount: getPermissionCount(formData.permissions),
      });

      setModals((prev) => ({ ...prev, create: false, success: true }));
      showToast('User created successfully!', 'success');
      await loadData();
      resetForm();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = useCallback(async (updatedUserData) => {
    setSubmitting(true);
    try {
      let permissionsObject = updatedUserData.permissions || {};
      if (Array.isArray(permissionsObject)) {
        const obj = {};
        permissionsObject.forEach((p) => { obj[p.permission_key] = p.granted; });
        permissionsObject = obj;
      }

      const payload = {
        username: updatedUserData.username,
        is_active: updatedUserData.is_active,
        expiry_date: updatedUserData.expiry_date,
        validity_date: updatedUserData.expiry_date, // Send both keys for backend
        permissions: permissionsObject,
      };

      if (updatedUserData.password?.trim()) {
        payload.password = updatedUserData.password.trim();
      }

      await axios.patch(`${API_URL}/franchise-users/${updatedUserData.id}/`, payload, apiConfig());
      showToast('User updated successfully!', 'success');
      await loadData();
      return true;
    } catch (error) {
      showToast('Failed to update user', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [loadData, showToast]);

  const handleDeleteUser = useCallback(async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      await axios.delete(`${API_URL}/franchise-users/${deletingUser.id}/`, apiConfig());
      setModals((prev) => ({ ...prev, delete: false }));
      showToast('User deleted successfully!', 'success');
      await loadData();
      setDeletingUser(null);
    } catch (error) {
      showToast('Failed to delete user', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [deletingUser, loadData, showToast]);

  const resetForm = useCallback(() => {
    setFormData({ franchise_id: '', expiry_date: '', permissions: { dashboard: true } });
    setSelectedFranchise(null);
    setDropdownSearch('');
  }, []);

  const getCategories = useCallback(() => {
    const categories = ['All'];
    ALL_PERMISSIONS.forEach((p) => {
      if (!categories.includes(p.category)) categories.push(p.category);
    });
    return categories;
  }, []);

  const getPermissionsByCategory = useCallback((category) => {
    if (category === 'All') return ALL_PERMISSIONS;
    return ALL_PERMISSIONS.filter((p) => p.category === category);
  }, []);

  const isSearching = searchTerm.trim().length > 0;

  if (loading) return <SkeletonLoader />;

  return (
    <div className={`fum-container ${isSearching ? 'fum-searching' : ''}`}>
      {toast.show && <div className={`fum-toast fum-toast-${toast.type}`}>{toast.message}</div>}

      <div className="fum-header fum-hide-on-search-mobile">
        <div>
          <h1 className="fum-title">👥 Franchise User Management</h1>
          <p className="fum-subtitle">Create and manage franchise users with dynamic permissions & expiry dates</p>
        </div>
        {!isFranchiseUser && (
          <button className="fum-btn-primary" onClick={() => setModals((prev) => ({ ...prev, create: true }))}>
            📝 Create User
          </button>
        )}
      </div>

      <div className="fum-search-wrapper">
        <input
          type="text"
          className="fum-search"
          placeholder="🔍 Search by username, code, name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="fum-table-wrapper">
        <div className="fum-table-scroll">
          <table className="fum-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Franchise Code</th>
                <th>Franchise Name</th>
                <th>Applicant</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Expiry Date</th>
                <th>Permissions</th>
                {!isFranchiseUser && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, index) => {
                  const formattedExpiry = formatDate(user.expiry_date);
                  const isExpired = user.expiry_date && new Date(user.expiry_date) < new Date();
                  
                  return (
                    <tr key={user.id}>
                      <td>{startIndex + index + 1}</td>
                      <td><span className="fum-code">{user.username}</span></td>
                      <td><span className="fum-code fum-code-highlight">{user.franchise_code}</span></td>
                      <td className="fum-text-name">{user.franchise_name}</td>
                      <td className="fum-text-name">{user.applicant_name}</td>
                      <td className="fum-text-mobile">{user.mobile}</td>
                      <td>
                        <span className={`fum-status ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      {/* ✅ EXPIRY DATE CELL WITH FALLBACK */}
                      <td>
                        {formattedExpiry ? (
                          <span style={{ color: isExpired ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                            {formattedExpiry}
                            {isExpired && ' ⚠️ (Expired)'}
                          </span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontSize: '11px' }}>Not Set (Edit)</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="fum-btn-permission"
                          onClick={() => {
                            setSelectedUser({ ...user });
                            setModals((prev) => ({ ...prev, permissions: true }));
                          }}
                        >
                          🔐 {getPermissionCount(user.permissions)}
                        </button>
                      </td>
                      {!isFranchiseUser && (
                        <td>
                          <div className="fum-actions">
                            <button
                              className="fum-btn-edit"
                              onClick={() => {
                                setEditingUser({ ...user });
                                setModals((prev) => ({ ...prev, edit: true }));
                              }}
                            >✏️</button>
                            <button
                              className="fum-btn-delete"
                              onClick={() => {
                                setDeletingUser(user);
                                setModals((prev) => ({ ...prev, delete: true }));
                              }}
                            >🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="10">
                    <div className="fum-no-data">
                      <span>📭</span>
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== CREATE MODAL ===== */}
      {modals.create && !isFranchiseUser && (
        <CreateUserModal
          filteredFranchises={filteredFranchises}
          dropdownSearch={dropdownSearch}
          setDropdownSearch={setDropdownSearch}
          formData={formData}
          setFormData={setFormData}
          selectedFranchise={selectedFranchise}
          onSelectFranchise={handleSelectFranchise}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          getCategories={getCategories}
          getPermissionsByCategory={getPermissionsByCategory}
          onSubmit={handleCreateUser}
          onClose={() => { setModals((prev) => ({ ...prev, create: false })); resetForm(); }}
          submitting={submitting}
        />
      )}

      {/* ===== EDIT MODAL ===== */}
      {modals.edit && editingUser && !isFranchiseUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => { setModals((prev) => ({ ...prev, edit: false })); setEditingUser(null); }}
          onSave={handleUpdateUser}
          submitting={submitting}
          showToast={showToast}
        />
      )}

      {/* ===== DELETE MODAL ===== */}
      {modals.delete && deletingUser && (
        <DeleteModal
          user={deletingUser}
          onClose={() => { setModals((prev) => ({ ...prev, delete: false })); setDeletingUser(null); }}
          onConfirm={handleDeleteUser}
          submitting={submitting}
        />
      )}
      
      {/* ===== SUCCESS MODAL ===== */}
      {modals.success && successData && (
        <SuccessModal
          data={successData}
          onClose={() => { setModals((prev) => ({ ...prev, success: false })); setSuccessData(null); }}
        />
      )}
    </div>
  );
};

// ============================================
// 🧩 CREATE USER MODAL
// ============================================
const CreateUserModal = React.memo(({ filteredFranchises, dropdownSearch, setDropdownSearch, formData, setFormData, selectedFranchise, onSelectFranchise, selectedCategory, setSelectedCategory, getCategories, getPermissionsByCategory, onSubmit, onClose, submitting }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="fum-modal-overlay" onClick={onClose}>
      <div className="fum-modal fum-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fum-modal-header">
          <h3>👤 Create Franchise User</h3>
          <button className="fum-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit} className="fum-modal-form">
          
          <div className="fum-form-group">
            <label>Search & Select Franchise *</label>
            <div className="fum-dropdown-wrapper">
              <div className="fum-dropdown-input" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <input
                  type="text"
                  placeholder="Search franchise by name, code..."
                  value={dropdownSearch}
                  onChange={(e) => { setDropdownSearch(e.target.value); setIsDropdownOpen(true); }}
                  className="fum-dropdown-search"
                />
              </div>
              {isDropdownOpen && (
                <div className="fum-dropdown-list">
                  {filteredFranchises.map((f) => (
                    <div key={f.id} className="fum-dropdown-item" onClick={() => { onSelectFranchise(f); setIsDropdownOpen(false); }}>
                      <strong>{f.franchiseName}</strong> ({f.franchiseCode})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedFranchise && (
            <div className="fum-form-grid">
              <div className="fum-form-group">
                <label>Franchise Code</label>
                <input type="text" value={selectedFranchise.franchiseCode} readOnly className="fum-readonly" />
              </div>
              <div className="fum-form-group">
                <label>Franchise Name</label>
                <input type="text" value={selectedFranchise.franchiseName} readOnly className="fum-readonly" />
              </div>
              
              {/* ✅ EXPIRY DATE INPUT */}
              <div className="fum-form-group" style={{gridColumn: '1 / -1'}}>
                <label style={{color: '#d97706', fontWeight: 'bold'}}>Access Expiry Date * (User cannot login after this date)</label>
                <input 
                  type="date" 
                  value={formData.expiry_date} 
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} 
                  required 
                  style={{border: '2px solid #d97706', padding: '10px', borderRadius: '6px', width: '100%'}}
                />
              </div>
            </div>
          )}

          <div className="fum-permissions-section">
            <h4>🔐 Permissions</h4>
            <div className="fum-permissions-grid">
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm.key} className={`fum-permission-checkbox ${formData.permissions[perm.key] ? 'checked' : ''}`}>
                  <input type="checkbox" checked={formData.permissions[perm.key] || false} onChange={(e) => setFormData({ ...formData, permissions: { ...formData.permissions, [perm.key]: e.target.checked } })} />
                  <span className="perm-label">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="fum-modal-footer">
            <button type="button" className="fum-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="fum-btn-submit" disabled={submitting || !selectedFranchise}>
              {submitting ? '⏳ Creating...' : '🚀 Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

CreateUserModal.displayName = 'CreateUserModal';

// ============================================
// 🧩 EDIT USER MODAL
// ============================================
const EditUserModal = React.memo(({ user, onClose, onSave, submitting, showToast }) => {
  const [username, setUsername] = useState(user.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(user.is_active);
  const [expiryDate, setExpiryDate] = useState(user.expiry_date || ''); 
  
  const [permissions] = useState(user.permissions || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!expiryDate) return showToast?.('Expiry Date is required', 'error');
    setIsSaving(true);
    await onSave({ id: user.id, username, is_active: isActive, expiry_date: expiryDate, permissions, password: newPassword });
    setIsSaving(false);
  };

  return (
    <div className="fum-modal-overlay" onClick={onClose}>
      <div className="fum-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fum-modal-header">
          <h3>✏️ Edit User - {user.username}</h3>
          <button className="fum-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fum-modal-body">
          <div className="fum-form-group">
            <label>Username *</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="fum-editable" />
          </div>

          <div className="fum-form-group">
            <label>New Password (Optional)</label>
            <div className="fum-password-field">
              <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="fum-editable" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <div className="fum-form-group">
            <label>Status</label>
            <select value={isActive ? 'active' : 'inactive'} onChange={(e) => setIsActive(e.target.value === 'active')} className="fum-select">
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
            </select>
          </div>

          {/* ✅ EDIT EXPIRY DATE */}
          <div className="fum-form-group">
            <label style={{color: '#d97706', fontWeight: 'bold'}}>Access Expiry Date * (Renewal)</label>
            <input 
              type="date" 
              value={expiryDate} 
              onChange={(e) => setExpiryDate(e.target.value)} 
              className="fum-editable" 
              style={{border: '2px solid #d97706'}}
              required
            />
          </div>

        </div>
        <div className="fum-modal-footer">
          <button type="button" className="fum-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="fum-btn-submit" disabled={isSaving} onClick={handleSave}>
            {isSaving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
});
EditUserModal.displayName = 'EditUserModal';

// ============================================
// 🧩 OTHER MODALS
// ============================================
const DeleteModal = React.memo(({ user, onClose, onConfirm, submitting }) => (
  <div className="fum-modal-overlay" onClick={onClose}>
    <div className="fum-modal fum-delete-modal" onClick={e => e.stopPropagation()}>
      <div className="fum-modal-header"><h3>🗑️ Delete User</h3></div>
      <div className="fum-modal-body"><p>Are you sure you want to delete {user.username}?</p></div>
      <div className="fum-modal-footer">
        <button onClick={onClose} className="fum-btn-cancel">Cancel</button>
        <button onClick={onConfirm} className="fum-btn-delete-confirm" disabled={submitting}>Delete</button>
      </div>
    </div>
  </div>
));
DeleteModal.displayName = 'DeleteModal';

const SuccessModal = React.memo(({ data, onClose }) => (
  <div className="fum-modal-overlay" onClick={onClose}>
    <div className="fum-modal fum-success-modal" onClick={e => e.stopPropagation()}>
      <div className="fum-modal-header"><h3>🎉 User Created!</h3></div>
      <div className="fum-modal-body">
        <p><strong>Username:</strong> {data.username}</p>
        <p><strong>Password:</strong> {data.password}</p>
        <p><strong>Expiry Date:</strong> {formatDate(data.expiry_date) || 'Set'}</p>
      </div>
      <div className="fum-modal-footer"><button onClick={onClose} className="fum-btn-submit">Close</button></div>
    </div>
  </div>
));
SuccessModal.displayName = 'SuccessModal';

const SkeletonLoader = React.memo(() => <div className="fum-container"><p>Loading...</p></div>);
SkeletonLoader.displayName = 'SkeletonLoader';

export default FranchiseUserManagement;