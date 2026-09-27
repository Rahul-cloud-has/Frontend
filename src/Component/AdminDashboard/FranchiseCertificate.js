import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL, apiConfig } from '../../Api';
import './FranchiseCertificate.css';

// ============================================
// 🔐 PERMISSION HELPER
// ============================================
const getUserAccess = () => {
  const userType = localStorage.getItem('userType');
  const isAdmin = localStorage.getItem('isAuthenticated') === 'true';
  const franchiseUser = JSON.parse(localStorage.getItem('franchiseUser'));
  
  if (franchiseUser || userType === 'franchise') {
    return {
      type: 'franchise',
      franchiseCode: franchiseUser?.franchise_code || '',
      franchiseName: franchiseUser?.franchise_name || franchiseUser?.applicant_name || 'Franchise',
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      isReadOnly: false
    };
  }
  
  if (isAdmin || userType === 'admin') {
    return {
      type: 'admin',
      franchiseCode: '',
      franchiseName: 'Admin',
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      isReadOnly: false
    };
  }
  
  return {
    type: 'guest',
    franchiseCode: '',
    franchiseName: 'Guest',
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    isReadOnly: true
  };
};

const FranchiseCertificate = () => {
  // ===== ACCESS PERMISSIONS =====
  const access = getUserAccess();
  const userType = access.type;
  const franchiseCode = access.franchiseCode;

  const [certificates, setCertificates] = useState([]);
  const [franchiseUsers, setFranchiseUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [franchiseSearchTerm, setFranchiseSearchTerm] = useState('');
  const [showFranchiseDropdown, setShowFranchiseDropdown] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [activeTab, setActiveTab] = useState('manual');
  const [loading, setLoading] = useState(false);

  // Social Links State
  const [socialLinks, setSocialLinks] = useState([
    { platform: 'Facebook', url: '', icon: '📘' },
    { platform: 'Instagram', url: '', icon: '📷' },
    { platform: 'YouTube', url: '', icon: '▶️' },
    { platform: 'LinkedIn', url: '', icon: '💼' }
  ]);

  const formRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({
    certNo: '',
    franchiseCode: '',
    applicantName: '',
    fatherName: '',
    franchiseName: '',
    authorizedArea: '',
    selectedCategory: '',
    courseName: '',
    validityFrom: '1st April 2026',
    validityTo: '31st March 2027',
    state: 'CHHATTISGARH',
    city: 'ASOLA/SURGUJA',
    centerCoordinator: 'Rahul Mishra',
    director: 'Mr. Ajay Kumar Gupta',
    companyName: 'EduSkillVision',
    regNo: 'U80900CT2023PTC014511',
    website: 'eduskillvision.com',
    iso: 'ISO 9001:2015 Certified',
    headOffice: 'Ambikapur, Surguja (C.G.) 497001',
    regionalOffice: 'Bilaspur, Chhattisgarh',
    applicantPhoto: null,
    phone: '+91 91111 37575',
    email: 'info@eduskillvision.com'
  });

  const [qrImage, setQrImage] = useState(null);

  // ============================================
  // 📤 LOAD FRANCHISE USERS FROM API
  // ============================================
  const loadFranchiseUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/franchise-users/`, apiConfig());
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && response.data.data) {
        data = response.data.data;
      } else if (response.data && response.data.results) {
        data = response.data.results;
      }

      const mapped = data.map(user => ({
        id: user.id,
        applicantName: user.applicant_name || user.username || user.applicant?.name || '',
        fatherName: user.father_name || user.fatherName || '',
        franchiseName: user.franchise_name || user.franchise?.name || '',
        franchiseCode: user.franchise_code || user.franchise?.code || '',
        email: user.email || user.user?.email || '',
        mobile: user.mobile || user.applicant?.mobile || '',
        city: user.city || user.applicant?.city || '',
        state: user.state || user.applicant?.state || '',
        address: user.address || user.applicant?.address || '',
        photo: user.photo || user.applicant?.photo || null
      }));

      setFranchiseUsers(mapped);
    } catch (error) {
      console.error('❌ Error loading franchise users:', error);
      setFranchiseUsers([]);
    }
  };

  // ============================================
  // 📤 LOAD CERTIFICATES FROM API (MAPPED)
  // ============================================
  const loadCertificates = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/franchise-certificates/`;
      
      if (userType === 'franchise' && franchiseCode) {
        url += `?franchise_code=${franchiseCode}`;
      }
      
      const response = await axios.get(url, apiConfig());
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && response.data.data) {
        data = response.data.data;
      } else if (response.data && response.data.results) {
        data = response.data.results;
      }
      
      // ✅ Map backend fields to frontend fields
      const mappedData = data.map(cert => ({
        id: cert.id,
        certNo: cert.cert_no || cert.certNo || '',
        franchiseCode: cert.franchise_code || cert.franchiseCode || '',
        applicantName: cert.applicant_name || cert.applicantName || '',
        fatherName: cert.father_name || cert.fatherName || '',
        franchiseName: cert.franchise_name || cert.franchiseName || '',
        authorizedArea: cert.authorized_area || cert.authorizedArea || '',
        selectedCategory: cert.selected_category || cert.selectedCategory || '',
        courseName: cert.course_name || cert.courseName || '',
        validityFrom: cert.validity_from || cert.validityFrom || '1st April 2026',
        validityTo: cert.validity_to || cert.validityTo || '31st March 2027',
        state: cert.state || 'CHHATTISGARH',
        city: cert.city || 'ASOLA/SURGUJA',
        centerCoordinator: cert.center_coordinator || cert.centerCoordinator || 'Rahul Mishra',
        director: cert.director || 'Mr. Ajay Kumar Gupta',
        companyName: cert.company_name || cert.companyName || 'EduSkillVision',
        regNo: cert.reg_no || cert.regNo || 'U80900CT2023PTC014511',
        website: cert.website || 'eduskillvision.com',
        iso: cert.iso || 'ISO 9001:2015 Certified',
        headOffice: cert.head_office || cert.headOffice || 'Ambikapur, Surguja (C.G.) 497001',
        regionalOffice: cert.regional_office || cert.regionalOffice || 'Bilaspur, Chhattisgarh',
        applicantPhoto: cert.applicant_photo || cert.applicantPhoto || null,
        phone: cert.phone || '+91 91111 37575',
        email: cert.email || 'info@eduskillvision.com',
        qrImage: cert.qr_image || cert.qrImage || null,
        socialLinks: cert.social_links || cert.socialLinks || [],
        status: cert.status || 'Active',
        created_at: cert.created_at,
        updated_at: cert.updated_at,
      }));
      
      setCertificates(mappedData);
    } catch (error) {
      console.error('Error loading certificates:', error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFranchiseUsers();
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // 🔢 GENERATE CERTIFICATE NUMBER
  // ============================================
  const generateCertNumber = () => {
    const count = certificates.length + 1;
    const year = new Date().getFullYear();
    return `ESV/FR/${year}/${String(count).padStart(4, '0')}`;
  };

  // ============================================
  // 🔍 SEARCH & FILTER
  // ============================================
  const filteredFranchises = franchiseUsers.filter(f => {
    const term = franchiseSearchTerm.toLowerCase().trim();
    if (!term) return false;
    return f.applicantName?.toLowerCase().includes(term) ||
      f.franchiseName?.toLowerCase().includes(term) ||
      f.franchiseCode?.toLowerCase().includes(term) ||
      f.mobile?.includes(term) ||
      f.email?.toLowerCase().includes(term) ||
      f.city?.toLowerCase().includes(term);
  });

  const updateDropdownPosition = () => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // ============================================
  // 📥 SELECT FRANCHISE - AUTO FILL
  // ============================================
  const handleSelectFranchise = (franchise) => {
    setSelectedFranchise(franchise);
    setFranchiseSearchTerm(franchise.applicantName);
    setShowFranchiseDropdown(false);
    setActiveTab('select');

    setFormData(prev => ({
      ...prev,
      applicantName: franchise.applicantName || '',
      fatherName: franchise.fatherName || '',
      franchiseName: franchise.franchiseName || '',
      franchiseCode: franchise.franchiseCode || '',
      city: franchise.city || '',
      state: franchise.state || '',
      email: prev.email || 'info@eduskillvision.com',
      phone: prev.phone || '+91 91111 37575',
      applicantPhoto: franchise.photo || null,
      centerCoordinator: prev.centerCoordinator || 'Rahul Mishra',
      director: prev.director || 'Mr. Ajay Kumar Gupta',
      certNo: generateCertNumber(),
      validityFrom: prev.validityFrom || '1st April 2026',
      validityTo: prev.validityTo || '31st March 2027',
      courseName: prev.courseName || '',
      selectedCategory: prev.selectedCategory || '',
      companyName: prev.companyName || 'EduSkillVision',
      headOffice: prev.headOffice || 'Ambikapur, Surguja (C.G.) 497001',
      regionalOffice: prev.regionalOffice || 'Bilaspur, Chhattisgarh',
      website: prev.website || 'eduskillvision.com'
    }));
  };

  // ============================================
  // 📝 HANDLE CHANGE
  // ============================================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, applicantPhoto: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, applicantPhoto: null });
    const input = document.getElementById('franchisePhotoInput');
    if (input) input.value = '';
  };

  // ============================================
  // 🔄 SOCIAL LINKS HANDLERS
  // ============================================
  const handleSocialLinkChange = (index, field, value) => {
    const updated = [...socialLinks];
    updated[index][field] = value;
    setSocialLinks(updated);
  };

  const getSocialIcon = (platform) => {
    const icons = {
      'Facebook': '📘',
      'Instagram': '📷',
      'YouTube': '▶️',
      'LinkedIn': '💼'
    };
    return icons[platform] || '🔗';
  };

  // ============================================
  // 📂 FORM OPEN/CLOSE
  // ============================================
  const openForm = () => {
    setFormData(prev => ({
      ...prev,
      certNo: generateCertNumber(),
      applicantName: '',
      fatherName: '',
      franchiseName: '',
      franchiseCode: '',
      authorizedArea: '',
      applicantPhoto: null,
      selectedCategory: '',
      courseName: '',
      city: '',
      state: '',
      centerCoordinator: prev.centerCoordinator || 'Rahul Mishra',
      director: prev.director || 'Mr. Ajay Kumar Gupta'
    }));
    setQrImage(null);
    setActiveTab('manual');
    setShowForm(true);
    setShowPreview(true);
    setSelectedFranchise(null);
    setFranchiseSearchTerm('');
    setShowFranchiseDropdown(false);
    setTimeout(() => {
      formRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateDropdownPosition();
    }, 100);
  };

  const closeForm = () => {
    setShowForm(false);
    setShowPreview(false);
    setIsEditing(false);
    setEditId(null);
    setShowFranchiseDropdown(false);
  };

  const resetForm = () => {
    setFormData({
      certNo: generateCertNumber(),
      franchiseCode: '',
      applicantName: '',
      fatherName: '',
      franchiseName: '',
      authorizedArea: '',
      selectedCategory: '',
      courseName: '',
      validityFrom: '1st April 2026',
      validityTo: '31st March 2027',
      state: '',
      city: '',
      centerCoordinator: 'Rahul Mishra',
      director: 'Mr. Ajay Kumar Gupta',
      companyName: 'EduSkillVision',
      regNo: 'U80900CT2023PTC014511',
      website: 'eduskillvision.com',
      iso: 'ISO 9001:2015 Certified',
      headOffice: 'Ambikapur, Surguja (C.G.) 497001',
      regionalOffice: 'Bilaspur, Chhattisgarh',
      applicantPhoto: null,
      phone: '+91 91111 37575',
      email: 'info@eduskillvision.com'
    });
    setQrImage(null);
    setIsEditing(false);
    setEditId(null);
    setSelectedFranchise(null);
    setFranchiseSearchTerm('');
    setShowFranchiseDropdown(false);
    setActiveTab('manual');
    const input = document.getElementById('franchisePhotoInput');
    if (input) input.value = '';
  };

  // ============================================
  // 💾 SAVE / EDIT
  // ============================================
  const handleSave = async () => {
    if (!formData.applicantName || !formData.franchiseName || !formData.courseName) {
      alert('⚠️ Please fill all required fields!');
      return;
    }

    const certData = {
      applicant_name: formData.applicantName,
      father_name: formData.fatherName || '',
      franchise_name: formData.franchiseName,
      authorized_area: formData.authorizedArea || '',
      selected_category: formData.selectedCategory || '',
      course_name: formData.courseName,
      validity_from: formData.validityFrom || '1st April 2026',
      validity_to: formData.validityTo || '31st March 2027',
      state: formData.state || 'CHHATTISGARH',
      city: formData.city || 'ASOLA/SURGUJA',
      center_coordinator: formData.centerCoordinator || 'Rahul Mishra',
      director: formData.director || 'Mr. Ajay Kumar Gupta',
      company_name: formData.companyName || 'EduSkillVision',
      reg_no: formData.regNo || 'U80900CT2023PTC014511',
      website: formData.website || 'eduskillvision.com',
      iso: formData.iso || 'ISO 9001:2015 Certified',
      head_office: formData.headOffice || 'Ambikapur, Surguja (C.G.) 497001',
      regional_office: formData.regionalOffice || 'Bilaspur, Chhattisgarh',
      phone: formData.phone || '+91 91111 37575',
      email: formData.email || 'info@eduskillvision.com',
      applicant_photo: formData.applicantPhoto || null,
      qr_image: qrImage || null,
      social_links: socialLinks.filter(link => link.url && link.url.trim() !== ''),
      franchise_code: userType === 'franchise' ? franchiseCode : formData.franchiseCode || '',
      status: 'Active',
    };

    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/franchise-certificates/${editId}/`, certData, apiConfig());
        alert('✅ Certificate Updated Successfully!');
      } else {
        await axios.post(`${API_URL}/franchise-certificates/`, certData, apiConfig());
        alert('✅ Certificate Saved Successfully!');
      }
      await loadCertificates();
      setShowPreview(false);
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving certificate:', error);
      if (error.response?.data) {
        alert(`⚠️ Error: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('⚠️ Error saving certificate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✏️ EDIT
  // ============================================
  const handleEdit = (id) => {
    const cert = certificates.find(c => c.id === id);
    if (cert) {
      setFormData({
        certNo: cert.certNo || '',
        franchiseCode: cert.franchiseCode || '',
        applicantName: cert.applicantName || '',
        fatherName: cert.fatherName || '',
        franchiseName: cert.franchiseName || '',
        authorizedArea: cert.authorizedArea || '',
        selectedCategory: cert.selectedCategory || '',
        courseName: cert.courseName || '',
        validityFrom: cert.validityFrom || '1st April 2026',
        validityTo: cert.validityTo || '31st March 2027',
        state: cert.state || 'CHHATTISGARH',
        city: cert.city || 'ASOLA/SURGUJA',
        centerCoordinator: cert.centerCoordinator || 'Rahul Mishra',
        director: cert.director || 'Mr. Ajay Kumar Gupta',
        companyName: cert.companyName || 'EduSkillVision',
        regNo: cert.regNo || 'U80900CT2023PTC014511',
        website: cert.website || 'eduskillvision.com',
        iso: cert.iso || 'ISO 9001:2015 Certified',
        headOffice: cert.headOffice || 'Ambikapur, Surguja (C.G.) 497001',
        regionalOffice: cert.regionalOffice || 'Bilaspur, Chhattisgarh',
        applicantPhoto: cert.applicantPhoto || null,
        phone: cert.phone || '+91 91111 37575',
        email: cert.email || 'info@eduskillvision.com',
      });
      setQrImage(cert.qrImage || null);
      setSocialLinks(cert.socialLinks || [
        { platform: 'Facebook', url: '', icon: '📘' },
        { platform: 'Instagram', url: '', icon: '📷' },
        { platform: 'YouTube', url: '', icon: '▶️' },
        { platform: 'LinkedIn', url: '', icon: '💼' }
      ]);
      setIsEditing(true);
      setEditId(id);
      setShowForm(true);
      setShowPreview(true);
      setSelectedFranchise(null);
      setFranchiseSearchTerm(cert.applicantName || '');
      setActiveTab(cert.franchiseCode ? 'select' : 'manual');
      setTimeout(() => {
        formRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateDropdownPosition();
      }, 100);
    }
  };

  // ============================================
  // 🗑️ DELETE
  // ============================================
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/franchise-certificates/${id}/`, apiConfig());
        alert('🗑️ Certificate Deleted!');
        await loadCertificates();
      } catch (error) {
        console.error('Error deleting certificate:', error);
        alert('⚠️ Error deleting certificate. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // ============================================
  // ✅ QR CODE UPLOAD
  // ============================================
  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setQrImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeQr = () => {
    setQrImage(null);
    const input = document.getElementById('qrUploadInput');
    if (input) input.value = '';
  };

  // ============================================
  // ✅ GENERATE QR PATTERN
  // ============================================
  const generateQRPattern = () => {
    const qrImageData = qrImage || formData.qrImage || formData.qr_image;
    
    if (qrImageData) {
      return `<img src="${qrImageData}" style="width:100%;height:100%;object-fit:contain;" />`;
    }
    
    const size = 19;
    const grid = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let filled = false;
        if (r < 6 && c < 6) filled = (r < 2 || r > 3 || c < 2 || c > 3) || (r > 2 && r < 4 && c > 2 && c < 4);
        else if (r < 6 && c >= size - 6) filled = (r < 2 || r > 3 || c < size - 5 || c > size - 2) || (r > 2 && r < 4 && c > size - 5 && c < size - 2);
        else if (r >= size - 6 && c < 6) filled = (r < size - 5 || r > size - 2 || c < 2 || c > 3) || (r > size - 5 && r < size - 2 && c > 2 && c < 4);
        else filled = Math.random() > 0.5;
        grid.push(filled);
      }
    }
    return `<div style="width:100%;height:100%;display:grid;grid-template-columns:repeat(${size},1fr);grid-template-rows:repeat(${size},1fr);">
      ${grid.map(f => `<div style="background:${f ? '#1a2a5e' : 'white'};"></div>`).join('')}
    </div>`;
  };

  // ============================================
  // ✅ CERTIFICATE HTML - FIXED (Social Links)
  // ============================================
  const getCertificateHTML = (d) => {
    const hasPhoto = d.applicantPhoto && d.applicantPhoto.length > 100;
    const qrPattern = generateQRPattern();

    const activeSocialLinks = (d.socialLinks || socialLinks).filter(link => link.url && link.url.trim() !== '');

    // ✅ Build social links HTML properly (Fixed broken JSX)
    let socialLinksHTML = '';
    if (activeSocialLinks.length > 0) {
      socialLinksHTML = `<span style="color:rgba(255,255,255,0.15);">|</span>`;
      activeSocialLinks.forEach((link, idx) => {
        socialLinksHTML += `
          <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">
            ${link.icon || getSocialIcon(link.platform)} ${link.platform}
          </span>
          ${idx < activeSocialLinks.length - 1 ? '<span style="color:rgba(255,255,255,0.15);">|</span>' : ''}
        `;
      });
    } else {
      socialLinksHTML = `
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">📷 /eduskillvision</span>
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">f /eduskillvision</span>
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">▶ /EduSkillVision</span>
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">in /eduskillvision</span>
      `;
    }

    return `
    <div style="
      width:850px; height:1150px; 
      background: #ffffff;
      font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
      overflow: hidden;
      box-sizing: border-box;
      padding: 40px 50px 38px;
      position: relative;
      border: 12px solid #1a2a5e;
    ">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:#ffffff;z-index:0;"></div>
      <div style="position:absolute;top:6px;left:6px;right:6px;bottom:6px;border:3px solid #c8a84e;z-index:1;pointer-events:none;"></div>
      <div style="position:absolute;top:16px;left:16px;right:16px;bottom:16px;border:1.5px solid rgba(200,168,78,0.35);z-index:1;pointer-events:none;"></div>

      <div style="position:relative;z-index:4;text-align:center;height:100%;display:flex;flex-direction:column;justify-content:space-between;align-items:center;">

        <div style="width:100%;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding:0 5px;">
            <div style="width:85px;text-align:left;">
              <div style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">
                <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(145deg,#f0d060,#c8a84e);display:inline-flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.12);border:3px solid white;">
                  <span style="font-size:14px;font-weight:900;color:#1a2a5e;letter-spacing:0.5px;line-height:1;text-align:center;">
                    <span style="display:block;font-size:16px;">ESV</span>
                    <span style="display:block;font-size:6px;letter-spacing:1.5px;font-weight:700;">SKILL</span>
                  </span>
                </div>
              </div>
            </div>

            <div style="flex:1;text-align:center;padding:0 10px;">
              <div style="font-family:'Cinzel Decorative','Cinzel',Georgia,serif;font-size:28px;color:#c8a84e;font-weight:900;letter-spacing:3px;text-transform:uppercase;line-height:1.2;">
                ${d.companyName || 'EduSkillVision'}
              </div>
              <div style="font-size:10px;color:#1a2a5e;font-weight:600;letter-spacing:1px;margin-top:3px;font-family:Georgia,serif;font-style:italic;">
                Empowering Skills, Building Futures
              </div>
            </div>

            <div style="width:85px;"></div>
          </div>

          <div style="height:18px;"></div>

          <div style="font-family:'Cinzel Decorative','Cinzel',Georgia,serif;font-size:20px;color:#1a2a5e;font-weight:900;letter-spacing:3px;text-transform:uppercase;line-height:1.2;">
            Certificate of Affiliation
          </div>

          <div style="display:flex;align-items:center;justify-content:center;margin:6px 0 10px;">
            <span style="width:50px;height:1.5px;background:linear-gradient(to right,transparent,#c8a84e,transparent);display:inline-block;"></span>
            <span style="color:#c8a84e;font-size:14px;margin:0 12px;">✦</span>
            <span style="width:50px;height:1.5px;background:linear-gradient(to right,transparent,#c8a84e,transparent);display:inline-block;"></span>
          </div>

          ${hasPhoto ? `
            <div style="width:75px;height:90px;border:3px solid #1a2a5e;overflow:hidden;border-radius:4px;margin:0 auto 6px;background:white;">
              <img src="${d.applicantPhoto}" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          ` : `
            <div style="width:75px;height:90px;border:2px dashed #c8a84e;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#bbb;background:#fafafa;margin:0 auto 6px;">PHOTO</div>
          `}

          <div style="font-family:'Great Vibes','Brush Script MT',cursive;font-size:18px;color:#c8a84e;font-weight:400;margin-bottom:2px;">
            ~ Certified that ~
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:2px 0;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#1a2a5e;font-weight:900;letter-spacing:3px;text-transform:uppercase;border-bottom:2px solid rgba(200,168,78,0.3);padding-bottom:5px;text-align:center;">
              CENTRE MANAGER
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:2px 0 4px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1a2a5e;font-weight:900;letter-spacing:2px;text-transform:uppercase;opacity:0.8;text-align:center;">
              ${d.applicantName || 'Applicant Name'}
            </div>
          </div>

          <div style="font-family:'Great Vibes','Brush Script MT',cursive;font-size:18px;color:#c8a84e;font-weight:400;margin:4px 0 4px;letter-spacing:1px;">
            ~ runs the authorized affiliated ~
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:4px 0;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#1a2a5e;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:6px 30px;border-top:2px solid rgba(200,168,78,0.3);border-bottom:2px solid rgba(200,168,78,0.3);text-align:center;">
              ${d.franchiseName || 'Franchise Name'}
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:3px 0;">
            <div style="font-family:'Cinzel Decorative','Cinzel',Georgia,serif;font-size:14px;color:#c8a84e;font-weight:700;letter-spacing:4px;text-transform:uppercase;background:rgba(200,168,78,0.08);padding:2px 20px;border-radius:20px;">
              (ESV CENTRE)
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:3px 0;">
            <div style="font-family:'Great Vibes','Brush Script MT',cursive;font-size:16px;color:#c8a84e;font-weight:400;">
              of
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:20px 0;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#1a2a5e;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
              ${d.companyName || 'EduSkillVision'}
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:5px 0;">
            <div style="font-family:'Poppins',sans-serif;font-size:13px;color:#1a2a5e;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:6px 25px;border:2px solid #c8a84e;border-radius:25px;background:white;">
              for ${d.courseName || 'Course Name'}
            </div>
          </div>

          <div style="display:flex;justify-content:center;align-items:center;margin:12px auto 0;">
            <div style="text-align:left;padding:8px 30px;background:#f8fafc;border-radius:8px;border:1px solid #eef2f6;min-width:300px;">
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;border-bottom:1px dashed #eef2f6;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">Certificate No.</span>
                <span style="font-weight:600;color:#c8a84e;">${d.certNo || 'ESV/FR/2026/001'}</span>
              </div>
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;border-bottom:1px dashed #eef2f6;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">Franchise Code</span>
                <span style="font-weight:600;color:#c8a84e;">${d.franchiseCode || 'ESV/FRC/001'}</span>
              </div>
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;border-bottom:1px dashed #eef2f6;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">Validity</span>
                <span style="font-weight:600;color:#c8a84e;">${d.validityFrom || '1st April 2026'} To ${d.validityTo || '31st March 2027'}</span>
              </div>
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;border-bottom:1px dashed #eef2f6;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">City/Dist</span>
                <span style="font-weight:600;color:#c8a84e;">${d.city || 'ASOLA/SURGUJA'}</span>
              </div>
              <div style="padding:4px 0;font-size:12px;color:#1a2a5e;display:flex;justify-content:space-between;">
                <span style="font-weight:700;">State</span>
                <span style="font-weight:600;color:#c8a84e;">${d.state || 'CHHATTISGARH'}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="width:100%;">
          <div style="display:flex;align-items:center;justify-content:center;margin:0 0 6px;">
            <span style="width:25px;height:1px;background:#c8a84e;display:inline-block;"></span>
            <span style="color:#c8a84e;font-size:6px;margin:0 4px;">✧</span>
            <span style="width:25px;height:1px;background:#c8a84e;display:inline-block;"></span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;padding:0 10px;max-width:520px;margin:0 auto;">
            
            <div style="text-align:center;width:150px;">
              <div style="width:70px;height:1.5px;background:#1a2a5e;margin:0 auto 6px;"></div>
              <div style="font-size:10px;font-weight:700;color:#1a2a5e;">${d.centerCoordinator || 'Rahul Mishra'}</div>
              <div style="font-size:8px;color:#6b7a8f;">Centre Manager</div>
              <div style="font-size:7px;color:#c8a84e;font-weight:600;margin-top:2px;">✓ Verified</div>
            </div>

            <div style="text-align:center;width:85px;">
              <div style="width:65px;height:65px;margin:0 auto;border:2px solid #c8a84e;border-radius:4px;background:white;display:flex;align-items:center;justify-content:center;padding:3px;">
                ${qrPattern}
              </div>
              <div style="font-size:6px;color:#999;margin-top:1px;letter-spacing:0.5px;text-transform:uppercase;">Scan to Verify</div>
            </div>

            <div style="text-align:center;width:150px;">
              <div style="width:70px;height:1.5px;background:#1a2a5e;margin:0 auto 6px;"></div>
              <div style="font-size:10px;font-weight:700;color:#1a2a5e;">${d.director || 'Mr. Ajay Kumar Gupta'}</div>
              <div style="font-size:8px;color:#6b7a8f;">Director</div>
              <div style="font-size:7px;color:#c8a84e;font-weight:600;margin-top:2px;">✦ Authorized Signatory</div>
            </div>

          </div>

          <div style="text-align:center;margin-top:8px;padding:0 15px;">
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:14px;color:#1a2a5e;font-weight:900;letter-spacing:1px;">
              ${d.companyName || 'EduSkillVision'}
            </div>
            <div style="font-size:9px;color:#6b7a8f;line-height:1.5;font-family:Georgia,serif;font-weight:600;">
              <strong>Head Office :</strong> ${d.headOffice || 'Ambikapur, Surguja (C.G.) 497001'}
            </div>
            <div style="font-size:8px;color:#6b7a8f;line-height:1.4;font-family:Georgia,serif;font-weight:500;">
              <strong>Regional Office :</strong> ${d.regionalOffice || 'Bilaspur, Chhattisgarh'}
            </div>
            <div style="display:inline-block;border:1.5px solid #c8a84e;padding:2px 15px;font-size:8px;font-weight:700;color:#1a2a5e;margin-top:4px;letter-spacing:0.5px;background:#fef9f0;border-radius:3px;">
              📞 ${d.phone || '+91 91111 37575'} | ✉ ${d.email || 'info@eduskillvision.com'}
            </div>
          </div>

          <div style="margin-top:8px;background:#1a2a5e;display:flex;align-items:center;justify-content:center;padding:5px 12px;gap:6px;border-radius:5px;flex-wrap:wrap;border:1.5px solid #c8a84e;width:100%;max-width:700px;margin-left:auto;margin-right:auto;">
            <span style="display:flex;align-items:center;gap:3px;font-size:7px;color:white;font-weight:400;">
              🌐 ${d.website || 'eduskillvision.com'}
            </span>
            ${socialLinksHTML}
          </div>
        </div>
      </div>
    </div>
    `;
  };

  // ============================================
  // 🎨 RENDER
  // ============================================
  if (loading && certificates.length === 0) {
    return <div className="fc-loading">⏳ Loading certificates...</div>;
  }

  return (
    <div className="fc-container">
      <div className="fc-card">
        <div className="fc-header">
          <div className="fc-header-left">
            <span className="fc-icon">🏢</span>
            <div>
              <h1 className="fc-title">Franchise <span>Certificate</span></h1>
              <p className="fc-subtitle">Create professional franchise affiliation certificates</p>
            </div>
          </div>
          <button className="fc-btn-add" onClick={openForm}>➕ New Certificate</button>
        </div>

        {showForm && (
          <div className="fc-form-container" ref={formRef}>
            <div className="fc-form-header">
              <h3>{isEditing ? '✏️ Edit Certificate' : '📝 Create New Certificate'}</h3>
              <button className="fc-btn-close" onClick={closeForm}>✕</button>
            </div>

            <div className="fc-form">
              {/* Tab Container */}
              <div className="fc-tab-container">
                <button 
                  className={`fc-tab-btn ${activeTab === 'manual' ? 'fc-tab-active' : ''}`}
                  onClick={() => { setActiveTab('manual'); setSelectedFranchise(null); setFranchiseSearchTerm(''); }}
                >
                  ✏️ Manual Entry
                </button>
                <button 
                  className={`fc-tab-btn ${activeTab === 'select' ? 'fc-tab-active' : ''}`}
                  onClick={() => setActiveTab('select')}
                >
                  🔍 Select Franchise
                </button>
              </div>

              {activeTab === 'select' && (
                <div className="fc-form-row">
                  <div className="fc-form-group fc-full-width">
                    <label>🔍 Search & Select Franchise User</label>
                    <div className="fc-search-wrapper" ref={dropdownRef}>
                      <div className="fc-search-input-wrapper">
                        <input 
                          ref={searchInputRef} 
                          type="text" 
                          className="fc-search-input"
                          placeholder="Search by applicant name, franchise name, code, city..."
                          value={franchiseSearchTerm}
                          onChange={(e) => { 
                            setFranchiseSearchTerm(e.target.value); 
                            setShowFranchiseDropdown(true); 
                            updateDropdownPosition(); 
                          }}
                          onFocus={() => { 
                            setShowFranchiseDropdown(true); 
                            updateDropdownPosition(); 
                          }}
                        />
                        {selectedFranchise && (
                          <span className="fc-selected-badge">
                            ✅ {selectedFranchise.applicantName}
                            <button className="fc-clear-selection" onClick={() => {
                              setSelectedFranchise(null); 
                              setFranchiseSearchTerm('');
                              setFormData(prev => ({ 
                                ...prev, 
                                applicantName: '', 
                                fatherName: '', 
                                franchiseName: '', 
                                franchiseCode: '',
                                city: '',
                                state: '',
                                applicantPhoto: null 
                              }));
                            }}>✕</button>
                          </span>
                        )}
                      </div>
                      {showFranchiseDropdown && franchiseSearchTerm.length > 0 && (
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
                          padding: '4px 0'
                        }}>
                          {filteredFranchises.length > 0 ? (
                            filteredFranchises.map((f) => (
                              <div 
                                key={f.id} 
                                onMouseDown={() => handleSelectFranchise(f)}
                                style={{ 
                                  padding: '8px 14px', 
                                  cursor: 'pointer', 
                                  borderBottom: '1px solid #f1f5f9' 
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8faff'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <span style={{ 
                                    background: '#fef3c7', 
                                    color: '#92400e', 
                                    padding: '1px 8px', 
                                    borderRadius: '10px', 
                                    fontSize: '9px', 
                                    fontWeight: '600' 
                                  }}>🏢</span>
                                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{f.applicantName || 'N/A'}</span>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>🏪 {f.franchiseName || 'N/A'}</span>
                                </div>
                                <div style={{ 
                                  fontSize: '10px', 
                                  color: '#8e9aac', 
                                  marginTop: '2px' 
                                }}>
                                  📍 {f.city || 'N/A'} | 🆔 {f.franchiseCode || 'N/A'} | 📱 {f.mobile || 'N/A'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                              No franchise users found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedFranchise && (
                      <div style={{ 
                        marginTop: '4px', 
                        padding: '6px 12px', 
                        background: '#f0fdf4', 
                        borderRadius: '5px', 
                        border: '1px solid #bbf7d0', 
                        fontSize: '11px', 
                        color: '#166534' 
                      }}>
                        ✅ <strong>Auto-filled:</strong> 
                        {selectedFranchise.applicantName && <span> 👤 {selectedFranchise.applicantName}</span>}
                        {selectedFranchise.franchiseName && <span> 🏪 {selectedFranchise.franchiseName}</span>}
                        {selectedFranchise.franchiseCode && <span> 🆔 {selectedFranchise.franchiseCode}</span>}
                      </div>
                    )}
                    <div style={{ marginTop: '4px', fontSize: '10px', color: '#94a3b8' }}>
                      💡 Type to search franchise users created from Franchise User Management
                    </div>
                  </div>
                </div>
              )}

              {/* ===== READONLY FIELDS ===== */}
              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>📜 Certificate No. <span className="fc-required">*</span></label>
                  <input 
                    name="certNo" 
                    value={formData.certNo} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="fc-form-group">
                  <label>🆔 Franchise Code <span className="fc-required">*</span></label>
                  <input 
                    name="franchiseCode" 
                    value={formData.franchiseCode} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    placeholder="Auto-filled from franchise"
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>👤 Applicant / Centre Manager <span className="fc-required">*</span></label>
                  <input 
                    name="applicantName" 
                    value={formData.applicantName} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    placeholder="Auto-filled from franchise"
                  />
                </div>
                <div className="fc-form-group">
                  <label>👪 Father's Name</label>
                  <input 
                    name="fatherName" 
                    value={formData.fatherName} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    placeholder="Auto-filled from franchise"
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>🏪 Franchise Name <span className="fc-required">*</span></label>
                  <input 
                    name="franchiseName" 
                    value={formData.franchiseName} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    placeholder="Auto-filled from franchise"
                  />
                </div>
                <div className="fc-form-group">
                  <label>📌 City/District <span className="fc-required">*</span></label>
                  <input 
                    name="city" 
                    value={formData.city} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    placeholder="Auto-filled from franchise"
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>🗺️ State <span className="fc-required">*</span></label>
                  <input 
                    name="state" 
                    value={formData.state} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    placeholder="Auto-filled from franchise"
                  />
                </div>
                <div className="fc-form-group">
                  <label>📧 Email</label>
                  <input 
                    name="email" 
                    value={formData.email} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    placeholder="Auto-filled from franchise"
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>📱 Phone</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    readOnly 
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    placeholder="Auto-filled from franchise"
                  />
                </div>
                <div className="fc-form-group">
                  <label>👔 Centre Coordinator (ESV)</label>
                  <input 
                    name="centerCoordinator" 
                    value={formData.centerCoordinator} 
                    onChange={handleChange}
                    placeholder="ESV Centre Coordinator"
                  />
                </div>
              </div>

              {/* ===== ADMIN INPUT FIELDS ===== */}
              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>📚 Category</label>
                  <input 
                    name="selectedCategory" 
                    value={formData.selectedCategory} 
                    onChange={handleChange} 
                    placeholder="e.g. IT, Vocational"
                  />
                </div>
                <div className="fc-form-group">
                  <label>🎯 Course Name <span className="fc-required">*</span></label>
                  <input 
                    name="courseName" 
                    value={formData.courseName} 
                    onChange={handleChange} 
                    placeholder="e.g. Web Development"
                    required
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>📅 Validity From</label>
                  <input 
                    name="validityFrom" 
                    value={formData.validityFrom} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="fc-form-group">
                  <label>📅 Validity To</label>
                  <input 
                    name="validityTo" 
                    value={formData.validityTo} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>🏢 Company Name</label>
                  <input 
                    name="companyName" 
                    value={formData.companyName} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="fc-form-group">
                  <label>👤 Director / CEO (ESV)</label>
                  <input 
                    name="director" 
                    value={formData.director} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>📧 Contact Email</label>
                  <input 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="fc-form-group">
                  <label>📞 Contact Phone</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group">
                  <label>🌐 Website</label>
                  <input 
                    name="website" 
                    value={formData.website} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="fc-form-group">
                  <label>🏢 Head Office Address</label>
                  <input 
                    name="headOffice" 
                    value={formData.headOffice} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="fc-form-row">
                <div className="fc-form-group fc-full-width">
                  <label>🏢 Regional Office Address</label>
                  <input 
                    name="regionalOffice" 
                    value={formData.regionalOffice} 
                    onChange={handleChange} 
                    placeholder="e.g. Bilaspur, Chhattisgarh"
                  />
                </div>
              </div>

              {/* ===== SOCIAL LINKS ===== */}
              <div className="fc-form-row">
                <div className="fc-form-group fc-full-width">
                  <label>🔗 Social Links (Optional - up to 4)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {socialLinks.map((link, index) => (
                      <div key={index} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px' }}>{link.icon || getSocialIcon(link.platform)}</span>
                        <input 
                          type="text" 
                          placeholder={`${link.platform} URL`}
                          value={link.url}
                          onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                          style={{ 
                            flex: 1, 
                            padding: '4px 8px',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: '10px',
                            height: '28px'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <small style={{ color: '#94a3b8', fontSize: '9px', marginTop: '3px' }}>
                    💡 Only links with URLs will appear on the certificate
                  </small>
                </div>
              </div>

              {/* ===== QR CODE UPLOAD ===== */}
              <div className="fc-form-row">
                <div className="fc-form-group fc-full-width">
                  <label>📱 QR Code (Upload custom QR image)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      border: '2px dashed #d1d5db', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: '#fafafa',
                      overflow: 'hidden'
                    }}>
                      {qrImage ? (
                        <img src={qrImage} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '10px', textAlign: 'center' }}>Upload QR</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <input 
                        type="file" 
                        id="qrUploadInput" 
                        accept="image/*" 
                        onChange={handleQrUpload} 
                        style={{ display: 'none' }} 
                      />
                      <button 
                        className="fc-btn-upload" 
                        onClick={() => document.getElementById('qrUploadInput')?.click()} 
                        type="button"
                      >
                        📤 Choose QR Image
                      </button>
                      {qrImage && (
                        <button 
                          className="fc-btn-remove-photo" 
                          onClick={removeQr} 
                          type="button"
                          style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            border: 'none', 
                            padding: '2px 12px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            height: '24px'
                          }}
                        >
                          ✕ Remove
                        </button>
                      )}
                      <small style={{ color: '#94a3b8', fontSize: '8px' }}>
                        Recommended: Square image (QR code)
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== PHOTO UPLOAD ===== */}
              <div className="fc-form-row">
                <div className="fc-form-group fc-full-width">
                  <label>📸 Applicant Photo</label>
                  <div className="fc-photo-wrapper">
                    <div className="fc-photo-preview">
                      {formData.applicantPhoto ? (
                        <div className="fc-photo-container">
                          <img src={formData.applicantPhoto} alt="Applicant" className="fc-photo-img" />
                          <button className="fc-btn-remove-photo" onClick={removePhoto} type="button">✕</button>
                        </div>
                      ) : (
                        <div className="fc-photo-placeholder">
                          <span>📷</span>
                          <p>Upload Photo</p>
                        </div>
                      )}
                    </div>
                    <div className="fc-photo-upload-btn">
                      <input 
                        type="file" 
                        id="franchisePhotoInput" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        style={{ display: 'none' }} 
                      />
                      <button 
                        className="fc-btn-upload" 
                        onClick={() => document.getElementById('franchisePhotoInput')?.click()} 
                        type="button"
                      >
                        📤 Choose Photo
                      </button>
                      {formData.applicantPhoto && (
                        <span className="fc-photo-status">✅ Uploaded</span>
                      )}
                      <span style={{ fontSize: '9px', color: '#8e9aac' }}>
                        Recommended: Square image (passport size)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== FORM ACTIONS - NO DOWNLOAD BUTTON ===== */}
              <div className="fc-form-actions">
                <button className="fc-btn-preview" onClick={() => setShowPreview(!showPreview)}>
                  👁️ {showPreview ? 'Hide' : 'Show'} Preview
                </button>
                <button className="fc-btn-save" onClick={handleSave} disabled={loading}>
                  {loading ? '⏳ Saving...' : `💾 ${isEditing ? 'Update' : 'Save'}`}
                </button>
                <button className="fc-btn-cancel" onClick={closeForm}>
                  ✕ Cancel
                </button>
              </div>
            </div>

            {showPreview && (
              <div className="fc-preview-section">
                <div className="fc-preview-wrapper" dangerouslySetInnerHTML={{ __html: getCertificateHTML(formData) }} />
              </div>
            )}
          </div>
        )}

        {/* ===== CERTIFICATE HISTORY ===== */}
        <div className="fc-list">
          <div className="fc-list-header">
            <h3>📋 Certificate History <span className="fc-count">{certificates.length}</span></h3>
            {certificates.length > 0 && (
              <span className="fc-list-sub">Total {certificates.length} certificates</span>
            )}
          </div>
          {certificates.length === 0 ? (
            <div className="fc-empty">
              <span>🏢</span>
              <h4>No Certificates Yet</h4>
              <p>Click on <strong>"➕ New Certificate"</strong> to create your first franchise certificate!</p>
            </div>
          ) : (
            <div className="fc-table-wrap">
              <table className="fc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Certificate No.</th>
                    <th>Applicant</th>
                    <th>Franchise</th>
                    <th>Category</th>
                    <th>Course</th>
                    <th>Franchise Code</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert, index) => (
                    <tr key={cert.id || index}>
                      <td>{index + 1}</td>
                      <td><span className="fc-badge">{cert.certNo}</span></td>
                      <td>
                        <div className="fc-user-cell">
                          {cert.applicantPhoto && (
                            <img src={cert.applicantPhoto} alt="" className="fc-table-photo" />
                          )}
                          <strong>{cert.applicantName}</strong>
                        </div>
                      </td>
                      <td>{cert.franchiseName}</td>
                      <td>{cert.selectedCategory || '-'}</td>
                      <td><strong>{cert.courseName || '-'}</strong></td>
                      <td><span className="fc-badge">{cert.franchiseCode}</span></td>
                      <td>
                        {/* ===== ONLY EDIT & DELETE BUTTONS ===== */}
                        <div className="fc-actions">
                          <button className="fc-btn-edit" onClick={() => handleEdit(cert.id)} title="Edit">✏️</button>
                          <button className="fc-btn-delete" onClick={() => handleDelete(cert.id)} title="Delete">🗑️</button>
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

export default FranchiseCertificate;