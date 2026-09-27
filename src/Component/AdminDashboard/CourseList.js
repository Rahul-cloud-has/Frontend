// CourseReport.jsx - Fixed Pagination + Scroll (Toast Only - Nothing Else Changed)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL, apiConfig } from '../../Api';
import './CourseList.css';

const CourseReport = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [, setCategoriesList] = useState([]);
  const [, setSessionsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [franchiseCode, setFranchiseCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setUserType] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const getCurrentUser = () => {
    try {
      const user =
        JSON.parse(localStorage.getItem('currentUser')) ||
        JSON.parse(localStorage.getItem('user')) ||
        JSON.parse(localStorage.getItem('franchiseUser'));
      return user;
    } catch {
      return null;
    }
  };

  const getFranchiseCode = () => {
    try {
      return (
        localStorage.getItem('franchiseCode') ||
        localStorage.getItem('franchise_code') ||
        ''
      );
    } catch {
      return '';
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveCategoryName = (category, categoriesArr) => {
    if (!category) return 'N/A';
    if (typeof category === 'object' && category.name) return category.name;
    const catId = category?.id || category;
    const found = categoriesArr.find(c => c.id === parseInt(catId));
    return found ? found.name : 'N/A';
  };

  const resolveSessionName = (session, sessionsArr) => {
    if (!session) return 'N/A';
    if (typeof session === 'object' && session.name) return session.name;
    const sesId = session?.id || session;
    const found = sessionsArr.find(s => s.id === parseInt(sesId));
    return found ? found.name : 'N/A';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      const fc =
        getFranchiseCode() ||
        user?.franchise_code ||
        user?.franchiseCode ||
        '';
      setFranchiseCode(fc);
      const uType = localStorage.getItem('userType') || 'admin';
      setUserType(uType);

      const [catRes, sesRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/categories/`, apiConfig()),
        axios.get(`${API_URL}/sessions/`, apiConfig()),
        axios.get(`${API_URL}/courses/`, apiConfig()),
      ]);

      const catsData = Array.isArray(catRes.data)
        ? catRes.data
        : catRes.data.data || catRes.data.results || [];
      const sesData = Array.isArray(sesRes.data)
        ? sesRes.data
        : sesRes.data.data || sesRes.data.results || [];
      setCategoriesList(catsData);
      setSessionsList(sesData);

      let coursesData = coursesRes.data;
      if (!Array.isArray(coursesData)) {
        coursesData = coursesData.data || coursesData.results || [];
      }

      const mappedCourses = coursesData.map(c => ({
        ...c,
        id: c.id,
        course_name: c.course_name || c.courseName || '',
        category_name: resolveCategoryName(c.category, catsData),
        session_name: resolveSessionName(c.sessions, sesData),
        fee: c.fee || 0,
        description: c.description || '',
        franchise_code: c.franchise_code || c.franchiseCode || '',
      }));

      let filteredByFranchise = mappedCourses;
      if (uType === 'franchise' && fc) {
        filteredByFranchise = mappedCourses.filter(
          c =>
            c.franchise_code === fc ||
            c.franchise_code === '' ||
            c.franchise_code === null
        );
      }

      setCourses(filteredByFranchise);
      setFilteredCourses(filteredByFranchise);

      const uniqueCategories = [
        ...new Set(filteredByFranchise.map(c => c.category_name)),
      ].filter(c => c && c !== 'N/A');
      setCategories(uniqueCategories);

      const storedStudents = JSON.parse(
        localStorage.getItem('students') || '[]'
      );
      let franchiseStudents = storedStudents;
      if (uType === 'franchise' && fc) {
        franchiseStudents = storedStudents.filter(
          s => s.franchise_code === fc || s.franchiseCode === fc
        );
      }
      setStudents(franchiseStudents);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = courses;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        course =>
          course.course_name?.toLowerCase().includes(term) ||
          course.category_name?.toLowerCase().includes(term) ||
          course.session_name?.toLowerCase().includes(term)
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter(
        course => course.category_name === selectedCategory
      );
    }
    setFilteredCourses(result);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, courses]);

  const getStudentCount = courseName => {
    return students.filter(
      s => s.courseName === courseName || s.course_name === courseName
    ).length;
  };

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = pageNumber => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // ✅ Smart Page Numbers: 1 2 3 ... 10
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage <= 3) {
        pages.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          '...',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        );
      }
    }
    return pages;
  };

  // ===== PDF =====
  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    const totalAmount = filteredCourses.reduce(
      (sum, c) => sum + (parseFloat(c.fee) || 0),
      0
    );
    const totalStudents = students.length;
    const totalCoursesCount = filteredCourses.length;
    const currentDate = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const tableRows = filteredCourses
      .map((course, index) => {
        const courseName = course.course_name || '';
        return `
        <tr>
          <td style="text-align:center;">${index + 1}</td>
          <td style="text-align:center;color:#4f46e5;font-weight:600;">#${course.id}</td>
          <td>
            <span style="padding:3px 10px;border-radius:12px;background:#e0e7ff;color:#4338ca;font-size:10px;font-weight:600;">
              ${course.category_name || 'N/A'}
            </span>
          </td>
          <td style="font-weight:600;">${courseName}</td>
          <td>
            <span style="padding:3px 10px;border-radius:12px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:600;">
              ${course.session_name || 'N/A'}
            </span>
          </td>
          <td style="text-align:right;font-weight:700;color:#e94560;">₹${course.fee || 0}</td>
          <td style="text-align:center;font-weight:700;color:#4f46e5;">${getStudentCount(courseName)}</td>
          <td style="text-align:center;">
            <span style="padding:3px 10px;border-radius:12px;background:#d1fae5;color:#065f46;font-size:10px;font-weight:600;">Active</span>
          </td>
        </tr>`;
      })
      .join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Course Report</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Arial',sans-serif; }
        body { background:#fff; color:#1e293b; padding:20px; }
        .top-bar { display:flex; justify-content:space-between; font-size:11px; color:#64748b; padding-bottom:6px; margin-bottom:8px; }
        .contact-bar { background:#1e2a44; color:#fff; padding:10px 20px; display:flex; justify-content:space-between; align-items:center; font-size:12px; border-bottom:3px solid #f59e0b; margin-bottom:20px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .logo-group { display:flex; align-items:center; gap:12px; }
        .logo-circle { width:55px; height:55px; border-radius:50%; border:3px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:#1e2a44; }
        .brand-text h1 { font-size:22px; color:#1e2a44; font-weight:700; }
        .brand-text p { font-size:10px; color:#f59e0b; font-weight:600; letter-spacing:1.5px; }
        .report-title { text-align:right; }
        .report-title h2 { font-size:20px; color:#1e2a44; font-weight:700; }
        .report-title p { font-size:10px; color:#64748b; }
        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
        .stat-box { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center; }
        .stat-box .value { font-size:20px; font-weight:700; color:#1e2a44; }
        .stat-box .label { font-size:9px; color:#64748b; text-transform:uppercase; }
        table { width:100%; border-collapse:collapse; font-size:10.5px; margin-bottom:20px; }
        thead tr { background:#1e2a44; }
        thead th { color:#fff; padding:8px 6px; text-align:left; font-size:10px; font-weight:600; text-transform:uppercase; }
        tbody td { padding:6px; border-bottom:1px solid #f1f5f9; color:#1e293b; }
        tbody tr:nth-child(even) { background:#f8fafc; }
        .total-row td { padding:10px 6px; font-size:11px; font-weight:700; color:#1e2a44; border-top:2px solid #1e2a44; }
        .footer { margin-top:15px; text-align:center; font-size:9px; color:#94a3b8; padding-top:10px; border-top:1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="top-bar"><span>${currentDate}</span><span>Course Report</span></div>
      <div class="contact-bar">
        <span>📞 +91 8818800802</span>
        <span>✉️ info@eduskillvision.com</span>
        <span>🌐 www.eduskillvision.com</span>
      </div>
      <div class="header">
        <div class="logo-group">
          <div class="logo-circle">ESV</div>
          <div class="brand-text">
            <h1>EduSkillVision</h1>
            <p>EMPOWERING SKILLS, SHAPING FUTURES</p>
          </div>
        </div>
        <div class="report-title">
          <h2>COURSE REPORT</h2>
          <p>Generated: ${currentDate}</p>
          <p>Total: ${totalCoursesCount} ${franchiseCode ? '| Franchise: ' + franchiseCode : ''}</p>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><div class="value">${totalCoursesCount}</div><div class="label">Total Courses</div></div>
        <div class="stat-box"><div class="value">${categories.length}</div><div class="label">Categories</div></div>
        <div class="stat-box"><div class="value">${totalStudents}</div><div class="label">Students</div></div>
        <div class="stat-box"><div class="value">₹${totalAmount.toFixed(0)}</div><div class="label">Total Fee</div></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th><th>ID</th><th>Category</th>
            <th>Course</th><th>Duration</th>
            <th style="text-align:right;">Fee (₹)</th>
            <th style="text-align:center;">Students</th>
            <th style="text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr class="total-row">
            <td colspan="5" style="text-align:right;">TOTAL:</td>
            <td style="text-align:right;">₹${totalAmount.toFixed(0)}</td>
            <td style="text-align:center;">${totalStudents}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="footer">© ${new Date().getFullYear()} EduSkillVision</div>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  // ===== CSV =====
  const downloadCSV = () => {
    const headers = [
      'S.No','ID','Category','Course Name',
      'Duration','Fee (₹)','Students','Description',
    ];
    const rows = filteredCourses.map((course, index) => {
      const courseName = course.course_name || '';
      return [
        index + 1,
        `#${course.id}`,
        course.category_name || 'N/A',
        courseName,
        course.session_name || 'N/A',
        course.fee || 0,
        getStudentCount(courseName),
        (course.description || '').replace(/,/g, ';').replace(/\n/g, ' '),
      ];
    });

    const totalFee = filteredCourses.reduce(
      (sum, c) => sum + (parseFloat(c.fee) || 0),
      0
    );
    rows.push(['', '', '', '', 'TOTAL:', totalFee, students.length, '']);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Course_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => generatePDF();

  const totalCourses = filteredCourses.length;
  const totalStudents = students.length;
  const totalFee = filteredCourses.reduce(
    (sum, c) => sum + (parseFloat(c.fee) || 0),
    0
  );

  if (loading) {
    return (
      <div className="cr-container">
        <div className="cr-card">
          <h3>⏳ Loading...</h3>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="cr-container">
        <div className="cr-card">
          <div className="cr-header">
            <div className="cr-header-left">
              <h2>📚 Course Report</h2>
              {franchiseCode && (
                <span className="cr-badge">🏷️ {franchiseCode}</span>
              )}
            </div>
          </div>
          <div className="cr-empty">
            <h3>No courses found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cr-container ${isSearchFocused ? 'search-active' : ''}`}>
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

      <div className="cr-card">

        {/* ===== HEADER ===== */}
        <div className="cr-header">
          <div className="cr-header-left">
            <h2>📚 Course Report</h2>
            {franchiseCode && (
              <span className="cr-badge">🏷️ {franchiseCode}</span>
            )}
          </div>
          <div className="cr-actions">
            <button className="cr-btn cr-btn-refresh" onClick={fetchData}>
              🔄 Refresh
            </button>
            <button className="cr-btn cr-btn-csv" onClick={downloadCSV}>
              📊 CSV
            </button>
            <button className="cr-btn cr-btn-print" onClick={printReport}>
              🖨️ Print
            </button>
            <button className="cr-btn cr-btn-pdf" onClick={generatePDF}>
              📄 PDF
            </button>
          </div>
        </div>

        {/* ===== FILTER ROW ===== */}
        <div className="cr-filter-row">
          <input
            type="text"
            className="cr-search"
            placeholder="🔍 Search courses..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          <select
            className="cr-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="All">📚 All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* ===== STATS ===== */}
        <div className="cr-stats">
          <div className="cr-stat">
            <span className="cr-stat-label">📊 Total</span>
            <span className="cr-stat-value">{totalCourses}</span>
          </div>
          <div className="cr-stat">
            <span className="cr-stat-label">📚 Categories</span>
            <span className="cr-stat-value" style={{ color: '#4338ca' }}>
              {categories.length}
            </span>
          </div>
          <div className="cr-stat">
            <span className="cr-stat-label">👨‍🎓 Students</span>
            <span className="cr-stat-value" style={{ color: '#667eea' }}>
              {totalStudents}
            </span>
          </div>
          <div className="cr-stat">
            <span className="cr-stat-label">💰 Fee</span>
            <span className="cr-stat-value" style={{ color: '#e94560' }}>
              ₹{totalFee.toFixed(0)}
            </span>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Course</th>
                <th>Duration</th>
                <th>Fee</th>
                <th>Students</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((course, index) => {
                  const courseName = course.course_name || '';
                  return (
                    <tr key={course.id || index}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>
                        <span className="cat-badge">
                          {course.category_name || '-'}
                        </span>
                      </td>
                      <td><strong>{courseName}</strong></td>
                      <td>
                        <span className="dur-badge">
                          {course.session_name || '-'}
                        </span>
                      </td>
                      <td className="fee-amount">₹{course.fee || 0}</td>
                      <td className="cr-student-count">
                        {getStudentCount(courseName)}
                      </td>
                      <td className="cr-desc">{course.description || '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="cr-no-data">
                    No courses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <div className="cr-pagination">
            {/* Info */}
            <span className="cr-page-info">
              Showing <strong>{indexOfFirstItem + 1}</strong> -{' '}
              <strong>
                {Math.min(indexOfLastItem, filteredCourses.length)}
              </strong>{' '}
              of <strong>{filteredCourses.length}</strong>
            </span>

            {/* Page Buttons */}
            <div className="cr-page-btns">
              {/* Prev */}
              <button
                className="cr-page-btn"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ◀
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`dots-${idx}`} className="cr-dots">
                    ...
                  </span>
                ) : (
                  <button
                    key={idx}
                    className={`cr-page-btn ${currentPage === page ? 'cr-active' : ''}`}
                    onClick={() => paginate(page)}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next */}
              <button
                className="cr-page-btn"
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
  );
};

export default CourseReport;