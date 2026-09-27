// JobForm.jsx - Complete with API Integration and Toast Notifications
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL, apiConfig } from '../../Api';
import './AddJob.css';

const JobForm = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    jobType: 'Private',
    category: '',
    location: '',
    salary: '',
    experience: '',
    qualification: '',
    lastDate: '',
    jobLink: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  // ===== GET BACKEND ERROR MESSAGE =====
  const getApiErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string') {
      return responseData;
    }

    if (responseData?.detail) {
      return responseData.detail;
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData && typeof responseData === 'object') {
      const firstError = Object.values(responseData).flat()[0];

      if (firstError) {
        return String(firstError);
      }
    }

    return fallbackMessage;
  };

  // ===== LOAD JOBS FROM API =====
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJobs = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/jobs/`,
        apiConfig()
      );

      setJobs(response.data);
      setFilteredJobs(response.data);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Failed to load jobs'),
        {
          toastId: 'fetch-jobs-error'
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== SEARCH & FILTER =====
  useEffect(() => {
    let result = jobs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      result = result.filter(job =>
        job.job_title?.toLowerCase().includes(term) ||
        job.company_name?.toLowerCase().includes(term) ||
        job.category?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term) ||
        job.job_type?.toLowerCase().includes(term)
      );
    }

    setFilteredJobs(result);
    setCurrentPage(1);
  }, [searchTerm, jobs]);

  // ===== HANDLE CHANGE =====
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // ===== VALIDATE =====
  const validate = () => {
    const newErrors = {};
    const required = [
      'jobTitle',
      'companyName',
      'jobType',
      'category',
      'location',
      'lastDate'
    ];

    required.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'Required';
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.warning('Please fill all required fields.');
      return false;
    }

    return true;
  };

  // ===== RESET FORM =====
  const resetForm = () => {
    setFormData({
      jobTitle: '',
      companyName: '',
      jobType: 'Private',
      category: '',
      location: '',
      salary: '',
      experience: '',
      qualification: '',
      lastDate: '',
      jobLink: '',
      description: '',
      status: 'Active'
    });

    setIsEditing(false);
    setEditId(null);
    setErrors({});
    setShowForm(false);
  };

  // ===== HANDLE SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const jobData = {
      job_title: formData.jobTitle,
      company_name: formData.companyName,
      job_type: formData.jobType,
      category: formData.category,
      location: formData.location,
      salary_range: formData.salary,
      experience_required: parseInt(formData.experience) || 0,
      qualification: formData.qualification,
      application_deadline: formData.lastDate,
      job_link: formData.jobLink,
      description: formData.description,
      is_active: formData.status === 'Active'
    };

    try {
      if (isEditing) {
        await axios.put(
          `${API_URL}/jobs/${editId}/`,
          jobData,
          apiConfig()
        );

        showSuccessMsg('Job updated successfully!');
      } else {
        await axios.post(
          `${API_URL}/jobs/`,
          jobData,
          apiConfig()
        );

        showSuccessMsg('Job added successfully!');
      }

      await fetchJobs();
      resetForm();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Failed to save job. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== SHOW SUCCESS TOAST =====
  const showSuccessMsg = (message) => {
    toast.success(message);
  };

  // ===== HANDLE EDIT =====
  const handleEdit = (job) => {
    setShowForm(true);

    setFormData({
      jobTitle: job.job_title || job.jobTitle || '',
      companyName: job.company_name || job.companyName || '',
      jobType: job.job_type || job.jobType || 'Private',
      category: job.category || '',
      location: job.location || '',
      salary: job.salary_range || job.salary || '',
      experience: job.experience_required || job.experience || '',
      qualification: job.qualification || '',
      lastDate: job.application_deadline || job.lastDate || '',
      jobLink: job.job_link || job.jobLink || '',
      description: job.description || '',
      status: job.is_active ? 'Active' : 'Inactive'
    });

    setIsEditing(true);
    setEditId(job.id);

    setTimeout(() => {
      const formSection = document.querySelector('.form-section');

      if (formSection) {
        formSection.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }, 150);
  };

  // ===== DELETE JOB FROM API =====
  const deleteJob = async (id) => {
    setLoading(true);

    try {
      await axios.delete(
        `${API_URL}/jobs/${id}/`,
        apiConfig()
      );

      await fetchJobs();
      showSuccessMsg('Job deleted successfully!');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Failed to delete job. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== HANDLE DELETE CONFIRMATION TOAST =====
  const handleDelete = (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <div
            style={{
              fontWeight: '600',
              marginBottom: '6px'
            }}
          >
            Delete Job?
          </div>

          <div
            style={{
              fontSize: '14px',
              marginBottom: '14px'
            }}
          >
            Are you sure you want to delete this job?
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}
          >
            <button
              type="button"
              onClick={closeToast}
              style={{
                border: 'none',
                borderRadius: '5px',
                padding: '7px 13px',
                cursor: 'pointer',
                backgroundColor: '#e5e7eb',
                color: '#111827',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={async () => {
                closeToast();
                await deleteJob(id);
              }}
              style={{
                border: 'none',
                borderRadius: '5px',
                padding: '7px 13px',
                cursor: 'pointer',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: '600'
              }}
            >
              Delete
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

  // ===== PAGINATION =====
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = filteredJobs.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(
    filteredJobs.length / itemsPerPage
  );

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getJobTypeClass = (type) => {
    return type === 'Government'
      ? 'job-type-govt'
      : 'job-type-private';
  };

  return (
    <div className="job-container">
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

      <div className="job-card">

        {/* ===== HEADER ===== */}
        <div className="job-header">
          <div className="job-title-group">
            <span className="job-icon">💼</span>

            <div>
              <h1>Job Management</h1>
              <p>Manage government & private jobs</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-add-toggle"
              onClick={() => setShowForm(!showForm)}
              disabled={loading}
            >
              {showForm ? '✕ Close' : '➕ Add Job'}
            </button>
          </div>
        </div>

        {/* ===== LOADING ===== */}
        {loading && (
          <div className="loading-msg">
            ⏳ Loading...
          </div>
        )}

        {/* ===== FORM ===== */}
        {showForm && (
          <div className="form-section">
            <div className="form-wrapper">
              <h3>
                {isEditing ? '✏️ Edit Job' : '➕ Add New Job'}
              </h3>

              <form
                onSubmit={handleSubmit}
                className="job-form"
              >
                {/* Row 1 - Title & Company */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Job Title <span className="req">*</span>
                    </label>

                    <input
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      placeholder="e.g., Software Engineer"
                      className={errors.jobTitle ? 'error' : ''}
                      disabled={loading}
                    />

                    {errors.jobTitle && (
                      <span className="err">
                        {errors.jobTitle}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Company Name <span className="req">*</span>
                    </label>

                    <input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g., Google"
                      className={errors.companyName ? 'error' : ''}
                      disabled={loading}
                    />

                    {errors.companyName && (
                      <span className="err">
                        {errors.companyName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2 - Type & Category */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Job Type <span className="req">*</span>
                    </label>

                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className={errors.jobType ? 'error' : ''}
                      disabled={loading}
                    >
                      <option value="Private">
                        🏢 Private
                      </option>

                      <option value="Government">
                        🏛️ Government
                      </option>
                    </select>

                    {errors.jobType && (
                      <span className="err">
                        {errors.jobType}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Category <span className="req">*</span>
                    </label>

                    <input
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="e.g., IT, Banking, Teaching"
                      className={errors.category ? 'error' : ''}
                      disabled={loading}
                    />

                    {errors.category && (
                      <span className="err">
                        {errors.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3 - Location & Salary */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Location <span className="req">*</span>
                    </label>

                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Delhi, Remote"
                      className={errors.location ? 'error' : ''}
                      disabled={loading}
                    />

                    {errors.location && (
                      <span className="err">
                        {errors.location}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Salary (₹)</label>

                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="e.g., 50000 - 80000"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Row 4 - Experience & Qualification */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Experience (Years)</label>

                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      placeholder="e.g., 2"
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Qualification</label>

                    <input
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      placeholder="e.g., B.Tech, MBA"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Row 5 - Last Date & Job Link */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Last Date <span className="req">*</span>
                    </label>

                    <input
                      type="date"
                      name="lastDate"
                      value={formData.lastDate}
                      onChange={handleChange}
                      className={errors.lastDate ? 'error' : ''}
                      disabled={loading}
                    />

                    {errors.lastDate && (
                      <span className="err">
                        {errors.lastDate}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Apply Link</label>

                    <input
                      type="url"
                      name="jobLink"
                      value={formData.jobLink}
                      onChange={handleChange}
                      placeholder="https://..."
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Row 6 - Status & Description */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Status</label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="Active">
                        ✅ Active
                      </option>

                      <option value="Inactive">
                        ❌ Inactive
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Description</label>

                    <input
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Job description..."
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading
                      ? '⏳ Saving...'
                      : isEditing
                        ? '💾 Update Job'
                        : '➕ Add Job'}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      ✕ Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-clear"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    🧹 Clear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== TABLE ===== */}
        {!showForm && (
          <div className="table-section">

            {/* Table Header */}
            <div className="table-header">
              <span className="table-title">
                📋 Job List ({filteredJobs.length})
              </span>

              <div className="table-controls">
                <input
                  type="text"
                  className="search-box"
                  placeholder="🔍 Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <button
                  className="btn-refresh"
                  onClick={fetchJobs}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Table Wrapper */}
            <div className="table-wrapper">
              {loading && jobs.length === 0 ? (
                <div className="loading-state">
                  ⏳ Loading jobs...
                </div>
              ) : (
                <table className="job-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Salary</th>
                      <th>Last Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((job, index) => {
                        const jobTitle =
                          job.job_title ||
                          job.jobTitle ||
                          '';

                        const companyName =
                          job.company_name ||
                          job.companyName ||
                          '';

                        const jobType =
                          job.job_type ||
                          job.jobType ||
                          '';

                        const jobCategory =
                          job.category || '';

                        const jobLocation =
                          job.location || '';

                        const salary =
                          job.salary_range ||
                          job.salary ||
                          '';

                        const lastDate =
                          job.application_deadline ||
                          job.lastDate ||
                          '';

                        const jobLink =
                          job.job_link ||
                          job.jobLink ||
                          '';

                        return (
                          <tr key={job.id}>
                            <td data-label="#">
                              {indexOfFirstItem + index + 1}
                            </td>

                            <td data-label="Title">
                              <strong>{jobTitle}</strong>
                            </td>

                            <td data-label="Company">
                              {companyName}
                            </td>

                            <td data-label="Type">
                              <span
                                className={`job-type-badge ${getJobTypeClass(jobType)}`}
                              >
                                {jobType === 'Government'
                                  ? '🏛️ Govt'
                                  : '🏢 Pvt'}
                              </span>
                            </td>

                            <td data-label="Category">
                              {jobCategory}
                            </td>

                            <td data-label="Location">
                              {jobLocation}
                            </td>

                            <td data-label="Salary">
                              {salary ? `₹${salary}` : '—'}
                            </td>

                            <td data-label="Last Date">
                              {lastDate
                                ? new Date(lastDate).toLocaleDateString('en-IN')
                                : '—'}
                            </td>

                            <td data-label="Actions">
                              <div className="actions-cell">
                                {jobLink && (
                                  <a
                                    href={jobLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-apply"
                                  >
                                    🔗 Link
                                  </a>
                                )}

                                <button
                                  className="btn-action edit"
                                  onClick={() => handleEdit(job)}
                                  disabled={loading}
                                  title="Edit Job"
                                >
                                  ✏️
                                </button>

                                <button
                                  className="btn-action delete"
                                  onClick={() => handleDelete(job.id)}
                                  disabled={loading}
                                  title="Delete Job"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="no-data"
                        >
                          {searchTerm
                            ? `❌ No jobs found for "${searchTerm}"`
                            : '📭 No jobs available. Click ➕ Add Job to start.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {filteredJobs.length > itemsPerPage && (
              <div className="pagination">
                <span className="page-info">
                  Showing {indexOfFirstItem + 1}–
                  {Math.min(
                    indexOfLastItem,
                    filteredJobs.length
                  )} of {filteredJobs.length} jobs
                </span>

                <div className="page-btns">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ◀
                  </button>

                  <span className="page-num">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobForm;