// GenerateFranchiseReport.js - Complete with View, Edit, Print, CSV
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_URL, apiConfig } from '../../../Api';
import './GenerateFranchiseReport.css';

const GenerateFranchiseReport = () => {
  // ===== STATE =====
  const [generatedHistory, setGeneratedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ✅ Modal & Edit States
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ============================================
  // 📤 LOAD DATA FROM API
  // ============================================
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/generated-franchises/`, apiConfig());
      
      let data = [];
      if (response.data && response.data.data) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      const mappedData = data.map(item => ({
        id: item.id,
        requestId: item.request_id,
        applicantName: item.applicant_name || '',
        franchiseName: item.franchise_name || '',
        email: item.email || '',
        mobile: item.mobile || '',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        pincode: item.pincode || '',
        agreementDate: item.agreement_date,
        validityDate: item.validity_date,
        notes: item.notes || '',
        selectedCourses: item.selected_courses || [],
        totalAmount: Number(item.total_amount) || 0,
        status: item.status || 'Generated',
        createdAt: item.created_at
      }));
      
      setGeneratedHistory(mappedData);
      
    } catch (error) {
      console.error('❌ API Error:', error);
      setError('Failed to load generated franchises. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================
  // 🔍 FILTER DATA
  // ============================================
  const filteredData = useMemo(() => {
    let filtered = generatedHistory;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        (item.applicantName || '').toLowerCase().includes(term) ||
        (item.franchiseName || '').toLowerCase().includes(term) ||
        (item.mobile || '').includes(term) ||
        String(item.id).includes(term) ||
        (item.email || '').toLowerCase().includes(term) ||
        (item.city || '').toLowerCase().includes(term) ||
        (item.state || '').toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item =>
        (item.status || 'Generated').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return filtered;
  }, [generatedHistory, searchTerm, statusFilter]);

  // ============================================
  // 📄 PAGINATION LOGIC
  // ============================================
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice().reverse().slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

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

  // ============================================
  // 📊 STATS
  // ============================================
  const stats = useMemo(() => {
    const total = generatedHistory.length;
    const totalAmount = generatedHistory.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
    const totalCourses = generatedHistory.reduce((sum, item) => sum + (item.selectedCourses ? item.selectedCourses.length : 0), 0);
    
    return {
      total,
      totalAmount,
      totalCourses,
      avgAmount: total > 0 ? Math.round(totalAmount / total) : 0
    };
  }, [generatedHistory]);

  // ============================================
  // 👁️ VIEW DETAILS
  // ============================================
  const handleViewDetails = (item) => {
    setSelectedFranchise(item);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedFranchise(null);
  };

  // ============================================
  // ✏️ EDIT FRANCHISE
  // ============================================
  const handleEdit = (item) => {
    setEditData({ ...item });
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditData(null);
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    
    setIsSaving(true);
    try {
      const dataToSave = {
        applicant_name: editData.applicantName,
        franchise_name: editData.franchiseName,
        email: editData.email,
        mobile: editData.mobile,
        address: editData.address,
        city: editData.city,
        state: editData.state,
        pincode: editData.pincode,
        agreement_date: editData.agreementDate,
        validity_date: editData.validityDate,
        notes: editData.notes,
        selected_courses: editData.selectedCourses,
        total_amount: editData.totalAmount,
        status: editData.status
      };

      await axios.put(
        `${API_URL}/generated-franchises/${editData.id}/`,
        dataToSave,
        apiConfig()
      );
      
      alert('✅ Franchise updated successfully!');
      handleCloseEdit();
      await loadData();
      
    } catch (error) {
      console.error('❌ Error updating:', error);
      alert('Failed to update franchise. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // 📥 EXPORT CSV
  // ============================================
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'S.No', 'Agreement ID', 'Request ID', 'Applicant Name', 'Franchise Name', 
      'Email', 'Mobile', 'Address', 'City', 'State', 'Pincode',
      'Courses', 'Total Amount', 'Agreement Date', 'Validity Date', 'Status', 'Created Date'
    ];
    
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      item.id || 'N/A',
      item.requestId || 'N/A',
      `"${(item.applicantName || 'N/A').replace(/"/g, '""')}"`,
      `"${(item.franchiseName || 'N/A').replace(/"/g, '""')}"`,
      item.email || 'N/A',
      item.mobile || 'N/A',
      `"${(item.address || 'N/A').replace(/"/g, '""')}"`,
      item.city || 'N/A',
      item.state || 'N/A',
      item.pincode || 'N/A',
      item.selectedCourses ? item.selectedCourses.length : 0,
      Number(item.totalAmount) || 0,
      item.agreementDate || 'N/A',
      item.validityDate || 'N/A',
      item.status || 'Generated',
      item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `franchise_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ============================================
  // 🖨️ PROFESSIONAL PRINT - Opens in NEW WINDOW (Card NOT shown)
  // ============================================
  const handlePrint = () => {
    if (filteredData.length === 0) {
      alert('No data to print!');
      return;
    }

    const printDate = new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const tableRows = filteredData.map((item, index) => `
      <tr>
        <td style="text-align:center;">${index + 1}</td>
        <td>#${item.id}</td>
        <td>${item.applicantName || '-'}</td>
        <td>${item.franchiseName || '—'}</td>
        <td>${item.mobile || '-'}</td>
        <td>${item.city || '-'}</td>
        <td>${item.state || '-'}</td>
        <td style="text-align:center;">${item.selectedCourses ? item.selectedCourses.length : 0}</td>
        <td style="text-align:right;font-weight:600;">₹${(item.totalAmount || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:center;">
          <span class="status-badge status-${(item.status || 'generated').toLowerCase()}">
            ${item.status || 'Generated'}
          </span>
        </td>
        <td>${item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-'}</td>
      </tr>
    `).join('');

    const totalCoursesSum = filteredData.reduce((sum, item) => sum + (item.selectedCourses ? item.selectedCourses.length : 0), 0);
    const totalAmountSum = filteredData.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);

    const printHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Generated Franchises Report</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 20px;
    }
    
    .print-container {
      max-width: 1200px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
    }
    
    .top-bar {
      background: #0a1e3f;
      color: #ffffff;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 500;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .yellow-line {
      height: 3px;
      background: #d4a017;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .main-header {
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    .logo-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 2px solid #d4a017;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: #d4a017;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .brand-info h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0a1e3f;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    
    .brand-info h1 .yellow-text {
      color: #d4a017;
    }
    
    .brand-info p {
      font-size: 10px;
      color: #6b7280;
      font-weight: 600;
      letter-spacing: 1.5px;
    }
    
    .report-title {
      text-align: right;
    }
    
    .report-title h2 {
      font-size: 18px;
      font-weight: 700;
      color: #0a1e3f;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    
    .report-title p {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .stats-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 15px 24px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .stat-item {
      text-align: center;
      padding: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .stat-item .value {
      font-size: 16px;
      font-weight: 700;
      color: #0a1e3f;
      margin-bottom: 2px;
    }
    
    .stat-item .label {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    
    .print-table-wrap {
      padding: 15px 24px;
    }
    
    .print-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      border: 1px solid #e5e7eb;
    }
    
    .print-table thead {
      background: #0a1e3f;
      color: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .print-table th {
      padding: 8px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      border: 1px solid #0a1e3f;
      color: #ffffff;
      background: #0a1e3f;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .print-table td {
      padding: 7px 8px;
      border: 1px solid #e5e7eb;
      color: #0f172a;
      font-size: 10px;
      vertical-align: middle;
    }
    
    .print-table tbody tr:nth-child(even) {
      background: #f9fafb;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .print-table tfoot {
      background: #f0f0f0;
      font-weight: 700;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .print-table tfoot td {
      padding: 8px;
      border-top: 2px solid #0a1e3f;
      font-size: 11px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
      text-align: center;
      min-width: 60px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .status-generated { background: #dbeafe !important; color: #1e40af !important; }
    .status-approved { background: #d1fae5 !important; color: #065f46 !important; }
    .status-pending { background: #fef3c7 !important; color: #92400e !important; }
    .status-rejected { background: #fee2e2 !important; color: #991b1b !important; }
    .status-active { background: #d1fae5 !important; color: #065f46 !important; }
    .status-inactive { background: #fee2e2 !important; color: #991b1b !important; }
    
    .print-footer {
      padding: 12px 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
    }
    
    @media screen and (max-width: 768px) {
      body { padding: 10px; }
      .top-bar { flex-direction: column; gap: 4px; text-align: center; font-size: 10px; padding: 8px 12px; }
      .main-header { flex-direction: column; gap: 12px; padding: 14px; }
      .logo-section { justify-content: center; }
      .report-title { text-align: center; }
      .brand-info h1 { font-size: 18px; }
      .report-title h2 { font-size: 15px; }
      .stats-summary { grid-template-columns: repeat(2, 1fr); padding: 10px; }
      .stat-item .value { font-size: 14px; }
      .stat-item .label { font-size: 8px; }
      .print-table-wrap { padding: 10px; overflow-x: auto; }
      .print-table { font-size: 9px; min-width: 900px; }
      .print-table th, .print-table td { padding: 5px 6px; font-size: 9px; }
    }
    
    @media print {
      body { padding: 0; margin: 0; }
      .print-container { border: none; max-width: 100%; }
      .print-btn-wrap { display: none !important; }
      
      .top-bar, .yellow-line, .logo-circle,
      .print-table thead, .print-table th,
      .stats-summary, .stat-item,
      .status-badge, .status-generated, .status-approved,
      .status-pending, .status-rejected, .status-active, .status-inactive,
      .print-table tbody tr:nth-child(even),
      .print-table tfoot {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      @page { size: A4 landscape; margin: 8mm; }
      .print-table tbody tr { page-break-inside: avoid; }
    }
    
    .print-btn-wrap {
      text-align: center;
      padding: 15px;
      background: #f8fafc;
      border-top: 1px solid #e5e7eb;
    }
    
    .btn-print, .btn-close {
      display: inline-block;
      padding: 10px 24px;
      margin: 0 6px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    
    .btn-print { background: #0a1e3f; color: #ffffff; }
    .btn-print:hover { background: #1e3a8a; }
    .btn-close { background: #e5e7eb; color: #374151; }
    .btn-close:hover { background: #d1d5db; }
  </style>
</head>
<body>
  <div class="print-container">
    
    <div class="top-bar">
      <span>+91 8818800802</span>
      <span>info@eduskillvision.com</span>
      <span>www.eduskillvision.com</span>
    </div>
    
    <div class="yellow-line"></div>
    
    <div class="main-header">
      <div class="logo-section">
        <div class="logo-circle">ESV</div>
        <div class="brand-info">
          <h1>Edu<span class="yellow-text">Skill</span>Vision</h1>
          <p>EMPOWERING SKILLS, SHAPING FUTURES</p>
        </div>
      </div>
      <div class="report-title">
        <h2>GENERATED FRANCHISES REPORT</h2>
        <p>Generated: ${printDate}</p>
        <p>Total Records: ${filteredData.length}</p>
      </div>
    </div>
    
    <div class="stats-summary">
      <div class="stat-item">
        <div class="value">${stats.total}</div>
        <div class="label">Total Franchises</div>
      </div>
      <div class="stat-item">
        <div class="value">₹${Number(stats.totalAmount).toLocaleString('en-IN')}</div>
        <div class="label">Total Revenue</div>
      </div>
      <div class="stat-item">
        <div class="value">${stats.totalCourses}</div>
        <div class="label">Total Courses</div>
      </div>
      <div class="stat-item">
        <div class="value">₹${Number(stats.avgAmount).toLocaleString('en-IN')}</div>
        <div class="label">Avg. per Franchise</div>
      </div>
    </div>
    
    <div class="print-table-wrap">
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:4%;">S.No</th>
            <th style="width:6%;">ID</th>
            <th style="width:14%;">Applicant</th>
            <th style="width:14%;">Franchise Name</th>
            <th style="width:10%;">Mobile</th>
            <th style="width:9%;">City</th>
            <th style="width:9%;">State</th>
            <th style="width:6%;">Courses</th>
            <th style="width:10%;">Total (₹)</th>
            <th style="width:9%;">Status</th>
            <th style="width:9%;">Date</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="7" style="text-align:right;"><strong>TOTAL:</strong></td>
            <td style="text-align:center;"><strong>${totalCoursesSum}</strong></td>
            <td style="text-align:right;"><strong>₹${totalAmountSum.toLocaleString('en-IN')}</strong></td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <div class="print-footer">
      © ${new Date().getFullYear()} EduSkillVision - Empowering Skills, Shaping Futures | Generated Franchises Report
    </div>
    
    <div class="print-btn-wrap">
      <button class="btn-print" onclick="window.print()">🖨️ Print Now</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
    
  </div>
</body>
</html>`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      const blob = new Blob([printHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (!printWindow) {
        alert('Please allow popups to print!');
        URL.revokeObjectURL(url);
        return;
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
      if (!printWindow) {
        alert('Please allow popups to print!');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      };
    }
  };

  // ============================================
  // 🔄 RESET
  // ============================================
  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  if (loading) {
    return (
      <div className="gfr-report-loading">
        <div className="gfr-report-spinner"></div>
        <p>⏳ Loading report...</p>
      </div>
    );
  }

  return (
    <div className="gfr-report-container">
      <div className="gfr-report-card">
        {/* Header */}
        <div className="gfr-report-header">
          <div>
            <h1 className="gfr-report-title">Generated Franchises Report</h1>
            <p className="gfr-report-subtitle">View all generated franchise agreements</p>
          </div>
          <div className="gfr-report-header-actions">
            <button className="gfr-report-btn gfr-report-btn-csv" onClick={handleExportCSV}>
              📥 CSV
            </button>
            <button className="gfr-report-btn gfr-report-btn-print" onClick={handlePrint}>
              🖨️ Print
            </button>
            <button className="gfr-report-btn gfr-report-btn-refresh" onClick={loadData}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            padding: '10px 14px', 
            borderRadius: '8px', 
            marginBottom: '12px',
            fontSize: '12px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats */}
        <div className="gfr-report-stats-grid">
          <div className="gfr-report-stat-card gfr-report-stat-total">
            <div className="gfr-report-stat-number">{stats.total}</div>
            <div className="gfr-report-stat-label">Total Franchises</div>
          </div>
          <div className="gfr-report-stat-card gfr-report-stat-amount">
            <div className="gfr-report-stat-number">₹{Number(stats.totalAmount).toLocaleString('en-IN')}</div>
            <div className="gfr-report-stat-label">Total Revenue</div>
          </div>
          <div className="gfr-report-stat-card gfr-report-stat-courses">
            <div className="gfr-report-stat-number">{stats.totalCourses}</div>
            <div className="gfr-report-stat-label">Total Courses Sold</div>
          </div>
          <div className="gfr-report-stat-card gfr-report-stat-avg">
            <div className="gfr-report-stat-number">₹{Number(stats.avgAmount).toLocaleString('en-IN')}</div>
            <div className="gfr-report-stat-label">Average per Franchise</div>
          </div>
        </div>

        {/* Filters */}
        <div className="gfr-report-filters">
          <div className="gfr-report-search-wrapper">
            <span className="gfr-report-search-icon">🔍</span>
            <input
              type="text"
              className="gfr-report-search-input"
              placeholder="Search by name, franchise, mobile, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="gfr-report-filter-group">
            <select
              className="gfr-report-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="generated">Generated</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="gfr-report-btn gfr-report-btn-reset" onClick={handleReset}>
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="gfr-report-table-wrapper">
          {paginatedData.length > 0 ? (
            <table className="gfr-report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Agreement ID</th>
                  <th>Applicant</th>
                  <th>Franchise Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Courses</th>
                  <th>Total (₹)</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{startIndex + index + 1}</td>
                    <td><span className="gfr-report-id">#{item.id}</span></td>
                    <td><strong>{item.applicantName}</strong></td>
                    <td>{item.franchiseName || '—'}</td>
                    <td>{item.mobile}</td>
                    <td>{item.email}</td>
                    <td>{item.selectedCourses ? item.selectedCourses.length : 0}</td>
                    <td className="gfr-report-amount">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={'gfr-report-status ' + (item.status || 'generated').toLowerCase()}>
                        {item.status || 'Generated'}
                      </span>
                    </td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="gfr-report-actions">
                        <button 
                          className="gfr-report-action-btn gfr-report-view-btn" 
                          onClick={() => handleViewDetails(item)}
                          title="View"
                        >
                          👁️
                        </button>
                        <button 
                          className="gfr-report-action-btn gfr-report-edit-btn" 
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="gfr-report-footer">
                  <td colSpan="6"><strong>Total</strong></td>
                  <td><strong>{filteredData.reduce((sum, item) => sum + (item.selectedCourses ? item.selectedCourses.length : 0), 0)}</strong></td>
                  <td><strong>₹{filteredData.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0).toLocaleString('en-IN')}</strong></td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="gfr-report-no-data">
              <span className="gfr-report-empty-icon">📭</span>
              <p>No generated franchises found</p>
              <span className="gfr-report-empty-hint">Generate a franchise first to see reports</span>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="gfr-report-pagination-wrap">
            <div className="gfr-report-pagination-info">
              <span>
                Showing <strong>{startIndex + 1}</strong>-<strong>{Math.min(endIndex, filteredData.length)}</strong> of <strong>{filteredData.length}</strong>
              </span>
              <div className="gfr-report-pagination-size">
                <span>Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="gfr-report-pagination-controls">
              <button className="gfr-report-page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>« First</button>
              <button className="gfr-report-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Prev</button>
              {getPageNumbers().map((page, idx) => 
                page === '...' ? (
                  <span key={`dots-${idx}`} className="gfr-report-page-dots">...</span>
                ) : (
                  <button
                    key={page}
                    className={`gfr-report-page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
              <button className="gfr-report-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ›</button>
              <button className="gfr-report-page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last »</button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="gfr-report-footer-info">
          <span className="gfr-report-record-count">
            Showing {filteredData.length} of {generatedHistory.length} records
          </span>
          <span className="gfr-report-last-updated">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      {/* ===== VIEW DETAILS MODAL ===== */}
      {showDetailsModal && selectedFranchise && (
        <div className="gfr-modal-overlay" onClick={handleCloseDetails}>
          <div className="gfr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gfr-modal-close" onClick={handleCloseDetails}>✕</button>
            
            <div className="gfr-modal-header">
              <h2>📋 Franchise Details</h2>
              <div className="gfr-modal-id">
                <span>ID: #{selectedFranchise.id}</span>
                <span className={`gfr-modal-status ${(selectedFranchise.status || 'generated').toLowerCase()}`}>
                  {selectedFranchise.status || 'Generated'}
                </span>
              </div>
            </div>

            <div className="gfr-modal-body">
              <div className="gfr-modal-section">
                <h3>👤 Applicant Information</h3>
                <div className="gfr-modal-grid">
                  <div><label>Applicant:</label><span>{selectedFranchise.applicantName}</span></div>
                  <div><label>Franchise Name:</label><span>{selectedFranchise.franchiseName || '—'}</span></div>
                  <div><label>Email:</label><span>{selectedFranchise.email}</span></div>
                  <div><label>Phone:</label><span>{selectedFranchise.mobile}</span></div>
                  <div><label>Address:</label><span>{selectedFranchise.address || '-'}</span></div>
                  <div><label>City:</label><span>{selectedFranchise.city || '-'}</span></div>
                  <div><label>State:</label><span>{selectedFranchise.state || '-'}</span></div>
                  <div><label>Pincode:</label><span>{selectedFranchise.pincode || '-'}</span></div>
                </div>
              </div>

              <div className="gfr-modal-section">
                <h3>📅 Agreement Details</h3>
                <div className="gfr-modal-grid">
                  <div><label>Agreement Date:</label><span>{selectedFranchise.agreementDate || '-'}</span></div>
                  <div><label>Validity Date:</label><span>{selectedFranchise.validityDate || 'N/A'}</span></div>
                  <div><label>Created:</label><span>{selectedFranchise.createdAt ? new Date(selectedFranchise.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                  <div><label>Request ID:</label><span>{selectedFranchise.requestId || 'N/A'}</span></div>
                </div>
              </div>

              <div className="gfr-modal-section">
                <h3>📚 Selected Courses</h3>
                {selectedFranchise.selectedCourses && selectedFranchise.selectedCourses.length > 0 ? (
                  <table className="gfr-modal-course-table">
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
                      {selectedFranchise.selectedCourses.map((course, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td><strong>{course.name}</strong></td>
                          <td>{course.code || 'N/A'}</td>
                          <td>{course.category || 'N/A'}</td>
                          <td>{course.duration || 'N/A'}</td>
                          <td>₹{course.fee || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5"><strong>Total Amount</strong></td>
                        <td><strong>₹{Number(selectedFranchise.totalAmount).toLocaleString('en-IN')}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p style={{ color: '#94a3b8', padding: '10px 0' }}>No courses selected</p>
                )}
              </div>

              {selectedFranchise.notes && (
                <div className="gfr-modal-section">
                  <h3>📝 Notes</h3>
                  <p className="gfr-modal-notes">{selectedFranchise.notes}</p>
                </div>
              )}
            </div>

            <div className="gfr-modal-footer">
              <button className="gfr-report-btn gfr-report-btn-reset" onClick={handleCloseDetails}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && editData && (
        <div className="gfr-modal-overlay" onClick={handleCloseEdit}>
          <div className="gfr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gfr-modal-close" onClick={handleCloseEdit}>✕</button>
            
            <div className="gfr-modal-header">
              <h2>✏️ Edit Franchise</h2>
              <div className="gfr-modal-id">
                <span>ID: #{editData.id}</span>
              </div>
            </div>

            <div className="gfr-modal-body">
              <div className="gfr-modal-section">
                <h3>👤 Basic Information</h3>
                <div className="gfr-edit-grid">
                  <div className="gfr-edit-field">
                    <label>Applicant Name *</label>
                    <input type="text" value={editData.applicantName} onChange={(e) => handleEditChange('applicantName', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field">
                    <label>Franchise Name</label>
                    <input type="text" value={editData.franchiseName} onChange={(e) => handleEditChange('franchiseName', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field">
                    <label>Email *</label>
                    <input type="email" value={editData.email} onChange={(e) => handleEditChange('email', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field">
                    <label>Mobile *</label>
                    <input type="tel" value={editData.mobile} onChange={(e) => handleEditChange('mobile', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field gfr-edit-full">
                    <label>Address</label>
                    <input type="text" value={editData.address} onChange={(e) => handleEditChange('address', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field">
                    <label>City</label>
                    <input type="text" value={editData.city} onChange={(e) => handleEditChange('city', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field">
                    <label>State</label>
                    <input type="text" value={editData.state} onChange={(e) => handleEditChange('state', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field">
                    <label>Pincode</label>
                    <input type="text" value={editData.pincode} onChange={(e) => handleEditChange('pincode', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field">
                    <label>Status</label>
                    <select value={editData.status} onChange={(e) => handleEditChange('status', e.target.value)}>
                      <option value="Generated">Generated</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="gfr-modal-section">
                <h3>📅 Agreement Dates</h3>
                <div className="gfr-edit-grid">
                  <div className="gfr-edit-field">
                    <label>Agreement Date</label>
                    <input type="date" value={editData.agreementDate || ''} onChange={(e) => handleEditChange('agreementDate', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field">
                    <label>Validity Date</label>
                    <input type="date" value={editData.validityDate || ''} onChange={(e) => handleEditChange('validityDate', e.target.value)} />
                  </div>
                  <div className="gfr-edit-field gfr-edit-full">
                    <label>Notes</label>
                    <textarea value={editData.notes} onChange={(e) => handleEditChange('notes', e.target.value)} rows="3" />
                  </div>
                </div>
              </div>
            </div>

            <div className="gfr-modal-footer">
              <button className="gfr-report-btn gfr-report-btn-reset" onClick={handleCloseEdit} disabled={isSaving}>
                Cancel
              </button>
              <button className="gfr-report-btn gfr-report-btn-refresh" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? '⏳ Saving...' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateFranchiseReport;