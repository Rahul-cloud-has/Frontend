// PaymentReport.jsx - Final with Toast + Logo only at Top Header
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, apiConfig } from '../../../Api';
import esvLogo from '../../../assets/logo.png';
import './PymentsReports.css';

const PaymentReport = () => {
  const receiptRef = useRef(null);

  const [payments, setPayments]               = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm]           = useState('');
  const [currentPage, setCurrentPage]         = useState(1);
  const [itemsPerPage, setItemsPerPage]       = useState(10);
  const [selectedStatus, setSelectedStatus]   = useState('All');
  const [franchiseCode, setFranchiseCode]     = useState('');
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [dateRange, setDateRange]             = useState({ start: '', end: '' });
  const [showReceiptView, setShowReceiptView] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [pdfLoading, setPdfLoading]           = useState(false);
  const [pdfMessage, setPdfMessage]           = useState('');

  /* ── helpers ── */
  const toNum   = n => Number(n || 0);
  const fmt     = useCallback(n => toNum(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }), []);
  const fmtDate = useCallback(d => d ? new Date(d).toLocaleDateString('en-GB') : '—', []);

  const getCurrentUser = () => {
    try { return JSON.parse(localStorage.getItem('currentUser')); }
    catch { return null; }
  };

  /* ── fetch ── */
  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPayments = async () => {
    setLoading(true); setError('');
    try {
      const res  = await axios.get(`${API_URL}/franchise-payments/`, apiConfig());
      const data = res.data;
      const user = getCurrentUser();
      const fc   = user?.franchise_code || '';
      setFranchiseCode(fc);
      const filtered = fc ? data.filter(p => p.franchise_code === fc) : data;
      setPayments(filtered);
      setFilteredPayments(filtered);
    } catch {
      setError('Failed to load payment records');
      toast.error('Failed to load payment records.');
    }
    finally  { setLoading(false); }
  };

  /* ── filter ── */
  useEffect(() => {
    let r = payments;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      r = r.filter(p =>
        p.applicant_name?.toLowerCase().includes(t) ||
        p.father_name?.toLowerCase().includes(t)    ||
        p.mobile?.includes(t)                        ||
        p.institute_name?.toLowerCase().includes(t) ||
        p.franchise_code?.toLowerCase().includes(t) ||
        p.email?.toLowerCase().includes(t)
      );
    }
    if (selectedStatus !== 'All') r = r.filter(p => p.payment_status === selectedStatus);
    if (dateRange.start) r = r.filter(p => p.created_at && new Date(p.created_at) >= new Date(dateRange.start));
    if (dateRange.end) {
      const ed = new Date(dateRange.end); ed.setHours(23, 59, 59);
      r = r.filter(p => p.created_at && new Date(p.created_at) <= ed);
    }
    setFilteredPayments(r);
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, payments, dateRange]);

  /* ── pagination ── */
  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems     = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages       = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginate         = n => { if (n >= 1 && n <= totalPages) setCurrentPage(n); };

  const statusClass = s => s === 'Completed' ? 'sc' : s === 'Partial' ? 'sp' : 'sq';
  const statusIcon  = s => s === 'Completed' ? '✅' : s === 'Partial' ? '🔶' : '⏳';
  const hasFilter   = dateRange.start || dateRange.end || searchTerm || selectedStatus !== 'All';

  const totalFee  = filteredPayments.reduce((s, p) => s + toNum(p.total_amount), 0);
  const totalPaid = filteredPayments.reduce((s, p) => s + toNum(p.paid_amount), 0);
  const totalDue  = totalFee - totalPaid;

  /* ── amount in words ── */
  const amountInWords = useCallback(num => {
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
      'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if (num.toString().length > 9) return 'Overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let s = '';
    s += +n[1] !== 0 ? (a[+n[1]] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore '    : '';
    s += +n[2] !== 0 ? (a[+n[2]] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh '     : '';
    s += +n[3] !== 0 ? (a[+n[3]] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
    s += +n[4] !== 0 ? (a[+n[4]] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred '  : '';
    s += +n[5] !== 0 ? ((s !== '') ? 'and ' : '') + (a[+n[5]] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return s.trim();
  }, []);

  /* ── page numbers ── */
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages);
    } else {
      pages.push(1, '...', currentPage-1, currentPage, currentPage+1, '...', totalPages);
    }
    return pages;
  };

  /* ════════════════════════════════════════════
     RECEIPT HTML BUILDER  — Logo ONLY at Top
  ════════════════════════════════════════════ */
  const buildReceiptHTML = useCallback((p) => {
    const rno   = `ESV/RCP/${new Date().getFullYear()}/${String(p.id).padStart(4,'0')}`;
    const date  = new Date(p.payment_date || p.created_at)
                    .toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
    const total = toNum(p.total_amount);
    const paid  = toNum(p.paid_amount);
    const due   = toNum(p.due_amount);
    const words = amountInWords(Math.floor(paid));

    const [stampTxt, stampBg, stampClr, stampBd] =
      p.payment_status === 'Completed'
        ? ['✔ FULLY PAID',        '#e8f5e9', '#1b5e20', '#1b5e20']
        : p.payment_status === 'Partial'
          ? ['⚠ PARTIALLY PAID',  '#fff3e0', '#e65100', '#e65100']
          : ['⏳ PAYMENT PENDING', '#ffebee', '#b71c1c', '#b71c1c'];

    return /* html */`
    <div style="width:740px;box-sizing:border-box;background:#fff;
      font-family:'Times New Roman',Georgia,serif;color:#222;
      border:2px solid #1a237e;border-radius:8px;overflow:hidden">

      <!-- TOP STRIP -->
      <div style="height:6px;background:linear-gradient(90deg,#1a237e,#3949ab,#7986cb,#3949ab,#1a237e)"></div>

      <!-- ══ HEADER WITH LOGO ══ -->
      <div style="box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;
        padding:18px 20px 14px;background:linear-gradient(135deg,#e8eaf6 0%,#fff 60%);
        border-bottom:2px solid #c5cae9">

        <div style="width:65px;flex-shrink:0">
          <img src="${esvLogo}" alt="ESV Logo" style="width:65px;height:65px;object-fit:contain;display:block;" crossorigin="anonymous" />
        </div>

        <div style="flex:1;text-align:center;padding:0 10px">
          <div style="font-size:24px;font-weight:900;letter-spacing:2px;
            font-family:'Times New Roman',serif">
            <span style="color:#1a237e">Edu</span><span style="color:#3949ab">Skill</span><span style="color:#5c6bc0">Vision</span>
          </div>
          <div style="font-size:10px;color:#5c6bc0;font-style:italic;margin:2px 0">
            Empowering Skills, Shaping Futures
          </div>
          <div style="font-size:10px;color:#334155">
            Computer Education & Training Institute (An ISO 9001:2015 Certified Institute)
          </div>
          <div style="font-size:9px;color:#546e7a;margin-top:2px">
            Head Office: Ambikapur, Surguja (C.G.) – 497001 | 📞 +91 88188 00802 | ✉️ info@eduskillvision.com
          </div>
        </div>

        <div style="text-align:right;font-size:9px;color:#5c6bc0;flex-shrink:0;width:90px">
          <div style="font-weight:700;color:#1a237e;font-size:11px">Est. 2023</div>
          <div style="margin-top:4px;line-height:1.4">
            CIN: U80900CT<br>2023PTC014511
          </div>
        </div>
      </div>

      <!-- ══ TITLE BAR ══ -->
      <div style="box-sizing:border-box;background:linear-gradient(90deg,#1a237e,#3949ab,#1a237e);
        color:#fff;padding:10px 20px;display:flex;align-items:center;
        justify-content:space-between">
        <span style="font-size:14px;font-weight:700;letter-spacing:4px;text-transform:uppercase">
          OFFICIAL PAYMENT RECEIPT
        </span>
        <span style="border:1.5px solid rgba(255,255,255,.55);padding:2px 10px;
          border-radius:4px;font-size:10px;font-weight:700;letter-spacing:2px">ORIGINAL</span>
      </div>

      <!-- ══ META ROW ══ -->
      <div style="box-sizing:border-box;display:flex;justify-content:space-between;
        flex-wrap:wrap;gap:6px;padding:10px 20px;background:#e8eaf6;
        border-bottom:1px solid #c5cae9;font-size:12px">
        <span><strong style="color:#1a237e">Receipt No.:</strong> ${rno}</span>
        <span><strong style="color:#1a237e">Date:</strong> ${date}</span>
        <span><strong style="color:#1a237e">Payment Mode:</strong> ${p.payment_method || 'Cash'}</span>
      </div>

      <!-- ══ RECEIVED FROM ══ -->
      <div style="box-sizing:border-box;margin:14px 20px;border:2px solid #1a237e;
        border-radius:6px;overflow:hidden">
        <div style="background:#1a237e;color:#fff;padding:5px 14px;
          font-size:10px;font-weight:700;letter-spacing:2px">RECEIVED FROM</div>
        <div style="padding:10px 14px;font-size:20px;font-weight:700;
          color:#1a237e;letter-spacing:1px">${p.applicant_name || 'N/A'}</div>
      </div>

      <!-- ══ DETAILS TABLE ══ -->
      <div style="box-sizing:border-box;padding:0 20px">
        <table style="width:100%;border-collapse:collapse;font-size:12px;
          table-layout:fixed">
          <colgroup>
            <col style="width:22%"><col style="width:28%">
            <col style="width:22%"><col style="width:28%">
          </colgroup>
          <tbody>
            <tr>
              <td style="padding:7px 10px;background:#e8eaf6;font-weight:700;color:#1a237e;
                border:1px solid #c5cae9;font-size:10px;letter-spacing:.5px;
                word-wrap:break-word">INSTITUTE</td>
              <td style="padding:7px 12px;border:1px solid #c5cae9;word-wrap:break-word">
                <strong>${p.institute_name || 'EduSkillVision HO'}</strong></td>
              <td style="padding:7px 10px;background:#e8eaf6;font-weight:700;color:#1a237e;
                border:1px solid #c5cae9;font-size:10px;letter-spacing:.5px;
                word-wrap:break-word">FRANCHISE CODE</td>
              <td style="padding:7px 12px;border:1px solid #c5cae9;word-wrap:break-word">
                <strong>${p.franchise_code || 'ADMIN'}</strong></td>
            </tr>
            <tr>
              <td style="padding:7px 10px;background:#e8eaf6;font-weight:700;color:#1a237e;
                border:1px solid #c5cae9;font-size:10px;letter-spacing:.5px">MOBILE</td>
              <td style="padding:7px 12px;border:1px solid #c5cae9;word-wrap:break-word">
                ${p.mobile || 'N/A'}</td>
              <td style="padding:7px 10px;background:#e8eaf6;font-weight:700;color:#1a237e;
                border:1px solid #c5cae9;font-size:10px;letter-spacing:.5px">EMAIL</td>
              <td style="padding:7px 12px;border:1px solid #c5cae9;word-wrap:break-word;
                word-break:break-all">${p.email || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══ SECTION LABEL ══ -->
      <div style="box-sizing:border-box;margin:14px 20px 8px;padding:6px 14px;
        background:#e8eaf6;border-left:4px solid #1a237e;font-size:11px;
        font-weight:700;color:#1a237e;letter-spacing:1px;border-radius:0 4px 4px 0">
        ▪ PAYMENT PARTICULARS
      </div>

      <!-- ══ AMOUNTS TABLE ══ -->
      <div style="box-sizing:border-box;padding:0 20px">
        <table style="width:100%;border-collapse:collapse;font-size:12px;
          table-layout:fixed">
          <colgroup>
            <col style="width:46px">
            <col>
            <col style="width:56px">
            <col style="width:140px">
          </colgroup>
          <thead>
            <tr style="background:linear-gradient(90deg,#1a237e,#3949ab);color:#fff">
              <th style="padding:9px 8px;text-align:center;font-size:11px;
                font-weight:700;text-transform:uppercase;letter-spacing:.5px">S.No</th>
              <th style="padding:9px 10px;text-align:left;font-size:11px;
                font-weight:700;text-transform:uppercase;letter-spacing:.5px">Description</th>
              <th style="padding:9px 8px;text-align:center;font-size:11px;
                font-weight:700;text-transform:uppercase;letter-spacing:.5px">Qty</th>
              <th style="padding:9px 10px;text-align:right;font-size:11px;
                font-weight:700;text-transform:uppercase;letter-spacing:.5px">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px 8px;text-align:center;border:1px solid #e8eaf6">01</td>
              <td style="padding:10px;border:1px solid #e8eaf6;word-wrap:break-word">
                <strong>Franchise Registration &amp; Onboarding Fee</strong>
                <div style="font-size:10px;color:#7986cb;margin-top:3px">
                  Category: ${p.institute_name || 'Franchise'}
                </div>
              </td>
              <td style="padding:10px 8px;text-align:center;border:1px solid #e8eaf6">1</td>
              <td style="padding:10px;text-align:right;border:1px solid #e8eaf6;
                font-weight:700;color:#1a237e">₹${fmt(total)}</td>
            </tr>

            <tr style="background:#f5f7ff">
              <td colspan="3" style="padding:8px 10px;text-align:right;font-weight:600;
                border:1px solid #e8eaf6;color:#555">Sub Total:</td>
              <td style="padding:8px 10px;text-align:right;border:1px solid #e8eaf6;
                font-weight:700;color:#1a237e">₹${fmt(total)}</td>
            </tr>

            <tr style="background:#e8f5e9">
              <td colspan="3" style="padding:8px 10px;text-align:right;font-weight:700;
                border:1px solid #c8e6c9;color:#1b5e20">✓ Amount Received:</td>
              <td style="padding:8px 10px;text-align:right;border:1px solid #c8e6c9;
                font-weight:800;color:#1b5e20">₹${fmt(paid)}</td>
            </tr>

            <tr style="background:#fff3e0">
              <td colspan="3" style="padding:8px 10px;text-align:right;font-weight:700;
                border:1px solid #ffe0b2;color:#e65100">Balance Due:</td>
              <td style="padding:8px 10px;text-align:right;border:1px solid #ffe0b2;
                font-weight:800;color:#e65100">₹${fmt(due)}</td>
            </tr>

            <tr style="background:linear-gradient(90deg,#1a237e,#3949ab)">
              <td colspan="3" style="padding:10px;text-align:right;color:#fff;
                font-weight:700;font-size:13px">GRAND TOTAL RECEIVED:</td>
              <td style="padding:10px;text-align:right;color:#fff;
                font-weight:900;font-size:15px">₹${fmt(paid)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══ AMOUNT IN WORDS ══ -->
      <div style="box-sizing:border-box;margin:14px 20px;padding:11px 14px;
        background:#fffde7;border:1.5px dashed #f9a825;border-radius:6px;
        display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <span style="font-size:10px;font-weight:700;color:#f57f17;
          text-transform:uppercase;letter-spacing:1px;white-space:nowrap">Amount In Words:</span>
        <span style="font-size:13px;font-weight:600;color:#333;font-style:italic;
          word-wrap:break-word">
          Rupees ${words} Only /-
        </span>
      </div>

      <!-- ══ STATUS STAMP ══ -->
      <div style="text-align:center;margin:12px 20px">
        <div style="display:inline-block;padding:8px 28px;border-radius:6px;
          font-size:16px;font-weight:900;letter-spacing:3px;transform:rotate(-2deg);
          border:3px solid ${stampBd};background:${stampBg};color:${stampClr}">
          ${stampTxt}
        </div>
      </div>

      <!-- ══ SIGNATURES ══ -->
      <div style="box-sizing:border-box;display:flex;justify-content:space-between;
        gap:20px;margin:20px 20px 14px">
        <div style="flex:1;text-align:center">
          <div style="height:52px;border-bottom:2px solid #333;margin-bottom:6px"></div>
          <div style="font-size:11px;font-weight:700;color:#333;letter-spacing:.5px">
            RECEIVER'S SIGNATURE
          </div>
          <div style="font-size:10px;color:#666;margin-top:3px">(Applicant)</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="height:52px;border-bottom:2px solid #333;margin-bottom:6px"></div>
          <div style="font-size:11px;font-weight:700;color:#333;letter-spacing:.5px">
            AUTHORIZED SIGNATORY
          </div>
          <div style="font-size:10px;color:#666;margin-top:3px">
            EduSkillVision Education Pvt. Ltd.
          </div>
        </div>
      </div>

      <!-- ══ FOOTER CLEAN (No Logo at Bottom) ══ -->
      <div style="box-sizing:border-box;background:#e8eaf6;padding:14px 20px;
        text-align:center;border-top:2px solid #1a237e">
        <div style="font-size:14px;font-weight:700;color:#1a237e;margin-bottom:4px">
          🙏 Thank You for Choosing EduSkillVision!
        </div>
        <div style="font-size:10px;color:#7986cb">
          Computer generated receipt &nbsp;|&nbsp; CIN: U80900CT2023PTC014511 &nbsp;|&nbsp;
          © ${new Date().getFullYear()} EduSkillVision Education Pvt. Ltd.
        </div>
      </div>

      <!-- BOTTOM STRIP -->
      <div style="height:6px;background:linear-gradient(90deg,#1a237e,#3949ab,#7986cb,#3949ab,#1a237e)"></div>
    </div>`;
  }, [fmt, amountInWords]);

  /* ════════════════════════════════════════════
     CORE: element → PDF
  ════════════════════════════════════════════ */
  const elementToPDF = async (el, orientation = 'portrait') => {
    await new Promise(r => setTimeout(r, 400));

    const rect         = el.getBoundingClientRect();
    const actualWidth  = Math.ceil(rect.width);
    const actualHeight = Math.ceil(el.scrollHeight);

    const canvas = await html2canvas(el, {
      scale          : 2.5,
      useCORS        : true,
      allowTaint     : true,
      backgroundColor: '#ffffff',
      logging        : false,
      scrollX        : 0,
      scrollY        : 0,
      x              : 0,
      y              : 0,
      width          : actualWidth,
      height         : actualHeight,
      windowWidth    : actualWidth,
      windowHeight   : actualHeight,
    });

    const pdf    = new jsPDF({ orientation, unit:'mm', format:'a4', compress:true });
    const pw     = pdf.internal.pageSize.getWidth();
    const ph     = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxW   = pw - margin * 2;
    const maxH   = ph - margin * 2;
    const ratio  = canvas.width / canvas.height;

    let iw = maxW;
    let ih = iw / ratio;

    if (ih > maxH) {
      ih = maxH;
      iw = ih * ratio;
    }

    const x = (pw - iw) / 2;
    const y = (ph - ih) / 2;

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', x, y, iw, ih);
    return pdf;
  };

  /* ════════════════════════════════════════════
     SAVE PDF — mode: 'download' | 'print'
  ════════════════════════════════════════════ */
  const savePDF = (pdf, fileName, mode = 'download') => {
    if (mode === 'download') {
      pdf.save(fileName);
      return;
    }

    if (mode === 'print') {
      const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i
                         .test(navigator.userAgent);

      if (isMobile) {
        pdf.save(fileName);
        return;
      }

      const url = URL.createObjectURL(pdf.output('blob'));
      const win = window.open(url, '_blank');

      if (win) {
        win.onload = () => {
          setTimeout(() => {
            win.focus();
            win.print();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
          }, 800);
        };
      } else {
        toast.error('Popup blocked! Please allow popups for this site and try again.');
        URL.revokeObjectURL(url);
      }
    }
  };

  /* ════════════════════════════════════════════
     GENERATE RECEIPT PDF
  ════════════════════════════════════════════ */
  const handleReceiptPDF = useCallback(async (paymentOverride = null, mode = 'download') => {
    const payment = paymentOverride || selectedPayment;
    if (!payment) return;

    setPdfLoading(true);
    setPdfMessage(mode === 'print' ? 'Preparing to print…' : 'Building receipt…');

    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      background: #ffffff;
      padding: 30px;
      width: 800px;
      box-sizing: border-box;
      z-index: 99999;
      overflow: visible;
    `;
    wrap.innerHTML = buildReceiptHTML(payment);
    document.body.appendChild(wrap);

    try {
      setPdfMessage('Rendering…');
      const el  = wrap.firstElementChild;
      const pdf = await elementToPDF(el, 'portrait');

      const rno      = `ESV/RCP/${new Date().getFullYear()}/${String(payment.id).padStart(4,'0')}`;
      const fileName = `Receipt_${rno.replace(/\//g,'-')}.pdf`;

      setPdfMessage(mode === 'print' ? 'Opening print…' : 'Saving…');
      savePDF(pdf, fileName, mode);

      if (mode === 'download') {
        toast.success('Receipt PDF downloaded successfully!');
      }
    } catch (err) {
      console.error('Receipt PDF error:', err);
      toast.error('Could not generate PDF. Please try again.');
    } finally {
      document.body.removeChild(wrap);
      setPdfLoading(false);
      setPdfMessage('');
    }
  }, [selectedPayment, buildReceiptHTML]);

  /* ── print button from table row ── */
  const printReceipt = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowReceiptView(true);
    setTimeout(() => handleReceiptPDF(payment, 'print'), 250);
  }, [handleReceiptPDF]);

  /* ════════════════════════════════════════════
     DOWNLOAD FULL REPORT PDF
  ════════════════════════════════════════════ */
  const downloadPDF = useCallback(async () => {
    if (!filteredPayments.length) {
      toast.warning('No records to export.');
      return;
    }

    setPdfLoading(true);
    setPdfMessage('Building report…');

    const tPaid = filteredPayments.reduce((s, p) => s + toNum(p.paid_amount), 0);
    const tFee  = filteredPayments.reduce((s, p) => s + toNum(p.total_amount), 0);
    const tDue  = tFee - tPaid;
    const now   = new Date().toLocaleString('en-GB', {
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit', hour12:true,
    });

    const rows = filteredPayments.map((p, i) => `
      <tr style="${i % 2 === 1 ? 'background:#f5f7ff' : ''}">
        <td style="text-align:center;padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px">${i + 1}</td>
        <td style="text-align:center;padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px">
          <span style="background:#dbeafe;color:#1e40af;padding:2px 7px;
            border-radius:3px;font-size:10px;font-weight:700">${p.franchise_code || '—'}</span>
        </td>
        <td style="padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px;word-wrap:break-word">
          <strong>${p.applicant_name || '—'}</strong></td>
        <td style="text-align:center;padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px">${p.mobile || '—'}</td>
        <td style="padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px;word-wrap:break-word">
          ${p.institute_name || '—'}</td>
        <td style="text-align:right;padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px">₹${fmt(p.total_amount)}</td>
        <td style="text-align:right;padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px;
          color:#1b5e20;font-weight:700">₹${fmt(p.paid_amount)}</td>
        <td style="text-align:right;padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px;
          color:${toNum(p.due_amount) > 0 ? '#b71c1c' : '#1b5e20'};
          font-weight:700">₹${fmt(p.due_amount)}</td>
        <td style="text-align:center;padding:6px 7px;border-bottom:1px solid #e8eaf6;
          border-right:1px solid #e8eaf6;font-size:10.5px">
          <span style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;
            background:${p.payment_status==='Completed'?'#d1fae5':p.payment_status==='Partial'?'#fef3c7':'#fee2e2'};
            color:${p.payment_status==='Completed'?'#065f46':p.payment_status==='Partial'?'#92400e':'#991b1b'}">
            ${p.payment_status || 'Pending'}</span>
        </td>
        <td style="text-align:center;padding:6px 7px;border-bottom:1px solid #e8eaf6;
          font-size:10.5px">${fmtDate(p.created_at)}</td>
      </tr>`).join('');

    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 1160px;
      box-sizing: border-box;
      background: #fff;
      padding: 30px;
      font-family: 'Times New Roman', serif;
      z-index: 99999;
    `;

    wrap.innerHTML = `
    <div style="box-sizing:border-box;font-family:'Times New Roman',serif;color:#000;background:#fff">
      <div style="height:6px;background:linear-gradient(90deg,#1a237e,#3949ab,#1a237e)"></div>
      <div style="box-sizing:border-box;border:2px solid #1a237e;border-top:none;padding:14px 20px">
        <div style="display:flex;align-items:center;gap:16px;padding-bottom:12px;
          border-bottom:1px solid #c5cae9;margin-bottom:12px">
          <div style="width:62px;height:62px;border-radius:50%;border:3px solid #1a237e;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            flex-shrink:0;background:#f5f7ff">
            <span style="font-size:19px;font-weight:900;color:#1a237e;
              font-family:Arial,sans-serif">ESV</span>
            <span style="font-size:7px;color:#3949ab;font-family:Arial,sans-serif">EDUCATION</span>
          </div>
          <div style="flex:1;text-align:center">
            <div style="font-size:23px;font-weight:900;letter-spacing:2px;color:#1a237e;
              text-transform:uppercase">EduSkillVision</div>
            <div style="font-size:10px;color:#5c6bc0;font-style:italic">
              Empowering Skills, Shaping Futures</div>
            <div style="font-size:9px;color:#37474f;margin-top:2px">
              Head Office: Ambikapur, Surguja (C.G.) – 497001 | 📞 +91 88188 00802</div>
          </div>
        </div>
        <div style="background:#1a237e;color:#fff;padding:8px 20px;font-size:14px;
          font-weight:700;letter-spacing:4px;text-transform:uppercase;text-align:center">
          ▪ PAYMENT REPORT ▪</div>
        <div style="box-sizing:border-box;display:flex;justify-content:space-between;
          flex-wrap:wrap;gap:4px;padding:8px 20px;background:#e8eaf6;font-size:10px;
          border-left:2px solid #1a237e;border-right:2px solid #1a237e">
          <span><strong style="color:#1a237e">Generated:</strong> ${now}</span>
          <span><strong style="color:#1a237e">Records:</strong> ${filteredPayments.length}</span>
          ${franchiseCode
            ? `<span><strong style="color:#1a237e">Franchise:</strong> ${franchiseCode}</span>`
            : `<span><strong style="color:#1a237e">Scope:</strong> All Franchises</span>`}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0">
        ${[
          {v: filteredPayments.length, l:'Total Records',   c:'#1a237e', bg:'#f5f7ff'},
          {v:`₹${fmt(tFee)}`,          l:'Total Fee',       c:'#1a237e', bg:'#f5f7ff'},
          {v:`₹${fmt(tPaid)}`,         l:'Total Paid',      c:'#1b5e20', bg:'#e8f5e9'},
          {v:`₹${fmt(tDue)}`,          l:'Total Due',       c:'#b71c1c', bg:'#ffebee'},
        ].map(s => `
          <div style="box-sizing:border-box;border:2px solid #1a237e;padding:10px;
            text-align:center;background:${s.bg};border-radius:4px">
            <div style="font-size:18px;font-weight:900;color:${s.c}">${s.v}</div>
            <div style="font-size:8px;color:#5c6bc0;text-transform:uppercase;
              letter-spacing:.5px;margin-top:3px">${s.l}</div>
          </div>`).join('')}
      </div>

      <table style="width:100%;border-collapse:collapse;border:2px solid #1a237e;
        table-layout:auto">
        <thead>
          <tr>
            ${['#','Code','Applicant','Mobile','Institute','Total','Paid','Due','Status','Date']
              .map(h => `<th style="background:#1a237e;color:#fff;padding:9px 7px;
                font-size:10px;font-weight:700;text-transform:uppercase;
                border-right:1px solid #3949ab;text-align:center">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="5" style="text-align:right;padding:10px 8px;
              background:#1a237e;color:#fff;font-weight:700;font-size:11px">
              TOTAL →
            </td>
            <td style="text-align:right;padding:10px 8px;
              background:#1a237e;color:#fff;font-weight:700">₹${fmt(tFee)}</td>
            <td style="text-align:right;padding:10px 8px;
              background:#1a237e;color:#fff;font-weight:700">₹${fmt(tPaid)}</td>
            <td style="text-align:right;padding:10px 8px;
              background:#1a237e;color:#fff;font-weight:700">₹${fmt(tDue)}</td>
            <td colspan="2" style="background:#1a237e"></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:12px;text-align:center;padding:10px;
        border-top:2px solid #1a237e;font-size:9px;color:#5c6bc0;background:#e8eaf6">
        <strong style="color:#1a237e">EduSkillVision Education Pvt. Ltd.</strong>
        | CIN: U80900CT2023PTC014511 | © ${new Date().getFullYear()}
      </div>
      <div style="height:6px;background:linear-gradient(90deg,#1a237e,#3949ab,#1a237e)"></div>
    </div>`;

    document.body.appendChild(wrap);

    try {
      setPdfMessage('Rendering…');
      const pdf = await elementToPDF(wrap, 'landscape');
      const fileName = `ESV_Payment_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      setPdfMessage('Saving…');
      savePDF(pdf, fileName, 'download');
      toast.success('Payment Report PDF downloaded!');
    } catch (err) {
      console.error('Report PDF error:', err);
      toast.error('Could not generate report PDF. Please try again.');
    } finally {
      document.body.removeChild(wrap);
      setPdfLoading(false);
      setPdfMessage('');
    }
  }, [filteredPayments, franchiseCode, fmt, fmtDate]);

  /* ── CSV ── */
  const exportCSV = () => {
    if (!filteredPayments.length) {
      toast.warning('No data to export.');
      return;
    }
    const hdr  = ['#','Code','Applicant','Mobile','Institute','Total','Paid','Due','Status','Date'];
    const rows = filteredPayments.map((p, i) => [
      i+1, p.franchise_code||'', p.applicant_name||'', p.mobile||'',
      p.institute_name||'', toNum(p.total_amount).toFixed(2),
      toNum(p.paid_amount).toFixed(2), toNum(p.due_amount).toFixed(2),
      p.payment_status||'Pending', fmtDate(p.created_at),
    ]);
    let csv = '\uFEFF' + hdr.join(',') + '\n';
    rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
    const a = Object.assign(document.createElement('a'), {
      href    : URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'})),
      download: `ESV_Payments_${new Date().toISOString().split('T')[0]}.csv`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('CSV exported successfully!');
  };

  /* ═══ LOADING / ERROR ═══ */
  if (loading) return (
    <div className="pr-wrap">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
      <div className="pr-card">
        <div className="pr-empty"><div className="pr-spinner"></div><p>Loading payment records…</p></div>
      </div>
    </div>
  );
  if (error) return (
    <div className="pr-wrap">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
      <div className="pr-card">
        <div className="pr-empty"><h3>⚠️ Error</h3><p>{error}</p>
          <button onClick={fetchPayments} className="pr-btn pr-refresh" style={{marginTop:12}}>
            🔄 Retry
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══ PDF OVERLAY ═══ */
  const PDFOverlay = () => pdfLoading ? (
    <div className="pr-pdf-overlay">
      <div className="pr-pdf-overlay-content">
        <div className="pr-spinner"></div>
        <div className="pr-pdf-overlay-text">{pdfMessage || 'Generating PDF…'}</div>
      </div>
    </div>
  ) : null;

  /* ═══════════════════════════════════════════
     RECEIPT SCREEN VIEW
  ═══════════════════════════════════════════ */
  if (showReceiptView && selectedPayment) {
    const p     = selectedPayment;
    const rno   = `ESV/RCP/${new Date().getFullYear()}/${String(p.id).padStart(4,'0')}`;
    const date  = new Date(p.payment_date || p.created_at)
                    .toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
    const total = toNum(p.total_amount);
    const paid  = toNum(p.paid_amount);
    const due   = toNum(p.due_amount);
    const words = amountInWords(Math.floor(paid));

    return (
      <div className="pr-wrap">
        <ToastContainer position="top-right" autoClose={2500} theme="colored" />
        <PDFOverlay />

        <div className="pr-receipt-actions">
          <button className="pr-btn pr-btn-back"
            onClick={() => { setShowReceiptView(false); setSelectedPayment(null); }}>
            ← Back to List
          </button>
          <div className="pr-receipt-actions-right">
            <button className="pr-btn pr-btn-download"
              onClick={() => handleReceiptPDF(null, 'download')}
              disabled={pdfLoading}>
              {pdfLoading ? '⏳ Generating…' : '📥 Download PDF'}
            </button>
            <button className="pr-btn pr-btn-print"
              onClick={() => handleReceiptPDF(null, 'print')}
              disabled={pdfLoading}>
              {pdfLoading ? '⏳ Please wait…' : '🖨️ Print'}
            </button>
          </div>
        </div>

        <div className="pr-receipt-wrapper">
          <div id="receipt-container" className="pr-receipt" ref={receiptRef}>

            {/* ✅ HEADER WITH LOGO */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1.5px solid #c5cae9', marginBottom: '14px', background: 'linear-gradient(135deg,#e8eaf6 0%,#fff 60%)', padding: '18px 20px 14px' }}>
              <div style={{ width: '65px', flexShrink: 0 }}>
                <img src={esvLogo} alt="ESV Logo" style={{ width: '65px', height: '65px', objectFit: 'contain', display: 'block' }} crossorigin="anonymous" />
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0', color: '#1a237e', letterSpacing: '2px', fontFamily: "'Times New Roman',serif" }}>
                  <span>Edu</span><span>Skill</span><span>Vision</span>
                </h1>
                <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#5c6bc0', margin: '2px 0' }}>Empowering Skills, Shaping Futures</p>
                <p style={{ fontSize: '10px', color: '#37474f', margin: '1px 0' }}>Computer Education & Training Institute (An ISO 9001:2015 Certified Institute)</p>
                <p style={{ fontSize: '9px', color: '#546e7a', margin: '1px 0' }}>Head Office: Ambikapur, Surguja (C.G.) – 497001 | 📞 +91 88188 00802 | ✉️ info@eduskillvision.com</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '9px', color: '#5c6bc0', flexShrink: 0, width: '90px' }}>
                <div style={{ fontWeight: '700', color: '#1a237e', fontSize: '11px' }}>Est. 2023</div>
                <div style={{ marginTop: '4px', lineHeight: '1.4' }}>CIN: U80900CT<br />2023PTC014511</div>
              </div>
            </div>

            <div className="pr-receipt-title">
              <span className="pr-receipt-title-text">OFFICIAL PAYMENT RECEIPT</span>
              <span className="pr-receipt-title-orig">ORIGINAL</span>
            </div>

            <div className="pr-receipt-meta">
              <span><strong>Receipt No.:</strong> {rno}</span>
              <span><strong>Date:</strong> {date}</span>
              <span><strong>Payment Mode:</strong> {p.payment_method || 'Cash'}</span>
            </div>

            <div className="pr-receipt-from">
              <div className="pr-receipt-from-label">RECEIVED FROM</div>
              <div className="pr-receipt-from-name">{p.applicant_name || 'N/A'}</div>
            </div>

            <table className="pr-receipt-details">
              <tbody>
                <tr>
                  <td className="pr-rd-lbl">INSTITUTE</td>
                  <td className="pr-rd-val">
                    <strong>{p.institute_name || 'EduSkillVision HO'}</strong>
                  </td>
                  <td className="pr-rd-lbl">FRANCHISE CODE</td>
                  <td className="pr-rd-val">
                    <strong>{p.franchise_code || 'ADMIN'}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="pr-rd-lbl">MOBILE</td>
                  <td className="pr-rd-val">{p.mobile || 'N/A'}</td>
                  <td className="pr-rd-lbl">EMAIL</td>
                  <td className="pr-rd-val">{p.email || 'N/A'}</td>
                </tr>
              </tbody>
            </table>

            <div className="pr-receipt-section">▪ PAYMENT PARTICULARS</div>

            <table className="pr-receipt-amounts">
              <thead>
                <tr>
                  <th style={{width:'50px'}}>S.No</th>
                  <th>Description</th>
                  <th style={{width:'60px',textAlign:'center'}}>Qty</th>
                  <th style={{width:'160px',textAlign:'right'}}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{textAlign:'center'}}>01</td>
                  <td>
                    <strong>Franchise Registration &amp; Onboarding Fee</strong>
                    <div className="pr-amt-desc">
                      Category: {p.institute_name || 'Franchise'}
                    </div>
                  </td>
                  <td style={{textAlign:'center'}}>1</td>
                  <td className="pr-amt-cell">₹{fmt(total)}</td>
                </tr>
                <tr className="pr-amt-sub">
                  <td colSpan="3" className="pr-amt-right">Sub Total:</td>
                  <td className="pr-amt-cell">₹{fmt(total)}</td>
                </tr>
                <tr className="pr-amt-paid">
                  <td colSpan="3" className="pr-amt-right">✓ Amount Received:</td>
                  <td className="pr-amt-cell">₹{fmt(paid)}</td>
                </tr>
                <tr className="pr-amt-due">
                  <td colSpan="3" className="pr-amt-right">Balance Due:</td>
                  <td className="pr-amt-cell">₹{fmt(due)}</td>
                </tr>
                <tr className="pr-amt-grand">
                  <td colSpan="3" className="pr-amt-right">GRAND TOTAL RECEIVED:</td>
                  <td className="pr-amt-cell">₹{fmt(paid)}</td>
                </tr>
              </tbody>
            </table>

            <div className="pr-receipt-words">
              <div className="pr-words-label">Amount In Words:</div>
              <div className="pr-words-value">Rupees {words} Only /-</div>
            </div>

            <div className="pr-receipt-stamp-wrap">
              <div className={`pr-receipt-stamp ${
                p.payment_status==='Completed' ? 'stamp-ok' :
                p.payment_status==='Partial'   ? 'stamp-partial' : 'stamp-pending'
              }`}>
                {p.payment_status==='Completed'  ? '✔ FULLY PAID' :
                 p.payment_status==='Partial'    ? '⚠ PARTIALLY PAID' :
                                                   '⏳ PAYMENT PENDING'}
              </div>
            </div>

            <div className="pr-receipt-signatures">
              <div className="pr-sig-col">
                <div className="pr-sig-space"></div>
                <div className="pr-sig-line">RECEIVER'S SIGNATURE</div>
                <div className="pr-sig-sub">(Applicant)</div>
              </div>
              <div className="pr-sig-col">
                <div className="pr-sig-space"></div>
                <div className="pr-sig-line">AUTHORIZED SIGNATORY</div>
                <div className="pr-sig-sub">EduSkillVision Education Pvt. Ltd.</div>
              </div>
            </div>

            <div className="pr-receipt-footer">
              <div className="pr-footer-thanks">
                🙏 Thank You for Choosing EduSkillVision!
              </div>
              <div className="pr-footer-disclaimer">
                Computer generated receipt &nbsp;|&nbsp; CIN: U80900CT2023PTC014511
                &nbsp;|&nbsp; © {new Date().getFullYear()} EduSkillVision Education Pvt. Ltd.
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     MAIN TABLE VIEW
  ═══════════════════════════════════════════ */
  return (
    <div className="pr-wrap">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
      <PDFOverlay />
      <div className="pr-card">

        <div className="pr-header">
          <div className="pr-brand">
            <div className="pr-brand-icon">💳</div>
            <div>
              <h1 className="pr-brand-title">Payment Report</h1>
              <p className="pr-brand-sub">
                <span className="pr-co">EduSkillVision</span>
                {franchiseCode &&
                  <span className="pr-fc-chip">🏷 {franchiseCode}</span>}
              </p>
            </div>
          </div>
          <div className="pr-hdr-btns">
            <button className="pr-btn pr-refresh" onClick={fetchPayments} title="Refresh">🔄</button>
            <button className="pr-btn pr-csv" onClick={exportCSV}>📊 CSV</button>
            <button className="pr-btn pr-pdf" onClick={downloadPDF} disabled={pdfLoading}>
              {pdfLoading ? '⏳ …' : '📄 PDF'}
            </button>
          </div>
        </div>

        <div className="pr-filters">
          <div className="pr-search-box">
            <span className="pr-si">🔍</span>
            <input className="pr-search" type="text"
              placeholder="Search name, mobile, code…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {searchTerm &&
              <button className="pr-sx" onClick={() => setSearchTerm('')}>✕</button>}
          </div>

          <select className="pr-sel" value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Pending">⏳ Pending</option>
            <option value="Partial">🔶 Partial</option>
            <option value="Completed">✅ Completed</option>
          </select>

          <input className="pr-date" type="date" value={dateRange.start}
            onChange={e => setDateRange(v => ({...v, start: e.target.value}))} />
          <input className="pr-date" type="date" value={dateRange.end}
            onChange={e => setDateRange(v => ({...v, end: e.target.value}))} />

          {hasFilter &&
            <button className="pr-clr" onClick={() => {
              setSearchTerm(''); setSelectedStatus('All');
              setDateRange({start:'', end:''});
            }}>✕ Clear</button>}
        </div>

        <div className="pr-stats">
          <div className="pr-stat">
            <span className="pr-sn">{filteredPayments.length}</span>
            <span className="pr-sl">📊 Records</span>
          </div>
          <div className="pr-stat">
            <span className="pr-sn">₹{toNum(totalFee).toLocaleString('en-IN')}</span>
            <span className="pr-sl">💰 Total</span>
          </div>
          <div className="pr-stat g">
            <span className="pr-sn">₹{toNum(totalPaid).toLocaleString('en-IN')}</span>
            <span className="pr-sl">✅ Paid</span>
          </div>
          <div className="pr-stat r">
            <span className="pr-sn">₹{toNum(totalDue).toLocaleString('en-IN')}</span>
            <span className="pr-sl">⏳ Due</span>
          </div>
        </div>

        <div className="pr-tbl-section">
          <div className="pr-tbl-top">
            <span className="pr-tbl-count">
              📋 Payment History ({filteredPayments.length})
            </span>
          </div>

          <div className="pr-tbl-wrap">
            <div className="pr-tbl-scroll">
              <table className="pr-tbl">
                <thead>
                  <tr>
                    <th>#</th><th>Code</th><th>Applicant</th><th>Mobile</th>
                    <th>Total</th><th>Paid</th><th>Due</th>
                    <th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? currentItems.map((p, i) => (
                    <tr key={p.id}>
                      <td>{indexOfFirstItem + i + 1}</td>
                      <td><span className="pr-code">{p.franchise_code || '—'}</span></td>
                      <td><strong>{p.applicant_name || '—'}</strong></td>
                      <td>{p.mobile || '—'}</td>
                      <td>₹{fmt(p.total_amount)}</td>
                      <td className="pr-paid">₹{fmt(p.paid_amount)}</td>
                      <td className="pr-due">₹{fmt(p.due_amount)}</td>
                      <td>
                        <span className={`pr-badge ${statusClass(p.payment_status)}`}>
                          {statusIcon(p.payment_status)} {p.payment_status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="pr-acts">
                          <button className="pr-act-v" title="View Receipt"
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowReceiptView(true);
                            }}>👁</button>
                          <button className="pr-act-p" title="Print Receipt"
                            onClick={() => printReceipt(p)}
                            disabled={pdfLoading}>🖨</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="9" className="pr-empty-row">
                        📭 No payment records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {filteredPayments.length > 0 && (
            <div className="pr-pagination">
              <div className="pr-pg-left">
                <span className="pr-pg-info">
                  Showing <b>{indexOfFirstItem + 1}</b>–
                  <b>{Math.min(indexOfLastItem, filteredPayments.length)}</b> of{' '}
                  <b>{filteredPayments.length}</b>
                </span>
              </div>

              {totalPages > 1 && (
                <div className="pr-pg-btns">
                  <button className="pr-pg-btn" disabled={currentPage===1}
                    onClick={() => paginate(1)}>«</button>
                  <button className="pr-pg-btn" disabled={currentPage===1}
                    onClick={() => paginate(currentPage - 1)}>‹</button>

                  {getPageNumbers().map((pg, i) =>
                    pg === '...'
                      ? <span key={`d${i}`} className="pr-pg-dots">•••</span>
                      : <button key={`p${pg}`}
                          className={`pr-pg-btn ${currentPage===pg?'pr-pg-active':''}`}
                          onChange={() => paginate(pg)}>{pg}</button>
                  )}

                  <button className="pr-pg-btn" disabled={currentPage===totalPages}
                    onClick={() => paginate(currentPage + 1)}>›</button>
                  <button className="pr-pg-btn" disabled={currentPage===totalPages}
                    onClick={() => paginate(totalPages)}>»</button>
                </div>
              )}

              <div className="pr-pg-right">
                <label className="pr-pg-label">Show:</label>
                <select className="pr-pg-select" value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="pr-pg-label">per page</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReport;