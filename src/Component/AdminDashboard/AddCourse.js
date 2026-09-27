// CourseAdd.jsx - Complete Final Version (with Toast Notifications)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL, apiConfig } from '../../Api';
import './AddCourse.css';

const CourseAdd = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [newSession, setNewSession] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [showSessionInput, setShowSessionInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    courseName: '',
    sessions: '',
    fee: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [catRes, sesRes] = await Promise.all([
        axios.get(`${API_URL}/categories/`, apiConfig()),
        axios.get(`${API_URL}/sessions/`, apiConfig())
      ]);
      setCategories(catRes.data);
      setSessionOptions(sesRes.data);

      const courseRes = await axios.get(`${API_URL}/courses/`, apiConfig());
      setCourses(courseRes.data);
      setFilteredCourses(courseRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/courses/`, apiConfig());
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (course) => {
    if (course.category && typeof course.category === 'object' && course.category.name) {
      return course.category.name;
    }
    const catId = course.category?.id || course.category;
    const found = categories.find(c => c.id === parseInt(catId));
    return found ? found.name : (course.category_name || 'N/A');
  };

  const getSessionName = (course) => {
    if (course.sessions && typeof course.sessions === 'object' && course.sessions.name) {
      return course.sessions.name;
    }
    const sesId = course.sessions?.id || course.sessions;
    const found = sessionOptions.find(s => s.id === parseInt(sesId));
    return found ? found.name : (course.session_name || 'N/A');
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) { toast.warning('Please enter category name'); return; }
    try {
      const response = await axios.post(
        `${API_URL}/categories/`,
        { name: newCategory.trim() },
        apiConfig()
      );
      setCategories([...categories, response.data]);
      setFormData({ ...formData, category: response.data.id });
      setNewCategory('');
      setShowCategoryInput(false);
      toast.success('Category added!');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleAddSession = async () => {
    if (!newSession.trim()) { toast.warning('Please enter session'); return; }
    try {
      const response = await axios.post(
        `${API_URL}/sessions/`,
        { name: newSession.trim() },
        apiConfig()
      );
      setSessionOptions([...sessionOptions, response.data]);
      setFormData({ ...formData, sessions: response.data.id });
      setNewSession('');
      setShowSessionInput(false);
      toast.success('Session added!');
    } catch (error) {
      toast.error('Failed to add session');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    const required = ['category', 'courseName', 'sessions', 'fee'];
    required.forEach(field => {
      if (!formData[field]) newErrors[field] = 'Required';
    });
    if (formData.fee && parseInt(formData.fee) <= 0) {
      newErrors.fee = 'Must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      category: '', courseName: '', sessions: '', fee: '', description: ''
    });
    setIsEditing(false);
    setEditId(null);
    setErrors({});
    setShowCategoryInput(false);
    setShowSessionInput(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const courseData = {
      category: parseInt(formData.category),
      course_name: formData.courseName,
      sessions: parseInt(formData.sessions),
      fee: parseInt(formData.fee),
      description: formData.description || ''
    };

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/courses/${editId}/`, courseData, apiConfig());
        toast.success('Course updated!');
      } else {
        await axios.post(`${API_URL}/courses/`, courseData, apiConfig());
        toast.success('Course added!');
      }
      await fetchCourses();
      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setShowForm(true);
    setFormData({
      category: course.category?.id || course.category || '',
      courseName: course.course_name || course.courseName || '',
      sessions: course.sessions?.id || course.sessions || '',
      fee: course.fee || '',
      description: course.description || ''
    });
    setIsEditing(true);
    setEditId(course.id);
    setTimeout(() => {
      const formSection = document.querySelector('.form-section');
      if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const deleteCourse = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/courses/${id}/`, apiConfig());
      await fetchCourses();
      toast.success('Course deleted!');
    } catch (error) {
      toast.error('Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>Delete Course?</div>
          <div style={{ fontSize: '14px', marginBottom: '14px' }}>Are you sure?</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={closeToast}
              style={{
                border: 'none', borderRadius: '5px', padding: '7px 13px',
                cursor: 'pointer', backgroundColor: '#e5e7eb', color: '#111827', fontWeight: '600'
              }}
            >Cancel</button>
            <button
              type="button"
              onClick={async () => { closeToast(); await deleteCourse(id); }}
              style={{
                border: 'none', borderRadius: '5px', padding: '7px 13px',
                cursor: 'pointer', backgroundColor: '#dc2626', color: '#fff', fontWeight: '600'
              }}
            >Delete</button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, draggable: false, position: 'top-center' }
    );
  };

  const handleClear = () => {
    toast(
      ({ closeToast }) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>Clear Fields?</div>
          <div style={{ fontSize: '14px', marginBottom: '14px' }}>Reset form?</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={closeToast}
              style={{
                border: 'none', borderRadius: '5px', padding: '7px 13px',
                cursor: 'pointer', backgroundColor: '#e5e7eb', color: '#111827', fontWeight: '600'
              }}
            >Cancel</button>
            <button
              type="button"
              onClick={() => { closeToast(); resetForm(); }}
              style={{
                border: 'none', borderRadius: '5px', padding: '7px 13px',
                cursor: 'pointer', backgroundColor: '#f59e0b', color: '#fff', fontWeight: '600'
              }}
            >Clear</button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, draggable: false, position: 'top-center' }
    );
  };

  const toggleForm = () => {
    if (showForm) {
      setShowForm(false);
      resetForm();
    } else {
      setShowForm(true);
      resetForm();
    }
  };

  useEffect(() => {
    let result = courses;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(course => {
        const catName = getCategoryName(course).toLowerCase();
        const sesName = getSessionName(course).toLowerCase();
        return (
          course.course_name?.toLowerCase().includes(term) ||
          catName.includes(term) ||
          sesName.includes(term)
        );
      });
    }
    setFilteredCourses(result);
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, courses, categories, sessionOptions]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage <= 3) {
        pages.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const totalPayment = formData.fee ? parseInt(formData.fee) : 0;

  return (
    <div className="course-container">
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

      <div className="course-card">
        {/* Header */}
        <div className="course-header">
          <h2>📚 Course Management</h2>
          <div className="header-actions">
            <button className="btn-add-toggle" onClick={toggleForm}>
              {showForm ? '✕ Close Form' : '➕ Add Course'}
            </button>
          </div>
        </div>

        {loading && <div className="loading-msg">⏳ Loading...</div>}

        {/* FORM */}
        {showForm && (
          <div className="form-section">
            <div className="form-wrapper">
              <h3>{isEditing ? '✏️ Edit Course' : '➕ Add New Course'}</h3>
              <form onSubmit={handleSubmit} className="course-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Category <span className="req">*</span></label>
                    <div className="select-with-add">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={errors.category ? 'error' : ''}
                        disabled={loading}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-add-option"
                        onClick={() => setShowCategoryInput(!showCategoryInput)}
                        disabled={loading}
                      >+</button>
                    </div>
                    {errors.category && <span className="err">{errors.category}</span>}
                    {showCategoryInput && (
                      <div className="add-option-input">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="New category"
                          className="small-input"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCategory();
                            }
                          }}
                        />
                        <button type="button" className="btn-add-small" onClick={handleAddCategory}>Add</button>
                        <button type="button" className="btn-cancel-small" onClick={() => setShowCategoryInput(false)}>✕</button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Course Name <span className="req">*</span></label>
                    <input
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleChange}
                      placeholder="e.g., Web Development"
                      className={errors.courseName ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.courseName && <span className="err">{errors.courseName}</span>}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Duration <span className="req">*</span></label>
                    <div className="select-with-add">
                      <select
                        name="sessions"
                        value={formData.sessions}
                        onChange={handleChange}
                        className={errors.sessions ? 'error' : ''}
                        disabled={loading}
                      >
                        <option value="">Select Duration</option>
                        {sessionOptions.map((session) => (
                          <option key={session.id} value={session.id}>{session.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-add-option"
                        onClick={() => setShowSessionInput(!showSessionInput)}
                        disabled={loading}
                      >+</button>
                    </div>
                    {errors.sessions && <span className="err">{errors.sessions}</span>}
                    {showSessionInput && (
                      <div className="add-option-input">
                        <input
                          type="text"
                          value={newSession}
                          onChange={(e) => setNewSession(e.target.value)}
                          placeholder="e.g., 3 Months"
                          className="small-input"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSession();
                            }
                          }}
                        />
                        <button type="button" className="btn-add-small" onClick={handleAddSession}>Add</button>
                        <button type="button" className="btn-cancel-small" onClick={() => setShowSessionInput(false)}>✕</button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Fee (₹) <span className="req">*</span></label>
                    <input
                      type="number"
                      name="fee"
                      value={formData.fee}
                      onChange={handleChange}
                      placeholder="e.g., 15000"
                      className={errors.fee ? 'error' : ''}
                      disabled={loading}
                    />
                    {errors.fee && <span className="err">{errors.fee}</span>}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Total Payment (₹)</label>
                    <input value={totalPayment || ''} placeholder="Auto" readOnly className="total" />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Optional"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? '⏳ Saving...' : isEditing ? '💾 Update' : '➕ Add Course'}
                  </button>
                  {isEditing && (
                    <button type="button" className="btn-cancel" onClick={() => { resetForm(); setShowForm(false); }}>
                      ✕ Cancel
                    </button>
                  )}
                  <button type="button" className="btn-clear" onClick={handleClear}>🧹 Clear</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TABLE */}
        {!showForm && (
          <div className="table-section">
            <div className="table-header">
              <span className="table-title">📋 Course List ({filteredCourses.length})</span>
              <div className="table-controls">
                <input
                  type="text"
                  className="search-box"
                  placeholder="🔍 Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn-refresh" onClick={loadAllData} disabled={loading}>
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              {loading && courses.length === 0 ? (
                <div className="loading-state">⏳ Loading courses...</div>
              ) : (
                <table className="course-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Category</th>
                      <th>Course Name</th>
                      <th>Duration</th>
                      <th>Fee (₹)</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((course, index) => (
                        <tr key={course.id}>
                          <td>{indexOfFirstItem + index + 1}</td>
                          <td><span className="category-badge">{getCategoryName(course)}</span></td>
                          <td><strong>{course.course_name || course.courseName}</strong></td>
                          <td><span className="duration-badge">{getSessionName(course)}</span></td>
                          <td>₹{course.fee}</td>
                          <td className="total-amount">₹{course.fee}</td>
                          <td>
                            <button className="btn-action edit" onClick={() => handleEdit(course)} disabled={loading}>✏️</button>
                            <button className="btn-action delete" onClick={() => handleDelete(course.id)} disabled={loading}>🗑️</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" className="no-data">No courses found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <span className="page-info">
                  Showing <strong>{indexOfFirstItem + 1}</strong> -{' '}
                  <strong>{Math.min(indexOfLastItem, filteredCourses.length)}</strong>{' '}
                  of <strong>{filteredCourses.length}</strong>
                </span>
                <div className="page-btns">
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>◀</button>
                  {getPageNumbers().map((page, idx) => (
                    page === '...' ? (
                      <span key={`dots-${idx}`} className="page-dots">...</span>
                    ) : (
                      <button
                        key={idx}
                        onClick={() => paginate(page)}
                        className={currentPage === page ? 'active' : ''}
                      >{page}</button>
                    )
                  ))}
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>▶</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseAdd;