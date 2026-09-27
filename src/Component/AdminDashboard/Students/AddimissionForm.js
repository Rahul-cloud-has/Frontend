// MultiStepAdmissionForm.jsx - FINAL COMPLETE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL, apiConfig } from '../../../Api';
import './AddimissionForm.css';

const TOAST_DURATION = 3000;

const categoryIcons = {
  'Information Technology': '💻',
  'Tally & Accounting': '📊',
  'Tailoring & Fashion': '👗',
  'Plumbing': '🔧',
  'Electrician': '⚡',
  'Computer Courses': '🖥️',
  'Beauty & Wellness': '💄',
  'Mehandi Designing': '🎨',
  'Skill Development': '📚',
  'Other Professional': '🏢'
};

const getUserAccess = () => {
  try {
    const userType = localStorage.getItem('userType');
    const franchiseUser = JSON.parse(localStorage.getItem('franchiseUser') || '{}');
    if (userType === 'franchise') {
      return {
        type: 'franchise',
        franchiseCode: franchiseUser?.franchise_code || '',
        franchiseName: franchiseUser?.franchise_name ||
          franchiseUser?.applicant_name || 'Franchise',
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

const MultiStepAdmissionForm = () => {
  const toastTimerRef = useRef(null);

  const access = getUserAccess();
  const userType = access.type;
  const franchiseCode = access.franchiseCode;
  const franchiseName = access.franchiseName;

  // ── Form States ──
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [, setLoading] = useState(false);
  const [studentListLoading, setStudentListLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // ✅ Per-step save tracking
  const [step1Saved, setStep1Saved] = useState(false);
  const [step2Saved, setStep2Saved] = useState(false);
  const [step3Saved, setStep3Saved] = useState(false);
  const [draftId, setDraftId] = useState(null);

  // ── Data States ──
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [totalPayment, setTotalPayment] = useState(0);
  const [studentsData, setStudentsData] = useState([]);

  // ── Pagination States ──
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // ── Form Data ──
  const [formData, setFormData] = useState({
    studentName: '', fatherName: '', motherName: '', dob: '',
    gender: '', mobile: '', email: '', address: '', city: '',
    state: '', pincode: '', courseCategory: '', courseName: '',
    sessions: '', feeAmount: '', paymentStatus: 'Pending', photo: null,
  });

  const [documents, setDocuments] = useState({
    adharCard: null, marksheet10: null, signature: null,
  });

  const [paymentData, setPaymentData] = useState({
    amount: '', method: 'Card', cardNumber: '',
    cardName: '', expiry: '', cvv: '', upiId: '',
  });

  const [errors, setErrors] = useState({});
  const [stepErrors, setStepErrors] = useState({});

  // ============================================
  // 📄 PAGINATION
  // ============================================
  const totalPages = Math.ceil(studentsData.length / perPage);
  const paginatedStudents = studentsData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) pages.push(1, 2, 3, 4, 5, '...', totalPages);
      else if (currentPage >= totalPages - 3) pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // ============================================
  // 🍞 TOAST
  // ============================================
  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, TOAST_DURATION);
  }, []);

  // ============================================
  // 📤 FETCH COURSES
  // ============================================
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/courses/`, apiConfig());
      const coursesData = Array.isArray(response.data)
        ? response.data
        : response.data?.results || response.data?.data || [];

      setCourses(coursesData);

      const uniqueCategories = [];
      coursesData.forEach(c => {
        let catName = '';
        if (c.category && typeof c.category === 'object') catName = c.category.name || '';
        else if (typeof c.category === 'string') catName = c.category;
        else if (c.category_name) catName = c.category_name;
        if (catName && !uniqueCategories.includes(catName)) uniqueCategories.push(catName);
      });
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ============================================
  // 📥 LOAD STUDENTS
  // ============================================
  const loadStudentsData = useCallback(async () => {
    setStudentListLoading(true);
    try {
      const response = await axios.get(`${API_URL}/students/`, apiConfig());
      let students = [];
      if (Array.isArray(response.data)) students = response.data;
      else if (response.data?.data) students = response.data.data;
      else if (response.data?.results) students = response.data.results;
      setStudentsData(students);
      setCurrentPage(1);
    } catch (error) {
      console.error('❌ Error loading students:', error);
      showToast('Failed to load students', 'error');
      setStudentsData([]);
    } finally {
      setStudentListLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCourses();
    loadStudentsData();
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [fetchCourses, loadStudentsData]);

  useEffect(() => {
    if (formData.courseCategory) {
      const filtered = courses.filter(c => {
        let catName = '';
        if (c.category && typeof c.category === 'object') catName = c.category.name || '';
        else if (typeof c.category === 'string') catName = c.category;
        else if (c.category_name) catName = c.category_name;
        return catName === formData.courseCategory;
      });
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [formData.courseCategory, courses]);

  useEffect(() => {
    if (formData.courseName) {
      const selected = courses.find(c =>
        (c.course_name || c.courseName || '') === formData.courseName
      );
      if (selected) {
        let sessionName = '';
        if (selected.sessions && typeof selected.sessions === 'object') sessionName = selected.sessions.name || '';
        else if (typeof selected.sessions === 'string') sessionName = selected.sessions;
        else if (selected.session_name) sessionName = selected.session_name;

        const sessionList = sessionName
          ? sessionName.split(',').map(s => s.trim()).filter(Boolean)
          : [];
        setSessionOptions(sessionList);

        const fee = selected.fee || selected.course_fee || 0;
        setFormData(prev => ({ ...prev, sessions: sessionList[0] || '', feeAmount: fee }));
        setTotalPayment(fee);
        setPaymentData(prev => ({ ...prev, amount: fee }));
      }
    } else {
      setSessionOptions([]);
    }
  }, [formData.courseName, courses]);

  // ============================================
  // 📝 HANDLERS
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    if (stepErrors[name]) setStepErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File size should be less than 5MB', 'error'); return; }
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo: { file, preview: reader.result } }));
      if (errors.photo) setErrors(prev => ({ ...prev, photo: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => setFormData(prev => ({ ...prev, photo: null }));

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File size should be less than 5MB', 'error'); return; }
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocuments(prev => ({ ...prev, [type]: { file, preview: reader.result } }));
      if (stepErrors[type]) setStepErrors(prev => ({ ...prev, [type]: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (type) => setDocuments(prev => ({ ...prev, [type]: null }));

  // ============================================
  // ✅ VALIDATION
  // ============================================
  const validateStep1 = () => {
    const newErrors = {};
    const required = [
      'studentName', 'fatherName', 'motherName', 'dob', 'gender',
      'mobile', 'email', 'address', 'city', 'state', 'pincode',
      'courseCategory', 'courseName', 'sessions'
    ];
    required.forEach(field => { if (!formData[field]) newErrors[field] = 'Required'; });
    if (!formData.photo) newErrors.photo = 'Photo required';
    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) newErrors.mobile = '10-digit number required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email required';
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = '6-digit pincode required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!documents.adharCard) newErrors.adharCard = 'Aadhar Card required';
    if (!documents.marksheet10) newErrors.marksheet10 = '10th Marksheet required';
    if (!documents.signature) newErrors.signature = 'Signature required';
    setStepErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!paymentData.amount || paymentData.amount <= 0) newErrors.amount = 'Amount required';
    if (paymentData.method === 'Card') {
      if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) newErrors.cardNumber = 'Valid card number required';
      if (!paymentData.cardName) newErrors.cardName = 'Name required';
      if (!paymentData.expiry) newErrors.expiry = 'Expiry required';
      if (!paymentData.cvv || paymentData.cvv.length < 3) newErrors.cvv = 'Valid CVV required';
    }
    if (paymentData.method === 'UPI') {
      if (!paymentData.upiId || !paymentData.upiId.includes('@')) newErrors.upiId = 'Valid UPI ID required';
    }
    setStepErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // 📍 NAVIGATION
  // ============================================
  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const resetForm = () => {
    setFormData({
      studentName: '', fatherName: '', motherName: '', dob: '',
      gender: '', mobile: '', email: '', address: '', city: '',
      state: '', pincode: '', courseCategory: '', courseName: '',
      sessions: '', feeAmount: '', paymentStatus: 'Pending', photo: null,
    });
    setDocuments({ adharCard: null, marksheet10: null, signature: null });
    setPaymentData({ amount: '', method: 'Card', cardNumber: '', cardName: '', expiry: '', cvv: '', upiId: '' });
    setErrors({});
    setStepErrors({});
    setStep1Saved(false);
    setStep2Saved(false);
    setStep3Saved(false);
    setDraftId(null);
    setEditingId(null);
    setCurrentStep(1);
    setSessionOptions([]);
    try { localStorage.removeItem('admissionDraft'); } catch (e) {}
  };

  const toggleAddRecord = () => {
    if (showForm) resetForm();
    setShowForm(!showForm);
  };

  // ============================================
  // 💾 PER-STEP DRAFT SAVE (Mobile Safe)
  // ============================================
  const saveDraftToStorage = (stepNum) => {
    try {
      const draftData = {
        id: draftId || Date.now(),
        formData: {
          studentName:    formData.studentName,
          fatherName:     formData.fatherName,
          motherName:     formData.motherName,
          dob:            formData.dob,
          gender:         formData.gender,
          mobile:         formData.mobile,
          email:          formData.email,
          address:        formData.address,
          city:           formData.city,
          state:          formData.state,
          pincode:        formData.pincode,
          courseCategory: formData.courseCategory,
          courseName:     formData.courseName,
          sessions:       formData.sessions,
          feeAmount:      formData.feeAmount,
          paymentStatus:  formData.paymentStatus,
          photo:          null,
        },
        documents: { adharCard: null, marksheet10: null, signature: null },
        paymentData: {
          amount:     paymentData.amount,
          method:     paymentData.method,
          cardNumber: '',
          cardName:   '',
          expiry:     '',
          cvv:        '',
          upiId:      paymentData.upiId,
        },
        currentStep: stepNum,
        step1Saved, step2Saved, step3Saved,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('admissionDraft', JSON.stringify(draftData));
      if (!draftId) setDraftId(draftData.id);
      return true;
    } catch (err) {
      console.error('Draft save error:', err);
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        try { localStorage.removeItem('admissionDraft'); } catch (e) {}
      }
      return false;
    }
  };

  // ✅ Step 1 Save/Update
  const handleSaveStep1 = () => {
    if (!validateStep1()) {
      showToast('Please fill all required fields first', 'error');
      return;
    }
    const success = saveDraftToStorage(1);
    if (success) {
      const wasAlready = step1Saved;
      setStep1Saved(true);
      showToast(wasAlready ? '✅ Step 1 updated!' : '✅ Step 1 saved!', 'success');
    } else {
      showToast('⚠️ Storage error', 'error');
    }
  };

  // ✅ Step 2 Save/Update
  const handleSaveStep2 = () => {
    if (!validateStep2()) {
      showToast('Please upload all documents first', 'error');
      return;
    }
    const success = saveDraftToStorage(2);
    if (success) {
      const wasAlready = step2Saved;
      setStep2Saved(true);
      showToast(wasAlready ? '✅ Step 2 updated!' : '✅ Step 2 saved!', 'success');
    } else {
      showToast('⚠️ Storage error', 'error');
    }
  };

  // ✅ Step 3 Save/Update
  const handleSaveStep3 = () => {
    if (!validateStep3()) {
      showToast('Please fill payment details first', 'error');
      return;
    }
    const success = saveDraftToStorage(3);
    if (success) {
      const wasAlready = step3Saved;
      setStep3Saved(true);
      showToast(wasAlready ? '✅ Step 3 updated!' : '✅ Step 3 saved!', 'success');
    } else {
      showToast('⚠️ Storage error', 'error');
    }
  };

  const handleClearDraft = () => {
    if (window.confirm('Clear all draft data?')) {
      try { localStorage.removeItem('admissionDraft'); }
      catch (err) { console.warn('Could not clear draft', err); }
      resetForm();
      showToast('🗑️ Draft cleared!', 'info');
    }
  };

  // ============================================
  // ✏️ EDIT — All Steps Auto Saved
  // ============================================
  const loadForEdit = (id) => {
    const record = studentsData.find(item => item.id === id);
    if (!record) return;
    setFormData({
      studentName: record.student_name || '', fatherName: record.father_name || '',
      motherName: record.mother_name || '', dob: record.dob || '',
      gender: record.gender || '', mobile: record.mobile || '',
      email: record.email || '', address: record.address || '',
      city: record.city || '', state: record.state || '',
      pincode: record.pincode || '', courseCategory: record.course_category || '',
      courseName: record.course_name || '', sessions: record.sessions || '',
      feeAmount: record.fee_amount || '', paymentStatus: record.payment_status || 'Pending',
      photo: record.photo ? { preview: record.photo } : null,
    });
    setDocuments({
      adharCard: record.documents?.adhar_card ? { preview: record.documents.adhar_card } : null,
      marksheet10: record.documents?.marksheet_10 ? { preview: record.documents.marksheet_10 } : null,
      signature: record.documents?.signature ? { preview: record.documents.signature } : null,
    });
    setPaymentData({
      amount: record.fee_amount || '', method: record.payment_method || 'Card',
      cardNumber: '', cardName: '', expiry: '', cvv: '', upiId: '',
    });
    setEditingId(id);
    setShowForm(true);
    setCurrentStep(1);

    // ✅ EDIT mode — sab steps already saved (direct Update + Next available)
    setStep1Saved(true);
    setStep2Saved(true);
    setStep3Saved(true);
  };

  // ============================================
  // 🗑️ DELETE
  // ============================================
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`${API_URL}/students/${id}/`, apiConfig());
      await loadStudentsData();
      showToast('🗑️ Record deleted!', 'success');
    } catch (error) {
      console.error('❌ Delete error:', error);
      showToast('Failed to delete record', 'error');
    }
  };

  // ============================================
  // ✅ SUBMIT
  // ============================================
  const handleSubmit = async () => {
    if (!validateStep3()) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const studentData = {
        student_name: formData.studentName,
        father_name: formData.fatherName,
        mother_name: formData.motherName,
        dob: formData.dob,
        gender: formData.gender,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        course_category: formData.courseCategory,
        course_name: formData.courseName,
        sessions: formData.sessions,
        fee_amount: parseFloat(paymentData.amount) || parseFloat(formData.feeAmount) || 0,
        total_payment: parseFloat(paymentData.amount) || 0,
        payment_status: 'Completed',
        payment_method: paymentData.method,
        franchise_code: franchiseCode || '',
        franchise_name: franchiseName || '',
        created_by: userType,
        photo: formData.photo?.preview || null,
        documents: {
          adhar_card: documents.adharCard?.preview || null,
          marksheet_10: documents.marksheet10?.preview || null,
          signature: documents.signature?.preview || null,
        },
      };

      let response;
      if (editingId) {
        response = await axios.put(`${API_URL}/students/${editingId}/`, studentData, apiConfig());
        setSuccessMessage('✅ Student updated successfully!');
      } else {
        response = await axios.post(`${API_URL}/students/`, studentData, apiConfig());
        setSuccessMessage('✅ Student admitted successfully!');
      }

      if (!editingId && response.data?.id) {
        try {
          await axios.post(`${API_URL}/payments/`, {
            student_id: response.data.id,
            student_name: formData.studentName,
            course_name: formData.courseName,
            amount: paymentData.amount,
            method: paymentData.method,
            status: 'Completed',
            receipt_no: `RCP-${Date.now().toString().slice(-6)}`,
            franchise_code: franchiseCode || '',
          }, apiConfig());
        } catch (payErr) {
          console.warn('Payment record not saved:', payErr);
        }
      }

      try { localStorage.removeItem('admissionDraft'); } catch (e) {}

      setReceiptData({
        receipt_no: `RCP-${Date.now().toString().slice(-6)}`,
        studentName: formData.studentName,
        courseName: formData.courseName,
        amount: paymentData.amount,
        method: paymentData.method,
      });

      setShowSuccess(true);
      await loadStudentsData();

      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        setShowForm(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Submit error:', error);
      const errMsg = error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to submit form';
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // 🖨️ RECEIPT PRINT — EduSkillVision Branded
  // ============================================
  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('en-IN');
    const time = new Date().toLocaleTimeString('en-IN');
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>EduSkillVision - Admission Receipt</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f2f5;padding:40px}
        .receipt{max-width:600px;margin:0 auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.12)}
        .header{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:24px 28px;text-align:center}
        .header h1{font-size:24px;font-weight:800;margin-bottom:4px;letter-spacing:0.3px}
        .header p{font-size:12px;opacity:.9}
        .header .tagline{font-size:11px;margin-top:4px;opacity:.85;font-style:italic}
        .fc-badge{display:inline-block;background:rgba(255,255,255,0.2);padding:3px 14px;border-radius:20px;font-size:11px;font-weight:600;margin-top:8px}
        .body{padding:24px 28px}
        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
        .row:last-child{border-bottom:none}
        .row .label{color:#6b7280;font-weight:500}
        .row .value{color:#111827;font-weight:600}
        .total{background:#f8fafc;border-radius:8px;padding:12px 16px;margin-top:16px;border:1px solid #e2e8f0}
        .total .row{border:none}
        .total .value{color:#4f46e5;font-size:16px}
        .status-badge{background:#dcfce7;color:#166534;padding:2px 12px;border-radius:20px;font-size:11px;font-weight:700}
        .footer{text-align:center;padding:16px 28px;background:#f9fafb;border-top:1px solid #f3f4f6;font-size:11px;color:#6b7280}
        .footer strong{color:#4f46e5;font-weight:700}
        .footer p{margin:2px 0}
        @media print{body{background:white;padding:0}.receipt{box-shadow:none}}
      </style></head><body>
      <div class="receipt">
        <div class="header">
          <h1>🎓 EduSkillVision</h1>
          <p>Admission Confirmation Receipt</p>
          <div class="tagline">Empowering Skills · Shaping Careers</div>
          <div class="fc-badge">${franchiseCode ? `🏷️ Franchise: ${franchiseCode}` : '👑 Admin'}</div>
        </div>
        <div class="body">
          <div class="row"><span class="label">Receipt No</span><span class="value">${receiptData?.receipt_no || 'RCP-' + Date.now()}</span></div>
          <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
          <div class="row"><span class="label">Student Name</span><span class="value">${formData.studentName}</span></div>
          <div class="row"><span class="label">Father's Name</span><span class="value">${formData.fatherName}</span></div>
          <div class="row"><span class="label">Mobile</span><span class="value">${formData.mobile}</span></div>
          <div class="row"><span class="label">Course</span><span class="value">${formData.courseName}</span></div>
          <div class="row"><span class="label">Duration</span><span class="value">${formData.sessions}</span></div>
          <div class="row"><span class="label">Payment Method</span><span class="value">${paymentData.method}</span></div>
          <div class="total">
            <div class="row"><span class="label">Amount Paid</span><span class="value">₹${paymentData.amount}</span></div>
            <div class="row"><span class="label">Status</span><span class="value"><span class="status-badge">✅ Completed</span></span></div>
          </div>
        </div>
        <div class="footer">
          <p><strong>EduSkillVision Education Pvt. Ltd.</strong></p>
          <p>📞 +91 91111 37575 · ✉️ eduskillvision@gmail.com</p>
          <p>🌐 eduskillvision.com · ISO 9001:2015 Certified</p>
          <p style="margin-top:8px">Generated on ${date} at ${time} · Thank You! 🙏</p>
        </div>
      </div></body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ============================================
  // 🔧 HELPERS
  // ============================================
  const getCategoryIcon = (category) => categoryIcons[category] || '📚';

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'msaf-status-completed';
      case 'Partial':   return 'msaf-status-partial';
      default:          return 'msaf-status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return '✅';
      case 'Partial':   return '🔶';
      default:          return '⏳';
    }
  };

  const anyStepSaved = step1Saved || step2Saved || step3Saved;

  // ============================================
  // 🎨 RENDER
  // ============================================
  return (
    <div className="msaf-container">

      {toast.show && (
        <div className={`msaf-toast msaf-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="msaf-card">

        {/* ══ HEADER ══ */}
        <div className="msaf-header">
          <div className="msaf-header-left">
            <span className="msaf-header-icon">🎓</span>
            <div>
              <h1>Student Admission</h1>
              <p>Complete admission in 3 easy steps</p>
              {franchiseCode && (
                <span className="msaf-franchise-badge">🏷️ {franchiseCode}</span>
              )}
              {anyStepSaved && (
                <span className="msaf-draft-badge">💾 Draft Saved</span>
              )}
            </div>
          </div>
          <div className="msaf-header-actions">
            <button type="button" className="msaf-btn-refresh"
              onClick={() => { fetchCourses(); loadStudentsData(); }} title="Refresh">🔄</button>
            <button type="button"
              className={`msaf-btn-add-record ${showForm ? 'close' : ''}`}
              onClick={toggleAddRecord}>
              {showForm ? '✕ Close Form' : '➕ Add Record'}
            </button>
          </div>
        </div>

        {/* ══ HISTORY TABLE ══ */}
        {!showForm && (
          <div className="msaf-history-section">
            <div className="msaf-history-header">
              <h3>📋 Student Records</h3>
              <span className="msaf-history-count">
                {studentsData.length} Total
                {userType === 'franchise' && ` · ${franchiseCode}`}
              </span>
            </div>

            {studentListLoading ? (
              <div className="msaf-loading">
                <div className="msaf-spinner"></div>
                <p>Loading students...</p>
              </div>
            ) : (
              <>
                <div className="msaf-table-wrapper">
                  <table className="msaf-history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Mobile</th>
                        <th>Course</th>
                        <th>Fee (₹)</th>
                        <th>Franchise</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.length > 0 ? (
                        paginatedStudents.map((item, index) => (
                          <tr key={item.id}>
                            <td>{(currentPage - 1) * perPage + index + 1}</td>
                            <td><strong>{item.student_name || '—'}</strong></td>
                            <td>{item.mobile || '—'}</td>
                            <td>{item.course_name || '—'}</td>
                            <td className="msaf-fee-cell">
                              ₹{Number(item.fee_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className="msaf-franchise-code-badge">
                                {item.franchise_code || 'Admin'}
                              </span>
                            </td>
                            <td>
                              <span className={`msaf-status-badge ${getStatusClass(item.payment_status)}`}>
                                {getStatusIcon(item.payment_status)}{' '}
                                {item.payment_status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              {item.admitted_at || item.created_at
                                ? new Date(item.admitted_at || item.created_at)
                                    .toLocaleDateString('en-IN')
                                : '—'}
                            </td>
                            <td>
                              <div className="msaf-table-actions">
                                <button type="button" className="msaf-btn-edit"
                                  onClick={() => loadForEdit(item.id)} title="Edit">✏️</button>
                                <button type="button" className="msaf-btn-delete"
                                  onClick={() => handleDelete(item.id)} title="Delete">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="msaf-no-data">
                            📭 No student records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {studentsData.length > 0 && (
                  <div className="msaf-pagination">
                    <span className="msaf-page-info">
                      Showing{' '}
                      <strong>
                        {Math.min((currentPage - 1) * perPage + 1, studentsData.length)}
                        –{Math.min(currentPage * perPage, studentsData.length)}
                      </strong>{' '}
                      of <strong>{studentsData.length}</strong> records
                    </span>

                    <div className="msaf-page-controls">
                      <button type="button" className="msaf-page-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1} title="First page">«</button>
                      <button type="button" className="msaf-page-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1} title="Previous page">‹</button>

                      {getPageNumbers().map((page, idx) =>
                        page === '...' ? (
                          <span key={`dots-${idx}`} className="msaf-page-dots">•••</span>
                        ) : (
                          <button key={`page-${page}`} type="button"
                            className={`msaf-page-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => handlePageChange(page)}>
                            {page}
                          </button>
                        )
                      )}

                      <button type="button" className="msaf-page-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0} title="Next page">›</button>
                      <button type="button" className="msaf-page-btn"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0} title="Last page">»</button>
                    </div>

                    <div className="msaf-per-page">
                      <label>Rows:</label>
                      <select value={perPage} onChange={handlePerPageChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ MULTI-STEP FORM ══ */}
        {showForm && (
          <>
            <div className="msaf-mobile-info">
              📱 Draft won't save uploaded images. Re-upload after loading draft.
            </div>

            <div className="msaf-progress-bar">
              <div className="msaf-progress-steps">
                <div className={`msaf-step ${currentStep >= 1 ? 'active' : ''}`}>
                  <span className="msaf-step-number">{step1Saved ? '✓' : '1'}</span>
                  <span className="msaf-step-label">Registration</span>
                </div>
                <div className={`msaf-step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                <div className={`msaf-step ${currentStep >= 2 ? 'active' : ''}`}>
                  <span className="msaf-step-number">{step2Saved ? '✓' : '2'}</span>
                  <span className="msaf-step-label">Documents</span>
                </div>
                <div className={`msaf-step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
                <div className={`msaf-step ${currentStep >= 3 ? 'active' : ''}`}>
                  <span className="msaf-step-number">{step3Saved ? '✓' : '3'}</span>
                  <span className="msaf-step-label">Payment</span>
                </div>
              </div>
            </div>

            {showSuccess && (
              <div className="msaf-success-message">{successMessage}</div>
            )}

            {/* ══ STEP 1: Registration ══ */}
            {currentStep === 1 && (
              <div className="msaf-step-content">
                <h2>📝 Student Registration</h2>

                <div className="msaf-photo-upload-top">
                  <div className="msaf-photo-upload-area"
                    onClick={() => document.getElementById('msaf-studentPhoto').click()}>
                    {formData.photo ? (
                      <div className="msaf-photo-preview">
                        <img src={formData.photo.preview} alt="Student" />
                        <button type="button" className="msaf-remove-photo"
                          onClick={(e) => { e.stopPropagation(); removePhoto(); }}>✕</button>
                      </div>
                    ) : (
                      <div className="msaf-photo-placeholder">
                        <span>📸</span>
                        <p>Upload Photo</p>
                        <small>Max 5MB</small>
                      </div>
                    )}
                  </div>
                  <input type="file" id="msaf-studentPhoto" accept="image/*"
                    onChange={handlePhotoUpload} hidden />
                  {errors.photo && <span className="msaf-err">⚠️ {errors.photo}</span>}
                </div>

                <div className="msaf-franchise-display">
                  <div className="msaf-form-group">
                    <label>🏷️ Franchise Code</label>
                    <input type="text" value={franchiseCode || 'Admin'} readOnly
                      style={{ background: '#f1f5f9', fontWeight: '700', color: '#4f46e5' }} />
                  </div>
                  <div className="msaf-form-group">
                    <label>🏪 Franchise Name</label>
                    <input type="text" value={franchiseName || 'Administrator'} readOnly
                      style={{ background: '#f1f5f9', fontWeight: '700', color: '#4f46e5' }} />
                  </div>
                </div>

                <div className="msaf-form-grid">
                  <div className="msaf-form-group">
                    <label>Student Name <span className="msaf-req">*</span></label>
                    <input name="studentName" value={formData.studentName}
                      onChange={handleChange} placeholder="Full name"
                      className={errors.studentName ? 'error' : ''} />
                    {errors.studentName && <span className="msaf-err">⚠️ {errors.studentName}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Father's Name <span className="msaf-req">*</span></label>
                    <input name="fatherName" value={formData.fatherName}
                      onChange={handleChange} placeholder="Father's name"
                      className={errors.fatherName ? 'error' : ''} />
                    {errors.fatherName && <span className="msaf-err">⚠️ {errors.fatherName}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Mother's Name <span className="msaf-req">*</span></label>
                    <input name="motherName" value={formData.motherName}
                      onChange={handleChange} placeholder="Mother's name"
                      className={errors.motherName ? 'error' : ''} />
                    {errors.motherName && <span className="msaf-err">⚠️ {errors.motherName}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Date of Birth <span className="msaf-req">*</span></label>
                    <input type="date" name="dob" value={formData.dob}
                      onChange={handleChange} className={errors.dob ? 'error' : ''} />
                    {errors.dob && <span className="msaf-err">⚠️ {errors.dob}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Gender <span className="msaf-req">*</span></label>
                    <select name="gender" value={formData.gender} onChange={handleChange}
                      className={errors.gender ? 'error' : ''}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <span className="msaf-err">⚠️ {errors.gender}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Mobile <span className="msaf-req">*</span></label>
                    <input name="mobile" value={formData.mobile}
                      onChange={handleChange} placeholder="10-digit" maxLength="10"
                      inputMode="numeric" className={errors.mobile ? 'error' : ''} />
                    {errors.mobile && <span className="msaf-err">⚠️ {errors.mobile}</span>}
                  </div>

                  <div className="msaf-form-group msaf-full-width">
                    <label>Email <span className="msaf-req">*</span></label>
                    <input type="email" name="email" value={formData.email}
                      onChange={handleChange} placeholder="Enter email" inputMode="email"
                      className={errors.email ? 'error' : ''} />
                    {errors.email && <span className="msaf-err">⚠️ {errors.email}</span>}
                  </div>

                  <div className="msaf-form-group msaf-full-width">
                    <label>Address <span className="msaf-req">*</span></label>
                    <input name="address" value={formData.address}
                      onChange={handleChange} placeholder="Complete address"
                      className={errors.address ? 'error' : ''} />
                    {errors.address && <span className="msaf-err">⚠️ {errors.address}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>City <span className="msaf-req">*</span></label>
                    <input name="city" value={formData.city}
                      onChange={handleChange} placeholder="City"
                      className={errors.city ? 'error' : ''} />
                    {errors.city && <span className="msaf-err">⚠️ {errors.city}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>State <span className="msaf-req">*</span></label>
                    <input name="state" value={formData.state}
                      onChange={handleChange} placeholder="State"
                      className={errors.state ? 'error' : ''} />
                    {errors.state && <span className="msaf-err">⚠️ {errors.state}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Pincode <span className="msaf-req">*</span></label>
                    <input name="pincode" value={formData.pincode}
                      onChange={handleChange} placeholder="6-digit" maxLength="6"
                      inputMode="numeric" className={errors.pincode ? 'error' : ''} />
                    {errors.pincode && <span className="msaf-err">⚠️ {errors.pincode}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Course Category <span className="msaf-req">*</span></label>
                    <select name="courseCategory" value={formData.courseCategory}
                      onChange={handleChange} className={errors.courseCategory ? 'error' : ''}>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                      ))}
                    </select>
                    {errors.courseCategory && <span className="msaf-err">⚠️ {errors.courseCategory}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Course Name <span className="msaf-req">*</span></label>
                    <select name="courseName" value={formData.courseName}
                      onChange={handleChange} disabled={!formData.courseCategory}
                      className={errors.courseName ? 'error' : ''}>
                      <option value="">Select Course</option>
                      {filteredCourses.map(c => {
                        const name = c.course_name || c.courseName || '';
                        return <option key={c.id} value={name}>{name}</option>;
                      })}
                    </select>
                    {errors.courseName && <span className="msaf-err">⚠️ {errors.courseName}</span>}
                  </div>

                  <div className="msaf-form-group">
                    <label>Duration <span className="msaf-req">*</span></label>
                    <select name="sessions" value={formData.sessions}
                      onChange={handleChange}
                      disabled={!formData.courseName || sessionOptions.length === 0}
                      className={errors.sessions ? 'error' : ''}>
                      <option value="">Select Duration</option>
                      {sessionOptions.map((session, idx) => (
                        <option key={idx} value={session}>{session}</option>
                      ))}
                    </select>
                    {errors.sessions && <span className="msaf-err">⚠️ {errors.sessions}</span>}
                  </div>
                </div>

                {/* ✅ ACTIONS — Step 1 */}
                <div className="msaf-step-actions">
                  <div className="msaf-action-left">
                    <button type="button" className="msaf-btn-save" onClick={handleSaveStep1}>
                      💾 {step1Saved ? 'Update Step 1' : 'Save Step 1'}
                    </button>
                    {anyStepSaved && (
                      <button type="button" className="msaf-btn-clear-draft" onClick={handleClearDraft}>
                        🗑️ Clear
                      </button>
                    )}
                  </div>
                  <div className="msaf-action-right">
                    {step1Saved && (
                      <button type="button" className="msaf-btn-next" onClick={nextStep}>
                        Next → Documents
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 2: Documents ══ */}
            {currentStep === 2 && (
              <div className="msaf-step-content">
                <h2>📎 Document Upload</h2>

                <div className="msaf-documents-grid">
                  <div className="msaf-document-upload">
                    <label>Aadhar Card <span className="msaf-req">*</span></label>
                    <div className={`msaf-upload-area ${stepErrors.adharCard ? 'error' : ''}`}
                      onClick={() => document.getElementById('msaf-adharCard').click()}>
                      {documents.adharCard ? (
                        <div className="msaf-uploaded-file">
                          <img src={documents.adharCard.preview} alt="Aadhar" />
                          <button type="button" className="msaf-remove-file"
                            onClick={(e) => { e.stopPropagation(); removeDocument('adharCard'); }}>✕</button>
                        </div>
                      ) : (
                        <div className="msaf-upload-placeholder">
                          <span>🪪</span>
                          <p>Upload Aadhar Card</p>
                          <small>JPG, PNG · Max 5MB</small>
                        </div>
                      )}
                    </div>
                    <input type="file" id="msaf-adharCard" accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'adharCard')} hidden />
                    {stepErrors.adharCard && <span className="msaf-err">⚠️ {stepErrors.adharCard}</span>}
                  </div>

                  <div className="msaf-document-upload">
                    <label>10th Marksheet <span className="msaf-req">*</span></label>
                    <div className={`msaf-upload-area ${stepErrors.marksheet10 ? 'error' : ''}`}
                      onClick={() => document.getElementById('msaf-marksheet10').click()}>
                      {documents.marksheet10 ? (
                        <div className="msaf-uploaded-file">
                          <img src={documents.marksheet10.preview} alt="Marksheet" />
                          <button type="button" className="msaf-remove-file"
                            onClick={(e) => { e.stopPropagation(); removeDocument('marksheet10'); }}>✕</button>
                        </div>
                      ) : (
                        <div className="msaf-upload-placeholder">
                          <span>📄</span>
                          <p>Upload 10th Marksheet</p>
                          <small>JPG, PNG · Max 5MB</small>
                        </div>
                      )}
                    </div>
                    <input type="file" id="msaf-marksheet10" accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'marksheet10')} hidden />
                    {stepErrors.marksheet10 && <span className="msaf-err">⚠️ {stepErrors.marksheet10}</span>}
                  </div>

                  <div className="msaf-document-upload">
                    <label>Signature <span className="msaf-req">*</span></label>
                    <div className={`msaf-upload-area ${stepErrors.signature ? 'error' : ''}`}
                      onClick={() => document.getElementById('msaf-signature').click()}>
                      {documents.signature ? (
                        <div className="msaf-uploaded-file">
                          <img src={documents.signature.preview} alt="Signature" />
                          <button type="button" className="msaf-remove-file"
                            onClick={(e) => { e.stopPropagation(); removeDocument('signature'); }}>✕</button>
                        </div>
                      ) : (
                        <div className="msaf-upload-placeholder">
                          <span>✍️</span>
                          <p>Upload Signature</p>
                          <small>JPG, PNG · Max 5MB</small>
                        </div>
                      )}
                    </div>
                    <input type="file" id="msaf-signature" accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature')} hidden />
                    {stepErrors.signature && <span className="msaf-err">⚠️ {stepErrors.signature}</span>}
                  </div>
                </div>

                {/* ✅ ACTIONS — Step 2 */}
                <div className="msaf-step-actions">
                  <div className="msaf-action-left">
                    <button type="button" className="msaf-btn-prev" onClick={prevStep}>← Back</button>
                    <button type="button" className="msaf-btn-save" onClick={handleSaveStep2}>
                      💾 {step2Saved ? 'Update Step 2' : 'Save Step 2'}
                    </button>
                  </div>
                  <div className="msaf-action-right">
                    {step2Saved && (
                      <button type="button" className="msaf-btn-next" onClick={nextStep}>
                        Next → Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 3: Payment ══ */}
            {currentStep === 3 && (
              <div className="msaf-step-content">
                <h2>💳 Payment</h2>

                <div className="msaf-payment-summary">
                  <div className="msaf-summary-item">
                    <span>Student</span><strong>{formData.studentName}</strong>
                  </div>
                  <div className="msaf-summary-item">
                    <span>Course</span><strong>{formData.courseName}</strong>
                  </div>
                  <div className="msaf-summary-item">
                    <span>Duration</span><strong>{formData.sessions}</strong>
                  </div>
                  <div className="msaf-summary-item">
                    <span>Fee Amount</span>
                    <strong className="msaf-fee-amount">
                      ₹{Number(paymentData.amount || totalPayment).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  {franchiseCode && (
                    <div className="msaf-summary-item">
                      <span>Franchise</span><strong>{franchiseCode}</strong>
                    </div>
                  )}
                </div>

                <div className="msaf-payment-methods">
                  <div className="msaf-method-options">
                    {['Card', 'UPI', 'Cash'].map(method => (
                      <button key={method} type="button"
                        className={`msaf-method-btn ${paymentData.method === method ? 'active' : ''}`}
                        onClick={() => setPaymentData(prev => ({ ...prev, method }))}>
                        {method === 'Card' ? '💳' : method === 'UPI' ? '📱' : '💵'} {method}
                      </button>
                    ))}
                  </div>

                  <div className="msaf-form-group">
                    <label>Amount (₹) <span className="msaf-req">*</span></label>
                    <input type="number" name="amount" value={paymentData.amount}
                      onChange={handlePaymentChange} inputMode="numeric"
                      className={stepErrors.amount ? 'error' : ''} />
                    {stepErrors.amount && <span className="msaf-err">⚠️ {stepErrors.amount}</span>}
                  </div>

                  {paymentData.method === 'Card' && (
                    <div className="msaf-card-details">
                      <div className="msaf-form-group">
                        <label>Card Number <span className="msaf-req">*</span></label>
                        <input type="text" name="cardNumber" value={paymentData.cardNumber}
                          onChange={handlePaymentChange} placeholder="1234 5678 9012 3456"
                          maxLength="16" inputMode="numeric"
                          className={stepErrors.cardNumber ? 'error' : ''} />
                        {stepErrors.cardNumber && <span className="msaf-err">⚠️ {stepErrors.cardNumber}</span>}
                      </div>
                      <div className="msaf-form-group">
                        <label>Card Holder Name <span className="msaf-req">*</span></label>
                        <input type="text" name="cardName" value={paymentData.cardName}
                          onChange={handlePaymentChange} placeholder="Name on card"
                          className={stepErrors.cardName ? 'error' : ''} />
                        {stepErrors.cardName && <span className="msaf-err">⚠️ {stepErrors.cardName}</span>}
                      </div>
                      <div className="msaf-form-group">
                        <label>Expiry <span className="msaf-req">*</span></label>
                        <input type="month" name="expiry" value={paymentData.expiry}
                          onChange={handlePaymentChange}
                          className={stepErrors.expiry ? 'error' : ''} />
                        {stepErrors.expiry && <span className="msaf-err">⚠️ {stepErrors.expiry}</span>}
                      </div>
                      <div className="msaf-form-group">
                        <label>CVV <span className="msaf-req">*</span></label>
                        <input type="password" name="cvv" value={paymentData.cvv}
                          onChange={handlePaymentChange} placeholder="•••"
                          maxLength="4" inputMode="numeric"
                          className={stepErrors.cvv ? 'error' : ''} />
                        {stepErrors.cvv && <span className="msaf-err">⚠️ {stepErrors.cvv}</span>}
                      </div>
                    </div>
                  )}

                  {paymentData.method === 'UPI' && (
                    <div className="msaf-form-group">
                      <label>UPI ID <span className="msaf-req">*</span></label>
                      <input type="text" name="upiId" value={paymentData.upiId}
                        onChange={handlePaymentChange} placeholder="name@upi"
                        inputMode="email" className={stepErrors.upiId ? 'error' : ''} />
                      {stepErrors.upiId && <span className="msaf-err">⚠️ {stepErrors.upiId}</span>}
                    </div>
                  )}
                </div>

                {/* ✅ ACTIONS — Step 3 */}
                <div className="msaf-step-actions">
                  <div className="msaf-action-left">
                    <button type="button" className="msaf-btn-prev" onClick={prevStep}>← Back</button>
                    <button type="button" className="msaf-btn-save" onClick={handleSaveStep3}>
                      💾 {step3Saved ? 'Update Step 3' : 'Save Step 3'}
                    </button>
                  </div>
                  <div className="msaf-action-right">
                    {step3Saved && (
                      <button type="button" className="msaf-btn-submit"
                        onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '⏳ Processing...' : editingId ? '✅ Update Record' : '✅ Pay & Submit'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ RECEIPT MODAL — EduSkillVision ══ */}
        {showSuccess && receiptData && (
          <div className="msaf-receipt-popup">
            <div className="msaf-receipt-modal">
              <div className="msaf-receipt-header">
                <h2>✅ Admission Successful!</h2>
                <button type="button" className="msaf-close-btn"
                  onClick={() => setShowSuccess(false)}>✕</button>
              </div>

              <div className="msaf-receipt-body">
                <div className="msaf-receipt-school">🎓 EDUSKILLVISION</div>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}>
                  Empowering Skills · Shaping Careers
                </div>
                {franchiseCode
                  ? <div className="msaf-receipt-franchise">🏷️ {franchiseCode}</div>
                  : <div className="msaf-receipt-franchise">👑 Admin</div>
                }
                <div className="msaf-receipt-details">
                  <div><span>Receipt No</span><strong>{receiptData.receipt_no}</strong></div>
                  <div><span>Student</span><strong>{receiptData.studentName}</strong></div>
                  <div><span>Course</span><strong>{receiptData.courseName}</strong></div>
                  <div>
                    <span>Amount Paid</span>
                    <strong className="msaf-amount">
                      ₹{Number(receiptData.amount).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div><span>Method</span><strong>{receiptData.method}</strong></div>
                  <div>
                    <span>Status</span>
                    <span className="msaf-status-badge msaf-status-completed">✅ Completed</span>
                  </div>
                </div>

                {/* ✅ Contact Info in Modal */}
                <div style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px dashed #e2e8f0',
                  textAlign: 'center',
                  fontSize: 11,
                  color: '#64748b',
                  lineHeight: 1.7
                }}>
                  <div>📞 +91 91111 37575</div>
                  <div>✉️ eduskillvision@gmail.com</div>
                  <div>🌐 eduskillvision.com</div>
                </div>
              </div>

              <div className="msaf-receipt-footer">
                <button type="button" className="msaf-btn-print" onClick={generatePDF}>
                  🖨️ Print Receipt
                </button>
                <button type="button" className="msaf-btn-close-receipt"
                  onClick={() => setShowSuccess(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MultiStepAdmissionForm;