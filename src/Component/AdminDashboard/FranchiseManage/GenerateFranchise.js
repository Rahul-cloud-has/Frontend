import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, apiConfig } from '../../../Api';
import './GenerateFranchise.css';

const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
};

// ✅ SAFE STRING HELPER
const safeStr = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return String(val.name || val.title || val.label || '');
  return String(val);
};

const GenerateFranchise = () => {
  // ===== STATE =====
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [franchiseRequests, setFranchiseRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [franchiseData, setFranchiseData] = useState({
    name: '', franchiseName: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
    agreementDate: new Date().toISOString().split('T')[0],
    validityDate: '', notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [generatedHistory, setGeneratedHistory] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ============================================
  // 📤 LOAD APPROVED APPLICATIONS
  // ============================================
  const loadApprovedApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/applications/?status=Approved`, apiConfig());
      
      let data = [];
      if (response.data && response.data.data) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      
      const mappedData = data.map(item => ({
        id: item.id,
        applicantName: safeStr(item.name || item.applicant_name),
        fatherName: safeStr(item.father_name),
        mobile: safeStr(item.mobile),
        email: safeStr(item.email),
        address: safeStr(item.address),
        city: safeStr(item.city),
        state: safeStr(item.state),
        pincode: safeStr(item.pincode),
        franchiseName: safeStr(item.franchise_name),
        message: safeStr(item.message),
        status: safeStr(item.status) || 'Pending',
        adminNote: safeStr(item.admin_note),
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        createdAt: item.created_at
      }));
      
      setFranchiseRequests(mappedData);
    } catch (error) {
      console.error('Error loading approved applications:', error);
      toast.error('⚠️ Error loading applications', toastConfig);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 📚 LOAD COURSES (WITH DEBUG)
  // ============================================
  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/courses/`, apiConfig());
      const coursesData = response.data;
      
      console.log('📚 Raw courses:', coursesData); // 🔥 DEBUG
      
      const mappedCourses = coursesData.map(function(course) {
        // ✅ Extract category properly
        let categoryStr = 'Uncategorized';
        if (course.category) {
          if (typeof course.category === 'string') {
            categoryStr = course.category;
          } else if (typeof course.category === 'object') {
            categoryStr = course.category.name || course.category.title || 'Uncategorized';
          }
        } else if (course.category_name) {
          categoryStr = course.category_name;
        }
        
        // ✅ Extract duration properly
        let durationStr = 'N/A';
        if (course.sessions) {
          if (typeof course.sessions === 'string') {
            durationStr = course.sessions;
          } else if (typeof course.sessions === 'object') {
            durationStr = course.sessions.name || course.sessions.title || 'N/A';
          }
        } else if (course.duration) {
          durationStr = typeof course.duration === 'object' 
            ? (course.duration.name || 'N/A') 
            : course.duration;
        }
        
        return {
          id: course.id || Date.now(),
          name: safeStr(course.course_name || course.courseName || course.name) || 'Unnamed Course',
          code: safeStr(course.code) || 'C-' + String(course.id || Date.now()).slice(-6),
          fee: parseFloat(course.fee) || 0,
          duration: durationStr,
          category: categoryStr,
          description: safeStr(course.description),
          totalPayment: course.totalPayment || course.fee || 0,
          createdAt: course.createdAt || new Date().toISOString()
        };
      });
      
      console.log('✅ Mapped courses:', mappedCourses); // 🔥 DEBUG
      setCourses(mappedCourses);
      
      // ✅ Unique categories (case-insensitive)
      const catsMap = new Map();
      mappedCourses.forEach(function(course) {
        const catStr = course.category;
        if (catStr && catStr.trim() && catStr !== 'Uncategorized') {
          const key = catStr.toLowerCase().trim();
          if (!catsMap.has(key)) {
            catsMap.set(key, catStr.trim());
          }
        }
      });
      
      const cats = Array.from(catsMap.values()).sort();
      console.log('📋 Unique categories:', cats); // 🔥 DEBUG
      setUniqueCategories(cats);
      
    } catch (error) {
      console.error('❌ Error loading courses:', error);
      toast.error('⚠️ Error loading courses', toastConfig);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 📋 LOAD GENERATED HISTORY
  // ============================================
  const loadGeneratedHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/generated-franchises/`, apiConfig());
      
      let data = [];
      if (response.data && response.data.data) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      
      const mappedData = data.map(item => ({
        id: item.id,
        requestId: item.request_id,
        applicantName: safeStr(item.applicant_name),
        franchiseName: safeStr(item.franchise_name),
        email: safeStr(item.email),
        mobile: safeStr(item.mobile),
        address: safeStr(item.address),
        city: safeStr(item.city),
        state: safeStr(item.state),
        pincode: safeStr(item.pincode),
        agreementDate: item.agreement_date,
        validityDate: item.validity_date,
        notes: safeStr(item.notes),
        selectedCourses: item.selected_courses || [],
        totalAmount: item.total_amount || 0,
        status: safeStr(item.status) || 'Generated',
        createdAt: item.created_at
      }));
      
      setGeneratedHistory(mappedData);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  useEffect(() => {
    loadCourses();
    loadApprovedApplications();
    loadGeneratedHistory();
  }, []);

  // ============================================
  // ✅ FILTERED HISTORY
  // ============================================
  const filteredHistory = useMemo(() => {
    let filtered = generatedHistory;

    if (historyStatusFilter !== 'all') {
      filtered = filtered.filter(item => 
        safeStr(item.status || 'Generated').toLowerCase() === historyStatusFilter.toLowerCase()
      );
    }

    if (historySearch.trim()) {
      const term = historySearch.toLowerCase().trim();
      filtered = filtered.filter(item =>
        safeStr(item.applicantName).toLowerCase().includes(term) ||
        safeStr(item.franchiseName).toLowerCase().includes(term) ||
        safeStr(item.email).toLowerCase().includes(term) ||
        safeStr(item.mobile).toLowerCase().includes(term) ||
        safeStr(item.city).toLowerCase().includes(term) ||
        String(item.id).includes(term)
      );
    }

    return filtered;
  }, [generatedHistory, historySearch, historyStatusFilter]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice().reverse().slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [historySearch, historyStatusFilter, itemsPerPage]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handlePageJump = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(e.target.value);
      if (page >= 1 && page <= totalPages) setCurrentPage(page);
      e.target.value = '';
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleRequestSelect = (e) => {
    var requestId = e.target.value;
    setSelectedRequestId(requestId);
    
    if (requestId) {
      var selected = franchiseRequests.find(f => String(f.id) === String(requestId));
      
      if (selected) {
        setSelectedRequest(selected);
        setFranchiseData({
          name: safeStr(selected.applicantName),
          franchiseName: safeStr(selected.franchiseName),
          email: safeStr(selected.email),
          phone: safeStr(selected.mobile),
          address: safeStr(selected.address),
          city: safeStr(selected.city),
          state: safeStr(selected.state),
          pincode: safeStr(selected.pincode),
          agreementDate: new Date().toISOString().split('T')[0],
          validityDate: '', notes: ''
        });
        
        if (selected.selectedCourses && selected.selectedCourses.length > 0) {
          setSelectedCourses(selected.selectedCourses);
        }
      }
    } else {
      setSelectedRequest(null);
      setFranchiseData({
        name: '', franchiseName: '', email: '', phone: '', address: '',
        city: '', state: '', pincode: '',
        agreementDate: new Date().toISOString().split('T')[0],
        validityDate: '', notes: ''
      });
      setSelectedCourses([]);
    }
  };

  const handleToggleForm = () => {
    if (showForm) resetForm();
    setShowForm(!showForm);
    setIsEditMode(false);
    setEditId(null);
  };

  const handleViewDetails = (item) => {
    setSelectedFranchise(item);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedFranchise(null);
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setEditId(item.id);
    setShowForm(true);
    
    setFranchiseData({
      name: safeStr(item.applicantName),
      franchiseName: safeStr(item.franchiseName),
      email: safeStr(item.email),
      phone: safeStr(item.mobile),
      address: safeStr(item.address),
      city: safeStr(item.city),
      state: safeStr(item.state),
      pincode: safeStr(item.pincode),
      agreementDate: item.agreementDate || new Date().toISOString().split('T')[0],
      validityDate: item.validityDate || '',
      notes: safeStr(item.notes)
    });
    
    if (item.selectedCourses && item.selectedCourses.length > 0) {
      setSelectedCourses(item.selectedCourses);
    }
    
    if (item.requestId) setSelectedRequestId(item.requestId);
    
    toast.info('✏️ Edit mode activated', toastConfig);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this franchise record?')) return;
    
    const loadingId = toast.loading('⏳ Deleting...', { position: "top-right" });
    try {
      await axios.delete(`${API_URL}/generated-franchises/${id}/`, apiConfig());
      await loadGeneratedHistory();
      toast.update(loadingId, {
        render: '✅ Franchise deleted successfully!',
        type: 'success', isLoading: false, autoClose: 3000,
      });
    } catch (error) {
      console.error('Error deleting franchise:', error);
      toast.update(loadingId, {
        render: '❌ Error deleting record',
        type: 'error', isLoading: false, autoClose: 3000,
      });
    }
  };

  // ============================================
  // ✅ FILTERED COURSES (Category + Search Only)
  // ============================================
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Category filter - case-insensitive
    if (filterCategory !== 'all') {
      filtered = filtered.filter(course => {
        const courseCat = safeStr(course.category).toLowerCase().trim();
        const filterCat = filterCategory.toLowerCase().trim();
        return courseCat === filterCat;
      });
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(course => {
        return (
          safeStr(course.name).toLowerCase().includes(term) ||
          safeStr(course.category).toLowerCase().includes(term) ||
          safeStr(course.code).toLowerCase().includes(term) ||
          safeStr(course.duration).toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }, [courses, searchTerm, filterCategory]);

  const handleCourseToggle = (course) => {
    setSelectedCourses(prev => {
      const exists = prev.some(s => s.id === course.id);
      if (exists) {
        return prev.filter(s => s.id !== course.id);
      } else {
        return prev.concat([{
          id: course.id,
          name: safeStr(course.name),
          fee: parseFloat(course.fee) || 0,
          code: safeStr(course.code),
          duration: safeStr(course.duration),
          category: safeStr(course.category)
        }]);
      }
    });
  };

  const handleSelectAll = () => {
    const availableIds = filteredCourses.map(c => c.id);
    const currentlySelectedIds = selectedCourses.map(c => c.id);
    const allSelected = availableIds.every(id => currentlySelectedIds.indexOf(id) !== -1);

    if (allSelected) {
      setSelectedCourses(prev => prev.filter(c => availableIds.indexOf(c.id) === -1));
      toast.info('❌ Deselected all courses', toastConfig);
    } else {
      const newCourses = filteredCourses.filter(c => currentlySelectedIds.indexOf(c.id) === -1);
      setSelectedCourses(prev => prev.concat(newCourses.map(c => ({
        id: c.id,
        name: safeStr(c.name),
        fee: parseFloat(c.fee) || 0,
        code: safeStr(c.code),
        duration: safeStr(c.duration),
        category: safeStr(c.category)
      }))));
      toast.success(`✅ Selected ${newCourses.length} courses`, toastConfig);
    }
  };

  const totalAmount = useMemo(() => {
    return selectedCourses.reduce((sum, course) => sum + (course.fee || 0), 0);
  }, [selectedCourses]);

  const handleInputChange = (e) => {
    setFranchiseData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const areAllFilteredSelected = useMemo(() => {
    if (filteredCourses.length === 0) return false;
    const filteredIds = filteredCourses.map(c => c.id);
    const selectedIds = selectedCourses.map(c => c.id);
    return filteredIds.every(id => selectedIds.indexOf(id) !== -1);
  }, [filteredCourses, selectedCourses]);

  const resetForm = () => {
    setSelectedCourses([]);
    setSelectedRequestId('');
    setSelectedRequest(null);
    setFranchiseData({
      name: '', franchiseName: '', email: '', phone: '', address: '',
      city: '', state: '', pincode: '',
      agreementDate: new Date().toISOString().split('T')[0],
      validityDate: '', notes: ''
    });
    setSearchTerm('');
    setFilterCategory('all');
    setIsEditMode(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedCourses.length === 0) {
      toast.warning('⚠️ Please select at least one course', toastConfig);
      return;
    }
    
    setIsSubmitting(true);
    const loadingId = toast.loading(
      isEditMode ? '⏳ Updating franchise...' : '⏳ Creating franchise...',
      { position: "top-right" }
    );

    try {
      const franchiseDataToSave = {
        request_id: selectedRequest ? selectedRequest.id : null,
        applicant_name: franchiseData.name,
        franchise_name: franchiseData.franchiseName || '',
        email: franchiseData.email,
        mobile: franchiseData.phone,
        address: franchiseData.address,
        city: franchiseData.city,
        state: franchiseData.state,
        pincode: franchiseData.pincode,
        agreement_date: franchiseData.agreementDate,
        validity_date: franchiseData.validityDate,
        notes: franchiseData.notes,
        selected_courses: selectedCourses.map(c => ({
          id: c.id,
          name: safeStr(c.name),
          fee: c.fee,
          code: safeStr(c.code),
          duration: safeStr(c.duration),
          category: safeStr(c.category)
        })),
        total_amount: totalAmount,
        status: 'Generated'
      };

      if (isEditMode && editId) {
        await axios.put(
          `${API_URL}/generated-franchises/${editId}/`,
          franchiseDataToSave,
          apiConfig()
        );
        toast.update(loadingId, {
          render: '✅ Franchise updated successfully!',
          type: 'success', isLoading: false, autoClose: 3000,
        });
      } else {
        await axios.post(
          `${API_URL}/generated-franchises/`,
          franchiseDataToSave,
          apiConfig()
        );
        toast.update(loadingId, {
          render: `🎉 Franchise generated! ${selectedCourses.length} courses • ₹${totalAmount.toLocaleString()}`,
          type: 'success', isLoading: false, autoClose: 4000,
        });
      }

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      
      await loadGeneratedHistory();
      resetForm();
      setShowForm(false);
      setIsEditMode(false);
      setEditId(null);

    } catch (error) {
      console.error('❌ Error:', error);
      toast.update(loadingId, {
        render: '❌ Failed to save. Try again.',
        type: 'error', isLoading: false, autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // MODAL COMPONENT
  // ============================================
  const FranchiseDetailsModal = ({ franchise, onClose }) => {
    if (!franchise) return null;
    
    return (
      <div className="gf-details-overlay" onClick={onClose}>
        <div className="gf-details-modal" onClick={(e) => e.stopPropagation()}>
          <button className="gf-details-close" onClick={onClose}>✕</button>
          
          <div className="gf-details-header">
            <h2>📋 Franchise Agreement Details</h2>
            <div className="gf-details-id">
              <span>ID: {franchise.id}</span>
              <span className={`gf-details-status ${safeStr(franchise.status || 'generated').toLowerCase()}`}>
                {safeStr(franchise.status) || 'Generated'}
              </span>
            </div>
          </div>

          <div className="gf-details-body">
            <div className="gf-details-section">
              <h3>👤 Applicant & Franchise Info</h3>
              <div className="gf-details-grid">
                <div><label>Applicant:</label><span>{safeStr(franchise.applicantName)}</span></div>
                <div><label>Franchise Name:</label><span>{safeStr(franchise.franchiseName) || '—'}</span></div>
                <div><label>Email:</label><span>{safeStr(franchise.email)}</span></div>
                <div><label>Phone:</label><span>{safeStr(franchise.mobile)}</span></div>
                <div><label>Address:</label><span>{safeStr(franchise.address)}</span></div>
                <div><label>City:</label><span>{safeStr(franchise.city)}</span></div>
                <div><label>State:</label><span>{safeStr(franchise.state)}</span></div>
                <div><label>Pincode:</label><span>{safeStr(franchise.pincode)}</span></div>
              </div>
            </div>

            <div className="gf-details-section">
              <h3>📅 Agreement Details</h3>
              <div className="gf-details-grid">
                <div><label>Agreement Date:</label><span>{franchise.agreementDate}</span></div>
                <div><label>Validity Date:</label><span>{franchise.validityDate || 'N/A'}</span></div>
                <div><label>Created:</label><span>{franchise.createdAt ? new Date(franchise.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                <div><label>Request ID:</label><span>{franchise.requestId || 'N/A'}</span></div>
              </div>
            </div>

            <div className="gf-details-section">
              <h3>📚 Selected Courses</h3>
              {franchise.selectedCourses && franchise.selectedCourses.length > 0 ? (
                <table className="gf-details-course-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Course Name</th>
                      <th>Code</th>
                      <th>Category</th>
                      <th>Duration</th>
                      <th>Fee (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {franchise.selectedCourses.map((course, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{safeStr(course.name)}</strong></td>
                        <td>{safeStr(course.code) || 'N/A'}</td>
                        <td>{safeStr(course.category) || 'N/A'}</td>
                        <td>{safeStr(course.duration) || 'N/A'}</td>
                        <td>₹{course.fee || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5"><strong>Total Amount</strong></td>
                      <td><strong>₹{franchise.totalAmount || franchise.selectedCourses.reduce((sum, c) => sum + (c.fee || 0), 0)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="gf-details-no-courses">No courses selected</p>
              )}
            </div>

            {franchise.notes && (
              <div className="gf-details-section">
                <h3>📝 Notes</h3>
                <p className="gf-details-notes">{safeStr(franchise.notes)}</p>
              </div>
            )}
          </div>

          <div className="gf-details-footer">
            <button className="gf-btn gf-btn-close" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="gf-container">
      <ToastContainer {...toastConfig} style={{ zIndex: 99999 }} />
      
      <div className="gf-card">
        {/* Header */}
        <div className="gf-header">
          <div>
            <h1 className="gf-title">Generate Franchise</h1>
            <p className="gf-subtitle">Create a new franchise agreement from approved requests</p>
          </div>
          <div className="gf-header-actions">
            <button className="gf-btn gf-btn-add" onClick={handleToggleForm}>
              {showForm ? '✕ Close' : '+ Add New'}
            </button>
          </div>
        </div>

        {submitSuccess && (
          <div className="gf-success">
            ✅ Franchise {isEditMode ? 'updated' : 'generated'} successfully!
          </div>
        )}

        {/* HISTORY SECTION */}
        {!showForm && (
          <div className="gf-history-section">
            <div className="gf-history-header">
              <h3>📋 Generated Franchises History</h3>
              <span className="gf-history-count">
                {filteredHistory.length} of {generatedHistory.length} records
              </span>
            </div>

            <div className="gf-history-controls">
              <div className="gf-history-search-wrapper">
                <span className="gf-history-search-icon">🔍</span>
                <input
                  type="text"
                  className="gf-history-search"
                  placeholder="Search name, email, city..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
              <select
                className="gf-history-filter"
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="generated">Generated</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="gf-history-table-wrap">
              {paginatedHistory.length > 0 ? (
                <table className="gf-history-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ID</th>
                      <th>Applicant</th>
                      <th>Franchise Name</th>
                      <th>Courses</th>
                      <th>Total (₹)</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistory.map((item, index) => (
                      <tr key={item.id}>
                        <td>{startIndex + index + 1}</td>
                        <td><strong>#{item.id}</strong></td>
                        <td>{safeStr(item.applicantName)}</td>
                        <td>{safeStr(item.franchiseName) || '—'}</td>
                        <td>
                          <span className="gf-course-count-badge">
                            {item.selectedCourses ? item.selectedCourses.length : 0}
                          </span>
                        </td>
                        <td>₹{item.totalAmount || 0}</td>
                        <td>
                          <span className={'gf-history-status ' + safeStr(item.status || 'generated').toLowerCase()}>
                            {safeStr(item.status) || 'Generated'}
                          </span>
                        </td>
                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="gf-action-buttons">
                            <button className="gf-action-btn gf-view-btn" onClick={() => handleViewDetails(item)} title="View Details">👁️</button>
                            <button className="gf-action-btn gf-edit-btn" onClick={() => handleEdit(item)} title="Edit">✏️</button>
                            <button className="gf-action-btn gf-delete-btn" onClick={() => handleDelete(item.id)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="gf-no-history">
                  <span>📭</span>
                  {generatedHistory.length > 0 ? <p>No matching records found</p> : <p>No generated franchises yet</p>}
                </div>
              )}
            </div>

            {filteredHistory.length > 0 && (
              <div className="gf-pagination-wrap">
                <div className="gf-pagination-info">
                  <span>
                    Showing <strong>{startIndex + 1}</strong>-<strong>{Math.min(endIndex, filteredHistory.length)}</strong> of <strong>{filteredHistory.length}</strong>
                  </span>
                  <div className="gf-pagination-size">
                    <span>Show:</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={500}>500</option>
                    </select>
                  </div>
                </div>

                <div className="gf-pagination-controls">
                  <button className="gf-page-btn gf-page-nav" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>« First</button>
                  <button className="gf-page-btn gf-page-nav" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Prev</button>
                  
                  {getPageNumbers().map((page, idx) => 
                    page === '...' ? (
                      <span key={`dots-${idx}`} className="gf-page-dots">...</span>
                    ) : (
                      <button key={page} className={`gf-page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                        {page}
                      </button>
                    )
                  )}
                  
                  <button className="gf-page-btn gf-page-nav" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ›</button>
                  <button className="gf-page-btn gf-page-nav" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last »</button>
                  
                  {totalPages > 5 && (
                    <div className="gf-page-input">
                      <span>Go:</span>
                      <input type="number" placeholder={currentPage} min="1" max={totalPages} onKeyDown={handlePageJump} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORM SECTION */}
        {showForm && (
          <div className="gf-form-wrapper">
            <div className="gf-form-divider">
              <span>{isEditMode ? '✏️ Edit Franchise' : '➕ Add New Franchise'}</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="gf-section">
                <h2 className="gf-section-title">Select Approved Request</h2>
                <div className="gf-form-grid">
                  <div className="gf-form-group gf-full-width">
                    <label>Select Approved Application</label>
                    <select
                      className="gf-franchise-select"
                      value={selectedRequestId}
                      onChange={handleRequestSelect}
                      disabled={isEditMode}
                    >
                      <option value="">-- Select an approved application --</option>
                      {franchiseRequests.length > 0 ? (
                        franchiseRequests.map((request) => (
                          <option key={request.id} value={request.id}>
                            #{request.id} - {safeStr(request.applicantName)} {request.franchiseName ? `(${safeStr(request.franchiseName)})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No approved applications available</option>
                      )}
                    </select>
                    {isEditMode && (
                      <span style={{ color: '#f59e0b', fontSize: '10px', marginTop: '2px', display: 'block' }}>
                        ⚠️ Request selection is disabled in edit mode
                      </span>
                    )}
                    {selectedRequest && (
                      <span style={{ color: '#1a237e', fontSize: '10px', marginTop: '2px', display: 'block' }}>
                        ✅ Selected: #{selectedRequest.id} | {safeStr(selectedRequest.applicantName)} | {safeStr(selectedRequest.franchiseName) || 'No Franchise Name'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="gf-section">
                <h2 className="gf-section-title">Franchise Details</h2>
                <div className="gf-form-grid">
                  <div className="gf-form-group">
                    <label>Applicant Name *</label>
                    <input type="text" name="name" value={franchiseData.name} onChange={handleInputChange} placeholder="Enter applicant name" required />
                  </div>
                  <div className="gf-form-group">
                    <label>Franchise Name <span style={{ color: '#6b7280', fontSize: '11px' }}>(Optional)</span></label>
                    <input type="text" name="franchiseName" value={franchiseData.franchiseName} onChange={handleInputChange} placeholder="Enter franchise name" />
                  </div>
                  <div className="gf-form-group">
                    <label>Email *</label>
                    <input type="email" name="email" value={franchiseData.email} onChange={handleInputChange} placeholder="Enter email" required />
                  </div>
                  <div className="gf-form-group">
                    <label>Phone *</label>
                    <input type="tel" name="phone" value={franchiseData.phone} onChange={handleInputChange} placeholder="Enter phone" required />
                  </div>
                  <div className="gf-form-group">
                    <label>Address</label>
                    <input type="text" name="address" value={franchiseData.address} onChange={handleInputChange} placeholder="Enter address" />
                  </div>
                  <div className="gf-form-group">
                    <label>City</label>
                    <input type="text" name="city" value={franchiseData.city} onChange={handleInputChange} placeholder="Enter city" />
                  </div>
                  <div className="gf-form-group">
                    <label>State</label>
                    <input type="text" name="state" value={franchiseData.state} onChange={handleInputChange} placeholder="Enter state" />
                  </div>
                  <div className="gf-form-group">
                    <label>Pincode</label>
                    <input type="text" name="pincode" value={franchiseData.pincode} onChange={handleInputChange} placeholder="Enter pincode" />
                  </div>
                  <div className="gf-form-group">
                    <label>Agreement Date</label>
                    <input type="date" name="agreementDate" value={franchiseData.agreementDate} onChange={handleInputChange} />
                  </div>
                  <div className="gf-form-group">
                    <label>Validity Date</label>
                    <input type="date" name="validityDate" value={franchiseData.validityDate} onChange={handleInputChange} />
                  </div>
                  <div className="gf-form-group gf-full-width">
                    <label>Notes</label>
                    <textarea name="notes" value={franchiseData.notes} onChange={handleInputChange} placeholder="Additional notes" rows="2" />
                  </div>
                </div>
              </div>

              {/* ✅ COURSE SELECTION - CLEAN & SIMPLE */}
              <div className="gf-section">
                <div className="gf-section-header">
                  <h2 className="gf-section-title">Select Courses</h2>
                  <div className="gf-section-actions">
                    <span className="gf-course-count">{selectedCourses.length} selected</span>
                    <button type="button" className="gf-btn gf-btn-select-all" onClick={handleSelectAll} disabled={filteredCourses.length === 0}>
                      {areAllFilteredSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* ✅ SEARCH + CATEGORY FILTER ONLY */}
                <div className="gf-controls">
                  <div className="gf-search-wrapper">
                    <span className="gf-search-icon">🔍</span>
                    <input 
                      type="text" 
                      className="gf-search-input" 
                      placeholder="Search by name, category, code..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                  <select 
                    className="gf-filter-select" 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">📚 All Categories ({courses.length})</option>
                    {uniqueCategories.map(cat => {
                      const count = courses.filter(c => 
                        safeStr(c.category).toLowerCase() === cat.toLowerCase()
                      ).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* ✅ ACTIVE FILTER BADGE */}
                {filterCategory !== 'all' && (
                  <div style={{ 
                    marginTop: '8px', 
                    display: 'flex', 
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Active Filter:</span>
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      📂 {filterCategory}
                      <button 
                        onClick={() => setFilterCategory('all')}
                        style={{
                          background: 'rgba(255,255,255,0.3)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >✕</button>
                    </span>
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                      → {filteredCourses.length} courses
                    </span>
                  </div>
                )}

                <div className="gf-course-grid">
                  {loading ? (
                    <div className="gf-loading">⏳ Loading courses...</div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="gf-no-courses">
                      {courses.length === 0 ? (
                        <>
                          <span className="gf-empty-icon">📚</span>
                          <p>No courses available</p>
                          <span className="gf-empty-hint">Add courses from the Admin panel first</span>
                        </>
                      ) : (
                        <>
                          <span className="gf-empty-icon">🔍</span>
                          <p>No matching courses</p>
                          <span className="gf-empty-hint">Try adjusting your search or category filter</span>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredCourses.map((course) => {
                      const isSelected = selectedCourses.some(s => s.id === course.id);
                      return (
                        <div key={course.id} className={'gf-course-item ' + (isSelected ? 'selected' : '')} onClick={() => handleCourseToggle(course)}>
                          <div className="gf-course-checkbox">
                            <input type="checkbox" checked={isSelected} onChange={() => {}} onClick={(e) => e.stopPropagation()} />
                          </div>
                          <div className="gf-course-info">
                            <div className="gf-course-name">{safeStr(course.name)}</div>
                            <div className="gf-course-meta">
                              <span className="gf-course-category">{safeStr(course.category)}</span>
                              <span className="gf-course-code">#{safeStr(course.code)}</span>
                              <span className="gf-course-duration">{safeStr(course.duration)}</span>
                              <span className="gf-course-fee">₹{course.fee}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedCourses.length > 0 && (
                  <div className="gf-selected-summary">
                    <div className="gf-selected-header">
                      <h3>Selected Courses ({selectedCourses.length})</h3>
                      <span className="gf-total-amount">Total: ₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="gf-selected-list">
                      {selectedCourses.map((course) => (
                        <span key={course.id} className="gf-selected-badge">
                          {safeStr(course.name)}
                          <span className="gf-selected-fee">₹{course.fee}</span>
                          <button type="button" className="gf-remove-course" onClick={() => handleCourseToggle(course)}>✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="gf-actions">
                <button type="submit" className="gf-btn gf-btn-submit" disabled={isSubmitting || selectedCourses.length === 0 || !franchiseData.name || !franchiseData.email || !franchiseData.phone}>
                  {isSubmitting ? (
                    <><span className="gf-spinner"></span>{isEditMode ? 'Updating...' : 'Creating...'}</>
                  ) : (
                    isEditMode ? '✓ Update Franchise' : '✓ Generate Franchise'
                  )}
                </button>
                <button type="button" className="gf-btn gf-btn-cancel" onClick={() => { resetForm(); setShowForm(false); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {showDetailsModal && selectedFranchise && (
        <FranchiseDetailsModal franchise={selectedFranchise} onClose={handleCloseDetails} />
      )}
    </div>
  );
};

export default GenerateFranchise;