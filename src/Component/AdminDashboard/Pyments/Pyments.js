// FranchisePaymentForm.jsx - Professional PDF + Clean Actions + Toast
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL, apiConfig } from '../../../Api';
import './Pyments.css';

const FranchisePaymentForm = () => {
  const [franchises, setFranchises] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedReports, setGeneratedReports] = useState([]);
  const [courseBreakdown, setCourseBreakdown] = useState([]);
  const [isFullPayment, setIsFullPayment] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    franchiseId: '',
    franchiseCode: '',
    applicantName: '',
    fatherName: '',
    mobile: '',
    email: '',
    alternateMobile: '',
    instituteName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    paymentAmount: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    note: '',
    paymentStatus: 'Pending',
    selectedCourses: [],
    courseDetails: [],
    agreementDate: '',
    validityDate: ''
  });

  const toNumber = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const getApiErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string') {
      return responseData;
    }

    if (responseData?.detail) {
      return responseData.detail;
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData?.error) {
      return responseData.error;
    }

    if (responseData && typeof responseData === 'object') {
      const firstError = Object.values(responseData).flat()[0];
      if (firstError) return String(firstError);
    }

    return fallbackMessage;
  };

  useEffect(() => {
    fetchFranchises();
    fetchPayments();
    fetchGeneratedReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGeneratedReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/generated-franchises/`, apiConfig());
      let data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      const mappedData = data.map(item => ({
        id: item.id,
        requestId: item.request_id,
        applicantName: item.applicant_name || '',
        fatherName: item.father_name || '',
        franchiseName: item.franchise_name || '',
        email: item.email || '',
        mobile: item.mobile || '',
        alternateMobile: item.alternate_mobile || '',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        pincode: item.pincode || '',
        agreementDate: item.agreement_date,
        validityDate: item.validity_date,
        selectedCourses: item.selected_courses || [],
        courseDetails: item.course_details || [],
        totalAmount: toNumber(item.total_amount),
        paidAmount: toNumber(item.paid_amount),
        dueAmount: toNumber(item.due_amount),
        status: item.status || 'Generated',
        createdAt: item.created_at
      }));
      setGeneratedReports(mappedData);
    } catch (error) {
      console.error('Error fetching generated reports:', error);
      toast.error('Failed to load generated reports', {
        toastId: 'generated-reports-error'
      });
    }
  };

  const fetchFranchises = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/franchises/`, apiConfig());
      const data = response.data;
      const approvedFranchises = data.filter(f =>
        ['Approved', 'Active Franchise', 'Payment Pending', 'Generated'].includes(f.status)
      );
      setFranchises(approvedFranchises);
    } catch (error) {
      setError('Failed to load franchises');
      toast.error('Failed to load franchises', {
        toastId: 'franchises-error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/franchise-payments/`, apiConfig());
      const data = response.data.map(p => ({
        ...p,
        total_amount: toNumber(p.total_amount),
        paid_amount: toNumber(p.paid_amount),
        due_amount: toNumber(p.due_amount)
      }));
      setPayments(data);
      setFilteredPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments', {
        toastId: 'payments-error'
      });
    }
  };

  useEffect(() => {
    let result = payments;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.applicant_name?.toLowerCase().includes(term) ||
        p.franchise_code?.toLowerCase().includes(term) ||
        p.mobile?.includes(term)
      );
    }
    setFilteredPayments(result);
    setCurrentPage(1);
  }, [searchTerm, payments]);

  const getCourseName = (course) => {
    if (typeof course === 'string') return course;
    if (typeof course === 'object' && course !== null) {
      return course.name || course.title || course.course_name || 'Course';
    }
    return 'Course';
  };

  const getCourseAmount = (course) => {
    if (typeof course === 'object' && course !== null) {
      return toNumber(course.amount || course.fee || course.price || 0);
    }
    return 0;
  };

  const handleFranchiseSelect = (e) => {
    const franchiseId = e.target.value;
    if (!franchiseId) return;

    const generatedReport = generatedReports.find(f =>
      f.id?.toString() === franchiseId || f.requestId?.toString() === franchiseId
    );

    const franchise = franchises.find(f =>
      f.franchise_code === franchiseId || f.id?.toString() === franchiseId
    );

    if (generatedReport) {
      setSelectedFranchise(generatedReport);
      const existing = payments.find(p => p.franchise_code === generatedReport.id?.toString());
      const paidAmount = toNumber(existing?.paid_amount || generatedReport.paidAmount || 0);
      const totalAmount = toNumber(generatedReport.totalAmount || 0);
      const dueAmount = totalAmount - paidAmount;

      const courses = generatedReport.selectedCourses || [];
      const courseDetails = generatedReport.courseDetails || [];

      const breakdown = courseDetails.length > 0
        ? courseDetails.map(c => ({
            name: getCourseName(c),
            amount: getCourseAmount(c) || (totalAmount / courseDetails.length),
            status: 'Pending'
          }))
        : courses.map(c => ({
            name: getCourseName(c),
            amount: totalAmount / (courses.length || 1),
            status: 'Pending'
          }));

      setCourseBreakdown(breakdown);
      setFormData({
        ...formData,
        franchiseId: generatedReport.id?.toString() || '',
        franchiseCode: generatedReport.id?.toString() || '',
        applicantName: generatedReport.applicantName || '',
        fatherName: generatedReport.fatherName || '',
        mobile: generatedReport.mobile || '',
        email: generatedReport.email || '',
        alternateMobile: generatedReport.alternateMobile || '',
        instituteName: generatedReport.franchiseName || '',
        address: generatedReport.address || '',
        city: generatedReport.city || '',
        state: generatedReport.state || '',
        pincode: generatedReport.pincode || '',
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        dueAmount: dueAmount > 0 ? dueAmount : 0,
        paymentStatus: dueAmount <= 0 ? 'Completed' : 'Partial',
        selectedCourses: courses,
        courseDetails: courseDetails,
        agreementDate: generatedReport.agreementDate || '',
        validityDate: generatedReport.validityDate || ''
      });
      setPaymentHistory(existing?.payment_history || []);
      setErrors({});
      setShowForm(true);
    } else if (franchise) {
      setSelectedFranchise(franchise);
      const existing = payments.find(p => p.franchise_code === franchise.franchise_code);
      const paidAmount = toNumber(existing?.paid_amount || franchise.payment?.amount_paid || 0);
      const totalAmount = toNumber(franchise.total_amount || franchise.franchise_fee || 0);
      const dueAmount = totalAmount - paidAmount;

      setCourseBreakdown([]);
      setFormData({
        ...formData,
        franchiseId: franchise.franchise_code,
        franchiseCode: franchise.franchise_code,
        applicantName: franchise.applicant_name || '',
        fatherName: franchise.father_name || '',
        mobile: franchise.mobile || '',
        email: franchise.email || '',
        instituteName: franchise.institute_name || '',
        address: franchise.address || '',
        city: franchise.city || '',
        state: franchise.state || '',
        pincode: franchise.pincode || '',
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        dueAmount: dueAmount > 0 ? dueAmount : 0,
        paymentStatus: dueAmount <= 0 ? 'Completed' : 'Partial',
        selectedCourses: [],
        courseDetails: []
      });
      setPaymentHistory(existing?.payment_history || []);
      setErrors({});
      setShowForm(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });

    if (name === 'paymentAmount') {
      const amount = toNumber(value);
      const total = toNumber(formData.totalAmount);
      const paid = toNumber(formData.paidAmount);
      const remaining = total - paid;

      if (amount > remaining && remaining > 0) {
        setErrors(prev => ({ ...prev, paymentAmount: `Exceeds ₹${remaining}` }));
      }

      const newPaid = paid + amount;
      const newRemaining = total - newPaid;
      setFormData(prev => ({
        ...prev,
        dueAmount: newRemaining > 0 ? newRemaining : 0,
        paymentStatus: newRemaining <= 0 ? 'Completed' : newPaid > 0 ? 'Partial' : 'Pending'
      }));
    }
  };

  const handleFullPaymentChange = (e) => {
    const checked = e.target.checked;
    setIsFullPayment(checked);
    if (checked) {
      const remaining = toNumber(formData.totalAmount) - toNumber(formData.paidAmount);
      setFormData(prev => ({
        ...prev,
        paymentAmount: remaining > 0 ? remaining : 0,
        dueAmount: 0,
        paymentStatus: 'Completed'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        paymentAmount: '',
        dueAmount: toNumber(prev.totalAmount) - toNumber(prev.paidAmount),
        paymentStatus: toNumber(prev.totalAmount) - toNumber(prev.paidAmount) <= 0 ? 'Completed' : 'Partial'
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.franchiseId) newErrors.franchiseId = 'Required';
    if (!formData.paymentAmount || toNumber(formData.paymentAmount) <= 0) {
      newErrors.paymentAmount = 'Enter valid amount';
    }
    const amount = toNumber(formData.paymentAmount);
    const remaining = toNumber(formData.totalAmount) - toNumber(formData.paidAmount);
    if (amount > remaining && remaining > 0) {
      newErrors.paymentAmount = `Max ₹${remaining}`;
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.warning('Please fill payment details correctly.');
    }

    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      ...formData,
      franchiseId: '',
      franchiseCode: '',
      applicantName: '',
      fatherName: '',
      mobile: '',
      email: '',
      alternateMobile: '',
      instituteName: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      paymentAmount: '',
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString().split('T')[0],
      note: '',
      paymentStatus: 'Pending',
      selectedCourses: [],
      courseDetails: [],
      agreementDate: '',
      validityDate: ''
    });
    setIsFullPayment(false);
    setSelectedFranchise(null);
    setPaymentHistory([]);
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
    setShowReceipt(false);
    setErrors({});
    setCourseBreakdown([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const amount = toNumber(formData.paymentAmount);
    const total = toNumber(formData.totalAmount);
    const paid = toNumber(formData.paidAmount);
    const newPaid = paid + amount;
    const remaining = total - newPaid;
    const status = remaining <= 0 ? 'Completed' : newPaid > 0 ? 'Partial' : 'Pending';

    const paymentData = {
      franchise_code: formData.franchiseCode,
      applicant_name: formData.applicantName,
      father_name: formData.fatherName,
      mobile: formData.mobile,
      email: formData.email,
      alternate_mobile: formData.alternateMobile,
      institute_name: formData.instituteName,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      total_amount: total,
      paid_amount: newPaid,
      due_amount: remaining > 0 ? remaining : 0,
      payment_status: status,
      payment_amount: amount,
      payment_method: formData.paymentMethod,
      payment_date: formData.paymentDate,
      note: formData.note,
      selected_courses: formData.selectedCourses,
      course_details: formData.courseDetails,
      agreement_date: formData.agreementDate,
      validity_date: formData.validityDate,
      payment_history: [
        ...(paymentHistory || []),
        {
          id: Date.now(),
          date: formData.paymentDate,
          amount: amount,
          method: formData.paymentMethod,
          receipt_no: `ESV-RCP-${Date.now().toString().slice(-6)}`,
          note: formData.note,
          status: 'Completed'
        }
      ]
    };

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/franchise-payments/${editId}/`, paymentData, apiConfig());
        setSuccessMessage('✅ Payment updated!');
        toast.success('✅ Payment updated!');
      } else {
        await axios.post(`${API_URL}/franchise-payments/`, paymentData, apiConfig());
        setSuccessMessage(`✅ ₹${amount} payment successful!`);
        toast.success(`✅ ₹${amount} payment successful!`);
      }

      await fetchPayments();
      await fetchFranchises();
      await fetchGeneratedReports();

      setReceiptData({
        ...paymentData,
        receipt_no: `ESV-RCP-${Date.now().toString().slice(-6)}`,
        amount: amount,
        method: formData.paymentMethod,
        date: formData.paymentDate,
        total_amount: total,
        paid_amount: newPaid,
        due_amount: remaining > 0 ? remaining : 0,
        courseBreakdown: courseBreakdown.length > 0 ? courseBreakdown :
          formData.selectedCourses.map((c, idx) => ({
            name: getCourseName(c),
            amount: total / (formData.selectedCourses.length || 1),
            status: idx === 0 ? 'Paid' : 'Pending'
          }))
      });

      setShowSuccess(true);
      setShowReceipt(true);
      resetForm();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setError('Failed to save payment');
      toast.error(getApiErrorMessage(error, 'Failed to save payment. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🎨 PROFESSIONAL PDF - EduSkillVision Branded
  // ============================================
  const generateReceiptPDF = () => {
    if (!receiptData) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1200');

    const total = toNumber(receiptData.total_amount);
    const amount = toNumber(receiptData.amount);
    const due = toNumber(receiptData.due_amount);
    const currentDate = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const courseRows = (receiptData.courseBreakdown || []).map((c, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-weight:600;">${c.name || 'Course'}</td>
        <td style="text-align:right;font-weight:600;color:#1e40af;">₹${toNumber(c.amount || 0).toFixed(2)}</td>
        <td style="text-align:center;">
          <span style="padding:3px 10px;border-radius:12px;background:${c.status === 'Paid' ? '#d1fae5' : '#fef3c7'};color:${c.status === 'Paid' ? '#065f46' : '#92400e'};font-size:10px;font-weight:600;">
            ${c.status || 'Pending'}
          </span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt - EduSkillVision</title>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Arial', sans-serif; }
        body { background: #fff; color: #1e293b; padding: 20px; }

        .top-bar {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }

        .contact-bar {
          background: #1e2a44;
          color: #fff;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          border-bottom: 3px solid #f59e0b;
          margin-bottom: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 0 5px;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-circle {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          border: 3px solid #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: #1e2a44;
          background: #fff;
        }

        .brand-text h1 {
          font-size: 22px;
          color: #1e2a44;
          font-weight: 700;
        }

        .brand-text p {
          font-size: 10px;
          color: #f59e0b;
          font-weight: 600;
          letter-spacing: 1.5px;
          margin-top: 2px;
        }

        .report-title {
          text-align: right;
        }

        .report-title h2 {
          font-size: 20px;
          color: #1e2a44;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .report-title p {
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
        }

        .receipt-info {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 2px solid #1e2a44;
          border-radius: 8px;
          padding: 12px 18px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .receipt-info-left h3 {
          font-size: 14px;
          color: #1e2a44;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .receipt-info-left p {
          font-size: 11px;
          color: #64748b;
        }

        .receipt-no-badge {
          background: #1e2a44;
          color: #f59e0b;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.5px;
        }

        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .details-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
        }

        .details-table tr:last-child td {
          border-bottom: none;
        }

        .details-table tr:nth-child(even) {
          background: #f8fafc;
        }

        .details-table .label {
          font-weight: 700;
          color: #1e2a44;
          width: 35%;
        }

        .details-table .value {
          color: #1e293b;
          font-weight: 500;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #1e2a44;
          padding: 8px 0;
          margin: 15px 0 8px;
          border-bottom: 2px solid #f59e0b;
        }

        .courses-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 11px;
        }

        .courses-table thead tr {
          background: #1e2a44;
        }

        .courses-table th {
          color: #fff;
          padding: 8px 10px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .courses-table td {
          padding: 6px 10px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 11px;
        }

        .courses-table tr:nth-child(even) {
          background: #f8fafc;
        }

        .totals-box {
          background: linear-gradient(135deg, #f8fafc, #eff6ff);
          border: 2px solid #1e2a44;
          border-radius: 8px;
          padding: 15px 20px;
          margin-top: 15px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
          border-bottom: 1px dashed #cbd5e1;
        }

        .total-row:last-child {
          border-bottom: none;
        }

        .total-row .label {
          font-weight: 600;
          color: #1e2a44;
        }

        .total-row.grand-total {
          background: #1e2a44;
          color: #fff;
          padding: 10px 15px;
          border-radius: 6px;
          margin-top: 8px;
          font-size: 14px;
          font-weight: 700;
        }

        .total-row.grand-total .label,
        .total-row.grand-total .value {
          color: #f59e0b;
          font-size: 15px;
        }

        .total-row.paid-row {
          background: #d1fae5;
          padding: 8px 12px;
          border-radius: 6px;
          margin: 6px 0;
        }

        .total-row.paid-row .value {
          color: #065f46;
          font-weight: 700;
        }

        .total-row.due-row {
          background: ${due > 0 ? '#fee2e2' : '#d1fae5'};
          padding: 8px 12px;
          border-radius: 6px;
        }

        .total-row.due-row .value {
          color: ${due > 0 ? '#991b1b' : '#065f46'};
          font-weight: 700;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 14px;
          border-radius: 15px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-completed { background: #d1fae5; color: #065f46; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-pending { background: #fee2e2; color: #991b1b; }

        .footer {
          margin-top: 25px;
          text-align: center;
          padding: 15px 0;
          border-top: 3px solid #f59e0b;
          background: #f8fafc;
          border-radius: 8px;
        }

        .footer .thank-you {
          font-size: 18px;
          color: #1e2a44;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .footer .subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .footer .contact {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 8px;
        }

        .signature-area {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          padding: 15px 30px 0;
        }

        .signature-box {
          text-align: center;
          width: 200px;
        }

        .signature-line {
          border-top: 1.5px solid #1e2a44;
          margin-bottom: 6px;
        }

        .signature-box p {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }

        .print-btn {
          display: block;
          margin: 20px auto 0;
          padding: 10px 40px;
          background: linear-gradient(135deg, #1e2a44, #253d7a);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(30, 42, 68, 0.3);
        }

        .print-btn:hover {
          transform: translateY(-1px);
        }

        @media print {
          .print-btn { display: none !important; }
          body { padding: 10px; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="top-bar">
        <span>${currentDate}</span>
        <span style="font-weight:600;">Payment Receipt</span>
        <span></span>
      </div>

      <div class="contact-bar">
        <span>📞 +91 8818800802</span>
        <span>✉️ info@eduskillvision.com</span>
        <span>🌐 www.eduskillvision.com</span>
      </div>

      <div class="header">
        <div class="logo-group">
          <div class="logo-circle">ESV</div>
          <div class="brand-text">
            <h1>EduSkillVision</h1>
            <p>EMPOWERING SKILLS, SHAPING FUTURES</p>
          </div>
        </div>
        <div class="report-title">
          <h2>PAYMENT RECEIPT</h2>
          <p>Franchise Payment Confirmation</p>
          <p>Date: ${new Date(receiptData.date).toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      <div class="receipt-info">
        <div class="receipt-info-left">
          <h3>💳 Franchise Payment Details</h3>
          <p>Official receipt for franchise fee payment</p>
        </div>
        <div class="receipt-no-badge">
          ${receiptData.receipt_no}
        </div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Franchise Code</td>
          <td class="value"><strong style="color:#1e40af;">${receiptData.franchise_code}</strong></td>
        </tr>
        <tr>
          <td class="label">Applicant Name</td>
          <td class="value">${receiptData.applicant_name}</td>
        </tr>
        ${receiptData.father_name ? `
        <tr>
          <td class="label">Father's Name</td>
          <td class="value">${receiptData.father_name}</td>
        </tr>` : ''}
        <tr>
          <td class="label">Institute Name</td>
          <td class="value">${receiptData.institute_name || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Contact Number</td>
          <td class="value">${receiptData.mobile || 'N/A'}</td>
        </tr>
        ${receiptData.email ? `
        <tr>
          <td class="label">Email</td>
          <td class="value">${receiptData.email}</td>
        </tr>` : ''}
        ${receiptData.city || receiptData.state ? `
        <tr>
          <td class="label">Location</td>
          <td class="value">${receiptData.city || ''}${receiptData.city && receiptData.state ? ', ' : ''}${receiptData.state || ''}</td>
        </tr>` : ''}
        <tr>
          <td class="label">Payment Date</td>
          <td class="value">${new Date(receiptData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
        </tr>
        <tr>
          <td class="label">Payment Method</td>
          <td class="value"><strong>${receiptData.method}</strong></td>
        </tr>
        <tr>
          <td class="label">Payment Status</td>
          <td class="value">
            <span class="status-badge status-${(receiptData.payment_status || '').toLowerCase()}">
              ${receiptData.payment_status || 'Pending'}
            </span>
          </td>
        </tr>
      </table>

      ${courseRows ? `
      <div class="section-title">📚 Course Breakdown</div>
      <table class="courses-table">
        <thead>
          <tr>
            <th style="width:40px;text-align:center;">S.No</th>
            <th>Course Name</th>
            <th style="width:120px;text-align:right;">Amount (₹)</th>
            <th style="width:100px;text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${courseRows}
        </tbody>
      </table>` : ''}

      <div class="totals-box">
        <div class="total-row">
          <span class="label">💰 Total Amount:</span>
          <span class="value" style="font-weight:700;color:#1e40af;">₹${total.toFixed(2)}</span>
        </div>
        <div class="total-row paid-row">
          <span class="label">✅ Paid Amount:</span>
          <span class="value">₹${amount.toFixed(2)}</span>
        </div>
        <div class="total-row due-row">
          <span class="label">${due > 0 ? '⏳ Remaining Due:' : '✔️ Fully Paid'}</span>
          <span class="value">₹${due.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
          <span class="label">💵 GRAND TOTAL</span>
          <span class="value">₹${total.toFixed(2)}</span>
        </div>
      </div>

      <div class="signature-area">
        <div class="signature-box">
          <div class="signature-line"></div>
          <p>Applicant Signature</p>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <p>Authorized Signatory</p>
          <p style="color:#f59e0b;margin-top:2px;">EduSkillVision</p>
        </div>
      </div>

      <div class="footer">
        <p class="thank-you">🙏 Thank You for Your Payment!</p>
        <p class="subtitle">This is a computer-generated receipt and does not require a physical signature.</p>
        <p class="contact">
          Head Office: Ambikapur, Surguja (C.G.) 497001 | Reg. No.: U80900CT2023PTC014511
        </p>
        <p class="contact">
          © ${new Date().getFullYear()} EduSkillVision Education Pvt. Ltd. | All Rights Reserved
        </p>
      </div>

      <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
    `);
    printWindow.document.close();
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const getStatusClass = (status) => {
    if (status === 'Completed') return 'status-completed';
    if (status === 'Partial') return 'status-partial';
    return 'status-pending';
  };

  const getStatusIcon = (status) => {
    if (status === 'Completed') return '✅';
    if (status === 'Partial') return '🔶';
    return '⏳';
  };

  const handleEditPayment = (payment) => {
    setShowForm(true);
    setIsEditing(true);
    setEditId(payment.id);

    const generated = generatedReports.find(f => f.id?.toString() === payment.franchise_code);
    if (generated) {
      setSelectedFranchise(generated);
      const courses = generated.selectedCourses || [];
      const total = toNumber(generated.totalAmount || 0);
      setCourseBreakdown(courses.map(c => ({
        name: getCourseName(c),
        amount: total / (courses.length || 1),
        status: 'Pending'
      })));
    }
    setPaymentHistory(payment.payment_history || []);
    setErrors({});
    setFormData({
      franchiseId: payment.franchise_code,
      franchiseCode: payment.franchise_code,
      applicantName: payment.applicant_name || '',
      fatherName: payment.father_name || '',
      mobile: payment.mobile || '',
      email: payment.email || '',
      alternateMobile: payment.alternate_mobile || '',
      instituteName: payment.institute_name || '',
      address: payment.address || '',
      city: payment.city || '',
      state: payment.state || '',
      pincode: payment.pincode || '',
      totalAmount: toNumber(payment.total_amount || 0),
      paidAmount: toNumber(payment.paid_amount || 0),
      dueAmount: toNumber(payment.due_amount || 0),
      paymentAmount: '',
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString().split('T')[0],
      note: '',
      paymentStatus: payment.payment_status || 'Pending',
      selectedCourses: payment.selected_courses || [],
      courseDetails: payment.course_details || [],
      agreementDate: payment.agreement_date || '',
      validityDate: payment.validity_date || ''
    });
  };

  const deletePayment = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/franchise-payments/${id}/`, apiConfig());
      await fetchPayments();
      setSuccessMessage('🗑️ Deleted!');
      setShowSuccess(true);
      toast.success('🗑️ Deleted!');
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>
            Delete Payment?
          </div>
          <div style={{ fontSize: '14px', marginBottom: '14px' }}>
            Delete this payment record?
          </div>
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
                await deletePayment(id);
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

  return (
    <div className="fpf-container">
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

      <div className="fpf-card">
        {/* HEADER */}
        <div className="fpf-header">
          <div className="fpf-title">
            <span className="fpf-icon">💳</span>
            <div>
              <h1>Franchise Payment</h1>
              <p>Manage payments for generated franchises</p>
            </div>
          </div>
          <div className="fpf-header-actions">
            <button className="fpf-btn-add" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Close' : '➕ Add Payment'}
            </button>

          </div>
        </div>

        {showSuccess && <div className="fpf-success">{successMessage}</div>}
        {error && <div className="fpf-error">{error}</div>}
        {loading && <div className="fpf-loading">⏳ Loading...</div>}

        {/* FORM */}
        {showForm && (
          <div className="fpf-form-section">
            <div className="fpf-form-wrapper">
              <h3>{isEditing ? '✏️ Edit Payment' : '💳 New Payment'}</h3>
              <form onSubmit={handleSubmit} className="fpf-form">
                <div className="fpf-form-group">
                  <label>Select Franchise <span className="req">*</span></label>
                  <select
                    name="franchiseId"
                    value={formData.franchiseId}
                    onChange={handleFranchiseSelect}
                    className={errors.franchiseId ? 'error' : ''}
                    disabled={isEditing}
                  >
                    <option value="">-- Select --</option>
                    <optgroup label="📋 Generated Reports">
                      {generatedReports.map(f => (
                        <option key={f.id || f.requestId} value={f.id || f.requestId}>
                          #{f.id} - {f.applicantName} (₹{toNumber(f.totalAmount).toFixed(0)})
                        </option>
                      ))}
                    </optgroup>
                    {franchises.length > 0 && (
                      <optgroup label="📁 Other Franchises">
                        {franchises.map(f => (
                          <option key={f.franchise_code} value={f.franchise_code}>
                            {f.franchise_code} - {f.applicant_name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {errors.franchiseId && <span className="err">{errors.franchiseId}</span>}
                </div>

                {selectedFranchise && (
                  <>
                    <div className="fpf-details-grid">
                      <div className="fpf-detail-item">
                        <label>Code</label>
                        <span>{formData.franchiseCode}</span>
                      </div>
                      <div className="fpf-detail-item">
                        <label>Applicant</label>
                        <span>{formData.applicantName}</span>
                      </div>
                      <div className="fpf-detail-item">
                        <label>Mobile</label>
                        <span>{formData.mobile}</span>
                      </div>
                      <div className="fpf-detail-item">
                        <label>Institute</label>
                        <span>{formData.instituteName}</span>
                      </div>
                      <div className="fpf-detail-item">
                        <label>Total</label>
                        <span className="fpf-fee">₹{toNumber(formData.totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="fpf-detail-item">
                        <label>Paid</label>
                        <span className="fpf-paid">₹{toNumber(formData.paidAmount).toFixed(2)}</span>
                      </div>
                      <div className="fpf-detail-item">
                        <label>Due</label>
                        <span className="fpf-remaining">₹{toNumber(formData.dueAmount).toFixed(2)}</span>
                      </div>
                      <div className="fpf-detail-item">
                        <label>Status</label>
                        <span className={`fpf-status-badge ${getStatusClass(formData.paymentStatus)}`}>
                          {getStatusIcon(formData.paymentStatus)} {formData.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {formData.selectedCourses.length > 0 && (
                      <div className="fpf-courses-compact">
                        <div className="fpf-courses-scroll">
                          {formData.selectedCourses.map((course, idx) => (
                            <span key={idx} className="fpf-course-tag">
                              {getCourseName(course)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="fpf-payment-row">
                      <div className="fpf-form-group">
                        <label>Amount (₹) <span className="req">*</span></label>
                        <input
                          type="number"
                          name="paymentAmount"
                          value={formData.paymentAmount}
                          onChange={handleChange}
                          placeholder="Enter amount"
                          className={errors.paymentAmount ? 'error' : ''}
                        />
                        {errors.paymentAmount && <span className="err">{errors.paymentAmount}</span>}
                        <span className="helper-text">Due: ₹{toNumber(formData.dueAmount).toFixed(2)}</span>
                      </div>
                      <div className="fpf-form-group">
                        <label>Method <span className="req">*</span></label>
                        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                          <option value="Cash">💵 Cash</option>
                          <option value="UPI">📱 UPI</option>
                          <option value="Bank Transfer">🏦 Transfer</option>
                          <option value="Cheque">📝 Cheque</option>
                          <option value="Card">💳 Card</option>
                          <option value="Online">🌐 Online</option>
                        </select>
                      </div>
                      <div className="fpf-form-group">
                        <label>Date</label>
                        <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} />
                      </div>
                      <div className="fpf-form-group">
                        <label>Note</label>
                        <input type="text" name="note" value={formData.note} onChange={handleChange} placeholder="Optional" />
                      </div>
                    </div>

                    <div className="fpf-actions-row">
                      <label className="fpf-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isFullPayment}
                          onChange={handleFullPaymentChange}
                          disabled={toNumber(formData.dueAmount) <= 0}
                        />
                        💰 Pay Full Amount {toNumber(formData.dueAmount) > 0 ? `(₹${toNumber(formData.dueAmount).toFixed(2)})` : ''}
                      </label>
                      <div className="fpf-btn-group">
                        <button type="submit" className="fpf-btn-submit" disabled={loading}>
                          {loading ? '⏳...' : isEditing ? '💾 Update' : '💳 Pay'}
                        </button>
                        <button type="button" className="fpf-btn-clear" onClick={() => {
                          setFormData({ ...formData, paymentAmount: '', note: '' });
                          setIsFullPayment(false);
                          setErrors({});
                        }}>
                          🔄 Clear
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {/* RECEIPT MODAL */}
        {showReceipt && receiptData && (
          <div className="fpf-receipt-overlay" onClick={() => setShowReceipt(false)}>
            <div className="fpf-receipt-modal" onClick={e => e.stopPropagation()}>
              <div className="fpf-receipt-header">
                <h2>📄 Payment Receipt</h2>
                <button className="fpf-btn-close-receipt" onClick={() => setShowReceipt(false)}>✕</button>
              </div>
              <div className="fpf-receipt-body">
                <div className="fpf-receipt-content">
                  <div className="fpf-receipt-school">
                    <h3>🎓 EduSkillVision</h3>
                    <p>Empowering Skills, Shaping Futures</p>
                    <span className="receipt-no">📄 {receiptData.receipt_no}</span>
                  </div>
                  <div className="fpf-receipt-details">
                    <div className="fpf-receipt-row">
                      <span className="label">Date:</span>
                      <span className="value">{new Date(receiptData.date).toLocaleDateString()}</span>
                    </div>
                    <div className="fpf-receipt-row">
                      <span className="label">Franchise Code:</span>
                      <span className="value"><strong>{receiptData.franchise_code}</strong></span>
                    </div>
                    <div className="fpf-receipt-row">
                      <span className="label">Applicant:</span>
                      <span className="value">{receiptData.applicant_name}</span>
                    </div>
                    <div className="fpf-receipt-row">
                      <span className="label">Institute:</span>
                      <span className="value">{receiptData.institute_name || 'N/A'}</span>
                    </div>
                    <div className="fpf-receipt-row">
                      <span className="label">Contact:</span>
                      <span className="value">{receiptData.mobile || 'N/A'}</span>
                    </div>

                    {receiptData.courseBreakdown?.length > 0 && (
                      <>
                        <div className="fpf-receipt-divider"></div>
                        <div className="fpf-receipt-section-title">📚 Courses</div>
                        {receiptData.courseBreakdown.map((c, idx) => (
                          <div className="fpf-receipt-row" key={idx}>
                            <span className="label">{c.name || `Course ${idx + 1}`}</span>
                            <span className="value">₹{toNumber(c.amount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    <div className="fpf-receipt-divider"></div>
                    <div className="fpf-receipt-row">
                      <span className="label">Method:</span>
                      <span className="value"><strong>{receiptData.method}</strong></span>
                    </div>
                    <div className="fpf-receipt-row">
                      <span className="label">Status:</span>
                      <span className={`fpf-status-badge ${getStatusClass(receiptData.payment_status)}`}>
                        {getStatusIcon(receiptData.payment_status)} {receiptData.payment_status}
                      </span>
                    </div>

                    <div className="fpf-receipt-total">
                      <div className="fpf-receipt-row grand-total">
                        <span className="label">💰 Total:</span>
                        <span className="value">₹{toNumber(receiptData.total_amount).toFixed(2)}</span>
                      </div>
                      <div className="fpf-receipt-row paid-amount">
                        <span className="label">💳 Paid:</span>
                        <span className="value">₹{toNumber(receiptData.amount).toFixed(2)}</span>
                      </div>
                      <div className="fpf-receipt-row">
                        <span className="label">📊 Remaining:</span>
                        <span className="value" style={{ color: toNumber(receiptData.due_amount) > 0 ? '#c53030' : '#2f855a', fontWeight: '700' }}>
                          ₹{toNumber(receiptData.due_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="fpf-receipt-footer">
                    <p>🙏 Thank You!</p>
                    <button className="fpf-btn-print" onClick={generateReceiptPDF}>
                      🖨️ Print Professional Receipt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT HISTORY TABLE */}
        {!showForm && (
          <div className="fpf-table-section">
            <div className="fpf-table-header">
              <span className="fpf-table-title">📋 History ({filteredPayments.length})</span>
              <input
                type="text"
                className="fpf-search-box"
                placeholder="🔍 Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="fpf-table-wrapper">
              <table className="fpf-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Applicant</th>
                    <th>Mobile</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((payment, index) => (
                      <tr key={payment.id}>
                        <td>{indexOfFirstItem + index + 1}</td>
                        <td><span className="fpf-code">{payment.franchise_code}</span></td>
                        <td><strong>{payment.applicant_name}</strong></td>
                        <td>{payment.mobile || 'N/A'}</td>
                        <td>₹{toNumber(payment.total_amount).toFixed(2)}</td>
                        <td>₹{toNumber(payment.paid_amount).toFixed(2)}</td>
                        <td>₹{toNumber(payment.due_amount).toFixed(2)}</td>
                        <td>
                          <span className={`fpf-status-badge ${getStatusClass(payment.payment_status)}`}>
                            {getStatusIcon(payment.payment_status)} {payment.payment_status}
                          </span>
                        </td>
                        <td>
                          {/* ===== ONLY EDIT & DELETE ===== */}
                          <div className="fpf-actions-cell">
                            <button
                              className="fpf-btn-action edit"
                              onClick={() => handleEditPayment(payment)}
                              title="Edit Payment"
                            >
                              ✏️
                            </button>
                            <button
                              className="fpf-btn-action delete"
                              onClick={() => handleDeletePayment(payment.id)}
                              title="Delete Payment"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="9" className="fpf-no-data">No payments found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredPayments.length > itemsPerPage && (
              <div className="fpf-pagination">
                <span>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length}</span>
                <div>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>◀</button>
                  <span className="fpf-page-num">{currentPage}/{totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>▶</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchisePaymentForm;