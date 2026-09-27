// CertificateReport.jsx - Course Wise Wallet Deduction (Same Certificate Design) with Toast
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL, apiConfig } from '../../Api';
import './CertificateReport.css';

// ============================================
// 🔐 USER ACCESS
// ============================================
const getUserAccess = () => {
  try {
    const userType = localStorage.getItem('userType');
    const franchiseUser = JSON.parse(
      localStorage.getItem('franchiseUser') || '{}'
    );
    if (userType === 'franchise') {
      return {
        type: 'franchise',
        franchiseCode: franchiseUser?.franchise_code || '',
        franchiseName: franchiseUser?.franchise_name || 'Franchise',
      };
    }
    if (userType === 'admin')
      return {
        type: 'admin',
        franchiseCode: '',
        franchiseName: 'Admin',
      };
    return {
      type: 'guest',
      franchiseCode: '',
      franchiseName: 'Guest',
    };
  } catch {
    return {
      type: 'guest',
      franchiseCode: '',
      franchiseName: 'Guest',
    };
  }
};

// ============================================
// 📁 MAIN COMPONENT
// ============================================
const CertificateReport = () => {
  const access = getUserAccess();
  const userType = access.type;
  const franchiseCode = access.franchiseCode;

  const [certificates, setCertificates] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterType, setFilterType] = useState('');

  const [previewCert, setPreviewCert] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const certRef = useRef(null);

  // ============================================
  // 📥 LOAD DATA
  // ============================================
  const loadWallet = async () => {
    if (userType !== 'franchise') return;
    try {
      const res = await axios.get(
        `${API_URL}/wallet/balance/?_t=${Date.now()}`,
        apiConfig()
      );
      setWalletData(res.data?.wallet || null);
    } catch (err) {
      console.error('Wallet error:', err);
    }
  };

  const loadTransactions = async () => {
    if (userType !== 'franchise') return;
    try {
      const res = await axios.get(
        `${API_URL}/wallet/transactions/?_t=${Date.now()}`,
        apiConfig()
      );
      setTransactions(
        Array.isArray(res.data)
          ? res.data
          : res.data?.results || []
      );
    } catch (err) {
      setTransactions([]);
    }
  };

  const loadCertificates = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/student-certificates/?_t=${Date.now()}`,
        apiConfig()
      );
      let data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.results || [];

      const mapped = data.map(cert => ({
        id: cert.id,
        certNo: cert.cert_no || '',
        enrollNo: cert.enroll_no || '',
        studentName: cert.student_name || '',
        relation: cert.relation || 'Son',
        fatherName: cert.father_name || '',
        courseName: cert.course_name || '',
        centerName: cert.center_name || 'EduSkillVision',
        grade: cert.grade || 'A+',
        duration: cert.duration || '3 Months',
        issueDate: cert.issue_date || '',
        centerCoordinator:
          cert.center_coordinator || 'Mr. Rahul Mishra',
        director: cert.director || 'Mr. Ajay Kumar Gupta',
        companyName: cert.company_name || 'EduSkillVision',
        regNo: cert.reg_no || 'U80900CT2023PTC014511',
        website: cert.website || 'eduskillvision.com',
        unit:
          cert.unit ||
          'A unit of EduSkillVision Education Pvt. Ltd.',
        iso: cert.iso || 'ISO 9001:2015 Certified',
        headOffice:
          cert.head_office ||
          'Ambikapur, Surguja (C.G.) 497001',
        regionalOffice:
          cert.regional_office ||
          'Behind Kamal Auto Agency, Dhamtari (C.G.) Pin 493671',
        studentPhoto: cert.student_photo || null,
        studentType: cert.student_type || 'student',
        phone: cert.phone || '+91 91111 37575',
        email: cert.email || 'info@eduskillvision.com',
        franchise_code: cert.franchise_code || '',
        franchise_name: cert.franchise_name || '',
        qrImage: cert.qr_image || null,
        is_downloaded: cert.is_downloaded || false,
        download_count: cert.download_count || 0,
        wallet_deducted: cert.wallet_deducted || false,
        created_at: cert.created_at,
      }));

      setCertificates(mapped);
    } catch (err) {
      console.error('Certificates error:', err);
      setCertificates([]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadCertificates(),
      loadWallet(),
      loadTransactions(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // 🔍 FILTERED CERTIFICATES
  // ============================================
  const filteredCerts = certificates.filter(cert => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      cert.studentName?.toLowerCase().includes(term) ||
      cert.courseName?.toLowerCase().includes(term) ||
      cert.certNo?.toLowerCase().includes(term) ||
      cert.enrollNo?.toLowerCase().includes(term);
    const matchCourse =
      !filterCourse || cert.courseName === filterCourse;
    const matchType =
      !filterType || cert.studentType === filterType;
    return matchSearch && matchCourse && matchType;
  });

  const uniqueCourses = [
    ...new Set(
      certificates.map(c => c.courseName).filter(Boolean)
    ),
  ];

  // ============================================
  // 📊 COURSE WISE BALANCE
  // ============================================
  const getCourseBalance = () => {
    const courseBalance = {};

    transactions.forEach(txn => {
      const course = txn.course_name || 'Unknown';
      if (!courseBalance[course]) {
        courseBalance[course] = {
          total: 0,
          used: 0,
          remaining: 0,
        };
      }
      if (
        txn.transaction_type === 'purchase' ||
        txn.transaction_type === 'admin_add'
      ) {
        courseBalance[course].total +=
          txn.certificate_count || 0;
      } else if (txn.transaction_type === 'deduction') {
        courseBalance[course].used +=
          txn.certificate_count || 0;
      }
    });

    Object.keys(courseBalance).forEach(course => {
      courseBalance[course].remaining =
        courseBalance[course].total -
        courseBalance[course].used;
    });

    return courseBalance;
  };

  // ============================================
  // 📊 STATS
  // ============================================
  const totalPurchased = walletData?.total_certificates || 0;
  const totalUsed = walletData?.used_certificates || 0;
  const totalRemaining = walletData?.remaining_certificates || 0;
  const usagePercent =
    totalPurchased > 0
      ? Math.round((totalUsed / totalPurchased) * 100)
      : 0;

  const totalCerts = certificates.length;
  const downloadedCerts = certificates.filter(
    c => c.is_downloaded
  ).length;
  const notDownloadedCerts = totalCerts - downloadedCerts;
  const courseBalance = getCourseBalance();

  // ============================================
  // 🎨 QR PATTERN
  // ============================================
  const generateQRPattern = qrImageData => {
    if (qrImageData)
      return `<img src="${qrImageData}" style="width:100%;height:100%;object-fit:contain;" />`;
    const size = 25;
    const grid = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let filled = false;
        if (r < 7 && c < 7)
          filled =
            r < 1 || r > 5 || c < 1 || c > 5 ||
            (r > 1 && r < 5 && c > 1 && c < 5);
        else if (r < 7 && c >= size - 7)
          filled =
            r < 1 || r > 5 || c < size - 6 || c > size - 2 ||
            (r > 1 && r < 5 && c > size - 6 && c < size - 2);
        else if (r >= size - 7 && c < 7)
          filled =
            r < size - 6 || r > size - 2 || c < 1 || c > 5 ||
            (r > size - 6 && r < size - 2 && c > 1 && c < 5);
        else if (r === 6 && c >= 8 && c <= size - 9)
          filled = c % 2 === 0;
        else if (c === 6 && r >= 8 && r <= size - 9)
          filled = r % 2 === 0;
        else filled = Math.random() > 0.52;
        grid.push(filled);
      }
    }
    return `<div style="width:100%;height:100%;display:grid;grid-template-columns:repeat(${size},1fr);grid-template-rows:repeat(${size},1fr);gap:0;">${grid
      .map(
        f =>
          `<div style="background:${
            f ? '#1a2a5e' : 'white'
          };"></div>`
      )
      .join('')}</div>`;
  };

  // ============================================
  // 📜 CERTIFICATE HTML - SAME AS GENERATOR
  // ============================================
  const getCertificateHTML = d => {
    const hasPhoto = d.studentPhoto && d.studentPhoto.length > 100;
    const qrPattern = generateQRPattern(d.qrImage);
    const fc = d.franchise_code || '';

    return `<div style="width:1120px;height:830px;position:relative;background:#ffffff;border:14px solid #1a2a5e;font-family:Georgia,'Times New Roman',serif;overflow:hidden;box-sizing:border-box;">
      
      <div style="position:absolute;top:6px;left:6px;right:6px;bottom:6px;border:3px solid #c8a84e;pointer-events:none;z-index:1;box-sizing:border-box;"></div>
      <div style="position:absolute;top:15px;left:15px;right:15px;bottom:15px;border:1px solid rgba(200,168,78,0.6);pointer-events:none;z-index:1;box-sizing:border-box;"></div>

      <div style="position:absolute;left:50px;top:395px;z-index:3;">
        <svg width="26" height="70" viewBox="0 0 26 70">
          <polygon points="0,0 26,0 26,60 13,50 0,60" fill="#1a2a5e" />
        </svg>
      </div>
      <div style="position:absolute;left:85px;top:395px;z-index:3;">
        <svg width="26" height="70" viewBox="0 0 26 70">
          <polygon points="0,0 26,0 26,60 13,50 0,60" fill="#1a2a5e" />
        </svg>
      </div>

      <div style="position:absolute;bottom:70px;left:38px;width:70px;height:70px;background-image:radial-gradient(circle,#c8a84e 1.3px,transparent 1.3px);background-size:8px 8px;opacity:0.5;z-index:1;"></div>
      <div style="position:absolute;bottom:70px;right:38px;width:70px;height:70px;background-image:radial-gradient(circle,#c8a84e 1.3px,transparent 1.3px);background-size:8px 8px;opacity:0.5;z-index:1;"></div>

      <div style="position:absolute;top:30px;left:50px;z-index:10;font-size:12px;font-family:Georgia,serif;">
        <span style="color:#1a2a5e;font-weight:700;">Certificate No.</span>
        <span style="color:#333;margin-left:5px;font-weight:600;">${d.certNo}</span>
      </div>

      <div style="position:absolute;top:30px;right:50px;z-index:10;font-size:12px;font-family:Georgia,serif;">
        <span style="color:#1a2a5e;font-weight:700;">Enrollment No.</span>
        <span style="color:#333;margin-left:5px;font-weight:600;">${d.enrollNo}</span>
      </div>

      <div style="position:absolute;left:55px;top:290px;width:140px;z-index:5;text-align:center;">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <path d="M 20,60 Q 8,72 15,90 Q 22,80 28,73" fill="none" stroke="#c8a84e" stroke-width="2.5"/>
          <path d="M 22,55 Q 12,65 18,80" fill="none" stroke="#c8a84e" stroke-width="2"/>
          <path d="M 110,60 Q 122,72 115,90 Q 108,80 102,73" fill="none" stroke="#c8a84e" stroke-width="2.5"/>
          <path d="M 108,55 Q 118,65 112,80" fill="none" stroke="#c8a84e" stroke-width="2"/>
          <circle cx="65" cy="58" r="38" fill="url(#gg1)" stroke="#b8941e" stroke-width="2"/>
          <circle cx="65" cy="58" r="29" fill="url(#gg2)" stroke="#f0d060" stroke-width="1"/>
          <text x="65" y="50" text-anchor="middle" fill="#1a2a5e" font-size="6" font-weight="800" font-family="Arial">COMMITMENT TO</text>
          <text x="65" y="60" text-anchor="middle" fill="#1a2a5e" font-size="8.5" font-weight="900" font-family="Arial" letter-spacing="1">EXCELLENCE</text>
          <text x="65" y="72" text-anchor="middle" fill="#1a2a5e" font-size="8" font-family="Arial" letter-spacing="3">★★★★★</text>
          <defs>
            <linearGradient id="gg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f5e085"/>
              <stop offset="50%" stop-color="#c8a84e"/>
              <stop offset="100%" stop-color="#d4b84a"/>
            </linearGradient>
            <linearGradient id="gg2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#dab840"/>
              <stop offset="100%" stop-color="#c8a84e"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div style="position:absolute;right:55px;top:390px;width:120px;z-index:5;text-align:center;">
        <div style="width:80px;height:80px;margin:0 auto 4px;border:2.5px solid #1a2a5e;display:flex;align-items:center;justify-content:center;background:white;padding:4px;">
          ${qrPattern}
        </div>
        <div style="background:#1a2a5e;color:white;font-size:7.5px;font-weight:800;padding:3px 12px;letter-spacing:1.5px;display:inline-block;margin-bottom:3px;">SCAN TO VERIFY</div>
        <div style="font-size:7px;color:#666;line-height:1.4;margin-bottom:8px;">Verify this certificate at<br/>${d.website}/verify</div>
        <div style="width:58px;height:58px;margin:0 auto;border-radius:6px;background:linear-gradient(135deg,#8b5cf6,#6366f1,#3b82f6,#10b981,#c8a84e);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.25);">
          <span style="color:white;font-size:16px;font-weight:900;line-height:1;text-shadow:1px 1px 3px rgba(0,0,0,0.4);">ESV</span>
          <span style="color:white;font-size:7.5px;font-weight:700;letter-spacing:2.5px;">SECURE</span>
        </div>
      </div>

      <div style="position:relative;z-index:4;padding:40px 210px 70px;text-align:center;">
        
        <div style="text-align:center;margin-bottom:2px;">
          <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(145deg,#f0d060,#c8a84e,#b8941e);display:inline-flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.3);">
            <span style="font-size:22px;">🎓</span>
          </div>
        </div>

        <div style="margin:2px 0 1px;">
          <div style="color:#1a2a5e;font-size:32px;font-weight:900;letter-spacing:1px;font-family:Georgia,serif;">${d.companyName}</div>
          <div style="color:#c8a84e;font-size:10px;letter-spacing:6px;font-weight:700;margin-top:2px;text-transform:uppercase;font-family:Georgia,serif;">CENTER FOR PROFESSIONAL EXCELLENCE</div>
          ${fc ? `<div style="color:#1a2a5e;font-size:10px;font-weight:600;margin-top:1px;">🏷️ Franchise: ${fc}</div>` : ''}
        </div>

        <div style="margin:3px 0 2px;">
          <div style="width:66px;height:72px;margin:0 auto;border:3px solid #1a2a5e;overflow:hidden;background:#eee;display:flex;align-items:center;justify-content:center;">
            ${hasPhoto
              ? `<img src="${d.studentPhoto}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous" />`
              : `<div style="font-size:9px;color:#999;">PHOTO</div>`
            }
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:center;margin:3px 0 1px;">
          <span style="color:#c8a84e;font-size:18px;margin:0 12px;">❦</span>
          <span style="font-size:38px;color:#1a2a5e;font-weight:900;letter-spacing:7px;font-family:Georgia,serif;">CERTIFICATE</span>
          <span style="color:#c8a84e;font-size:18px;margin:0 12px;">❦</span>
        </div>

        <div style="font-size:12px;color:#666;font-style:italic;margin:1px 0;font-family:Georgia,serif;">This credential is awarded to</div>

        <div style="font-family:'Brush Script MT','Segoe Script',cursive;font-size:46px;color:#1a2a5e;font-weight:400;line-height:1.1;padding:2px 0 4px 0;margin:0;display:block;text-align:center;">${d.studentName || 'Student Name'}</div>

        <div style="font-size:12px;color:#666;margin:1px 0;font-family:Georgia,serif;">${d.relation} of</div>
        <div style="font-size:15px;color:#1a2a5e;font-weight:700;margin:1px 0 3px;font-family:Georgia,serif;">${d.fatherName || 'Father Name'}</div>
        <div style="font-size:12px;color:#666;margin:2px 0 3px;font-family:Georgia,serif;">for successfully completing the course</div>

        <div style="display:flex;align-items:center;justify-content:center;margin:3px 0;gap:14px;">
          <svg width="34" height="24" viewBox="0 0 34 24">
            <polygon points="0,12 8,0 34,0 26,12 34,24 8,24" fill="#c8a84e" stroke="#b8941e" stroke-width="1"/>
            <text x="17" y="17" text-anchor="middle" fill="#1a2a5e" font-size="12" font-weight="900">★</text>
          </svg>
          <span style="font-size:24px;color:#1a2a5e;font-weight:900;font-family:Georgia,serif;">${d.courseName || 'Course Name'}</span>
          <svg width="34" height="24" viewBox="0 0 34 24">
            <polygon points="34,12 26,0 0,0 8,12 0,24 26,24" fill="#c8a84e" stroke="#b8941e" stroke-width="1"/>
            <text x="17" y="17" text-anchor="middle" fill="#1a2a5e" font-size="12" font-weight="900">★</text>
          </svg>
        </div>

        <div style="font-size:12px;color:#666;margin:3px 0 1px;font-family:Georgia,serif;">
          from our <span style="color:#c8a84e;font-weight:700;">${d.centerName}</span> with
          <span style="color:#c8a84e;font-weight:900;font-size:16px;margin:0 3px;">${d.grade}</span> grade
        </div>

        <div style="font-size:12px;color:#666;margin:1px 0 4px;font-family:Georgia,serif;">
          and his/her course duration was <strong style="color:#1a2a5e;">${d.duration}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:0 10px;margin-top:4px;position:relative;">
          
          <div style="text-align:center;width:200px;">
            <div style="font-family:'Brush Script MT',cursive;font-size:26px;color:#1a2a5e;line-height:1;margin-bottom:2px;">Rahul</div>
            <div style="font-size:12px;font-weight:700;color:#000;font-family:Georgia,serif;">${d.centerCoordinator}</div>
            <div style="font-size:10px;color:#333;font-family:Georgia,serif;">Center Co-Ordinator</div>
            <div style="font-size:9px;color:#666;font-family:Georgia,serif;">Authorized Signature</div>
          </div>

          <div style="text-align:center;position:absolute;left:50%;top:5px;transform:translateX(-50%);">
            <svg width="44" height="44" viewBox="0 0 50 50">
              <polygon points="25,3 30,18 46,18 34,28 39,43 25,34 11,43 16,28 4,18 20,18" fill="url(#starGrad)" stroke="#b8941e" stroke-width="1.5"/>
              <defs>
                <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f5e085"/>
                  <stop offset="100%" stop-color="#c8a84e"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div style="text-align:center;width:200px;">
            <div style="font-family:'Brush Script MT',cursive;font-size:26px;color:#1a2a5e;line-height:1;margin-bottom:2px;">Ajay</div>
            <div style="font-size:12px;font-weight:700;color:#000;font-family:Georgia,serif;">${d.director}</div>
            <div style="font-size:10px;color:#333;font-family:Georgia,serif;">Chief Executive Officer</div>
            <div style="font-size:9px;color:#666;font-family:Georgia,serif;">${d.companyName}</div>
          </div>
        </div>

        <div style="text-align:center;margin-top:6px;">
          <div style="font-size:13px;color:#1a2a5e;font-weight:700;font-family:Georgia,serif;">${d.companyName}</div>
          <div style="font-size:9px;color:#444;line-height:1.5;font-family:Georgia,serif;margin-top:1px;">
            <span style="color:#e74c3c;">📍</span> <strong>Head Office :</strong> ${d.headOffice}<br>
            <strong>Regional Office :</strong> ${d.regionalOffice}<br>
            <strong>Reg. No. :</strong> ${d.regNo} | ${d.unit}
          </div>
          <div style="display:inline-block;border:2px solid #1a2a5e;padding:2px 20px;font-size:10px;font-weight:800;color:#1a2a5e;margin-top:3px;letter-spacing:1px;font-family:Georgia,serif;">${d.iso}</div>
        </div>
      </div>

      <div style="position:absolute;bottom:38px;left:0;width:0;height:0;border-style:solid;border-width:0 0 22px 32px;border-color:transparent transparent #1a2a5e transparent;z-index:5;"></div>
      <div style="position:absolute;bottom:38px;right:0;width:0;height:0;border-style:solid;border-width:0 32px 22px 0;border-color:transparent #1a2a5e transparent transparent;z-index:5;"></div>

      <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to right,#c8a84e,#dab840,#c8a84e);display:flex;align-items:center;justify-content:space-around;padding:8px 12px;border-top:2.5px solid #1a2a5e;height:38px;box-sizing:border-box;z-index:6;font-family:Georgia,serif;">

        <div style="display:flex;align-items:center;gap:4px;">
          <span style="background:#1a2a5e;color:#fff;width:16px;height:16px;border-radius:50%;font-size:9px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">🌐</span>
          <span style="font-size:9px;color:#1a2a5e;font-weight:700;">${d.website}</span>
        </div>

        <div style="display:flex;align-items:center;gap:4px;">
          <span style="background:#1a2a5e;color:#fff;width:16px;height:16px;border-radius:3px;font-size:9px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">✉</span>
          <span style="font-size:9px;color:#1a2a5e;font-weight:700;">${d.email}</span>
        </div>

        <div style="display:flex;align-items:center;gap:4px;">
          <span style="background:#25D366;color:#fff;width:16px;height:16px;border-radius:50%;font-size:9px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">📞</span>
          <span style="font-size:9px;color:#1a2a5e;font-weight:700;">${d.phone}</span>
        </div>

        <div style="display:flex;align-items:center;gap:4px;">
          <span style="background:#1877F2;color:#fff;width:16px;height:16px;border-radius:3px;font-size:11px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">f</span>
          <span style="font-size:9px;color:#1a2a5e;font-weight:700;">/eduskillvision</span>
        </div>

        <div style="display:flex;align-items:center;gap:4px;">
          <span style="background:#FF0000;color:#fff;width:16px;height:16px;border-radius:3px;font-size:9px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">▶</span>
          <span style="font-size:9px;color:#1a2a5e;font-weight:700;">/EduSkillVision</span>
        </div>

        <div style="display:flex;align-items:center;gap:4px;">
          <span style="background:#0A66C2;color:#fff;width:16px;height:16px;border-radius:3px;font-size:9px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">in</span>
          <span style="font-size:9px;color:#1a2a5e;font-weight:700;">/company/eduskillvision</span>
        </div>

        <div style="display:flex;align-items:center;gap:4px;">
          <span style="background:#25D366;color:#fff;width:16px;height:16px;border-radius:50%;font-size:9px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">📱</span>
          <span style="font-size:9px;color:#1a2a5e;font-weight:700;">+91 91111 37375</span>
        </div>

        <div style="display:flex;align-items:center;gap:4px;">
          <span style="background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:#fff;width:16px;height:16px;border-radius:4px;font-size:9px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">📷</span>
          <span style="font-size:9px;color:#1a2a5e;font-weight:700;">/eduskillvision</span>
        </div>

      </div>
    </div>`;
  };

  // ============================================
  // 👁️ PREVIEW
  // ============================================
  const openPreview = cert => setPreviewCert(cert);
  const closePreview = () => setPreviewCert(null);

  // ============================================
  // 📥 DOWNLOAD PDF
  // ============================================
  const handleDownload = async () => {
    if (!certRef.current || !previewCert) return;
    setDownloading(true);

    try {
      const downloadRes = await axios.post(
        `${API_URL}/student-certificates/${previewCert.id}/download/`,
        {},
        apiConfig()
      );

      console.log('📥 Download Response:', downloadRes.data);

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName =
        `Certificate_${previewCert.studentName}_${previewCert.certNo}.pdf`.replace(
          /[^a-z0-9._]/gi,
          '_'
        );
      pdf.save(fileName);

      await loadAll();

      if (downloadRes.data.wallet_deducted) {
        const courseBal = downloadRes.data.course_balance;
        toast.success(
          <div>
            <strong>✅ Certificate Downloaded!</strong>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              📚 Course: {downloadRes.data.course_name}<br />
              💰 Course Balance: {courseBal?.remaining || 0} remaining
            </div>
          </div>
        );
      } else {
        toast.success(
          <div>
            <strong>✅ Certificate Downloaded!</strong>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              📋 Free download (already paid before)
            </div>
          </div>
        );
      }

      closePreview();
    } catch (err) {
      console.error('Download error:', err);

      if (err.response?.status === 400) {
        const errData = err.response.data;
        toast.error(
          <div>
            <strong>❌ {errData.error || 'Insufficient Balance!'}</strong>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              📚 Course: {errData.course || 'N/A'}<br />
              💰 Remaining: {errData.remaining || 0}<br />
              {errData.message || 'Please recharge to continue.'}
            </div>
          </div>,
          { autoClose: 5000 }
        );
      } else if (err.response?.status === 404) {
        toast.error(
          <div>
            <strong>❌ Wallet Not Found!</strong>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Please contact admin to recharge your wallet.
            </div>
          </div>
        );
      } else if (err.response?.status === 403) {
        toast.error('❌ Access denied!');
      } else {
        toast.error('⚠️ Error downloading certificate. Try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  // ============================================
  // 🖨️ PRINT
  // ============================================
  const handlePrint = async () => {
    if (!previewCert || !certRef.current) return;
    setDownloading(true);

    try {
      const printRes = await axios.post(
        `${API_URL}/student-certificates/${previewCert.id}/download/`,
        {},
        apiConfig()
      );

      console.log('🖨️ Print Response:', printRes.data);

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${previewCert.studentName}</title>
            <style>
              @page { size: A4 landscape; margin: 0; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { display: flex; align-items: center;
                     justify-content: center; min-height: 100vh; }
              img { width: 100%; max-width: 297mm; height: auto; }
              @media print {
                body { margin: 0; }
                img { width: 297mm; height: 210mm;
                      object-fit: contain; }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}"
              onload="setTimeout(() => {
                window.print(); window.close();
              }, 300);" />
          </body>
        </html>
      `);
      printWindow.document.close();

      await loadAll();

      if (printRes.data.wallet_deducted) {
        console.log(
          `✅ Wallet deducted for ${printRes.data.course_name}`
        );
      }
    } catch (err) {
      console.error('Print error:', err);

      if (err.response?.status === 400) {
        const errData = err.response.data;
        toast.error(
          <div>
            <strong>❌ {errData.error || 'Insufficient Balance!'}</strong>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              📚 Course: {errData.course || 'N/A'}<br />
              💰 Remaining: {errData.remaining || 0}<br />
              {errData.message || 'Please recharge to continue.'}
            </div>
          </div>,
          { autoClose: 5000 }
        );
      } else if (err.response?.status === 404) {
        toast.error(
          <div>
            <strong>❌ Wallet Not Found!</strong>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Please contact admin to recharge your wallet.
            </div>
          </div>
        );
      } else {
        toast.error('⚠️ Error printing certificate.');
      }
    } finally {
      setDownloading(false);
    }
  };

  // ============================================
  // 🎨 LOADING
  // ============================================
  if (loading) {
    return (
      <div className="cr-loading">
        <div className="cr-spinner" />
        <p>Loading certificates...</p>
      </div>
    );
  }

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="cr-container">
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

      {/* HEADER */}
      <div className="cr-header">
        <div className="cr-header-left">
          <span className="cr-header-icon">📊</span>
          <div>
            <h1 className="cr-title">
              Certificate <span>Report</span>
            </h1>
            <p className="cr-subtitle">
              View and download all certificates
            </p>
            {franchiseCode && (
              <span className="cr-badge">🏷️ {franchiseCode}</span>
            )}
          </div>
        </div>
        <button className="cr-btn-refresh" onClick={loadAll}>
          🔄 Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="cr-stats">
        {userType === 'franchise' && walletData ? (
          <>
            <div className="cr-stat-card cr-stat-purchased">
              <div className="cr-stat-icon">💰</div>
              <div className="cr-stat-content">
                <div className="cr-stat-label">PURCHASED</div>
                <div className="cr-stat-value">
                  ₹{Number(walletData?.total_amount_paid || 0).toLocaleString()}
                </div>
                <div className="cr-stat-sub">
                  Total Amount Paid
                </div>
              </div>
            </div>

            <div className="cr-stat-card cr-stat-downloaded">
              <div className="cr-stat-icon">✅</div>
              <div className="cr-stat-content">
                <div className="cr-stat-label">USED</div>
                <div className="cr-stat-value">
                  ₹{(() => {
                    const total = walletData?.total_certificates || 0;
                    const used = walletData?.used_certificates || 0;
                    const paid = Number(walletData?.total_amount_paid || 0);
                    const perCert = total > 0 ? paid / total : 0;
                    return Math.round(used * perCert).toLocaleString();
                  })()}
                </div>
                <div className="cr-stat-sub">
                  Amount Used ({totalUsed} certs)
                </div>
              </div>
            </div>

            <div className="cr-stat-card cr-stat-remaining">
              <div className="cr-stat-icon">💵</div>
              <div className="cr-stat-content">
                <div className="cr-stat-label">REMAINING</div>
                <div className="cr-stat-value">
                  ₹{(() => {
                    const total = walletData?.total_certificates || 0;
                    const remaining = walletData?.remaining_certificates || 0;
                    const paid = Number(walletData?.total_amount_paid || 0);
                    const perCert = total > 0 ? paid / total : 0;
                    return Math.round(remaining * perCert).toLocaleString();
                  })()}
                </div>
                <div className="cr-stat-sub">
                  Balance Available ({totalRemaining} certs)
                </div>
              </div>
            </div>

            <div className="cr-stat-card cr-stat-usage">
              <div className="cr-stat-icon">📊</div>
              <div className="cr-stat-content">
                <div className="cr-stat-header">
                  <span className="cr-stat-label">USAGE</span>
                  <span className="cr-stat-percent">
                    {usagePercent}%
                  </span>
                </div>
                <div className="cr-progress-bar">
                  <div
                    className="cr-progress-fill"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <div className="cr-usage-info">
                  <span>Used: {totalUsed}</span>
                  <span>Total: {totalPurchased}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="cr-stat-card cr-stat-purchased">
              <div className="cr-stat-icon">📜</div>
              <div className="cr-stat-content">
                <div className="cr-stat-label">TOTAL</div>
                <div className="cr-stat-value">{totalCerts}</div>
                <div className="cr-stat-sub">
                  Total Certificates
                </div>
              </div>
            </div>

            <div className="cr-stat-card cr-stat-downloaded">
              <div className="cr-stat-icon">✅</div>
              <div className="cr-stat-content">
                <div className="cr-stat-label">DOWNLOADED</div>
                <div className="cr-stat-value">
                  {downloadedCerts}
                </div>
                <div className="cr-stat-sub">
                  Already Downloaded
                </div>
              </div>
            </div>

            <div className="cr-stat-card cr-stat-remaining">
              <div className="cr-stat-icon">📋</div>
              <div className="cr-stat-content">
                <div className="cr-stat-label">PENDING</div>
                <div className="cr-stat-value">
                  {notDownloadedCerts}
                </div>
                <div className="cr-stat-sub">
                  Not Downloaded Yet
                </div>
              </div>
            </div>

            <div className="cr-stat-card cr-stat-usage">
              <div className="cr-stat-icon">📊</div>
              <div className="cr-stat-content">
                <div className="cr-stat-header">
                  <span className="cr-stat-label">
                    DOWNLOAD RATE
                  </span>
                  <span className="cr-stat-percent">
                    {totalCerts > 0
                      ? Math.round(
                          (downloadedCerts / totalCerts) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="cr-progress-bar">
                  <div
                    className="cr-progress-fill"
                    style={{
                      width: `${
                        totalCerts > 0
                          ? (downloadedCerts / totalCerts) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="cr-usage-info">
                  <span>Done: {downloadedCerts}</span>
                  <span>Total: {totalCerts}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* COURSE WISE BALANCE (Franchise only) */}
      {userType === 'franchise' &&
        Object.keys(courseBalance).length > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '800',
                color: '#1a2a5e',
              }}
            >
              📚 Course-wise Balance
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px',
              }}
            >
              {Object.entries(courseBalance).map(
                ([course, bal]) => {
                  let color = '#10b981';
                  if (bal.remaining <= 0) color = '#ef4444';
                  else if (bal.remaining <= 5) color = '#f59e0b';

                  return (
                    <div
                      key={course}
                      style={{
                        border: `2px solid ${color}30`,
                        borderLeft: `5px solid ${color}`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        background: '#f9fafb',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: '#1a2a5e',
                          }}
                        >
                          📚 {course}
                        </div>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: '900',
                            color: color,
                          }}
                        >
                          {bal.remaining}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          marginTop: '4px',
                        }}
                      >
                        Total: {bal.total} | Used: {bal.used}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

      {/* FILTERS */}
      <div className="cr-filters">
        <div className="cr-search-wrapper">
          <input
            type="text"
            className="cr-search"
            placeholder="🔍 Search by name, course, certificate no..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="cr-select"
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {uniqueCourses.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="cr-select"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="student">Student</option>
          <option value="vocational">Vocational</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="cr-table-wrapper">
        {filteredCerts.length === 0 ? (
          <div className="cr-empty">
            <span>📜</span>
            <h4>No Certificates Found</h4>
            <p>
              Try adjusting your filters or generate new certificates.
            </p>
          </div>
        ) : (
          <table className="cr-table">
            <thead>
              <tr>
                <th>CERT NO.</th>
                <th>ENROLL NO.</th>
                <th>STUDENT</th>
                <th>FATHER</th>
                <th>COURSE</th>
                <th>TYPE</th>
                <th>GRADE</th>
                <th>STATUS</th>
                <th>FRANCHISE</th>
                <th>ISSUE DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map(cert => (
                <tr key={cert.id}>
                  <td>
                    <span className="cr-cert-no">{cert.certNo}</span>
                  </td>
                  <td>
                    <span className="cr-enroll-no">
                      {cert.enrollNo}
                    </span>
                  </td>
                  <td>
                    <div className="cr-student-cell">
                      {cert.studentPhoto ? (
                        <img
                          src={cert.studentPhoto}
                          alt=""
                          className="cr-student-photo"
                        />
                      ) : (
                        <div className="cr-student-photo cr-no-photo">
                          👤
                        </div>
                      )}
                      <strong>{cert.studentName}</strong>
                    </div>
                  </td>
                  <td>{cert.fatherName}</td>
                  <td>
                    <span
                      style={{
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}
                    >
                      📚 {cert.courseName}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`cr-type-badge cr-type-${cert.studentType}`}
                    >
                      {cert.studentType === 'vocational'
                        ? '🔧'
                        : '👨‍🎓'}{' '}
                      {cert.studentType}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`cr-grade cr-grade-${cert.grade
                        ?.toLowerCase()
                        .replace('+', 'plus')}`}
                    >
                      {cert.grade}
                    </span>
                  </td>
                  <td>
                    {cert.wallet_deducted ? (
                      <span
                        style={{
                          background: '#d1fae5',
                          color: '#065f46',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                      >
                        ✅ Paid ({cert.download_count}x)
                      </span>
                    ) : cert.is_downloaded ? (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                      >
                        ✅ Downloaded
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                      >
                        📋 Not Downloaded
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="cr-franchise-badge">
                      {cert.franchise_code || 'Admin'}
                    </span>
                  </td>
                  <td>{cert.issueDate}</td>
                  <td>
                    <div className="cr-actions">
                      <button
                        className="cr-btn-download"
                        onClick={() => openPreview(cert)}
                        title="Download"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER */}
      <div className="cr-footer">
        Showing {filteredCerts.length} of {certificates.length}{' '}
        certificates
        {franchiseCode && ` | Franchise: ${franchiseCode}`}
      </div>

      {/* PREVIEW MODAL */}
      {previewCert && (
        <div className="cr-modal-overlay" onClick={closePreview}>
          <div
            className="cr-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="cr-modal-header">
              <h3>
                📜 Certificate Preview - {previewCert.studentName}
              </h3>
              <button
                className="cr-modal-close"
                onClick={closePreview}
              >
                ✕
              </button>
            </div>

            <div className="cr-modal-body">
              <div
                ref={certRef}
                className="cr-cert-preview"
                dangerouslySetInnerHTML={{
                  __html: getCertificateHTML(previewCert),
                }}
              />
            </div>

            <div className="cr-modal-footer">
              <div className="cr-modal-info">
                {previewCert.wallet_deducted ? (
                  <span className="cr-info-downloaded">
                    ✅ Already paid for this certificate (
                    {previewCert.download_count}x downloaded) -
                    Free download
                  </span>
                ) : (
                  <span className="cr-info-new">
                    ⚠️ First download will deduct 1 certificate
                    from{' '}
                    <strong>
                      📚 {previewCert.courseName}
                    </strong>{' '}
                    course balance
                  </span>
                )}
              </div>
              <div className="cr-modal-actions">
                <button
                  className="cr-btn-print"
                  onClick={handlePrint}
                  disabled={downloading}
                >
                  {downloading ? '⏳ Processing...' : '🖨️ Print'}
                </button>
                <button
                  className="cr-btn-pdf"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading
                    ? '⏳ Downloading...'
                    : '📥 Download PDF'}
                </button>
                <button
                  className="cr-btn-close"
                  onClick={closePreview}
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateReport;