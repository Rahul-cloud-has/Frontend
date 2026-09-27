// FranchiseManage/FranchiseRequestReport.jsx - Complete with API Integration + PDF Export + Perfect Auto Print
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL, apiConfig } from '../../../Api';
import './FranchiseRequestReport.css';

const FranchiseRequestReport = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // ============================================
  // 📤 FETCH DATA FROM API
  // ============================================
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/applications/`, apiConfig());
      
      console.log('📥 API Response:', response.data);
      
      let data = [];
      if (response.data && response.data.data) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      // Map API data
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
        date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '-',
        createdAt: item.created_at
      }));
      
      // ✅ SORT BY created_at ASCENDING (Oldest First)
      mappedData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });
      
      // ✅ Assign Serial Number
      const withSerial = mappedData.map((item, index) => ({
        ...item,
        serialNo: index + 1
      }));
      
      setRequests(withSerial);
      setFilteredRequests(withSerial);
      calculateStats(withSerial);
      
    } catch (error) {
      console.error('❌ API Error:', error);
      setError('Failed to load applications. Please refresh.');
      
      try {
        const stored = localStorage.getItem('franchiseRequests');
        if (stored) {
          const data = JSON.parse(stored);
          setRequests(data);
          setFilteredRequests(data);
          calculateStats(data);
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
        setRequests([]);
        setFilteredRequests([]);
        calculateStats([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🔄 LOAD DATA ON MOUNT
  // ============================================
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      pending: data.filter(r => r.status === 'Pending').length,
      approved: data.filter(r => r.status === 'Approved').length,
      rejected: data.filter(r => r.status === 'Rejected').length
    });
  };

  // ============================================
  // 🔍 FILTER DATA
  // ============================================
  useEffect(() => {
    let result = [...requests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.applicantName?.toLowerCase().includes(term) ||
        r.franchiseName?.toLowerCase().includes(term) ||
        r.mobile?.includes(term) ||
        r.id?.toString().includes(term) ||
        r.serialNo?.toString().includes(term) ||
        r.address?.toLowerCase().includes(term) ||
        r.city?.toLowerCase().includes(term) ||
        r.state?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter);
    }

    setFilteredRequests(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, requests]);

  // ============================================
  // 📄 PAGINATION
  // ============================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
  };

  // ============================================
  // 📥 EXPORT CSV
  // ============================================
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'S.No', 'Applicant Name', 'Father Name', 'Franchise Name', 
      'Mobile', 'Email', 'Address', 'City', 'State', 'Pincode',
      'Date', 'Status', 'Message', 'Admin Note'
    ];

    const rows = filteredRequests.map(r => [
      r.serialNo,
      r.applicantName || 'N/A',
      r.fatherName || 'N/A',
      r.franchiseName || 'N/A',
      r.mobile || 'N/A',
      r.email || 'N/A',
      r.address || 'N/A',
      r.city || 'N/A',
      r.state || 'N/A',
      r.pincode || 'N/A',
      r.date || 'N/A',
      r.status || 'N/A',
      (r.message || '').replace(/,/g, ';'),
      (r.adminNote || '').replace(/,/g, ';')
    ]);

    const companyHeader = [
      ['EduSkillVision - EMPOWERING SKILLS, SHAPING FUTURES'],
      ['Phone: +91 8818800802 | Email: info@eduskillvision.com'],
      [`Report Generated: ${new Date().toLocaleString('en-IN')}`],
      ['Report Type: Franchise Applications Report'],
      [`Total Records: ${filteredRequests.length}`],
      [''],
      headers
    ];

    const csvContent = [
      ...companyHeader.map(row => row.join(',')),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `EduSkillVision_Franchise_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  // ============================================
  // 📄 EXPORT TO PDF LAYOUT CREATION
  // ============================================
  const generatePDFLayout = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== TOP CONTACT BAR (Navy Blue) =====
    doc.setFillColor(13, 30, 61);
    doc.rect(0, 0, pageWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('+91 8818800802', 14, 6.5);
    doc.text('info@eduskillvision.com', 70, 6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('www.eduskillvision.com', pageWidth - 14, 6.5, { align: 'right' });

    // ===== GOLD ACCENT LINE =====
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 10, pageWidth, 1.5, 'F');

    // ===== COMPANY BRAND HEADER =====
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 11.5, pageWidth, 25, 'F');

    // Logo Circle
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.circle(22, 24, 8, 'FD');
    doc.setTextColor(13, 30, 61);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ESV', 22, 25.5, { align: 'center' });

    // Company Name
    doc.setTextColor(13, 30, 61);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Edu', 35, 22);
    doc.setTextColor(212, 175, 55);
    doc.text('Skill', 47, 22);
    doc.setTextColor(13, 30, 61);
    doc.text('Vision', 60, 22);

    // Slogan
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('EMPOWERING SKILLS, SHAPING FUTURES', 35, 28);

    // Report Info (Right Side)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 30, 61);
    doc.text('FRANCHISE APPLICATIONS REPORT', pageWidth - 14, 20, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 26, { align: 'right' });
    doc.text(`Total Records: ${filteredRequests.length}`, pageWidth - 14, 30, { align: 'right' });

    // Divider Line
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(14, 38, pageWidth - 14, 38);

    // ===== TABLE - FULL WIDTH =====
    const tableData = filteredRequests.map(req => [
      req.serialNo,
      req.applicantName || '-',
      req.franchiseName || '-',
      req.mobile || '-',
      req.city || '-',
      req.state || '-',
      req.date || '-',
      req.status || '-'
    ]);

    const availableWidth = pageWidth - 28;

    autoTable(doc, {
      startY: 42,
      head: [['S.No', 'Applicant', 'Franchise Name', 'Mobile', 'City', 'State', 'Date', 'Status']],
      body: tableData,
      theme: 'grid',
      tableWidth: availableWidth,
      headStyles: {
        fillColor: [13, 30, 61],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        valign: 'middle',
        cellPadding: 3.5
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [15, 23, 42],
        cellPadding: 3,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: availableWidth * 0.06, halign: 'center' },
        1: { cellWidth: availableWidth * 0.18, halign: 'left' },
        2: { cellWidth: availableWidth * 0.17, halign: 'left' },
        3: { cellWidth: availableWidth * 0.12, halign: 'left' },
        4: { cellWidth: availableWidth * 0.13, halign: 'left' },
        5: { cellWidth: availableWidth * 0.12, halign: 'left' },
        6: { cellWidth: availableWidth * 0.11, halign: 'center' },
        7: { cellWidth: availableWidth * 0.11, halign: 'center' }
      },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === 'body') {
          const status = data.cell.raw;
          if (status === 'Approved') {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [6, 95, 70];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Rejected') {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Pending') {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { left: 14, right: 14, bottom: 15 },
      didDrawPage: (data) => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(13, 30, 61);
        doc.rect(0, pageH - 10, pageWidth, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('© 2025 EduSkillVision - All Rights Reserved', 14, pageH - 3.5);
        doc.text(
          `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
          pageWidth - 14,
          pageH - 3.5,
          { align: 'right' }
        );
      }
    });

    return doc;
  };

  // ============================================
  // 📄 EXPORT PDF
  // ============================================
  const handleExportPDF = () => {
    if (filteredRequests.length === 0) {
      alert('No data to export');
      return;
    }
    const doc = generatePDFLayout();
    doc.save(`EduSkillVision_Franchise_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  // ============================================
  // 🖨️ PRINT (Auto-opens print window from PDF)
  // ============================================
  const handlePrint = () => {
    if (filteredRequests.length === 0) {
      alert('No data to print');
      return;
    }

    const doc = generatePDFLayout();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');

    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      alert('⚠️ Popup Blocker Active! Please allow popups for this site, or we will download the PDF instead.');
      doc.save(`EduSkillVision_Franchise_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    setShowExportMenu(false);
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  if (loading) {
    return (
      <div className="frr-container">
        <div className="frr-loading">⏳ Loading...</div>
      </div>
    );
  }

  return (
    <div className="frr-container">
      {/* Header */}
      <div className="frr-header">
        <div>
          <h1 className="frr-title">Franchise Application Report</h1>
          <p className="frr-subtitle">View all franchise applications</p>
        </div>
        <div className="frr-header-actions">
          {/* Export Dropdown */}
          <div className="frr-export-dropdown-wrapper">
            <button 
              className="frr-export-btn" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export Options"
            >
              📥 Export
            </button>
            {showExportMenu && (
              <>
                <div className="frr-export-backdrop" onClick={() => setShowExportMenu(false)}></div>
                <div className="frr-export-menu">
                  <button onClick={handleExportPDF} className="frr-export-menu-item">
                    📄 Export as PDF
                  </button>
                  <button onClick={handleExportCSV} className="frr-export-menu-item">
                    📊 Export as CSV
                  </button>
                  <button onClick={handlePrint} className="frr-export-menu-item">
                    🖨️ Print
                  </button>
                </div>
              </>
            )}
          </div>
          
          <button className="frr-btn frr-btn-refresh" onClick={loadData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="frr-error">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="frr-stats-grid">
        <div className="frr-stat-card frr-stat-total">
          <div className="frr-stat-icon">📊</div>
          <div className="frr-stat-info">
            <span className="frr-stat-number">{stats.total}</span>
            <span className="frr-stat-label">Total</span>
          </div>
        </div>
        <div className="frr-stat-card frr-stat-pending">
          <div className="frr-stat-icon">⏳</div>
          <div className="frr-stat-info">
            <span className="frr-stat-number">{stats.pending}</span>
            <span className="frr-stat-label">Pending</span>
          </div>
        </div>
        <div className="frr-stat-card frr-stat-approved">
          <div className="frr-stat-icon">✅</div>
          <div className="frr-stat-info">
            <span className="frr-stat-number">{stats.approved}</span>
            <span className="frr-stat-label">Approved</span>
          </div>
        </div>
        <div className="frr-stat-card frr-stat-rejected">
          <div className="frr-stat-icon">❌</div>
          <div className="frr-stat-info">
            <span className="frr-stat-number">{stats.rejected}</span>
            <span className="frr-stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="frr-filters">
        <div className="frr-search-wrapper">
          <span className="frr-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by Name, Franchise Name, Mobile..."
            className="frr-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="frr-filter-group">
          <select
            className="frr-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button className="frr-btn-reset" onClick={handleResetFilters}>
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="frr-table-wrapper">
        <table className="frr-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Request ID</th>
              <th>Applicant Name</th>
              <th>Franchise Name</th>
              <th>Mobile</th>
              <th>City</th>
              <th>State</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((request) => (
              <tr key={request.id}>
                <td><strong>{request.serialNo}</strong></td>
                <td><span className="frr-id">#{request.id}</span></td>
                <td><strong>{request.applicantName || '—'}</strong></td>
                <td>{request.franchiseName || '—'}</td>
                <td>{request.mobile}</td>
                <td>{request.city || '—'}</td>
                <td>{request.state || '—'}</td>
                <td>{request.date}</td>
                <td>
                  <span className={`frr-status ${request.status?.toLowerCase() || 'pending'}`}>
                    {request.status || 'Pending'}
                  </span>
                </td>
                <td>
                  <button className="frr-view-btn">
                    👁️ View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <div className="frr-pagination">
          <span className="frr-pagination-info">
            Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length}
          </span>
          <div className="frr-pagination-buttons">
            <button
              className="frr-page-btn"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ← Prev
            </button>
            {(() => {
              const buttons = [];
              let start = Math.max(1, currentPage - 2);
              let end = Math.min(totalPages, start + 4);
              if (end - start < 4) start = Math.max(1, end - 4);
              
              for (let i = start; i <= end; i++) {
                buttons.push(
                  <button
                    key={i}
                    className={`frr-page-btn ${currentPage === i ? 'frr-active' : ''}`}
                    onClick={() => handlePageChange(i)}
                  >
                    {i}
                  </button>
                );
              }
              return buttons;
            })()}
            <button
              className="frr-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseRequestReport;