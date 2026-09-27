// FranchiseManage/FranchiseRequestList.jsx - Complete with API Integration + Export + Email + Professional View Modal
import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URL, apiConfig } from '../../../Api';
import "./FranchiseRequestList.css";

const FranchiseRequestList = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const itemsPerPage = 10;

  // ============================================
  // 📤 FETCH DATA FROM API
  // ============================================
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_URL}/applications/`, apiConfig());
      
      console.log('📥 API Response:', response.data);
      
      let requests = [];
      if (response.data && response.data.data) {
        requests = response.data.data;
      } else if (Array.isArray(response.data)) {
        requests = response.data;
      }
      
      requests.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateA - dateB;
      });
      
      const mappedRequests = requests.map((item, index) => ({
        serialNo: index + 1,
        id: item.id,
        applicantName: item.name || item.applicant_name || '',
        fatherName: item.father_name || '',
        mobile: item.mobile || '',
        email: item.email || '',
        address: item.address || '',
        state: item.state || '',
        city: item.city || '',
        pincode: item.pincode || '',
        franchiseName: item.franchise_name || '',
        message: item.message || '',
        status: item.status || 'Pending',
        adminNote: item.admin_note || '',
        date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '-',
        createdAt: item.created_at
      }));
      
      setAllRequests(mappedRequests);
      setFilteredRequests(mappedRequests);
      
    } catch (error) {
      console.error('❌ API Error:', error);
      setError('Failed to load applications. Please refresh.');
      
      try {
        const stored = localStorage.getItem('franchiseRequests');
        if (stored) {
          const parsed = JSON.parse(stored);
          setAllRequests(Array.isArray(parsed) ? parsed : []);
          setFilteredRequests(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
        setAllRequests([]);
        setFilteredRequests([]);
      }
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
  useEffect(() => {
    let result = [...allRequests];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        item.applicantName?.toLowerCase().includes(term) ||
        item.franchiseName?.toLowerCase().includes(term) ||
        item.mobile?.includes(term) ||
        item.id?.toString().includes(term) ||
        item.serialNo?.toString().includes(term) ||
        item.address?.toLowerCase().includes(term) ||
        item.city?.toLowerCase().includes(term) ||
        item.state?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== "All") {
      result = result.filter((item) => item.status === statusFilter);
    }
    
    setFilteredRequests(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, allRequests]);

  // ============================================
  // 📊 STATS
  // ============================================
  const totalRequests = allRequests.length;
  const pendingCount = allRequests.filter(r => r.status === "Pending").length;
  const approvedCount = allRequests.filter(r => r.status === "Approved").length;
  const rejectedCount = allRequests.filter(r => r.status === "Rejected").length;

  // ============================================
  // 📄 PAGINATION
  // ============================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // ============================================
  // 👁️ VIEW DETAILS - OPEN MODAL
  // ============================================
  const handleView = (id) => {
    const request = allRequests.find(req => req.id === id);
    if (request) {
      setSelectedRequest(request);
      setAdminNote(request.adminNote || '');
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setAdminNote('');
  };

  // ============================================
  // ✅ UPDATE STATUS
  // ============================================
  const updateRequestStatus = async (status, requestData = null) => {
    const targetRequest = requestData || selectedRequest;
    if (!targetRequest) return null;
    
    try {
      const response = await axios.patch(
        `${API_URL}/applications/${targetRequest.id}/status/`,
        { 
          status: status, 
          admin_note: adminNote || '' 
        },
        apiConfig()
      );
      
      console.log('✅ Status updated:', response.data);
      
      if (response.data?.email_status) {
        console.log('📧 Email Status:', response.data.email_status);
      }
      
      await loadData();
      return response.data;
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert('Failed to update status. Please try again.');
      return null;
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    if (!adminNote.trim()) {
      if (!window.confirm('No admin notes added. Continue with approval?')) return;
    }
    
    const result = await updateRequestStatus('Approved');
    
    if (result) {
      const emailInfo = result.email_status?.includes('successfully') 
        ? '\n\n📧 Email sent to applicant!' 
        : '\n\n⚠️ Email could not be sent.';
      alert('✅ Request approved successfully!' + emailInfo);
    }
    
    handleCloseModal();
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (window.confirm('Are you sure you want to reject this request?')) {
      const result = await updateRequestStatus('Rejected');
      
      if (result) {
        const emailInfo = result.email_status?.includes('successfully') 
          ? '\n\n📧 Email sent to applicant!' 
          : '\n\n⚠️ Email could not be sent.';
        alert('❌ Request rejected!' + emailInfo);
      }
      
      handleCloseModal();
    }
  };

  // ============================================
  // ⚡ QUICK APPROVE/REJECT FROM TABLE
  // ============================================
  const handleQuickApprove = async (request) => {
    if (window.confirm(`Approve application from ${request.applicantName}?`)) {
      setSelectedRequest(request);
      const result = await updateRequestStatus('Approved', request);
      
      if (result) {
        const emailInfo = result.email_status?.includes('successfully') 
          ? '\n\n📧 Email sent to applicant!' 
          : '\n\n⚠️ Email could not be sent.';
        alert('✅ Request approved successfully!' + emailInfo);
      }
    }
  };

  const handleQuickReject = async (request) => {
    if (window.confirm(`Reject application from ${request.applicantName}?`)) {
      setSelectedRequest(request);
      const result = await updateRequestStatus('Rejected', request);
      
      if (result) {
        const emailInfo = result.email_status?.includes('successfully') 
          ? '\n\n📧 Email sent to applicant!' 
          : '\n\n⚠️ Email could not be sent.';
        alert('❌ Request rejected!' + emailInfo);
      }
    }
  };

  // ============================================
  // 📥 EXPORT TO CSV
  // ============================================
  const exportToCSV = () => {
    if (filteredRequests.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = [
      'S.No', 'Applicant Name', 'Father Name', 'Franchise Name', 
      'Mobile', 'Email', 'Address', 'City', 'State', 'Pincode',
      'Date', 'Status', 'Message', 'Admin Note'
    ];

    const rows = filteredRequests.map(req => [
      req.serialNo,
      req.applicantName,
      req.fatherName,
      req.franchiseName,
      req.mobile,
      req.email,
      req.address,
      req.city,
      req.state,
      req.pincode,
      req.date,
      req.status,
      (req.message || '').replace(/,/g, ';'),
      (req.adminNote || '').replace(/,/g, ';')
    ]);

    const companyHeader = [
      ['EduSkillVision - EMPOWERING SKILLS, SHAPING FUTURES'],
      ['Phone: +91 8818800802 | Email: info@eduskillvision.com'],
      [`Report Generated: ${new Date().toLocaleString('en-IN')}`],
      ['Report Type: Franchise Applications'],
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
    link.download = `EduSkillVision_Franchise_Applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  // ============================================
  // 📄 GENERATE PDF LAYOUT
  // ============================================
  const generatePDFLayout = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(13, 30, 61);
    doc.rect(0, 0, pageWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('+91 8818800802', 14, 6.5);
    doc.text('info@eduskillvision.com', 70, 6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('www.eduskillvision.com', pageWidth - 14, 6.5, { align: 'right' });

    doc.setFillColor(212, 175, 55);
    doc.rect(0, 10, pageWidth, 1.5, 'F');

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 11.5, pageWidth, 25, 'F');

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.circle(22, 24, 8, 'FD');
    doc.setTextColor(13, 30, 61);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ESV', 22, 25.5, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Edu', 35, 22);
    doc.setTextColor(212, 175, 55);
    doc.text('Skill', 47, 22);
    doc.setTextColor(13, 30, 61);
    doc.text('Vision', 60, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('EMPOWERING SKILLS, SHAPING FUTURES', 35, 28);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 30, 61);
    doc.text('FRANCHISE APPLICATIONS REPORT', pageWidth - 14, 20, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 26, { align: 'right' });
    doc.text(`Total Records: ${filteredRequests.length}`, pageWidth - 14, 30, { align: 'right' });

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(14, 38, pageWidth - 14, 38);

    const tableData = filteredRequests.map(req => [
      req.serialNo,
      req.applicantName,
      req.franchiseName || '-',
      req.mobile,
      req.city || '-',
      req.state || '-',
      req.date,
      req.status
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
        1: { cellWidth: availableWidth * 0.17, halign: 'left' },
        2: { cellWidth: availableWidth * 0.17, halign: 'left' },
        3: { cellWidth: availableWidth * 0.12, halign: 'left' },
        4: { cellWidth: availableWidth * 0.13, halign: 'left' },
        5: { cellWidth: availableWidth * 0.13, halign: 'left' },
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

  const exportToPDF = () => {
    if (filteredRequests.length === 0) {
      alert('No data to export!');
      return;
    }
    const doc = generatePDFLayout();
    doc.save(`EduSkillVision_Franchise_Applications_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };
  
  const handlePrint = () => {
    if (filteredRequests.length === 0) {
      alert('No data to print!');
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
      alert('⚠️ Popup Blocker Active! Please allow popups.');
      doc.save(`EduSkillVision_Franchise_Applications_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    setShowExportMenu(false);
  };

  // ============================================
  // 🏷️ STATUS BADGE
  // ============================================
  const StatusBadge = ({ status }) => {
    const statusMap = {
      Pending: { class: "badge-pending", label: "Pending" },
      Approved: { class: "badge-approved", label: "Approved" },
      Rejected: { class: "badge-rejected", label: "Rejected" },
    };
    const { class: badgeClass, label } = statusMap[status] || statusMap.Pending;
    return <span className={`status-badge ${badgeClass}`}>{label}</span>;
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="franchise-container">
      <div className="franchise-card">
        {/* Header */}
        <div className="franchise-header">
          <div>
            <h2 className="franchise-title">Franchise Applications</h2>
            <p className="franchise-subtitle">Manage all franchise applications</p>
          </div>
          <div className="header-actions">
            <span className="total-count">Total: {totalRequests}</span>
            
            <div className="export-dropdown-wrapper">
              <button 
                className="export-btn" 
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                📥 Export
              </button>
              {showExportMenu && (
                <>
                  <div className="export-backdrop" onClick={() => setShowExportMenu(false)}></div>
                  <div className="export-menu">
                    <button onClick={exportToPDF} className="export-menu-item">
                      📄 Export as PDF
                    </button>
                    <button onClick={exportToCSV} className="export-menu-item">
                      📊 Export as CSV
                    </button>
                    <button onClick={handlePrint} className="export-menu-item">
                      🖨️ Print
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <button className="refresh-btn" onClick={loadData} disabled={loading}>
              {loading ? '⏳' : '🔄'}
            </button>
          </div>
        </div>

        {error && (
          <div className="frd-error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card stat-total">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <span className="stat-number">{totalRequests}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-number">{pendingCount}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="stat-card stat-approved">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-number">{approvedCount}</span>
              <span className="stat-label">Approved</span>
            </div>
          </div>
          <div className="stat-card stat-rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <span className="stat-number">{rejectedCount}</span>
              <span className="stat-label">Rejected</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="franchise-controls">
          <div className="search-wrapper">
            <i className="search-icon">🔍</i>
            <input
              type="text"
              placeholder="Search by name, franchise name, mobile..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-wrapper">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="franchise-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Applicant</th>
                <th>Franchise Name</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="no-data">⏳ Loading...</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((request) => (
                  <tr key={request.id}>
                    <td><strong>{request.serialNo}</strong></td>
                    <td>{request.applicantName}</td>
                    <td>{request.franchiseName || '—'}</td>
                    <td>{request.mobile}</td>
                    <td>{request.address}</td>
                    <td>{request.city}</td>
                    <td>{request.state}</td>
                    <td>{request.date}</td>
                    <td>
                      <StatusBadge status={request.status} />
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleView(request.id)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        {request.status === "Pending" && (
                          <>
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleQuickApprove(request)}
                              title="Approve"
                            >
                              ✅
                            </button>
                            <button
                              className="action-btn reject-btn"
                              onClick={() => handleQuickReject(request)}
                              title="Reject"
                            >
                              ❌
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">
                    {allRequests.length === 0 ? (
                      <div>
                        <p>📭 No applications found</p>
                        <small>Submit from franchise application form.</small>
                      </div>
                    ) : (
                      <p>No matches</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="pagination-wrapper">
            <span className="pagination-info">
              Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length}
            </span>
            <div className="pagination-buttons">
              <button
                className="pagination-btn"
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
                      className={`pagination-btn ${currentPage === i ? "active" : ""}`}
                      onClick={() => handlePageChange(i)}
                    >
                      {i}
                    </button>
                  );
                }
                return buttons;
              })()}
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* ✅ PROFESSIONAL VIEW MODAL */}
      {/* ============================================ */}
      {showModal && selectedRequest && (
        <div className="frl-modal-overlay" onClick={handleCloseModal}>
          <div className="frl-modal" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="frl-modal-header">
              <div className="frl-modal-header-left">
                <div className="frl-modal-avatar">
                  {selectedRequest.applicantName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h2 className="frl-modal-title">{selectedRequest.applicantName || 'N/A'}</h2>
                  <div className="frl-modal-meta">
                    <span className="frl-modal-id">S.No: #{selectedRequest.serialNo}</span>
                    <span className="frl-modal-divider">•</span>
                    <span className="frl-modal-date">📅 {selectedRequest.date}</span>
                    <span className={`frl-modal-status frl-${selectedRequest.status?.toLowerCase() || 'pending'}`}>
                      {selectedRequest.status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              <button className="frl-modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            {/* Modal Body */}
            <div className="frl-modal-body">
              
              {/* Contact Chips */}
              <div className="frl-modal-chips">
                {selectedRequest.mobile && (
                  <a href={`tel:${selectedRequest.mobile}`} className="frl-modal-chip">
                    📱 {selectedRequest.mobile}
                  </a>
                )}
                {selectedRequest.email && (
                  <a href={`mailto:${selectedRequest.email}`} className="frl-modal-chip">
                    ✉️ {selectedRequest.email}
                  </a>
                )}
              </div>

              {/* Personal Info */}
              <div className="frl-modal-section">
                <h3 className="frl-modal-section-title">
                  👤 Personal Information
                </h3>
                <div className="frl-modal-grid">
                  <div className="frl-modal-item">
                    <label>Full Name</label>
                    <span>{selectedRequest.applicantName || 'N/A'}</span>
                  </div>
                  <div className="frl-modal-item">
                    <label>Father's Name</label>
                    <span>{selectedRequest.fatherName || 'N/A'}</span>
                  </div>
                  <div className="frl-modal-item">
                    <label>Mobile</label>
                    <span>{selectedRequest.mobile || 'N/A'}</span>
                  </div>
                  <div className="frl-modal-item">
                    <label>Email</label>
                    <span>{selectedRequest.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="frl-modal-section">
                <h3 className="frl-modal-section-title">
                  📍 Address Information
                </h3>
                <div className="frl-modal-grid">
                  <div className="frl-modal-item frl-full-width">
                    <label>Full Address</label>
                    <span>{selectedRequest.address || 'N/A'}</span>
                  </div>
                  <div className="frl-modal-item">
                    <label>City</label>
                    <span>{selectedRequest.city || 'N/A'}</span>
                  </div>
                  <div className="frl-modal-item">
                    <label>State</label>
                    <span>{selectedRequest.state || 'N/A'}</span>
                  </div>
                  <div className="frl-modal-item">
                    <label>Pincode</label>
                    <span>{selectedRequest.pincode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Franchise Details */}
              <div className="frl-modal-section frl-modal-highlight">
                <h3 className="frl-modal-section-title">
                  🏪 Franchise Details
                </h3>
                <div className="frl-modal-franchise">
                  {selectedRequest.franchiseName || 'Not Provided'}
                </div>
              </div>

              {/* Message */}
              {selectedRequest.message && (
                <div className="frl-modal-section">
                  <h3 className="frl-modal-section-title">
                    💬 Applicant Message
                  </h3>
                  <div className="frl-modal-message">
                    {selectedRequest.message}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="frl-modal-section">
                <h3 className="frl-modal-section-title">
                  📝 Admin Notes
                </h3>
                <textarea
                  className="frl-modal-textarea"
                  rows="3"
                  placeholder="Write your remarks here..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  disabled={selectedRequest.status !== 'Pending'}
                />
                {selectedRequest.status !== 'Pending' && selectedRequest.adminNote && (
                  <p className="frl-notes-info">
                    ℹ️ Notes cannot be edited after {selectedRequest.status?.toLowerCase()}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="frl-modal-footer">
              <button className="frl-modal-btn frl-modal-btn-close" onClick={handleCloseModal}>
                ← Close
              </button>
              {selectedRequest.status === "Pending" && (
                <>
                  <button className="frl-modal-btn frl-modal-btn-reject" onClick={handleReject}>
                    ❌ Reject
                  </button>
                  <button className="frl-modal-btn frl-modal-btn-approve" onClick={handleApprove}>
                    ✅ Approve
                  </button>
                </>
              )}
              {selectedRequest.status !== "Pending" && (
                <span className="frl-modal-resolved">
                  {selectedRequest.status === 'Approved' ? '✅' : '❌'} This request has been <strong>{selectedRequest.status?.toLowerCase()}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseRequestList;