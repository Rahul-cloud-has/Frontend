import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL, apiConfig } from '../../../Api';
import esvLogo from '../../../assets/logo.png';
import './StudentReport.css';

const StudentReport = () => {
  const tableRef = useRef(null);

  const franchiseUser = JSON.parse(localStorage.getItem('franchiseUser') || '{}');
  const franchiseCode = franchiseUser?.franchise_code || '';
  const franchiseName = franchiseUser?.franchise_name || franchiseUser?.applicant_name || '';

  const [studentsData, setStudentsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Mobile + Laptop Date Placeholder States
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/students/`, apiConfig());
      let students = [];
      if (Array.isArray(response.data)) students = response.data;
      else if (response.data?.data) students = response.data.data;
      else if (response.data?.results) students = response.data.results;

      const mappedData = students.map(item => ({
        id: item.id,
        studentName: item.student_name || '',
        fatherName: item.father_name || '',
        motherName: item.mother_name || '',
        dob: item.dob || '',
        gender: item.gender || '',
        mobile: item.mobile || '',
        email: item.email || '',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        pincode: item.pincode || '',
        courseCategory: item.course_category || '',
        courseName: item.course_name || '',
        sessions: item.sessions || '',
        feeAmount: item.fee_amount || 0,
        totalPayment: item.total_payment || 0,
        paymentStatus: item.payment_status || 'Pending',
        paymentMethod: item.payment_method || '',
        photo: item.photo || null,
        admittedAt: item.admitted_at || item.created_at || '',
        franchise_code: item.franchise_code || '',
        franchise_name: item.franchise_name || '',
        status: item.status || 'Active',
      }));

      setStudentsData(mappedData);
      setFilteredData(mappedData);
      const uniqueCats = [...new Set(mappedData.map(i => i.courseCategory))].filter(Boolean);
      setCategories(uniqueCats);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Access denied.' : 'Failed to load records.');
      setStudentsData([]);
      setFilteredData([]);
      toast.error('Failed to load student records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let result = [...studentsData];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.studentName?.toLowerCase().includes(term) ||
        item.fatherName?.toLowerCase().includes(term) ||
        item.mobile?.includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.courseCategory?.toLowerCase().includes(term) ||
        item.courseName?.toLowerCase().includes(term) ||
        item.franchise_code?.toLowerCase().includes(term) ||
        item.city?.toLowerCase().includes(term)
      );
    }
    if (selectedStatus !== 'All') result = result.filter(i => i.paymentStatus === selectedStatus);
    if (selectedCategory !== 'All') result = result.filter(i => i.courseCategory === selectedCategory);
    if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); result = result.filter(i => new Date(i.admittedAt) >= s); }
    if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); result = result.filter(i => new Date(i.admittedAt) <= e); }
    result.sort((a, b) => new Date(b.admittedAt || 0) - new Date(a.admittedAt || 0));
    setFilteredData(result);
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedCategory, startDate, endDate, studentsData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);
  const paginate = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      if (currentPage <= 4) pages.push(1,2,3,4,5,'...',totalPages);
      else if (currentPage >= totalPages - 3) pages.push(1,'...',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages);
      else pages.push(1,'...',currentPage-1,currentPage,currentPage+1,'...',totalPages);
    }
    return pages;
  };

  const getStatusClass = (s) => s === 'Completed' ? 'sr-status-completed' : s === 'Partial' ? 'sr-status-partial' : 'sr-status-pending';
  const getStatusIcon = (s) => s === 'Completed' ? '✅' : s === 'Partial' ? '🔶' : '⏳';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const totalAmount = filteredData.reduce((sum, s) => sum + (parseFloat(s.feeAmount) || 0), 0);
  const clearFilters = () => { setSearchTerm(''); setSelectedStatus('All'); setSelectedCategory('All'); setStartDate(''); setEndDate(''); };
  const openViewModal = (r) => { setSelectedRecord(r); setShowViewModal(true); };

  // ═══ Single Student PDF — Logo at Top, NO Payment Section ═══
  const buildStudentPDFHTML = (item) => {
    const today = new Date();
    const date = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    const admNo = `ESV/ADM/2024/${String(item.id).padStart(4,'0')}`;

    return `
      <div style="font-family:'Times New Roman',serif;background:#fff;padding:12px;border:3px double #1e40af;outline:1.5px solid #1e40af;outline-offset:-6px;width:780px;box-sizing:border-box;color:#000;">

        <!-- ══ HEADER WITH REAL LOGO ══ -->
        <div style="position:relative;padding:6px 8px 10px;border-bottom:2px solid #1e40af;margin-bottom:6px;">
          <div style="position:absolute;top:3px;right:8px;font-size:10px;">Reg. No.: <strong style="color:#dc2626;">ESV/2024/00125</strong></div>
          <div style="display:flex;align-items:center;gap:14px;padding-top:8px;">
            <div style="width:70px;height:70px;flex-shrink:0;">
              <img src="${esvLogo}" alt="ESV Logo" style="width:70px;height:70px;object-fit:contain;display:block;" crossorigin="anonymous" />
            </div>
            <div style="flex:1;text-align:center;">
              <h1 style="font-size:28px;color:#1e40af;font-weight:700;line-height:1;margin:0;"><span>Edu</span><span style="color:#f59e0b;">Skill</span><span>Vision</span></h1>
              <div style="font-size:10px;color:#1e40af;font-weight:700;letter-spacing:1.5px;margin-top:3px;font-style:italic;">• EMPOWERING SKILLS, SHAPING FUTURES •</div>
              <h2 style="font-size:13px;color:#1e40af;font-weight:700;margin:3px 0 0;">Computer Education & Training Institute</h2>
              <div style="font-size:10px;color:#333;font-style:italic;margin-top:2px;">(An ISO 9001:2015 Certified Institute)</div>
              <div style="font-size:9px;color:#333;margin-top:2px;">H.O.: Ambikapur, Chhattisgarh - 497001</div>
              <div style="font-size:9px;color:#333;margin-top:1px;">📞 +91 91111 37575 | ✉️ eduskillvision@gmail.com</div>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;padding:4px 6px 8px;font-size:12px;">
          <div>Admission No.: <strong style="color:#dc2626;">${admNo}</strong></div>
          <div>Date: <strong style="color:#dc2626;">${date}</strong></div>
        </div>

        <!-- ══ PERSONAL INFORMATION ══ -->
        <div style="background:#1e40af;color:#fff;text-align:center;padding:4px;font-size:11px;font-weight:700;letter-spacing:1px;">PERSONAL INFORMATION</div>
        <div style="display:flex;align-items:stretch;">
          <div style="flex:1;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;color:#000;">
              <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;width:28%;">Student Name</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;width:2%;">:</td><td style="border:1px solid #333;padding:4px 7px;"><strong>${item.studentName||'—'}</strong></td></tr>
              <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Father's Name</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;">${item.fatherName||'—'}</td></tr>
              <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Mother's Name</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;">${item.motherName||'—'}</td></tr>
              <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Date of Birth</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;">${item.dob?new Date(item.dob).toLocaleDateString('en-IN'):'—'}</td></tr>
              <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Gender</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;">${item.gender||'—'}</td></tr>
              <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Mobile</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;">${item.mobile||'—'}</td></tr>
              <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Email</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;">${item.email||'—'}</td></tr>
              <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Address</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;"><strong>${item.address||'—'}</strong><br/>${item.city||''}, ${item.state||''} - ${item.pincode||''}</td></tr>
            </table>
          </div>
          <div style="width:140px;border:1px solid #333;border-left:none;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;background:#fff;">
            <div style="width:115px;height:135px;border:1.5px solid #1e40af;background:#f3f4f6;display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${item.photo?`<img src="${item.photo}" style="max-width:100%;max-height:100%;object-fit:contain;" crossorigin="anonymous"/>`:'<span style="color:#999;font-size:10px;">Photo</span>'}
            </div>
            <div style="margin-top:5px;font-size:9px;font-weight:700;color:#1e40af;">Student Photo</div>
          </div>
        </div>

        <!-- ══ COURSE INFORMATION ══ -->
        <div style="background:#1e40af;color:#fff;text-align:center;padding:4px;font-size:11px;font-weight:700;margin-top:6px;">COURSE INFORMATION</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;color:#000;">
          <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;width:28%;">Course</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;width:2%;">:</td><td style="border:1px solid #333;padding:4px 7px;"><strong>${item.courseName||'—'}</strong></td></tr>
          <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Category</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;">${item.courseCategory||'—'}</td></tr>
          <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Duration</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;"><strong>${item.sessions||'—'}</strong></td></tr>
          <tr><td style="border:1px solid #333;padding:4px 7px;background:#fafafa;font-weight:600;">Admission Date</td><td style="border:1px solid #333;padding:4px 7px;text-align:center;font-weight:bold;">:</td><td style="border:1px solid #333;padding:4px 7px;">${formatDate(item.admittedAt)}</td></tr>
        </table>

        <!-- ══ PAYMENT DETAILS REMOVED ══ -->

        <!-- ══ FRANCHISE INFO ══ -->
        <div style="background:linear-gradient(135deg,#fef9c3,#fef08a);border:1.5px solid #ca8a04;border-radius:4px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <div>
            <div style="font-size:9px;color:#a16207;font-weight:700;text-transform:uppercase;">${item.franchise_code?'FRANCHISE PARTNER':'HEAD OFFICE'}</div>
            <div style="font-size:12px;font-weight:700;color:#854d0e;">${item.franchise_code||'MAIN CAMPUS'}</div>
          </div>
          <div style="font-size:10px;color:#a16207;">${item.franchise_name||'Admin'}</div>
        </div>

        <!-- ══ SIGNATURES — LEFT & RIGHT ONLY ══ -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:25px 14px 10px;gap:14px;">
          <div style="text-align:center;font-size:10px;flex:1;max-width:180px;">
            <div style="height:36px;"></div>
            <div style="border-top:1.5px solid #333;padding-top:4px;font-weight:700;margin-top:3px;">(Student Signature)</div>
          </div>
          <div style="text-align:center;font-size:10px;flex:1;max-width:180px;">
            <div style="height:36px;"></div>
            <div style="border-top:1.5px solid #333;padding-top:4px;font-weight:700;margin-top:3px;">(Authorized Signatory)</div>
            <div style="font-size:9px;color:#666;margin-top:2px;">EduSkillVision Education Pvt. Ltd.</div>
          </div>
        </div>

        <!-- ══ BOTTOM BAR — NO LOGOS ══ -->
        <div style="text-align:center;padding:8px;margin:8px 4px 4px;border-top:1px dashed #999;">
          <div style="font-size:12px;font-weight:800;color:#1e40af;"><span>Edu</span><span style="color:#f59e0b;">Skill</span><span>Vision</span></div>
          <div style="font-size:9px;color:#666;margin-top:2px;">📞 +91 91111 37575 · ✉️ eduskillvision@gmail.com</div>
        </div>

        <div style="text-align:center;padding:6px;font-size:10px;color:#dc2626;font-style:italic;border-top:1px dashed #999;margin:5px 4px 0;">Computer generated document | EduSkillVision</div>
      </div>`;
  };

  const downloadSinglePDF = async (item) => {
    setPdfLoading(true);
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:fixed;left:-9999px;top:0;width:780px;background:#fff;z-index:-1;';
    tempDiv.innerHTML = buildStudentPDFHTML(item);
    document.body.appendChild(tempDiv);
    try {
      const imgs = tempDiv.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 3000); });
      }));
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(tempDiv.firstElementChild, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false, windowWidth: 780,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pW = pdf.internal.pageSize.getWidth();
      const pH = pdf.internal.pageSize.getHeight();
      const m = 5;
      const iW = pW - m * 2;
      const iH = (canvas.height * iW) / canvas.width;
      if (iH <= pH - m * 2) {
        pdf.addImage(imgData, 'JPEG', m, m, iW, iH);
      } else {
        const sH = pH - m * 2;
        const sW = (canvas.width * sH) / canvas.height;
        pdf.addImage(imgData, 'JPEG', (pW - sW) / 2, m, sW, sH);
      }
      pdf.save(`ESV_${item.studentName.replace(/\s+/g, '_')}_${String(item.id).padStart(4, '0')}.pdf`);
      toast.success('Student PDF downloaded successfully!');
      setTimeout(() => {
        setPdfLoading(false);
        if (window.confirm('✅ PDF Downloaded!\n\nPrint this document?')) {
          const url = URL.createObjectURL(pdf.output('blob'));
          const pw = window.open(url, '_blank');
          if (pw) pw.addEventListener('load', () => pw.print());
          else window.open(url, '_blank');
        }
      }, 500);
    } catch (err) {
      toast.error('Failed to generate PDF: ' + err.message);
      setPdfLoading(false);
    } finally {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    }
  };

  const generateSimpleTablePDF = async () => {
    if (!filteredData.length) { toast.warning('No records to export.'); return; }
    setPdfLoading(true);
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    const timeStr = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const rows = filteredData.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
        <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-size:10px;">${i + 1}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:10px;font-weight:600;">${item.studentName || '—'}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:10px;">${item.fatherName || '—'}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:10px;">${item.mobile || '—'}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:10px;">${item.city || '—'}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:9.5px;">${item.courseName || '—'}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:10px;">${item.sessions || '—'}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:10px;text-align:right;font-weight:700;color:#1e40af;">₹${parseFloat(item.feeAmount || 0).toLocaleString('en-IN')}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:9.5px;text-align:center;color:${item.paymentStatus === 'Completed' ? '#059669' : item.paymentStatus === 'Partial' ? '#d97706' : '#dc2626'};font-weight:600;">${item.paymentStatus}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:9.5px;">${item.franchise_code || 'Admin'}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:9.5px;text-align:center;">${formatDate(item.admittedAt)}</td>
      </tr>`).join('');

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#fff;padding:20px;width:1140px;box-sizing:border-box;color:#000;">
        <div style="display:flex;align-items:center;gap:16px;padding-bottom:12px;border-bottom:3px solid #1e40af;">
          <div style="width:60px;height:60px;flex-shrink:0;">
            <img src="${esvLogo}" alt="ESV Logo" style="width:60px;height:60px;object-fit:contain;display:block;" crossorigin="anonymous" />
          </div>
          <div style="flex:1;">
            <div style="font-size:22px;font-weight:800;color:#1e40af;"><span>Edu</span><span style="color:#f59e0b;">Skill</span><span>Vision</span></div>
            <div style="font-size:11px;color:#1e40af;font-weight:600;margin-top:1px;">Computer Education & Training Institute</div>
            <div style="font-size:9px;color:#666;margin-top:2px;">H.O.: Ambikapur, Chhattisgarh - 497001 | 📞 +91 91111 37575 | ✉️ eduskillvision@gmail.com</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:10px;color:#666;">Date: <strong style="color:#1e40af;">${dateStr}</strong></div>
            <div style="font-size:10px;color:#666;margin-top:2px;">Time: <strong style="color:#1e40af;">${timeStr}</strong></div>
          </div>
        </div>
        <div style="text-align:center;margin:14px 0 10px;">
          <div style="display:inline-block;background:#1e40af;color:#fff;padding:6px 40px;font-size:14px;font-weight:700;letter-spacing:1.5px;border-radius:3px;">STUDENT REPORT</div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:center;border:1px solid #1e40af;">#</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:left;border:1px solid #1e40af;">Student Name</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:left;border:1px solid #1e40af;">Father Name</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:left;border:1px solid #1e40af;">Mobile</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:left;border:1px solid #1e40af;">City</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:left;border:1px solid #1e40af;">Course</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:left;border:1px solid #1e40af;">Duration</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:right;border:1px solid #1e40af;">Fee</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:center;border:1px solid #1e40af;">Status</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:left;border:1px solid #1e40af;">Franchise</th>
            <th style="background:#1e40af;color:#fff;padding:8px 6px;font-size:10px;font-weight:700;text-align:center;border:1px solid #1e40af;">Date</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr style="background:#eef2ff;">
              <td colspan="7" style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;font-size:11px;font-weight:800;color:#1e40af;">TOTAL :</td>
              <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-size:12px;font-weight:800;color:#1e40af;">₹${totalAmount.toLocaleString('en-IN')}</td>
              <td colspan="3" style="border:1px solid #cbd5e1;padding:8px;text-align:center;font-size:11px;font-weight:700;color:#1e40af;">${filteredData.length} Students</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:16px;padding-top:10px;border-top:2px solid #1e40af;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:9px;color:#888;">Generated on ${dateStr} at ${timeStr}</div>
          <div style="font-size:11px;font-weight:700;color:#1e40af;"><span>Edu</span><span style="color:#f59e0b;">Skill</span><span>Vision</span></div>
        </div>
      </div>`;

    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:fixed;left:-9999px;top:0;width:1140px;background:#fff;z-index:-1;';
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    try {
      await new Promise(r => setTimeout(r, 200));
      const canvas = await html2canvas(tempDiv.firstElementChild, {
        scale: 1.5, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false, windowWidth: 1140,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
      const pW = pdf.internal.pageSize.getWidth();
      const pH = pdf.internal.pageSize.getHeight();
      const m = 5;
      const iW = pW - m * 2;
      const iH = (canvas.height * iW) / canvas.width;
      let hLeft = iH;
      let pos = m;
      pdf.addImage(imgData, 'JPEG', m, pos, iW, iH);
      hLeft -= (pH - m * 2);
      while (hLeft > 0) {
        pos = -(iH - hLeft) + m;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', m, pos, iW, iH);
        hLeft -= (pH - m * 2);
      }
      pdf.save(`ESV_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Student Report PDF downloaded!');
      setTimeout(() => {
        setPdfLoading(false);
        if (window.confirm('✅ Report Downloaded!\n\nPrint?')) {
          const url = URL.createObjectURL(pdf.output('blob'));
          const pw = window.open(url, '_blank');
          if (pw) pw.addEventListener('load', () => pw.print());
        }
      }, 500);
    } catch (err) {
      toast.error('Failed to generate report PDF: ' + err.message);
      setPdfLoading(false);
    } finally {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    }
  };

  const exportCSV = () => {
    if (!filteredData.length) { toast.warning('No data to export.'); return; }
    const h = ['S.No','Student','Father','Mobile','City','Course','Duration','Fee','Status','Franchise','Date'];
    const r = filteredData.map((item, i) => [
      i + 1, `"${item.studentName}"`, `"${item.fatherName}"`, item.mobile, item.city,
      `"${item.courseName}"`, item.sessions, item.feeAmount, item.paymentStatus,
      item.franchise_code || 'Admin',
      item.admittedAt ? new Date(item.admittedAt).toLocaleDateString('en-IN') : ''
    ]);
    const csv = [h.join(','), ...r.map(x => x.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    a.download = `ESV_Students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('CSV exported successfully!');
  };

  if (loading) return (
    <div className="sr-container">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
      <div className="sr-card">
        <div className="sr-loading"><div className="sr-spinner"></div><p>Loading...</p></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="sr-container">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
      <div className="sr-card">
        <div className="sr-empty-state">
          <div className="sr-empty-icon">⚠️</div>
          <h3>{error}</h3>
          <button onClick={loadData} className="sr-btn sr-btn-primary">🔄 Retry</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sr-container">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      {pdfLoading && (
        <div className="sr-pdf-overlay">
          <div className="sr-pdf-overlay-content">
            <div className="sr-spinner sr-spinner-white"></div>
            <div className="sr-pdf-overlay-text">Generating PDF...</div>
            <div className="sr-pdf-overlay-sub">Please wait</div>
          </div>
        </div>
      )}

      <div className="sr-card">

        {/* Header */}
        <div className="sr-header">
          <div className="sr-title">
            <span className="sr-icon">🎓</span>
            <div>
              <h1>Student Report</h1>
              <p>{franchiseCode ? `🏷️ ${franchiseCode} · ${franchiseName}` : '👑 Admin'}</p>
            </div>
          </div>
          <div className="sr-actions">
            <button type="button" className="sr-btn sr-btn-refresh" onClick={loadData}>🔄</button>
            <button type="button" className="sr-btn sr-btn-csv" onClick={exportCSV}>📊 CSV</button>
            <button type="button" className="sr-btn sr-btn-pdf" onClick={generateSimpleTablePDF}>📄 PDF</button>
          </div>
        </div>

        {/* Filters */}
        <div className="sr-filters">
          <input type="search" className="sr-search" placeholder="🔍 Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <select className="sr-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Completed">✅ Completed</option>
            <option value="Partial">🔶 Partial</option>
            <option value="Pending">⏳ Pending</option>
          </select>
          <select className="sr-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* ✅ Date Filter with Working Mobile Placeholders */}
          <div className="sr-date-wrap">
            <input
              type={startFocused || startDate ? 'date' : 'text'}
              className="sr-date"
              placeholder="dd/mm/yyyy"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              onFocus={() => setStartFocused(true)}
              onBlur={() => setStartFocused(false)}
            />
            <span className="sr-date-sep">→</span>
            <input
              type={endFocused || endDate ? 'date' : 'text'}
              className="sr-date"
              placeholder="dd/mm/yyyy"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              onFocus={() => setEndFocused(true)}
              onBlur={() => setEndFocused(false)}
            />
          </div>

          <select className="sr-select sr-select-sm" value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          {(searchTerm || selectedStatus !== 'All' || selectedCategory !== 'All' || startDate || endDate) && (
            <button type="button" className="sr-btn sr-btn-clear" onClick={clearFilters}>✕</button>
          )}
        </div>

        {/* Table */}
        <div className="sr-table-wrap" ref={tableRef}>
          <table className="sr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Father</th>
                <th>Mobile</th>
                <th>Category</th>
                <th>Course</th>
                <th>Duration</th>
                <th>Fee (₹)</th>
                <th>Status</th>
                <th>Franchise</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((item, idx) => (
                <tr key={item.id}>
                  <td>{indexOfFirst + idx + 1}</td>
                  <td><strong>{item.studentName || '—'}</strong></td>
                  <td>{item.fatherName || '—'}</td>
                  <td>{item.mobile || '—'}</td>
                  <td><span className="sr-tag">{item.courseCategory || '—'}</span></td>
                  <td>{item.courseName || '—'}</td>
                  <td>{item.sessions || '—'}</td>
                  <td className="sr-fee">₹{parseFloat(item.feeAmount || 0).toLocaleString('en-IN')}</td>
                  <td><span className={`sr-badge ${getStatusClass(item.paymentStatus)}`}>{getStatusIcon(item.paymentStatus)} {item.paymentStatus}</span></td>
                  <td><span className="sr-tag">{item.franchise_code || 'Admin'}</span></td>
                  <td>{formatDate(item.admittedAt)}</td>
                  <td>
                    <div className="sr-acts">
                      <button type="button" className="sr-act-btn sr-act-view" onClick={() => openViewModal(item)} title="View">👁️</button>
                      <button type="button" className="sr-act-btn sr-act-pdf" onClick={() => downloadSinglePDF(item)} title="PDF">📥</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="12" className="sr-empty-td">📭 No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="sr-pagination">
            <span className="sr-pg-info">
              <strong>{indexOfFirst + 1}–{Math.min(indexOfLast, filteredData.length)}</strong> of <strong>{filteredData.length}</strong>
            </span>
            <div className="sr-pg-btns">
              <button type="button" className="sr-pg-btn" onClick={() => paginate(1)} disabled={currentPage === 1}>«</button>
              <button type="button" className="sr-pg-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>‹</button>
              {getPageNumbers().map((p, i) =>
                p === '...'
                  ? <span key={`d${i}`} className="sr-pg-dots">•••</span>
                  : <button key={`p${p}`} type="button" className={`sr-pg-btn ${currentPage === p ? 'active' : ''}`} onClick={() => paginate(p)}>{p}</button>
              )}
              <button type="button" className="sr-pg-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || !totalPages}>›</button>
              <button type="button" className="sr-pg-btn" onClick={() => paginate(totalPages)} disabled={currentPage === totalPages || !totalPages}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* ══ VIEW MODAL ══ */}
      {showViewModal && selectedRecord && (
        <div className="sr-overlay" onClick={() => setShowViewModal(false)}>
          <div className="sr-modal-pdf" onClick={e => e.stopPropagation()}>
            <button type="button" className="sr-modal-close-x" onClick={() => setShowViewModal(false)}>✕</button>

            {/* Modal Header — REAL LOGO */}
            <div className="sr-pdf-hdr">
              <div className="sr-pdf-reg">Reg. No.: <strong>ESV/2024/00125</strong></div>
              <div className="sr-pdf-hdr-content">
                <div style={{ width: '70px', height: '70px', flexShrink: 0 }}>
                  <img src={esvLogo} alt="ESV Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', display: 'block' }} />
                </div>
                <div className="sr-pdf-brand">
                  <h1><span>Edu</span><span className="gold">Skill</span><span>Vision</span></h1>
                  <div className="sr-pdf-tagline">• EMPOWERING SKILLS, SHAPING FUTURES •</div>
                  <h2>Computer Education & Training Institute</h2>
                  <div className="sr-pdf-iso">(An ISO 9001:2015 Certified Institute)</div>
                  <div className="sr-pdf-addr">Ambikapur, Chhattisgarh | 📞 +91 91111 37575</div>
                </div>
              </div>
            </div>

            <div className="sr-pdf-info">
              <div>Admission No.: <strong>ESV/ADM/2024/{String(selectedRecord.id).padStart(4, '0')}</strong></div>
              <div>Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong></div>
            </div>

            {/* Modal Body */}
            <div className="sr-modal-body">
              <div className="sr-pdf-secbar">PERSONAL INFORMATION</div>
              <div className="sr-pdf-personal">
                <div className="sr-pdf-personal-left">
                  <table className="sr-pdf-tbl"><tbody>
                    <tr><td className="lbl">Student Name</td><td className="col">:</td><td className="val"><strong>{selectedRecord.studentName || '—'}</strong></td></tr>
                    <tr><td className="lbl">Father's Name</td><td className="col">:</td><td className="val">{selectedRecord.fatherName || '—'}</td></tr>
                    <tr><td className="lbl">Mother's Name</td><td className="col">:</td><td className="val">{selectedRecord.motherName || '—'}</td></tr>
                    <tr><td className="lbl">Date of Birth</td><td className="col">:</td><td className="val">{selectedRecord.dob ? new Date(selectedRecord.dob).toLocaleDateString('en-IN') : '—'}</td></tr>
                    <tr><td className="lbl">Gender</td><td className="col">:</td><td className="val">{selectedRecord.gender || '—'}</td></tr>
                    <tr><td className="lbl">Mobile</td><td className="col">:</td><td className="val">{selectedRecord.mobile || '—'}</td></tr>
                    <tr><td className="lbl">Email</td><td className="col">:</td><td className="val">{selectedRecord.email || '—'}</td></tr>
                    <tr><td className="lbl">Address</td><td className="col">:</td><td className="val">{selectedRecord.address || '—'}<br />{selectedRecord.city}, {selectedRecord.state} - {selectedRecord.pincode}</td></tr>
                  </tbody></table>
                </div>
                <div className="sr-pdf-personal-right">
                  <div className="sr-pdf-photo">
                    {selectedRecord.photo ? <img src={selectedRecord.photo} alt="Student" /> : <span>Photo</span>}
                  </div>
                  <div className="sr-pdf-photo-lbl">Student Photo</div>
                </div>
              </div>

              <div className="sr-pdf-secbar" style={{ marginTop: 6 }}>COURSE INFORMATION</div>
              <table className="sr-pdf-tbl"><tbody>
                <tr><td className="lbl">Course</td><td className="col">:</td><td className="val"><strong>{selectedRecord.courseName || '—'}</strong></td></tr>
                <tr><td className="lbl">Category</td><td className="col">:</td><td className="val">{selectedRecord.courseCategory || '—'}</td></tr>
                <tr><td className="lbl">Duration</td><td className="col">:</td><td className="val"><strong>{selectedRecord.sessions || '—'}</strong></td></tr>
                <tr><td className="lbl">Admission Date</td><td className="col">:</td><td className="val">{formatDate(selectedRecord.admittedAt)}</td></tr>
              </tbody></table>

              {/* ✅ PAYMENT DETAILS REMOVED FROM MODAL */}

              <div className="sr-pdf-fc">
                <div>
                  <div className="sr-pdf-fc-lbl">{selectedRecord.franchise_code ? 'FRANCHISE' : 'HEAD OFFICE'}</div>
                  <div className="sr-pdf-fc-code">{selectedRecord.franchise_code || 'MAIN CAMPUS'}</div>
                </div>
                {selectedRecord.franchise_name && <div className="sr-pdf-fc-name">{selectedRecord.franchise_name}</div>}
              </div>

              {/* Footer — Left & Right Signatures Only */}
              <div className="sr-pdf-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '25px 14px 10px' }}>
                <div className="sr-pdf-sign" style={{ textAlign: 'center', flex: 1, maxWidth: '180px' }}>
                  <div className="sr-pdf-sig" style={{ minHeight: 25 }}></div>
                  <div className="sr-pdf-sig-line">(Student Signature)</div>
                </div>
                <div className="sr-pdf-sign" style={{ textAlign: 'center', flex: 1, maxWidth: '180px' }}>
                  <div className="sr-pdf-sig" style={{ minHeight: 25 }}></div>
                  <div className="sr-pdf-sig-line">(Authorized Signatory)</div>
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>EduSkillVision Education Pvt. Ltd.</div>
                </div>
              </div>

              {/* Bottom Bar — No Logos */}
              <div style={{ textAlign: 'center', padding: '10px', borderTop: '1px dashed #999', marginTop: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e40af' }}><span>Edu</span><span className="gold">Skill</span><span>Vision</span></div>
                <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>📞 +91 91111 37575 · ✉️ eduskillvision@gmail.com</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sr-modal-foot">
              <span className="sr-m-id">ID: #{selectedRecord.id}</span>
              <div className="sr-modal-foot-btns">
                <button type="button" className="sr-modal-btn sr-modal-btn-pdf" onClick={() => downloadSinglePDF(selectedRecord)}>📥 PDF</button>
                <button type="button" className="sr-modal-close" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReport;