// JobReport.jsx - Complete Final (Toast + Govt/Pvt Text + Mobile Date Placeholder)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL, apiConfig } from '../../Api';
import './JobReports.css';

const JobReport = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState('All');
  const [franchiseCode, setFranchiseCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);

  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      return user;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchJobs();
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJobs = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${API_URL}/jobs/`, apiConfig());
      const jobsData = response.data;

      setJobs(jobsData);
      setFilteredJobs(jobsData);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = () => {
    const user = getCurrentUser();
    const fc = user?.franchise_code || '';

    setFranchiseCode(fc);

    const storedApps = JSON.parse(localStorage.getItem('jobApplications') || '[]');
    const franchiseApps = fc
      ? storedApps.filter(app => app.franchise_code === fc)
      : storedApps;

    setApplications(franchiseApps);
  };

  useEffect(() => {
    let result = jobs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      result = result.filter(job =>
        job.job_title?.toLowerCase().includes(term) ||
        job.company_name?.toLowerCase().includes(term) ||
        job.category?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term)
      );
    }

    if (selectedType !== 'All') {
      result = result.filter(job => job.job_type === selectedType);
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      result = result.filter(job =>
        new Date(job.created_at || job.createdAt) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      result = result.filter(job =>
        new Date(job.created_at || job.createdAt) <= end
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();

      return dateB - dateA;
    });

    setFilteredJobs(result);
    setCurrentPage(1);
  }, [searchTerm, selectedType, startDate, endDate, jobs]);

  const getApplicationCount = (jobId) => {
    return applications.filter(app => app.jobId === jobId).length;
  };

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentItems = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // ✅ Page Numbers with dots
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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

  const getJobTypeClass = (type) => {
    return type === 'Government' ? 'govt' : 'private';
  };

  // ===== SIMPLE PDF - SIRF TABLE =====
  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const tableRows = filteredJobs.map((job, index) => {
      const jobTitle = job.job_title || job.jobTitle || '';
      const companyName = job.company_name || job.companyName || '';
      const jobType = job.job_type || job.jobType || 'Private';
      const category = job.category || '';
      const location = job.location || '';
      const salary = job.salary_range || job.salary || '';
      const createdAt = job.created_at || job.createdAt || '';

      return `
      <tr>
        <td style="text-align:center;">${index + 1}</td>
        <td style="font-weight:600;">${jobTitle}</td>
        <td>${companyName}</td>
        <td style="text-align:center;">
          <span style="padding:2px 8px;border-radius:10px;background:${jobType === 'Government' ? '#dbeafe' : '#d1fae5'};color:${jobType === 'Government' ? '#1e40af' : '#065f46'};font-size:10px;font-weight:600;">
            ${jobType === 'Government' ? 'Govt' : 'Private'}
          </span>
        </td>
        <td>${category}</td>
        <td>${location}</td>
        <td style="text-align:right;">${salary ? '₹' + salary : '—'}</td>
        <td style="text-align:center;font-weight:700;color:#4f46e5;">${getApplicationCount(job.id)}</td>
        <td style="text-align:center;">${createdAt ? new Date(createdAt).toLocaleDateString('en-GB') : '—'}</td>
      </tr>`;
    }).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Job Report</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:Arial,sans-serif; }
        body { padding:20px; color:#1e293b; }
        .header {
          display:flex; justify-content:space-between; align-items:center;
          margin-bottom:15px; padding-bottom:10px; border-bottom:2px solid #1e2a44;
        }
        .logo-group { display:flex; align-items:center; gap:10px; }
        .logo-circle {
          width:45px; height:45px; border-radius:50%; border:2px solid #f59e0b;
          display:flex; align-items:center; justify-content:center;
          font-weight:700; font-size:12px; color:#1e2a44;
        }
        .brand-text h1 { font-size:18px; color:#1e2a44; }
        .brand-text p { font-size:9px; color:#f59e0b; font-weight:600; letter-spacing:1px; }
        .report-info { text-align:right; }
        .report-info h2 { font-size:16px; color:#1e2a44; }
        .report-info p { font-size:10px; color:#64748b; }
        table { width:100%; border-collapse:collapse; font-size:11px; margin-top:10px; }
        thead tr { background:#1e2a44; }
        thead th {
          color:#fff; padding:8px 6px; text-align:left;
          font-size:10px; font-weight:600; text-transform:uppercase;
        }
        tbody td { padding:6px; border-bottom:1px solid #f1f5f9; font-size:11px; }
        tbody tr:nth-child(even) { background:#f8fafc; }
        .footer {
          margin-top:15px; text-align:center; font-size:9px;
          color:#94a3b8; padding-top:8px; border-top:1px solid #e5e7eb;
        }
        @media print { body { padding:10px; } table { page-break-inside:avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-group">
          <div class="logo-circle">ESV</div>
          <div class="brand-text">
            <h1>EduSkillVision</h1>
            <p>EMPOWERING SKILLS, SHAPING FUTURES</p>
          </div>
        </div>
        <div class="report-info">
          <h2>JOB REPORT</h2>
          <p>Generated: ${currentDate}</p>
          <p>Total: ${filteredJobs.length} Jobs</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Job Title</th>
            <th>Company</th>
            <th>Type</th>
            <th>Category</th>
            <th>Location</th>
            <th style="text-align:right;">Salary</th>
            <th style="text-align:center;">Apps</th>
            <th style="text-align:center;">Date</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">
        © ${new Date().getFullYear()} EduSkillVision | Total: ${filteredJobs.length} Jobs
      </div>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => printWindow.print(), 300);
  };

  const totalJobs = filteredJobs.length;
  const totalGovt = filteredJobs.filter(j => (j.job_type || j.jobType) === 'Government').length;
  const totalPrivate = filteredJobs.filter(j => (j.job_type || j.jobType) === 'Private').length;
  const totalApps = applications.length;

  return (
    <>
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

      {loading ? (
        <div className="jr-container">
          <div className="jr-card">
            <h3>⏳ Loading...</h3>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="jr-container">
          <div className="jr-card">
            <div className="jr-header">
              <div className="jr-header-left">
                <h2>💼 Job Report</h2>
              </div>
            </div>

            <div className="jr-empty">
              <h3>No jobs found</h3>
            </div>
          </div>
        </div>
      ) : (
        <div className={`jr-container ${isSearchFocused ? 'search-active' : ''}`}>
          <div className="jr-card">

            {/* ===== HEADER ===== */}
            <div className="jr-header">
              <div className="jr-header-left">
                <h2>💼 Job Report</h2>

                {franchiseCode && (
                  <span className="jr-badge">
                    🏷️ {franchiseCode}
                  </span>
                )}
              </div>

              <div className="jr-actions">
                <button
                  className="jr-btn jr-btn-refresh"
                  onClick={fetchJobs}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>

                <button
                  className="jr-btn jr-btn-pdf"
                  onClick={generatePDF}
                  disabled={loading}
                >
                  📄 PDF
                </button>
              </div>
            </div>

            {/* ===== FILTER ROW ===== */}
            <div className="jr-filter-row">
              <input
                type="text"
                className="jr-search"
                placeholder="🔍 Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />

              <select
                className="jr-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All">📌 All Types</option>
                <option value="Government">🏛️ Govt</option>
                <option value="Private">🏢 Pvt</option>
              </select>

              {/* Date inputs - Mobile + Laptop dono me dd/mm/yyyy dikhega */}
              <div className="jr-date-group">
                <input
                  type={startFocused || startDate ? 'date' : 'text'}
                  className="jr-date"
                  placeholder="dd/mm/yyyy"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onFocus={() => setStartFocused(true)}
                  onBlur={() => setStartFocused(false)}
                  title="Start Date"
                />

                <span>→</span>

                <input
                  type={endFocused || endDate ? 'date' : 'text'}
                  className="jr-date"
                  placeholder="dd/mm/yyyy"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onFocus={() => setEndFocused(true)}
                  onBlur={() => setEndFocused(false)}
                  title="End Date"
                />
              </div>
            </div>

            {/* ===== STATS ===== */}
            <div className="jr-stats">
              <div className="jr-stat">
                <span className="jr-stat-label">📊 Total</span>
                <span className="jr-stat-value">{totalJobs}</span>
              </div>

              <div className="jr-stat">
                <span className="jr-stat-label">🏛️ Govt</span>
                <span className="jr-stat-value" style={{ color: '#2b6cb0' }}>
                  {totalGovt}
                </span>
              </div>

              <div className="jr-stat">
                <span className="jr-stat-label">🏢 Pvt</span>
                <span className="jr-stat-value" style={{ color: '#48bb78' }}>
                  {totalPrivate}
                </span>
              </div>

              <div className="jr-stat">
                <span className="jr-stat-label">📋 Apps</span>
                <span className="jr-stat-value" style={{ color: '#667eea' }}>
                  {totalApps}
                </span>
              </div>
            </div>

            {/* ===== TABLE ===== */}
            <div className="jr-table-wrap">
              <table className="jr-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Job</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Salary</th>
                    <th>Apps</th>
                    <th>Date</th>
                    <th>Apply</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((job, index) => {
                      const jobTitle = job.job_title || job.jobTitle || '';
                      const companyName = job.company_name || job.companyName || '';
                      const jobType = job.job_type || job.jobType || 'Private';
                      const category = job.category || '';
                      const location = job.location || '';
                      const salary = job.salary_range || job.salary || '';
                      const createdAt = job.created_at || job.createdAt || '';
                      const jobLink = job.job_link || job.jobLink || '';

                      return (
                        <tr key={job.id}>
                          <td>{indexOfFirstItem + index + 1}</td>

                          <td>
                            <strong>{jobTitle}</strong>
                          </td>

                          <td>{companyName}</td>

                          <td>
                            <span className={`jr-type ${getJobTypeClass(jobType)}`}>
                              {jobType === 'Government' ? '🏛️ Govt' : '🏢 Pvt'}
                            </span>
                          </td>

                          <td>{category}</td>
                          <td>{location}</td>
                          <td>₹{salary || '—'}</td>

                          <td className="jr-app-count">
                            {getApplicationCount(job.id)}
                          </td>

                          <td>
                            {createdAt
                              ? new Date(createdAt).toLocaleDateString()
                              : '—'}
                          </td>

                          <td>
                            {jobLink ? (
                              <a
                                href={jobLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="jr-link"
                              >
                                Apply
                              </a>
                            ) : (
                              <span className="jr-no-link">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="jr-no-data">
                        No jobs found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
              <div className="jr-pagination">
                <span className="jr-page-info">
                  Showing <strong>{indexOfFirstItem + 1}</strong> -{' '}
                  <strong>{Math.min(indexOfLastItem, filteredJobs.length)}</strong>{' '}
                  of <strong>{filteredJobs.length}</strong>
                </span>

                <div className="jr-page-btns">
                  <button
                    className="jr-page-btn"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ◀
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                      <span key={`dots-${idx}`} className="jr-dots">
                        ...
                      </span>
                    ) : (
                      <button
                        key={idx}
                        className={`jr-page-btn ${currentPage === page ? 'jr-active' : ''}`}
                        onClick={() => paginate(page)}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    className="jr-page-btn"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default JobReport;