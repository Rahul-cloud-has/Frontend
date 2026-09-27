// CertificateGenerator.jsx - Complete Final Version (with Toast Notifications)
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL, apiConfig } from '../../Api';
import './Certificate.css';

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
        franchiseName:
          franchiseUser?.franchise_name ||
          franchiseUser?.applicant_name ||
          'Franchise',
      };
    }
    if (userType === 'admin') {
      return { type: 'admin', franchiseCode: '', franchiseName: 'Admin' };
    }
    return { type: 'guest', franchiseCode: '', franchiseName: 'Guest' };
  } catch {
    return { type: 'guest', franchiseCode: '', franchiseName: 'Guest' };
  }
};

const CertificateGenerator = () => {
  const access = getUserAccess();
  const franchiseCode = access.franchiseCode;
  const franchiseName = access.franchiseName;

  const [certificates, setCertificates] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [, setShowPreview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0, left: 0, width: 0,
  });
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [downloadCert, setDownloadCert] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const formRef = useRef(null);
  const searchInputRef = useRef(null);
  const certRef = useRef(null);

  const defaultFormData = {
    certNo: '',
    enrollNo: '',
    studentName: '',
    relation: 'Son',
    fatherName: '',
    courseName: '',
    centerName: 'EduSkillVision',
    grade: 'A+',
    duration: '3 Months',
    issueDate: new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }),
    centerCoordinator: 'Mr. Rahul Mishra',
    director: 'Mr. Ajay Kumar Gupta',
    companyName: 'EduSkillVision',
    regNo: 'U80900CT2023PTC014511',
    website: 'eduskillvision.com',
    unit: 'A unit of EduSkillVision Education Pvt. Ltd.',
    iso: 'ISO 9001:2015 Certified',
    headOffice: 'Ambikapur, Surguja (C.G.) 497001',
    regionalOffice:
      'Behind Kamal Auto Agency, Dhamtari (C.G.) Pin 493671',
    studentPhoto: null,
    studentType: 'student',
    studentId: null,
    phone: '+91 91111 37575',
    email: 'info@eduskillvision.com',
    franchise_code: franchiseCode || '',
    franchise_name: franchiseName || '',
    qrImage: null,
  };

  const [formData, setFormData] = useState(defaultFormData);

  // ============================================
  // 📥 LOAD STUDENTS
  // ============================================
  const loadStudents = async () => {
    try {
      const [studentRes, vocationalRes] = await Promise.all([
        axios.get(`${API_URL}/students/`, apiConfig()),
        axios.get(`${API_URL}/vocational/students/`, apiConfig()),
      ]);

      let sData = Array.isArray(studentRes.data)
        ? studentRes.data
        : studentRes.data?.data ||
        studentRes.data?.results ||
        [];

      let vData = Array.isArray(vocationalRes.data)
        ? vocationalRes.data
        : vocationalRes.data?.data ||
        vocationalRes.data?.results ||
        [];

      const mapped = [
        ...sData.map(s => ({
          id: s.id,
          name: s.student_name || '',
          fatherName: s.father_name || '',
          courseName: s.course_name || '',
          photo: s.photo || null,
          type: 'student',
          label: 'Student',
          icon: '👨‍🎓',
          franchise_code: s.franchise_code || '',
        })),
        ...vData.map(s => ({
          id: s.id,
          name: s.student_name || '',
          fatherName: s.father_name || '',
          courseName: s.course_name || '',
          photo: s.photo || null,
          type: 'vocational',
          label: 'Vocational',
          icon: '🔧',
          franchise_code: s.franchise_code || '',
        })),
      ];
      setAllStudents(mapped);
    } catch (err) {
      console.error('Students error:', err);
    }
  };

  // ============================================
  // 📥 LOAD CERTIFICATES
  // ============================================
  const loadCertificates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/student-certificates/?_t=${Date.now()}`,
        apiConfig()
      );
      let data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.results || [];

      setCertificates(
        data.map(cert => ({
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
            cert.head_office || 'Ambikapur, Surguja (C.G.) 497001',
          regionalOffice:
            cert.regional_office ||
            'Behind Kamal Auto Agency, Dhamtari (C.G.) Pin 493671',
          studentPhoto: cert.student_photo || null,
          studentType: cert.student_type || 'student',
          studentId: cert.student_id || null,
          phone: cert.phone || '+91 91111 37575',
          email: cert.email || 'info@eduskillvision.com',
          franchise_code: cert.franchise_code || '',
          franchise_name: cert.franchise_name || '',
          qrImage: cert.qr_image || null,
          is_downloaded: cert.is_downloaded || false,
          download_count: cert.download_count || 0,
          created_at: cert.created_at,
        }))
      );
    } catch (err) {
      console.error('Certificates error:', err);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadCertificates();
  }, []);

  const filteredStudents = allStudents.filter(s => {
    const term = studentSearchTerm.toLowerCase().trim();
    if (!term) return false;
    return (
      s.name?.toLowerCase().includes(term) ||
      s.fatherName?.toLowerCase().includes(term) ||
      s.courseName?.toLowerCase().includes(term)
    );
  });

  const updateDropdownPosition = () => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const handleSelectStudent = student => {
    setSelectedStudent(student);
    setStudentSearchTerm(student.name);
    setShowStudentDropdown(false);
    const certCount = certificates.length + 1;
    const prefix =
      student.type === 'vocational' ? 'VOC' : 'ESV';
    setFormData(prev => ({
      ...prev,
      studentName: student.name,
      fatherName: student.fatherName || '',
      courseName: student.courseName || '',
      studentPhoto: student.photo || null,
      studentId: student.id,
      studentType: student.type,
      franchise_code: franchiseCode || student.franchise_code || '',
      franchise_name: franchiseName || '',
      certNo: `${prefix}/2026/${String(certCount).padStart(3, '0')}`,
      enrollNo: `${prefix}/ENR/${String(certCount).padStart(3, '0')}`,
    }));
  };

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePhotoUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData(prev => ({
          ...prev, studentPhoto: reader.result,
        }));
      reader.readAsDataURL(file);
    }
  };

  const handleQRUpload = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setQrImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () =>
    setFormData(prev => ({ ...prev, studentPhoto: null }));
  const removeQR = () => setQrImage(null);

  const resetForm = () => {
    const certCount = certificates.length + 1;
    setFormData({
      ...defaultFormData,
      certNo: `ESV/2026/${String(certCount).padStart(3, '0')}`,
      enrollNo: `ESV/ENR/${String(certCount).padStart(3, '0')}`,
      franchise_code: franchiseCode || '',
      franchise_name: franchiseName || '',
    });
    setQrImage(null);
    setIsEditing(false);
    setEditId(null);
    setSelectedStudent(null);
    setStudentSearchTerm('');
    setShowStudentDropdown(false);
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
    setShowPreview(false);
    setTimeout(() => {
      formRef?.current?.scrollIntoView({
        behavior: 'smooth', block: 'start',
      });
      updateDropdownPosition();
    }, 100);
  };

  const closeForm = () => {
    setShowForm(false);
    setShowPreview(false);
    setIsEditing(false);
    setEditId(null);
    setShowStudentDropdown(false);
  };

  // ============================================
  // 💾 SAVE / UPDATE
  // ============================================
  const handleSave = async () => {
    if (
      !formData.studentName ||
      !formData.fatherName ||
      !formData.courseName
    ) {
      toast.warning('⚠️ Please fill all required fields!');
      return;
    }

    const certData = {
      student_name: formData.studentName,
      relation: formData.relation || 'Son',
      father_name: formData.fatherName,
      course_name: formData.courseName,
      center_name: formData.centerName,
      grade: formData.grade,
      duration: formData.duration,
      issue_date: formData.issueDate,
      center_coordinator: formData.centerCoordinator,
      director: formData.director,
      company_name: formData.companyName,
      reg_no: formData.regNo,
      website: formData.website,
      unit: formData.unit,
      iso: formData.iso,
      head_office: formData.headOffice,
      regional_office: formData.regionalOffice,
      phone: formData.phone,
      email: formData.email,
      student_photo: formData.studentPhoto || null,
      qr_image: qrImage || formData.qrImage || null,
      student_id: formData.studentId || null,
      student_type: formData.studentType || 'student',
      franchise_code: franchiseCode || '',
      franchise_name: franchiseName || '',
    };

    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(
          `${API_URL}/student-certificates/${editId}/`,
          certData,
          apiConfig()
        );
        toast.success('✅ Certificate Updated!');
      } else {
        await axios.post(
          `${API_URL}/student-certificates/`,
          certData,
          apiConfig()
        );
        toast.success('✅ Certificate Generated!');
      }
      await loadCertificates();
      setShowPreview(false);
      setShowForm(false);
      resetForm();
    } catch (error) {
      const errMsg =
        error.response?.data?.error || 'Error saving certificate';
      toast.error(`⚠️ ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = id => {
    const cert = certificates.find(c => c.id === id);
    if (!cert) return;
    setFormData({
      certNo: cert.certNo,
      enrollNo: cert.enrollNo,
      studentName: cert.studentName,
      relation: cert.relation,
      fatherName: cert.fatherName,
      courseName: cert.courseName,
      centerName: cert.centerName,
      grade: cert.grade,
      duration: cert.duration,
      issueDate: cert.issueDate,
      centerCoordinator: cert.centerCoordinator,
      director: cert.director,
      companyName: cert.companyName,
      regNo: cert.regNo,
      website: cert.website,
      unit: cert.unit,
      iso: cert.iso,
      headOffice: cert.headOffice,
      regionalOffice: cert.regionalOffice,
      studentPhoto: cert.studentPhoto,
      studentType: cert.studentType,
      studentId: cert.studentId,
      phone: cert.phone,
      email: cert.email,
      franchise_code: cert.franchise_code,
      franchise_name: cert.franchise_name,
      qrImage: cert.qrImage,
    });
    setQrImage(cert.qrImage || null);
    setIsEditing(true);
    setEditId(id);
    setShowForm(true);
    setShowPreview(true);
    setStudentSearchTerm(cert.studentName || '');
    setTimeout(() => {
      formRef?.current?.scrollIntoView({
        behavior: 'smooth', block: 'start',
      });
    }, 100);
  };

  // Internal Delete API trigger
  const executeDelete = async id => {
    setLoading(true);
    try {
      await axios.delete(
        `${API_URL}/student-certificates/${id}/`,
        apiConfig()
      );
      toast.success('🗑️ Certificate Deleted!');
      await loadCertificates();
    } catch (err) {
      toast.error('⚠️ Error deleting certificate.');
    } finally {
      setLoading(false);
    }
  };

  // Toast confirmation dialog for deleting
  const handleDelete = id => {
    toast(
      ({ closeToast }) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>Delete Certificate?</div>
          <div style={{ fontSize: '14px', marginBottom: '14px' }}>Are you sure you want to delete this certificate?</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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
                await executeDelete(id);
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

  // ============================================
  // 📥 DOWNLOAD PDF - Course Wise Wallet Check
  // ============================================
  const handleDownloadPDF = async () => {
    if (!certRef.current || !downloadCert) return;
    setDownloading(true);

    try {
      const downloadRes = await axios.post(
        `${API_URL}/student-certificates/${downloadCert.id}/download/`,
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
        `Certificate_${downloadCert.studentName}_${downloadCert.certNo}.pdf`
          .replace(/[^a-z0-9._]/gi, '_');
      pdf.save(fileName);

      await loadCertificates();

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

      setDownloadCert(null);
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
        toast.error('⚠️ Error downloading. Try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  // ============================================
  // 🖨️ PRINT - Course Wise Wallet Check
  // ============================================
  const handlePrint = async () => {
    if (!certRef.current || !downloadCert) return;
    setDownloading(true);

    try {
      const printRes = await axios.post(
        `${API_URL}/student-certificates/${downloadCert.id}/download/`,
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
            <title>Certificate - ${downloadCert.studentName}</title>
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

      await loadCertificates();

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
        toast.error('⚠️ Error printing.');
      }
    } finally {
      setDownloading(false);
    }
  };

  // QR Pattern
  const generateQRPattern = qrImageData => {
    if (qrImageData)
      return `<img src="${qrImageData}"
        style="width:100%;height:100%;object-fit:contain;" />`;
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
    return `<div style="width:100%;height:100%;display:grid;
      grid-template-columns:repeat(${size},1fr);
      grid-template-rows:repeat(${size},1fr);gap:0;">
      ${grid
        .map(
          f =>
            `<div style="background:${f ? '#1a2a5e' : 'white'
            };"></div>`
        )
        .join('')}
    </div>`;
  };

  // ============================================
  // 📜 CERTIFICATE HTML - FIXED SPACING
  // ============================================
  const getCertificateHTML = d => {
    const hasPhoto = d.studentPhoto && d.studentPhoto.length > 100;
    const qrImageData = d.qrImage || qrImage || formData.qrImage;
    const qrPattern = generateQRPattern(qrImageData);
    const fc = d.franchise_code || franchiseCode || '';

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
  // 📥 DOWNLOAD PREVIEW MODAL
  // ============================================
  const DownloadPreviewModal = () => {
    if (!downloadCert) return null;
    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000, padding: '20px',
        }}
        onClick={() => setDownloadCert(null)}
      >
        <div
          style={{
            background: 'white', borderRadius: '16px',
            maxWidth: '1200px', width: '100%',
            maxHeight: '95vh', display: 'flex',
            flexDirection: 'column', overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: 'white', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>
              📜 {downloadCert.studentName} - {downloadCert.certNo}
            </h3>
            <button
              onClick={() => setDownloadCert(null)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', color: 'white',
                width: '32px', height: '32px',
                borderRadius: '6px', cursor: 'pointer',
                fontSize: '16px',
              }}
            >✕</button>
          </div>

          <div style={{
            flex: 1, overflow: 'auto', padding: '20px',
            background: '#f1f5f9', display: 'flex',
            justifyContent: 'center', alignItems: 'flex-start',
          }}>
            <div
              ref={certRef}
              style={{
                transform: 'scale(0.65)',
                transformOrigin: 'top center',
                marginBottom: '-280px',
              }}
              dangerouslySetInnerHTML={{
                __html: getCertificateHTML(downloadCert),
              }}
            />
          </div>

          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>
              {downloadCert.is_downloaded ? (
                <span style={{
                  background: '#d1fae5', color: '#065f46',
                  padding: '6px 12px', borderRadius: '6px',
                }}>
                  ✅ Downloaded {downloadCert.download_count}x
                </span>
              ) : (
                <span style={{
                  background: '#f1f5f9', color: '#475569',
                  padding: '6px 12px', borderRadius: '6px',
                }}>
                  📋 First Download
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handlePrint}
                disabled={downloading}
                style={{
                  background: '#f59e0b', color: 'white',
                  border: 'none', padding: '10px 20px',
                  borderRadius: '8px', fontWeight: '700',
                  fontSize: '13px',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  opacity: downloading ? 0.6 : 1,
                }}
              >
                {downloading ? '⏳...' : '🖨️ Print'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                style={{
                  background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: '8px',
                  fontWeight: '700', fontSize: '13px',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  opacity: downloading ? 0.6 : 1,
                }}
              >
                {downloading ? '⏳ Downloading...' : '📥 Download PDF'}
              </button>
              <button
                onClick={() => setDownloadCert(null)}
                style={{
                  background: '#f1f5f9', color: '#475569',
                  border: 'none', padding: '10px 20px',
                  borderRadius: '8px', fontWeight: '600',
                  fontSize: '13px', cursor: 'pointer',
                }}
              >✕ Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && certificates.length === 0) {
    return (
      <div className="cert-loading">
        <div className="cert-spinner"></div>
        <p>Loading certificates...</p>
      </div>
    );
  }

  return (
    <div className="cert-gen-container">
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

      <div className="cert-gen-card">
        <DownloadPreviewModal />

        {/* Header */}
        <div className="gen-header">
          <div className="gen-header-left">
            <span className="gen-icon">📜</span>
            <div>
              <h1>Certificate <span>Generator</span></h1>
              <p>Create professional EduSkillVision certificates</p>
              {franchiseCode && (
                <span className="franchise-badge">
                  🏷️ {franchiseCode}
                </span>
              )}
            </div>
          </div>
          <button className="btn-add" onClick={openForm}>
            ➕ New Certificate
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="gen-form-container" ref={formRef}>
            <div className="gen-form-header">
              <h3>
                {isEditing
                  ? '✏️ Edit Certificate'
                  : '📝 Create Certificate'}
              </h3>
              <button
                className="btn-close-form"
                onClick={closeForm}
              >✕</button>
            </div>

            <div className="gen-form">
              {/* Student Search */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>🔍 Search Student</label>
                  <div className="student-search-wrapper">
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="student-search-input"
                      placeholder="Type student name..."
                      value={studentSearchTerm}
                      onChange={e => {
                        setStudentSearchTerm(e.target.value);
                        setShowStudentDropdown(true);
                        updateDropdownPosition();
                      }}
                      onFocus={() => {
                        setShowStudentDropdown(true);
                        updateDropdownPosition();
                      }}
                    />
                    {selectedStudent && (
                      <span className="selected-student-badge">
                        ✅ {selectedStudent.icon} {selectedStudent.name}
                        <button
                          className="clear-selection"
                          onClick={() => {
                            setSelectedStudent(null);
                            setStudentSearchTerm('');
                            setFormData(prev => ({
                              ...prev,
                              studentName: '',
                              fatherName: '',
                              courseName: '',
                              studentPhoto: null,
                            }));
                          }}
                        >✕</button>
                      </span>
                    )}
                    {showStudentDropdown &&
                      studentSearchTerm.length > 0 &&
                      filteredStudents.length > 0 && (
                        <div style={{
                          position: 'fixed',
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                          maxHeight: '300px',
                          overflowY: 'auto',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                          zIndex: 9999,
                          padding: '4px 0',
                        }}>
                          {filteredStudents.map(s => (
                            <div
                              key={`${s.type}-${s.id}`}
                              onMouseDown={() => handleSelectStudent(s)}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                              }}
                              onMouseEnter={e =>
                                (e.currentTarget.style.background = '#f8faff')
                              }
                              onMouseLeave={e =>
                                (e.currentTarget.style.background = 'white')
                              }
                            >
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                              }}>
                                <span style={{
                                  background:
                                    s.type === 'vocational'
                                      ? '#dbeafe'
                                      : '#d1fae5',
                                  color:
                                    s.type === 'vocational'
                                      ? '#1d4ed8'
                                      : '#065f46',
                                  padding: '2px 10px',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                }}>
                                  {s.icon} {s.label}
                                </span>
                                <strong>{s.name}</strong>
                                <span style={{
                                  fontSize: '12px',
                                  color: '#64748b',
                                }}>
                                  👤 {s.fatherName}
                                </span>
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: '#8e9aac',
                                marginTop: '3px',
                              }}>
                                📚 {s.courseName}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Certificate No + Enrollment No */}
              <div className="form-row">
                <div className="form-group">
                  <label>Certificate No.</label>
                  <input
                    name="certNo"
                    value={formData.certNo}
                    readOnly
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Enrollment No.</label>
                  <input
                    name="enrollNo"
                    value={formData.enrollNo}
                    readOnly
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Student Name + Relation */}
              <div className="form-row">
                <div className="form-group">
                  <label>Student Name <span className="required">*</span></label>
                  <input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Relation</label>
                  <select
                    name="relation"
                    value={formData.relation}
                    onChange={handleChange}
                  >
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Wife">Wife</option>
                  </select>
                </div>
              </div>

              {/* Father Name + Course Name */}
              <div className="form-row">
                <div className="form-group">
                  <label>Father's Name <span className="required">*</span></label>
                  <input
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Course Name <span className="required">*</span></label>
                  <input
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Center Name + Grade */}
              <div className="form-row">
                <div className="form-group">
                  <label>Center Name</label>
                  <input
                    name="centerName"
                    value={formData.centerName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Grade</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                  >
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="O">O</option>
                  </select>
                </div>
              </div>

              {/* Duration + Issue Date */}
              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Issue Date</label>
                  <input
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Center Coordinator + Director */}
              <div className="form-row">
                <div className="form-group">
                  <label>Center Co-ordinator</label>
                  <input
                    name="centerCoordinator"
                    value={formData.centerCoordinator}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Director / CEO</label>
                  <input
                    name="director"
                    value={formData.director}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Company Name + Phone */}
              <div className="form-row">
                <div className="form-group">
                  <label>🏢 Company Name</label>
                  <input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>📞 Phone</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email + Website */}
              <div className="form-row">
                <div className="form-group">
                  <label>✉️ Email</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>🌐 Website</label>
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Head Office */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>📍 Head Office</label>
                  <input
                    name="headOffice"
                    value={formData.headOffice}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Regional Office */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>📍 Regional Office</label>
                  <input
                    name="regionalOffice"
                    value={formData.regionalOffice}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Registration No + ISO */}
              <div className="form-row">
                <div className="form-group">
                  <label>📋 Registration No.</label>
                  <input
                    name="regNo"
                    value={formData.regNo}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>🏆 ISO Certification</label>
                  <input
                    name="iso"
                    value={formData.iso}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Unit Info */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>🏢 Unit Info</label>
                  <input
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Franchise Info - Read Only */}
              <div className="form-row">
                <div className="form-group">
                  <label>🏷️ Franchise Code</label>
                  <input
                    type="text"
                    value={franchiseCode || 'Admin'}
                    readOnly
                    style={{
                      background: '#f1f5f9',
                      fontWeight: 'bold',
                      color: '#4f46e5',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>🏪 Franchise Name</label>
                  <input
                    type="text"
                    value={franchiseName || 'Administrator'}
                    readOnly
                    style={{
                      background: '#f1f5f9',
                      fontWeight: 'bold',
                      color: '#4f46e5',
                    }}
                  />
                </div>
              </div>

              {/* QR Upload */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>📱 QR Code</label>
                  <div className="photo-upload-wrapper">
                    <div className="photo-preview" style={{
                      width: '80px', height: '80px', borderRadius: '8px',
                    }}>
                      {qrImage || formData.qrImage ? (
                        <div className="photo-preview-container">
                          <img
                            src={qrImage || formData.qrImage}
                            alt="QR"
                            className="photo-preview-img"
                          />
                          <button
                            className="btn-remove-photo"
                            onClick={removeQR}
                            type="button"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="photo-placeholder">
                          <span style={{ fontSize: '24px' }}>📱</span>
                          <p style={{ fontSize: '8px' }}>Upload QR</p>
                        </div>
                      )}
                    </div>
                    <div className="photo-upload-btn-wrapper">
                      <input
                        type="file"
                        id="qrInput"
                        accept="image/*"
                        onChange={handleQRUpload}
                        hidden
                      />
                      <button
                        className="btn-upload-photo"
                        onClick={() =>
                          document.getElementById('qrInput')?.click()
                        }
                        type="button"
                      >📤 Choose QR</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>📸 Student Photo</label>
                  <div className="photo-upload-wrapper">
                    <div className="photo-preview">
                      {formData.studentPhoto ? (
                        <div className="photo-preview-container">
                          <img
                            src={formData.studentPhoto}
                            alt="Student"
                            className="photo-preview-img"
                          />
                          <button
                            className="btn-remove-photo"
                            onClick={removePhoto}
                            type="button"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="photo-placeholder">
                          <span>📷</span>
                          <p>Upload Photo</p>
                        </div>
                      )}
                    </div>
                    <div className="photo-upload-btn-wrapper">
                      <input
                        type="file"
                        id="photoInput"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        hidden
                      />
                      <button
                        className="btn-upload-photo"
                        onClick={() =>
                          document.getElementById('photoInput')?.click()
                        }
                        type="button"
                      >📤 Choose Photo</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading
                    ? '⏳ Saving...'
                    : `💾 ${isEditing ? 'Update' : 'Save'}`}
                </button>
                <button className="btn-cancel" onClick={closeForm}>
                  ✕ Cancel
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Certificate List */}
        <div className="cert-list">
          <div className="cert-list-header">
            <h3>
              📋 Certificate History{' '}
              <span className="count">{certificates.length}</span>
            </h3>
            {franchiseCode && (
              <span className="franchise-badge">🏷️ {franchiseCode}</span>
            )}
          </div>

          {certificates.length === 0 ? (
            <div className="empty-list">
              <span>📜</span>
              <h4>No Certificates Yet</h4>
              <p>Click <strong>"➕ New Certificate"</strong> to create one!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cert No.</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Franchise</th>
                    <th>Issue Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert, index) => (
                    <tr key={cert.id}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="cert-badge">{cert.certNo}</span>
                      </td>
                      <td>
                        <div className="student-cell">
                          {cert.studentPhoto && (
                            <img
                              src={cert.studentPhoto}
                              alt=""
                              className="table-photo"
                            />
                          )}
                          <strong>{cert.studentName}</strong>
                        </div>
                      </td>
                      <td>{cert.courseName}</td>
                      <td>
                        <span className={`grade-badge grade-${cert.grade?.toLowerCase().replace('+', 'plus') || 'a'
                          }`}>
                          {cert.grade}
                        </span>
                      </td>
                      <td>
                        {cert.is_downloaded ? (
                          <span style={{
                            background: '#d1fae5',
                            color: '#065f46',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '700',
                          }}>
                            ✅ Downloaded ({cert.download_count}x)
                          </span>
                        ) : (
                          <span style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '700',
                          }}>
                            📋 Not Downloaded
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="franchise-code-badge">
                          {cert.franchise_code || 'Admin'}
                        </span>
                      </td>
                      <td>{cert.issueDate}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-edit-sm"
                            onClick={() => handleEdit(cert.id)}
                            title="Edit"
                          >
                            ✏️
                          </button>

                          <button
                            className="btn-delete-sm"
                            onClick={() => handleDelete(cert.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;