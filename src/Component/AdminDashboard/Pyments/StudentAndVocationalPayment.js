import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, apiConfig } from '../../../Api';
import esvLogo from '../../../assets/logo.png';
import './StudentAndVocationalPayment.css';

const StudentAndVocationalPayment = () => {
  const receiptRef = useRef(null);

  const franchiseUser = JSON.parse(localStorage.getItem('franchiseUser') || '{}');
  const franchiseCode = franchiseUser?.franchise_code || '';
  const franchiseName = franchiseUser?.franchise_name || franchiseUser?.applicant_name || '';

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // ── FETCH ──
  const fetchAllPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let allPayments = [];

      try {
        const res = await axios.get(`${API_URL}/students/`, apiConfig());
        let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
        const mapped = data
          .filter(s => ['Completed', 'Partial', 'Pending'].includes(s.payment_status))
          .map(s => ({
            id: `STU-${s.id}`, originalId: s.id,
            franchise_code: s.franchise_code || '', franchise_name: s.franchise_name || '',
            payment_type: 'Student', type_icon: '👨‍',
            student_name: s.student_name || '', father_name: s.father_name || '',
            mobile: s.mobile || '', email: s.email || '',
            course_name: s.course_name || '', course_category: s.course_category || '',
            sessions: s.sessions || '',
            total_amount: parseFloat(s.total_payment) || parseFloat(s.fee_amount) || 0,
            paid_amount: parseFloat(s.fee_amount) || parseFloat(s.total_payment) || 0,
            due_amount: Math.max(0, (parseFloat(s.total_payment) || 0) - (parseFloat(s.fee_amount) || 0)),
            payment_status: s.payment_status || 'Pending',
            payment_method: s.payment_method || 'Cash',
            receipt_no: `RCP-${String(s.id).padStart(6, '0')}`,
            created_at: s.created_at || s.admitted_at || '',
          }));
        allPayments = [...allPayments, ...mapped];
      } catch (e) { console.warn('Student err:', e); }

      try {
        const res = await axios.get(`${API_URL}/vocational/students/`, apiConfig());
        let data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || [];
        const mapped = data
          .filter(s => ['Completed', 'Partial', 'Pending'].includes(s.payment_status))
          .map(s => ({
            id: `VOC-${s.id}`, originalId: s.id,
            franchise_code: s.franchise_code || '', franchise_name: s.franchise_name || '',
            payment_type: 'Vocational', type_icon: '🔧',
            student_name: s.student_name || '', father_name: s.father_name || '',
            mobile: s.mobile || '', email: s.email || '',
            course_name: s.course_name || '', course_category: s.course_category || '',
            sessions: s.sessions || '',
            total_amount: parseFloat(s.fee_amount) || 0,
            paid_amount: parseFloat(s.fee_amount) || 0,
            due_amount: 0,
            payment_status: s.payment_status || 'Pending',
            payment_method: s.payment_method || 'Cash',
            receipt_no: `VOC-${String(s.id).padStart(6, '0')}`,
            created_at: s.admission_date || s.created_at || '',
          }));
        allPayments = [...allPayments, ...mapped];
      } catch (e) { console.warn('Voc err:', e); }

      allPayments.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setPayments(allPayments);
      setFilteredPayments(allPayments);
    } catch (err) {
      setError('Failed to load payment records');
      toast.error('Failed to load payment records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllPayments(); }, [fetchAllPayments]);

  // ── FILTERS ──
  useEffect(() => {
    let result = [...payments];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.student_name?.toLowerCase().includes(t) || p.father_name?.toLowerCase().includes(t) ||
        p.mobile?.includes(t) || p.course_name?.toLowerCase().includes(t) ||
        p.receipt_no?.toLowerCase().includes(t) || p.franchise_code?.toLowerCase().includes(t)
      );
    }
    if (selectedType !== 'All') result = result.filter(p => p.payment_type === selectedType);
    if (selectedStatus !== 'All') result = result.filter(p => p.payment_status === selectedStatus);
    if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); result = result.filter(p => new Date(p.created_at) >= s); }
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); result = result.filter(p => new Date(p.created_at) <= e); }
    setFilteredPayments(result);
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus, startDate, endDate, payments]);

  // ── HELPERS ──
  const fmtAmt = n => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const amountInWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num.toString().length > 9) return 'Overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let s = '';
    s += +n[1] !== 0 ? (a[+n[1]] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
    s += +n[2] !== 0 ? (a[+n[2]] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
    s += +n[3] !== 0 ? (a[+n[3]] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
    s += +n[4] !== 0 ? (a[+n[4]] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
    s += +n[5] !== 0 ? ((s !== '') ? 'and ' : '') + (a[+n[5]] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return s.trim() + ' Rupees Only';
  };

  // ── ONE PAGE PDF DOWNLOAD + PRINT ──
  const handleDownloadSlipPDF = async () => {
    if (!receiptRef.current || !receiptData) return;
    setPdfLoading(true);

    try {
      const imgs = receiptRef.current.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 3000); });
      }));

      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: receiptRef.current.scrollWidth,
        windowHeight: receiptRef.current.scrollHeight,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 8, marginY = 8;
      const maxWidth = pageWidth - marginX * 2;
      const maxHeight = pageHeight - marginY * 2;
      const canvasRatio = canvas.width / canvas.height;

      let imageWidth = maxWidth;
      let imageHeight = imageWidth / canvasRatio;
      if (imageHeight > maxHeight) {
        imageHeight = maxHeight;
        imageWidth = imageHeight * canvasRatio;
      }

      const x = (pageWidth - imageWidth) / 2;
      const y = (pageHeight - imageHeight) / 2;
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', x, y, imageWidth, imageHeight, undefined, 'FAST');

      const fileName = `Receipt_${receiptData.receipt_no || 'Slip'}.pdf`;
      pdf.save(fileName);

      toast.success('Receipt PDF downloaded successfully!');

      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      } else {
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            }, 700);
          };
        }
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Could not generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── PAGINATION ──
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirst, indexOfLast);
  const paginate = n => { if (n >= 1 && n <= totalPages) setCurrentPage(n); };

  // ── SMART PAGE NUMBERS ──
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const hasFilter = searchTerm || selectedType !== 'All' || selectedStatus !== 'All' || startDate || endDate;
  const studentCount = filteredPayments.filter(p => p.payment_type === 'Student').length;
  const vocationalCount = filteredPayments.filter(p => p.payment_type === 'Vocational').length;
  const completedCount = filteredPayments.filter(p => p.payment_status === 'Completed').length;

  // ── LOADING STATE ──
  if (loading) return (
    <div className="sap-wrap">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
      <div className="sap-card">
        <div className="sap-loading"><div className="sap-spinner"></div><p>Loading payments...</p></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="sap-wrap">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
      <div className="sap-card">
        <div className="sap-loading"><h3>⚠️ {error}</h3>
          <button className="sap-btn sap-btn-p" onClick={fetchAllPayments} style={{ marginTop: 12 }}>🔄 Retry</button>
        </div>
      </div>
    </div>
  );

  // ── VIEW MODE (Full Page Vertical - No Scroll) ──
  if (showReceipt && receiptData) {
    return (
      <div className="sap-wrap">
        <ToastContainer position="top-right" autoClose={2500} theme="colored" />

        {pdfLoading && (
          <div className="sr-pdf-overlay">
            <div className="sr-pdf-overlay-content">
              <div className="sap-spinner"></div>
              <div className="sr-pdf-overlay-text">Generating PDF...</div>
            </div>
          </div>
        )}

        <div className="slip-action-bar">
          <button className="sap-btn sap-btn-back" onClick={() => setShowReceipt(false)}>← Back to List</button>
          <div className="slip-action-right">
            <button className="sap-btn sap-btn-p" onClick={handleDownloadSlipPDF}>📥 Download PDF</button>
          </div>
        </div>

        <div className="slip-full-page-wrap">
          <div className="print-slip-container" ref={receiptRef}>

            <div className="slip-color-strip"></div>

            {/* ✅ HEADER WITH LOGO ONLY AT TOP */}
            <div className="slip-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1.5px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ width: '65px', flexShrink: 0 }}>
                <img src={esvLogo} alt="ESV Logo" style={{ width: '65px', height: '65px', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
                <h1 className="slip-brand-name" style={{ fontSize: '24px', fontWeight: '800', margin: '0', color: '#1e40af' }}>
                  <span className="brand-edu">Edu</span>
                  <span className="brand-skill">Skill</span>
                  <span className="brand-vision">Vision</span>
                </h1>
                <p className="slip-tagline" style={{ fontSize: '10px', fontStyle: 'italic', color: '#64748b', margin: '2px 0' }}>Empowering Skills, Shaping Futures</p>
                <p className="slip-institute" style={{ fontSize: '10px', color: '#334155', margin: '1px 0' }}>Computer Education & Training Institute</p>
                <p className="slip-iso" style={{ fontSize: '10px', color: '#334155', margin: '1px 0' }}>(An ISO 9001:2015 Certified Institute)</p>
                <p className="slip-address" style={{ fontSize: '10px', color: '#334155', margin: '1px 0' }}>H.O.: Ambikapur, Surguja (C.G.) – 497001</p>
                <p className="slip-contact" style={{ fontSize: '10px', color: '#334155', margin: '1px 0' }}>📞 +91 88188 00802 &nbsp;|&nbsp; ✉️ info@eduskillvision.com</p>
              </div>
              <div style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>
                <div className="slip-est" style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>Est. 2023</div>
                <div className="slip-cin" style={{ fontSize: '8px', color: '#888', marginTop: '4px', lineHeight: '1.4' }}>CIN: U80900CT<br />2023PTC014511</div>
              </div>
            </div>

            <div className="slip-title-bar">
              <span className="slip-title-text">OFFICIAL PAYMENT RECEIPT</span>
              <span className="slip-title-orig">ORIGINAL</span>
            </div>

            <div className="slip-meta-row">
              <span><strong>Receipt No:</strong> ESV/RCP/{new Date().getFullYear()}/{String(receiptData.originalId || 0).padStart(4, '0')}</span>
              <span><strong>Date:</strong> {receiptData.created_at ? new Date(receiptData.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              <span><strong>Mode:</strong> {receiptData.payment_method}</span>
            </div>

            <div className="slip-received-box">
              <div className="slip-recv-label">Received From</div>
              <div className="slip-recv-name">{receiptData.student_name || 'N/A'}</div>
              {receiptData.father_name && <div className="slip-recv-father">S/o D/o: {receiptData.father_name}</div>}
            </div>

            <table className="slip-detail-table">
              <tbody>
                <tr>
                  <td className="dt-lbl">Institute / Centre</td>
                  <td className="dt-val"><strong>{receiptData.franchise_name || 'EduSkillVision HO'}</strong></td>
                  <td className="dt-lbl">Centre Code</td>
                  <td className="dt-val"><strong>{receiptData.franchise_code || 'ADMIN'}</strong></td>
                </tr>
                <tr>
                  <td className="dt-lbl">Mobile No.</td>
                  <td className="dt-val">{receiptData.mobile || 'N/A'}</td>
                  <td className="dt-lbl">Email</td>
                  <td className="dt-val">{receiptData.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="dt-lbl">Course Type</td>
                  <td className="dt-val"><strong>{receiptData.type_icon} {receiptData.payment_type}</strong></td>
                  <td className="dt-lbl">Duration</td>
                  <td className="dt-val"><strong>{receiptData.sessions || 'N/A'}</strong></td>
                </tr>
              </tbody>
            </table>

            <div className="slip-section-bar">▪ Payment Particulars</div>
            <table className="slip-amount-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>S.No</th>
                  <th>Description</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'center' }}>01</td>
                  <td>
                    <strong>{receiptData.course_name || 'Course Fee'}</strong>
                    {' '}({receiptData.payment_type === 'Vocational' ? 'Vocational Training' : 'Student Admission'})
                    <div className="slip-desc-sub">Category: {receiptData.course_category || 'Academic'}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td className="amt-cell">₹{fmtAmt(receiptData.total_amount || receiptData.paid_amount)}</td>
                </tr>
                <tr className="row-sub">
                  <td colSpan="3" className="right-text">Sub Total:</td>
                  <td className="amt-cell">₹{fmtAmt(receiptData.total_amount || receiptData.paid_amount)}</td>
                </tr>
                <tr className="row-paid">
                  <td colSpan="3" className="right-text">✓ Amount Received:</td>
                  <td className="amt-cell">₹{fmtAmt(receiptData.paid_amount)}</td>
                </tr>
                <tr className="row-due">
                  <td colSpan="3" className="right-text">Balance Due:</td>
                  <td className="amt-cell">₹{fmtAmt(Math.max(0, receiptData.due_amount))}</td>
                </tr>
                <tr className="row-grand">
                  <td colSpan="3" className="right-text">GRAND TOTAL RECEIVED:</td>
                  <td className="amt-cell">₹{fmtAmt(receiptData.paid_amount)}</td>
                </tr>
              </tbody>
            </table>

            <div className="slip-words-box">
              <div className="words-lbl">Amount in Words</div>
              <div className="words-val">{amountInWords(Math.floor(receiptData.paid_amount))}</div>
            </div>

            <div className="slip-status-center">
              <div className={`slip-status-stamp ${receiptData.payment_status === 'Completed' ? 'stamp-ok' : receiptData.payment_status === 'Partial' ? 'stamp-partial' : 'stamp-pending'}`}>
                {receiptData.payment_status === 'Completed' ? '✔ FULLY PAID' : receiptData.payment_status === 'Partial' ? '⚠ PARTIALLY PAID' : '⏳ PAYMENT PENDING'}
              </div>
            </div>

            {/* ✅ SIGNATURES — LEFT & RIGHT ONLY, NO STAMP IN MIDDLE */}
            <div className="slip-signatures" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', marginBottom: '10px', padding: '0 20px' }}>
              <div style={{ width: '200px', textAlign: 'center' }}>
                <div style={{ height: '50px' }}></div>
                <div style={{ borderTop: '1.5px solid #333', paddingTop: '6px', fontSize: '11px', fontWeight: '700', color: '#333', letterSpacing: '.5px' }}>
                  (Student Signature)
                </div>
              </div>
              <div style={{ width: '200px', textAlign: 'center' }}>
                <div style={{ height: '50px' }}></div>
                <div style={{ borderTop: '1.5px solid #333', paddingTop: '6px', fontSize: '11px', fontWeight: '700', color: '#333', letterSpacing: '.5px' }}>
                  (Authorized Signatory)
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                  EduSkillVision Education Pvt. Ltd.
                </div>
              </div>
            </div>

            {/* ✅ BOTTOM BAR WITH NO LOGOS */}
            <div className="slip-bottom-bar" style={{ textAlign: 'center', padding: '10px 0', borderTop: '1px solid #cbd5e1', marginTop: '15px' }}>
              <div className="slip-bottom-info">
                <div className="bottom-brand" style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}><span>Edu</span><span style={{ color: '#f59e0b' }}>Skill</span><span>Vision</span></div>
                <div className="bottom-contact" style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>📞 +91 88188 00802 · ✉️ info@eduskillvision.com</div>
              </div>
            </div>

            <div className="slip-disclaimer">
              🙏 Thank You for Choosing EduSkillVision! · Computer generated receipt · CIN: U80900CT2023PTC014511
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── MAIN TABLE VIEW ──
  return (
    <div className="sap-wrap">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
      <div className="sap-card">

        {/* Header */}
        <div className="sap-header">
          <div className="sap-brand">
            <div className="sap-brand-icon">💳</div>
            <div>
              <h1 className="sap-h1">Payments & Fees</h1>
              <p className="sap-sub">{franchiseCode ? `🏷️ ${franchiseCode} — ${franchiseName}` : '👑 Admin — All Payments'}</p>
            </div>
          </div>
          <div className="sap-hdr-btns">
            <button className="sap-btn sap-btn-r" onClick={fetchAllPayments}>🔄 Refresh</button>
          </div>
        </div>

        {/* Stats */}
        <div className="sap-stats">
          <div className="sap-stat t"><span className="sap-si">📊</span><div><span className="sap-sl">Total</span><span className="sap-sn">{filteredPayments.length}</span></div></div>
          <div className="sap-stat s"><span className="sap-si">👨‍🎓</span><div><span className="sap-sl">Student</span><span className="sap-sn">{studentCount}</span></div></div>
          <div className="sap-stat v"><span className="sap-si">🔧</span><div><span className="sap-sl">Vocational</span><span className="sap-sn">{vocationalCount}</span></div></div>
          <div className="sap-stat d"><span className="sap-si">✅</span><div><span className="sap-sl">Completed</span><span className="sap-sn">{completedCount}</span></div></div>
        </div>

        {/* Filters */}
        <div className="sap-filters">
          <div className="sap-search-wrap">
            <span className="sap-search-i">🔍</span>
            <input className="sap-search" placeholder="Search name, mobile, course..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {searchTerm && <button className="sap-search-x" onClick={() => setSearchTerm('')}>✕</button>}
          </div>
          <select className="sap-sel" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="All">All Types</option><option value="Student">👨‍🎓 Student</option><option value="Vocational">🔧 Vocational</option>
          </select>
          <select className="sap-sel" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="All">All Status</option><option value="Pending">⏳ Pending</option><option value="Partial">🔶 Partial</option><option value="Completed">✅ Completed</option>
          </select>
          <input className="sap-dt" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input className="sap-dt" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          {hasFilter && <button className="sap-clr" onClick={() => { setSearchTerm(''); setSelectedType('All'); setSelectedStatus('All'); setStartDate(''); setEndDate(''); }}>✕</button>}
        </div>

        {/* Table */}
        <div className="sap-tbl-wrap">
          <div className="sap-tbl-scroll">
            <table className="sap-tbl">
              <thead>
                <tr>
                  <th>#</th><th>Receipt</th><th>Type</th><th>Student</th><th>Course</th>
                  <th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length ? currentItems.map((p, i) => (
                  <tr key={p.id}>
                    <td>{indexOfFirst + i + 1}</td>
                    <td><strong>{p.receipt_no}</strong></td>
                    <td><span className={`sap-type ${p.payment_type === 'Student' ? 'sap-ts' : 'sap-tv'}`}>{p.type_icon} {p.payment_type}</span></td>
                    <td><strong>{p.student_name || '—'}</strong></td>
                    <td>{p.course_name || '—'}</td>
                    <td className="sap-amt">₹{fmtAmt(p.paid_amount)}</td>
                    <td>{p.payment_method}</td>
                    <td><span className={`sap-badge ${p.payment_status === 'Completed' ? 'sap-sc' : p.payment_status === 'Partial' ? 'sap-sp' : 'sap-sq'}`}>{p.payment_status}</span></td>
                    <td>{fmtDate(p.created_at)}</td>
                    <td>
                      <div className="sap-acts">
                        <button className="sap-act-btn act-view" onClick={() => { setReceiptData(p); setShowReceipt(true); }} title="View Slip">👁️</button>
                        <button className="sap-act-btn act-pdf" onClick={() => { setReceiptData(p); setTimeout(() => { setShowReceipt(true); setTimeout(handleDownloadSlipPDF, 500); }, 100); }} title="Download PDF">📥</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="10" className="sap-empty">📭 No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            ADVANCED PAGINATION
        ═══════════════════════════════════════════ */}
        {filteredPayments.length > 0 && (
          <div className="sap-pagination">
            {/* Left: Info */}
            <div className="sap-pg-left">
              <span className="sap-pg-info">
                Showing <b>{indexOfFirst + 1}</b>–<b>{Math.min(indexOfLast, filteredPayments.length)}</b> of <b>{filteredPayments.length}</b> records
              </span>
            </div>

            {/* Center: Page Buttons */}
            {totalPages > 1 && (
              <div className="sap-pg-btns">
                <button
                  className="sap-pg-btn"
                  disabled={currentPage === 1}
                  onClick={() => paginate(1)}
                  title="First Page"
                >«</button>
                <button
                  className="sap-pg-btn"
                  disabled={currentPage === 1}
                  onClick={() => paginate(currentPage - 1)}
                  title="Previous"
                >‹ Prev</button>

                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span key={`dot-${i}`} className="sap-pg-dots">•••</span>
                  ) : (
                    <button
                      key={`pg-${p}`}
                      className={`sap-pg-btn ${currentPage === p ? 'sap-pg-active' : ''}`}
                      onClick={() => paginate(p)}
                    >{p}</button>
                  )
                )}

                <button
                  className="sap-pg-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => paginate(currentPage + 1)}
                  title="Next"
                >Next ›</button>
                <button
                  className="sap-pg-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => paginate(totalPages)}
                  title="Last Page"
                >»</button>
              </div>
            )}

            {/* Right: Items Per Page */}
            <div className="sap-pg-right">
              <label className="sap-pg-label">Show:</label>
              <select
                className="sap-pg-select"
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="sap-pg-label">per page</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAndVocationalPayment;