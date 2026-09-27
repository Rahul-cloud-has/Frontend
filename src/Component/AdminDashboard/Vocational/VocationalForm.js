import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL, apiConfig } from '../../../Api';
import './VocationalForm.css';

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
        franchiseName: franchiseUser?.franchise_name || franchiseUser?.applicant_name || 'Franchise',
      };
    }
    if (userType === 'admin') return { type: 'admin', franchiseCode: '', franchiseName: 'Admin' };
    return { type: 'guest', franchiseCode: '', franchiseName: 'Guest' };
  } catch {
    return { type: 'guest', franchiseCode: '', franchiseName: 'Guest' };
  }
};

const VocationalForm = () => {
  const toastTimerRef = useRef(null);
  const access = getUserAccess();
  const userType = access.type;
  const franchiseCode = access.franchiseCode;
  const franchiseName = access.franchiseName;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [studentListLoading, setStudentListLoading] = useState(false);

  // ✅ Per-step save tracking
  const [step1Saved, setStep1Saved] = useState(false);
  const [step2Saved, setStep2Saved] = useState(false);
  const [step3Saved, setStep3Saved] = useState(false);
  const [draftId, setDraftId] = useState(null);

  // ✅ Edit mode dirty tracking - jabtak save/update na ho Next disabled
  const [step1Dirty, setStep1Dirty] = useState(false);
  const [step2Dirty, setStep2Dirty] = useState(false);
  const [step3Dirty, setStep3Dirty] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [totalPayment, setTotalPayment] = useState(0);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

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

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / perPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * perPage, currentPage * perPage
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

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, TOAST_DURATION);
  }, []);

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
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadStudentsData = useCallback(async () => {
    setStudentListLoading(true);
    try {
      const response = await axios.get(`${API_URL}/vocational/students/`, apiConfig());
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
        paymentStatus: item.payment_status || 'Pending',
        paymentMethod: item.payment_method || 'Cash',
        photo: item.photo || null,
        adharCard: item.adhar_card || null,
        marksheet10: item.marksheet_10 || null,
        signature: item.signature || null,
        franchise_code: item.franchise_code || '',
        franchise_name: item.franchise_name || '',
        admittedAt: item.admission_date || item.created_at || '',
        status: item.status || 'Active',
      }));

      setFilteredStudents(mappedData);
      setCurrentPage(1);
    } catch (error) {
      showToast('Failed to load students', 'error');
      setFilteredStudents([]);
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

  // ✅ handleChange - marks step1 dirty
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    // If already saved, mark dirty (needs re-save)
    if (step1Saved) setStep1Dirty(true);
  };

  // ✅ handlePaymentChange - marks step3 dirty
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    if (stepErrors[name]) setStepErrors(prev => ({ ...prev, [name]: '' }));
    if (step3Saved) setStep3Dirty(true);
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
      if (step1Saved) setStep1Dirty(true);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    if (step1Saved) setStep1Dirty(true);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File size should be less than 5MB', 'error'); return; }
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocuments(prev => ({ ...prev, [type]: { file, preview: reader.result } }));
      if (stepErrors[type]) setStepErrors(prev => ({ ...prev, [type]: '' }));
      if (step2Saved) setStep2Dirty(true);
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (type) => {
    setDocuments(prev => ({ ...prev, [type]: null }));
    if (step2Saved) setStep2Dirty(true);
  };

  // Validation
  const validateStep1 = () => {
    const newErrors = {};
    const required = [
      'studentName', 'fatherName', 'motherName', 'dob', 'gender',
      'mobile', 'email', 'address', 'city', 'state', 'pincode',
      'courseCategory', 'courseName', 'sessions'
    ];
    required.forEach(field => { if (!formData[field]) newErrors[field] = 'Required'; });
    if (!formData.photo) newErrors.photo = 'Photo required';
    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) newErrors.mobile = '10-digit required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email required';
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = '6-digit required';
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

  // ✅ Next only works if saved AND not dirty
  const canGoNext1 = step1Saved && !step1Dirty;
  const canGoNext2 = step2Saved && !step2Dirty;
  const canSubmit = step3Saved && !step3Dirty;

  const nextStep = () => {
    if (currentStep === 1 && canGoNext1) setCurrentStep(2);
    else if (currentStep === 2 && canGoNext2) setCurrentStep(3);
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
    setStep1Dirty(false);
    setStep2Dirty(false);
    setStep3Dirty(false);
    setDraftId(null);
    setEditingId(null);
    setCurrentStep(1);
    setSessionOptions([]);
    try { localStorage.removeItem('vocationalDraft'); } catch (e) {}
  };

  const toggleAddRecord = () => {
    if (showForm) resetForm();
    setShowForm(!showForm);
  };

  // Draft Save
  const saveDraftToStorage = (stepNum) => {
    try {
      const draftData = {
        id: draftId || Date.now(),
        formData: {
          studentName: formData.studentName, fatherName: formData.fatherName,
          motherName: formData.motherName, dob: formData.dob, gender: formData.gender,
          mobile: formData.mobile, email: formData.email, address: formData.address,
          city: formData.city, state: formData.state, pincode: formData.pincode,
          courseCategory: formData.courseCategory, courseName: formData.courseName,
          sessions: formData.sessions, feeAmount: formData.feeAmount,
          paymentStatus: formData.paymentStatus, photo: null,
        },
        documents: { adharCard: null, marksheet10: null, signature: null },
        paymentData: {
          amount: paymentData.amount, method: paymentData.method,
          cardNumber: '', cardName: '', expiry: '', cvv: '', upiId: paymentData.upiId,
        },
        currentStep: stepNum,
        step1Saved, step2Saved, step3Saved,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('vocationalDraft', JSON.stringify(draftData));
      if (!draftId) setDraftId(draftData.id);
      return true;
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        try { localStorage.removeItem('vocationalDraft'); } catch (e) {}
      }
      return false;
    }
  };

  // ✅ Step Save Handlers - dirty clear karo save ke baad
  const handleSaveStep1 = () => {
    if (!validateStep1()) {
      showToast('Please fill all required fields first', 'error');
      return;
    }
    const success = saveDraftToStorage(1);
    if (success) {
      const wasAlready = step1Saved;
      setStep1Saved(true);
      setStep1Dirty(false); // ✅ dirty clear
      showToast(wasAlready ? '✅ Step 1 updated!' : '✅ Step 1 saved!', 'success');
    } else {
      showToast('⚠️ Storage error', 'error');
    }
  };

  const handleSaveStep2 = () => {
    if (!validateStep2()) {
      showToast('Please upload all documents first', 'error');
      return;
    }
    const success = saveDraftToStorage(2);
    if (success) {
      const wasAlready = step2Saved;
      setStep2Saved(true);
      setStep2Dirty(false); // ✅ dirty clear
      showToast(wasAlready ? '✅ Step 2 updated!' : '✅ Step 2 saved!', 'success');
    } else {
      showToast('⚠️ Storage error', 'error');
    }
  };

  const handleSaveStep3 = () => {
    if (!validateStep3()) {
      showToast('Please fill payment details first', 'error');
      return;
    }
    const success = saveDraftToStorage(3);
    if (success) {
      const wasAlready = step3Saved;
      setStep3Saved(true);
      setStep3Dirty(false); // ✅ dirty clear
      showToast(wasAlready ? '✅ Step 3 updated!' : '✅ Step 3 saved!', 'success');
    } else {
      showToast('⚠️ Storage error', 'error');
    }
  };

  const handleClearDraft = () => {
    if (window.confirm('Clear all draft data?')) {
      try { localStorage.removeItem('vocationalDraft'); } catch (err) {}
      resetForm();
      showToast('🗑️ Draft cleared!', 'info');
    }
  };

  // ✅ Edit - all saved but dirty = false (already updated data)
  const loadForEdit = (id) => {
    const record = filteredStudents.find(item => item.id === id);
    if (!record) return;
    setFormData({
      studentName: record.studentName || '', fatherName: record.fatherName || '',
      motherName: record.motherName || '', dob: record.dob || '',
      gender: record.gender || '', mobile: record.mobile || '',
      email: record.email || '', address: record.address || '',
      city: record.city || '', state: record.state || '',
      pincode: record.pincode || '', courseCategory: record.courseCategory || '',
      courseName: record.courseName || '', sessions: record.sessions || '',
      feeAmount: record.feeAmount || '', paymentStatus: record.paymentStatus || 'Pending',
      photo: record.photo ? { preview: record.photo } : null,
    });
    setDocuments({
      adharCard: record.adharCard ? { preview: record.adharCard } : null,
      marksheet10: record.marksheet10 ? { preview: record.marksheet10 } : null,
      signature: record.signature ? { preview: record.signature } : null,
    });
    setPaymentData({
      amount: record.feeAmount || '', method: record.paymentMethod || 'Card',
      cardNumber: '', cardName: '', expiry: '', cvv: '', upiId: '',
    });
    setEditingId(id);
    setShowForm(true);
    setCurrentStep(1);
    // ✅ Edit mode: saved=true, dirty=false → Next available immediately
    setStep1Saved(true);
    setStep2Saved(true);
    setStep3Saved(true);
    setStep1Dirty(false);
    setStep2Dirty(false);
    setStep3Dirty(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`${API_URL}/vocational/students/${id}/`, apiConfig());
      await loadStudentsData();
      showToast('🗑️ Record deleted!', 'success');
    } catch (error) {
      showToast('Failed to delete record', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const vocationalData = {
        student_name: formData.studentName, father_name: formData.fatherName,
        mother_name: formData.motherName, dob: formData.dob, gender: formData.gender,
        mobile: formData.mobile, email: formData.email, address: formData.address,
        city: formData.city, state: formData.state, pincode: formData.pincode,
        course_category: formData.courseCategory, course_name: formData.courseName,
        sessions: formData.sessions,
        fee_amount: parseFloat(paymentData.amount) || parseFloat(formData.feeAmount) || 0,
        total_payment: parseFloat(paymentData.amount) || 0,
        payment_status: 'Completed', payment_method: paymentData.method,
        admission_date: new Date().toISOString().split('T')[0],
        course_type: 'vocational',
        franchise_code: franchiseCode || '', franchise_name: franchiseName || '',
        created_by: userType,
        photo: formData.photo?.preview || null,
        adhar_card: documents.adharCard?.preview || null,
        marksheet_10: documents.marksheet10?.preview || null,
        signature: documents.signature?.preview || null,
      };

      if (editingId) {
        await axios.put(`${API_URL}/vocational/students/${editingId}/`, vocationalData, apiConfig());
        setSuccessMessage('✅ Vocational student updated successfully!');
      } else {
        await axios.post(`${API_URL}/vocational/students/`, vocationalData, apiConfig());
        setSuccessMessage('✅ Vocational student admitted successfully!');
      }

      try { localStorage.removeItem('vocationalDraft'); } catch (e) {}

      setReceiptData({
        receipt_no: `VOC-${Date.now().toString().slice(-6)}`,
        studentName: formData.studentName, courseName: formData.courseName,
        amount: paymentData.amount, method: paymentData.method, status: 'Completed',
      });

      setShowSuccess(true);
      await loadStudentsData();

      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        setShowForm(false);
      }, 3000);

    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to submit form';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('en-IN');
    const time = new Date().toLocaleTimeString('en-IN');
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>EduSkillVision - Vocational Receipt</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f2f5;padding:40px}
        .receipt{max-width:600px;margin:0 auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.12)}
        .header{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:24px 28px;text-align:center}
        .header h1{font-size:24px;font-weight:800;margin-bottom:4px}
        .header p{font-size:12px;opacity:.9}
        .tagline{font-size:11px;margin-top:4px;opacity:.85;font-style:italic}
        .fc-badge{display:inline-block;background:rgba(255,255,255,0.2);padding:3px 14px;border-radius:20px;font-size:11px;font-weight:600;margin-top:8px}
        .body{padding:24px 28px}
        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
        .row:last-child{border-bottom:none}
        .label{color:#6b7280;font-weight:500}
        .value{color:#111827;font-weight:600}
        .total{background:#f8fafc;border-radius:8px;padding:12px 16px;margin-top:16px;border:1px solid #e2e8f0}
        .total .row{border:none}
        .total .value{color:#4f46e5;font-size:16px}
        .status-badge{background:#dcfce7;color:#166534;padding:2px 12px;border-radius:20px;font-size:11px;font-weight:700}
        .footer{text-align:center;padding:16px 28px;background:#f9fafb;border-top:1px solid #f3f4f6;font-size:11px;color:#6b7280}
        .footer strong{color:#4f46e5}.footer p{margin:2px 0}
        @media print{body{background:white;padding:0}.receipt{box-shadow:none}}
      </style></head><body>
      <div class="receipt">
        <div class="header">
          <h1>🔧 EduSkillVision Vocational</h1>
          <p>Vocational Admission Receipt</p>
          <div class="tagline">Empowering Skills · Shaping Careers</div>
          <div class="fc-badge">${franchiseCode ? `🏷️ ${franchiseCode}` : '👑 Admin'}</div>
        </div>
        <div class="body">
          <div class="row"><span class="label">Receipt No</span><span class="value">${receiptData?.receipt_no || 'VOC-' + Date.now()}</span></div>
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

  const getCategoryIcon = (category) => categoryIcons[category] || '📚';
  const getStatusClass = (s) => s === 'Completed' ? 'vf-status-completed' : s === 'Partial' ? 'vf-status-partial' : 'vf-status-pending';
  const getStatusIcon = (s) => s === 'Completed' ? '✅' : s === 'Partial' ? '🔶' : '⏳';
  const anyStepSaved = step1Saved || step2Saved || step3Saved;

  return (
    <div className="vf-container">
      {toast.show && (
        <div className={`vf-toast vf-toast-${toast.type}`}>{toast.message}</div>
      )}

      <div className="vf-card">

        {/* Header */}
        <div className="vf-header">
          <div className="vf-header-left">
            <span className="vf-header-icon">🔧</span>
            <div>
              <h1>Vocational Admission</h1>
              <p>Complete vocational course admission in 3 easy steps</p>
              {franchiseCode && <span className="vf-franchise-badge">🏷️ {franchiseCode}</span>}
              {anyStepSaved && <span className="vf-draft-badge">💾 Draft Saved</span>}
            </div>
          </div>
          <div className="vf-header-actions">
            <button type="button" className="vf-btn-refresh"
              onClick={() => { fetchCourses(); loadStudentsData(); }}>🔄</button>
            <button type="button"
              className={`vf-btn-add-record ${showForm ? 'close' : ''}`}
              onClick={toggleAddRecord}>
              {showForm ? '✕ Close Form' : '➕ New Admission'}
            </button>
          </div>
        </div>

        {/* Table */}
        {!showForm && (
          <div className="vf-history-section">
            <div className="vf-history-header">
              <h3>📋 Vocational Students</h3>
              <span className="vf-history-count">
                {filteredStudents.length} Total
                {userType === 'franchise' && ` · ${franchiseCode}`}
              </span>
            </div>

            {studentListLoading ? (
              <div className="vf-loading">
                <div className="vf-spinner"></div>
                <p>Loading students...</p>
              </div>
            ) : (
              <>
                <div className="vf-table-wrapper">
                  <table className="vf-history-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Student</th><th>Mobile</th><th>Course</th>
                        <th>Fee (₹)</th><th>Franchise</th><th>Status</th><th>Date</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.length > 0 ? paginatedStudents.map((item, index) => (
                        <tr key={item.id}>
                          <td>{(currentPage - 1) * perPage + index + 1}</td>
                          <td><strong>{item.studentName || '—'}</strong></td>
                          <td>{item.mobile || '—'}</td>
                          <td>{item.courseName || '—'}</td>
                          <td className="vf-fee-cell">₹{Number(item.feeAmount || 0).toLocaleString('en-IN')}</td>
                          <td><span className="vf-franchise-code-badge">{item.franchise_code || 'Admin'}</span></td>
                          <td>
                            <span className={`vf-status-badge ${getStatusClass(item.paymentStatus)}`}>
                              {getStatusIcon(item.paymentStatus)} {item.paymentStatus || 'Pending'}
                            </span>
                          </td>
                          <td>{item.admittedAt ? new Date(item.admittedAt).toLocaleDateString('en-IN') : '—'}</td>
                          <td>
                            <div className="vf-table-actions">
                              <button type="button" className="vf-btn-edit" onClick={() => loadForEdit(item.id)}>✏️</button>
                              <button type="button" className="vf-btn-delete" onClick={() => handleDelete(item.id)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="9" className="vf-no-data">📭 No vocational student records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredStudents.length > 0 && (
                  <div className="vf-pagination">
                    <span className="vf-page-info">
                      Showing <strong>{Math.min((currentPage - 1) * perPage + 1, filteredStudents.length)}–{Math.min(currentPage * perPage, filteredStudents.length)}</strong> of <strong>{filteredStudents.length}</strong>
                    </span>
                    <div className="vf-page-controls">
                      <button type="button" className="vf-page-btn" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>«</button>
                      <button type="button" className="vf-page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                      {getPageNumbers().map((page, idx) =>
                        page === '...' ? <span key={`d${idx}`} className="vf-page-dots">•••</span>
                          : <button key={`p${page}`} type="button" className={`vf-page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>{page}</button>
                      )}
                      <button type="button" className="vf-page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>›</button>
                      <button type="button" className="vf-page-btn" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>»</button>
                    </div>
                    <div className="vf-per-page">
                      <label>Rows:</label>
                      <select value={perPage} onChange={handlePerPageChange}>
                        <option value={5}>5</option><option value={10}>10</option>
                        <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <>
            <div className="vf-mobile-info">
              📱 Draft won't save uploaded images. Re-upload after loading draft.
            </div>

            <div className="vf-progress-bar">
              <div className="vf-progress-steps">
                <div className={`vf-step ${currentStep >= 1 ? 'active' : ''}`}>
                  <span className="vf-step-number">{step1Saved && !step1Dirty ? '✓' : '1'}</span>
                  <span className="vf-step-label">Registration</span>
                </div>
                <div className={`vf-step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                <div className={`vf-step ${currentStep >= 2 ? 'active' : ''}`}>
                  <span className="vf-step-number">{step2Saved && !step2Dirty ? '✓' : '2'}</span>
                  <span className="vf-step-label">Documents</span>
                </div>
                <div className={`vf-step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
                <div className={`vf-step ${currentStep >= 3 ? 'active' : ''}`}>
                  <span className="vf-step-number">{step3Saved && !step3Dirty ? '✓' : '3'}</span>
                  <span className="vf-step-label">Payment</span>
                </div>
              </div>
            </div>

            {showSuccess && <div className="vf-success-message">{successMessage}</div>}

            {/* ══ STEP 1 ══ */}
            {currentStep === 1 && (
              <div className="vf-step-content">
                <h2>📝 Student Registration</h2>

                <div className="vf-photo-upload-top">
                  <div className="vf-photo-upload-area"
                    onClick={() => document.getElementById('vf-studentPhoto').click()}>
                    {formData.photo ? (
                      <div className="vf-photo-preview">
                        <img src={formData.photo.preview} alt="Student" />
                        <button type="button" className="vf-remove-photo"
                          onClick={(e) => { e.stopPropagation(); removePhoto(); }}>✕</button>
                      </div>
                    ) : (
                      <div className="vf-photo-placeholder">
                        <span>📸</span><p>Upload Photo</p><small>Max 5MB</small>
                      </div>
                    )}
                  </div>
                  <input type="file" id="vf-studentPhoto" accept="image/*" onChange={handlePhotoUpload} hidden />
                  {errors.photo && <span className="vf-error">⚠️ {errors.photo}</span>}
                </div>

                <div className="vf-franchise-display">
                  <div className="vf-form-group">
                    <label>🏷️ Franchise Code</label>
                    <input type="text" value={franchiseCode || 'Admin'} readOnly
                      style={{ background: '#f1f5f9', fontWeight: '700', color: '#4f46e5' }} />
                  </div>
                  <div className="vf-form-group">
                    <label>🏪 Franchise Name</label>
                    <input type="text" value={franchiseName || 'Administrator'} readOnly
                      style={{ background: '#f1f5f9', fontWeight: '700', color: '#4f46e5' }} />
                  </div>
                </div>

                {/* ✅ Always 2-column grid on all devices */}
                <div className="vf-form-grid">
                  <div className="vf-form-group">
                    <label>Student Name <span className="vf-req">*</span></label>
                    <input name="studentName" value={formData.studentName} onChange={handleChange}
                      placeholder="Full name" className={errors.studentName ? 'error' : ''} />
                    {errors.studentName && <span className="vf-error">⚠️ {errors.studentName}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Father's Name <span className="vf-req">*</span></label>
                    <input name="fatherName" value={formData.fatherName} onChange={handleChange}
                      placeholder="Father's name" className={errors.fatherName ? 'error' : ''} />
                    {errors.fatherName && <span className="vf-error">⚠️ {errors.fatherName}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Mother's Name <span className="vf-req">*</span></label>
                    <input name="motherName" value={formData.motherName} onChange={handleChange}
                      placeholder="Mother's name" className={errors.motherName ? 'error' : ''} />
                    {errors.motherName && <span className="vf-error">⚠️ {errors.motherName}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Date of Birth <span className="vf-req">*</span></label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange}
                      className={errors.dob ? 'error' : ''} />
                    {errors.dob && <span className="vf-error">⚠️ {errors.dob}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Gender <span className="vf-req">*</span></label>
                    <select name="gender" value={formData.gender} onChange={handleChange}
                      className={errors.gender ? 'error' : ''}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <span className="vf-error">⚠️ {errors.gender}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Mobile <span className="vf-req">*</span></label>
                    <input name="mobile" value={formData.mobile} onChange={handleChange}
                      placeholder="10-digit" maxLength="10" inputMode="numeric"
                      className={errors.mobile ? 'error' : ''} />
                    {errors.mobile && <span className="vf-error">⚠️ {errors.mobile}</span>}
                  </div>
                  <div className="vf-form-group vf-full-width">
                    <label>Email <span className="vf-req">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="Enter email" inputMode="email"
                      className={errors.email ? 'error' : ''} />
                    {errors.email && <span className="vf-error">⚠️ {errors.email}</span>}
                  </div>
                  <div className="vf-form-group vf-full-width">
                    <label>Address <span className="vf-req">*</span></label>
                    <input name="address" value={formData.address} onChange={handleChange}
                      placeholder="Complete address" className={errors.address ? 'error' : ''} />
                    {errors.address && <span className="vf-error">⚠️ {errors.address}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>City <span className="vf-req">*</span></label>
                    <input name="city" value={formData.city} onChange={handleChange}
                      className={errors.city ? 'error' : ''} />
                    {errors.city && <span className="vf-error">⚠️ {errors.city}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>State <span className="vf-req">*</span></label>
                    <input name="state" value={formData.state} onChange={handleChange}
                      className={errors.state ? 'error' : ''} />
                    {errors.state && <span className="vf-error">⚠️ {errors.state}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Pincode <span className="vf-req">*</span></label>
                    <input name="pincode" value={formData.pincode} onChange={handleChange}
                      maxLength="6" inputMode="numeric" className={errors.pincode ? 'error' : ''} />
                    {errors.pincode && <span className="vf-error">⚠️ {errors.pincode}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Course Category <span className="vf-req">*</span></label>
                    <select name="courseCategory" value={formData.courseCategory} onChange={handleChange}
                      className={errors.courseCategory ? 'error' : ''}>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                      ))}
                    </select>
                    {errors.courseCategory && <span className="vf-error">⚠️ {errors.courseCategory}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Course Name <span className="vf-req">*</span></label>
                    <select name="courseName" value={formData.courseName} onChange={handleChange}
                      disabled={!formData.courseCategory} className={errors.courseName ? 'error' : ''}>
                      <option value="">Select Course</option>
                      {filteredCourses.map(c => {
                        const name = c.course_name || c.courseName || '';
                        return <option key={c.id} value={name}>{name}</option>;
                      })}
                    </select>
                    {errors.courseName && <span className="vf-error">⚠️ {errors.courseName}</span>}
                  </div>
                  <div className="vf-form-group">
                    <label>Duration <span className="vf-req">*</span></label>
                    <select name="sessions" value={formData.sessions} onChange={handleChange}
                      disabled={!formData.courseName || sessionOptions.length === 0}
                      className={errors.sessions ? 'error' : ''}>
                      <option value="">Select Duration</option>
                      {sessionOptions.map((session, idx) => (
                        <option key={idx} value={session}>{session}</option>
                      ))}
                    </select>
                    {errors.sessions && <span className="vf-error">⚠️ {errors.sessions}</span>}
                  </div>
                </div>

                {/* ✅ Dirty indicator */}
                {step1Dirty && (
                  <div className="vf-dirty-warning">
                    ⚠️ Changes detected — please Save/Update to continue
                  </div>
                )}

                <div className="vf-step-actions">
                  <div className="vf-action-left">
                    <button type="button" className="vf-btn-save" onClick={handleSaveStep1}>
                      💾 {step1Saved ? 'Update Step 1' : 'Save Step 1'}
                    </button>
                    {anyStepSaved && (
                      <button type="button" className="vf-btn-clear-draft" onClick={handleClearDraft}>
                        🗑️ Clear
                      </button>
                    )}
                  </div>
                  <div className="vf-action-right">
                    {/* ✅ Next only if saved AND not dirty */}
                    {canGoNext1 ? (
                      <button type="button" className="vf-btn-next" onClick={nextStep}>
                        Next → Documents
                      </button>
                    ) : step1Saved && step1Dirty ? (
                      <button type="button" className="vf-btn-next vf-btn-disabled" disabled>
                        Update First ↑
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 2 ══ */}
            {currentStep === 2 && (
              <div className="vf-step-content">
                <h2>📎 Document Upload</h2>

                <div className="vf-documents-grid">
                  <div className="vf-document-upload">
                    <label>Aadhar Card <span className="vf-req">*</span></label>
                    <div className={`vf-upload-area ${stepErrors.adharCard ? 'error' : ''}`}
                      onClick={() => document.getElementById('vf-adharCard').click()}>
                      {documents.adharCard ? (
                        <div className="vf-uploaded-file">
                          <img src={documents.adharCard.preview} alt="Aadhar" />
                          <button type="button" className="vf-remove-file"
                            onClick={(e) => { e.stopPropagation(); removeDocument('adharCard'); }}>✕</button>
                        </div>
                      ) : (
                        <div className="vf-upload-placeholder">
                          <span>🪪</span><p>Upload Aadhar Card</p><small>JPG, PNG · Max 5MB</small>
                        </div>
                      )}
                    </div>
                    <input type="file" id="vf-adharCard" accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'adharCard')} hidden />
                    {stepErrors.adharCard && <span className="vf-error">⚠️ {stepErrors.adharCard}</span>}
                  </div>

                  <div className="vf-document-upload">
                    <label>10th Marksheet <span className="vf-req">*</span></label>
                    <div className={`vf-upload-area ${stepErrors.marksheet10 ? 'error' : ''}`}
                      onClick={() => document.getElementById('vf-marksheet10').click()}>
                      {documents.marksheet10 ? (
                        <div className="vf-uploaded-file">
                          <img src={documents.marksheet10.preview} alt="Marksheet" />
                          <button type="button" className="vf-remove-file"
                            onClick={(e) => { e.stopPropagation(); removeDocument('marksheet10'); }}>✕</button>
                        </div>
                      ) : (
                        <div className="vf-upload-placeholder">
                          <span>📄</span><p>Upload 10th Marksheet</p><small>JPG, PNG · Max 5MB</small>
                        </div>
                      )}
                    </div>
                    <input type="file" id="vf-marksheet10" accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'marksheet10')} hidden />
                    {stepErrors.marksheet10 && <span className="vf-error">⚠️ {stepErrors.marksheet10}</span>}
                  </div>

                  <div className="vf-document-upload">
                    <label>Signature <span className="vf-req">*</span></label>
                    <div className={`vf-upload-area ${stepErrors.signature ? 'error' : ''}`}
                      onClick={() => document.getElementById('vf-signature').click()}>
                      {documents.signature ? (
                        <div className="vf-uploaded-file">
                          <img src={documents.signature.preview} alt="Signature" />
                          <button type="button" className="vf-remove-file"
                            onClick={(e) => { e.stopPropagation(); removeDocument('signature'); }}>✕</button>
                        </div>
                      ) : (
                        <div className="vf-upload-placeholder">
                          <span>✍️</span><p>Upload Signature</p><small>JPG, PNG · Max 5MB</small>
                        </div>
                      )}
                    </div>
                    <input type="file" id="vf-signature" accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature')} hidden />
                    {stepErrors.signature && <span className="vf-error">⚠️ {stepErrors.signature}</span>}
                  </div>
                </div>

                {step2Dirty && (
                  <div className="vf-dirty-warning">
                    ⚠️ Changes detected — please Save/Update to continue
                  </div>
                )}

                <div className="vf-step-actions">
                  <div className="vf-action-left">
                    <button type="button" className="vf-btn-prev" onClick={prevStep}>← Back</button>
                    <button type="button" className="vf-btn-save" onClick={handleSaveStep2}>
                      💾 {step2Saved ? 'Update Step 2' : 'Save Step 2'}
                    </button>
                  </div>
                  <div className="vf-action-right">
                    {canGoNext2 ? (
                      <button type="button" className="vf-btn-next" onClick={nextStep}>
                        Next → Payment
                      </button>
                    ) : step2Saved && step2Dirty ? (
                      <button type="button" className="vf-btn-next vf-btn-disabled" disabled>
                        Update First ↑
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 3 ══ */}
            {currentStep === 3 && (
              <div className="vf-step-content">
                <h2>💳 Payment</h2>

                <div className="vf-payment-summary">
                  <div className="vf-summary-item"><span>Student</span><strong>{formData.studentName}</strong></div>
                  <div className="vf-summary-item"><span>Course</span><strong>{formData.courseName}</strong></div>
                  <div className="vf-summary-item"><span>Duration</span><strong>{formData.sessions}</strong></div>
                  <div className="vf-summary-item">
                    <span>Fee</span>
                    <strong className="vf-fee-amount">₹{Number(paymentData.amount || totalPayment).toLocaleString('en-IN')}</strong>
                  </div>
                  {franchiseCode && <div className="vf-summary-item"><span>Franchise</span><strong>{franchiseCode}</strong></div>}
                </div>

                <div className="vf-payment-methods">
                  <div className="vf-method-options">
                    {['Card', 'UPI', 'Cash'].map(method => (
                      <button key={method} type="button"
                        className={`vf-method-btn ${paymentData.method === method ? 'active' : ''}`}
                        onClick={() => {
                          setPaymentData(prev => ({ ...prev, method }));
                          if (step3Saved) setStep3Dirty(true);
                        }}>
                        {method === 'Card' ? '💳' : method === 'UPI' ? '📱' : '💵'} {method}
                      </button>
                    ))}
                  </div>

                  <div className="vf-form-group">
                    <label>Amount (₹) <span className="vf-req">*</span></label>
                    <input type="number" name="amount" value={paymentData.amount}
                      onChange={handlePaymentChange} inputMode="numeric"
                      className={stepErrors.amount ? 'error' : ''} />
                    {stepErrors.amount && <span className="vf-error">⚠️ {stepErrors.amount}</span>}
                  </div>

                  {paymentData.method === 'Card' && (
                    <div className="vf-card-details">
                      <div className="vf-form-group">
                        <label>Card Number <span className="vf-req">*</span></label>
                        <input type="text" name="cardNumber" value={paymentData.cardNumber}
                          onChange={handlePaymentChange} placeholder="1234 5678 9012 3456"
                          maxLength="16" inputMode="numeric"
                          className={stepErrors.cardNumber ? 'error' : ''} />
                        {stepErrors.cardNumber && <span className="vf-error">⚠️ {stepErrors.cardNumber}</span>}
                      </div>
                      <div className="vf-form-group">
                        <label>Card Holder Name <span className="vf-req">*</span></label>
                        <input type="text" name="cardName" value={paymentData.cardName}
                          onChange={handlePaymentChange} placeholder="Name on card"
                          className={stepErrors.cardName ? 'error' : ''} />
                        {stepErrors.cardName && <span className="vf-error">⚠️ {stepErrors.cardName}</span>}
                      </div>
                      <div className="vf-form-group">
                        <label>Expiry <span className="vf-req">*</span></label>
                        <input type="month" name="expiry" value={paymentData.expiry}
                          onChange={handlePaymentChange} className={stepErrors.expiry ? 'error' : ''} />
                        {stepErrors.expiry && <span className="vf-error">⚠️ {stepErrors.expiry}</span>}
                      </div>
                      <div className="vf-form-group">
                        <label>CVV <span className="vf-req">*</span></label>
                        <input type="password" name="cvv" value={paymentData.cvv}
                          onChange={handlePaymentChange} placeholder="•••"
                          maxLength="4" inputMode="numeric"
                          className={stepErrors.cvv ? 'error' : ''} />
                        {stepErrors.cvv && <span className="vf-error">⚠️ {stepErrors.cvv}</span>}
                      </div>
                    </div>
                  )}

                  {paymentData.method === 'UPI' && (
                    <div className="vf-form-group">
                      <label>UPI ID <span className="vf-req">*</span></label>
                      <input type="text" name="upiId" value={paymentData.upiId}
                        onChange={handlePaymentChange} placeholder="name@upi"
                        inputMode="email" className={stepErrors.upiId ? 'error' : ''} />
                      {stepErrors.upiId && <span className="vf-error">⚠️ {stepErrors.upiId}</span>}
                    </div>
                  )}
                </div>

                {step3Dirty && (
                  <div className="vf-dirty-warning">
                    ⚠️ Changes detected — please Save/Update before submitting
                  </div>
                )}

                <div className="vf-step-actions">
                  <div className="vf-action-left">
                    <button type="button" className="vf-btn-prev" onClick={prevStep}>← Back</button>
                    <button type="button" className="vf-btn-save" onClick={handleSaveStep3}>
                      💾 {step3Saved ? 'Update Step 3' : 'Save Step 3'}
                    </button>
                  </div>
                  <div className="vf-action-right">
                    {canSubmit ? (
                      <button type="button" className="vf-btn-submit"
                        onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '⏳ Processing...' : editingId ? '✅ Update Admission' : '✅ Pay & Submit'}
                      </button>
                    ) : step3Saved && step3Dirty ? (
                      <button type="button" className="vf-btn-submit vf-btn-disabled" disabled>
                        Update First ↑
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Receipt Modal */}
        {showSuccess && receiptData && (
          <div className="vf-receipt-popup">
            <div className="vf-receipt-modal">
              <div className="vf-receipt-header">
                <h2>✅ Admission Successful!</h2>
                <button type="button" className="vf-close-btn" onClick={() => setShowSuccess(false)}>✕</button>
              </div>
              <div className="vf-receipt-body">
                <div className="vf-receipt-school">🔧 EDUSKILLVISION VOCATIONAL</div>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}>
                  Empowering Skills · Shaping Careers
                </div>
                {franchiseCode
                  ? <div className="vf-receipt-franchise">🏷️ {franchiseCode}</div>
                  : <div className="vf-receipt-franchise">👑 Admin</div>
                }
                <div className="vf-receipt-details">
                  <div><span>Receipt No</span><strong>{receiptData.receipt_no}</strong></div>
                  <div><span>Student</span><strong>{receiptData.studentName}</strong></div>
                  <div><span>Course</span><strong>{receiptData.courseName}</strong></div>
                  <div><span>Amount</span><strong className="vf-amount">₹{Number(receiptData.amount).toLocaleString('en-IN')}</strong></div>
                  <div><span>Method</span><strong>{receiptData.method}</strong></div>
                  <div><span>Status</span><span className="vf-status-badge vf-status-completed">✅ Completed</span></div>
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #e2e8f0', textAlign: 'center', fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
                  <div>📞 +91 91111 37575</div>
                  <div>✉️ eduskillvision@gmail.com</div>
                  <div>🌐 eduskillvision.com</div>
                </div>
              </div>
              <div className="vf-receipt-footer">
                <button type="button" className="vf-btn-print" onClick={generatePDF}>🖨️ Print Receipt</button>
                <button type="button" className="vf-btn-close" onClick={() => setShowSuccess(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocationalForm;