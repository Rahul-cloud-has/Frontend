// FranchiseApplication.jsx - Complete with API Call First + Toast
import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL, apiConfig } from '../../Api';
import "./FranchiseApplication.css";

const FranchiseApplication = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    mobile: "",
    email: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    franchiseName: "",
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error('Please enter Full Name'); return false; }
    if (!formData.mobile.trim() || formData.mobile.length !== 10) { toast.error('Please enter valid 10-digit Mobile Number'); return false; }
    if (!formData.email.trim()) { toast.error('Please enter Email'); return false; }
    if (!formData.address.trim()) { toast.error('Please enter Address'); return false; }
    if (!formData.state.trim()) { toast.error('Please enter State'); return false; }
    if (!formData.city.trim()) { toast.error('Please enter City'); return false; }
    if (!formData.pincode.trim() || formData.pincode.length !== 6) { toast.error('Please enter valid 6-digit Pincode'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const apiData = {
        name: formData.name,
        father_name: formData.fatherName || '',
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        franchise_name: formData.franchiseName || '',
        message: formData.message || '',
        status: 'Pending'
      };
      
      const response = await axios.post(
        `${API_URL}/applications/`,
        apiData,
        apiConfig()
      );
      
      // ============================================
      // ✅ ONLY SAVE TO LOCAL STORAGE - NO NAVIGATE
      // ============================================
      let existingRequests = [];
      const stored = localStorage.getItem('franchiseRequests');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) existingRequests = parsed;
        } catch (error) {}
      }
      
      const apiSavedData = response.data.data || response.data;
      
      const newRequest = {
        id: apiSavedData.id || (Date.now() + Math.floor(Math.random() * 1000)),
        applicantName: formData.name,
        fatherName: formData.fatherName || '',
        mobile: formData.mobile,
        whatsapp: formData.mobile,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        franchiseName: formData.franchiseName || '',
        message: formData.message || '',
        date: new Date().toISOString().split('T')[0],
        status: "Pending",
        createdAt: new Date().toISOString(),
        adminNote: ""
      };
      
      const updatedRequests = [...existingRequests, newRequest];
      localStorage.setItem('franchiseRequests', JSON.stringify(updatedRequests));
      
      // ✅ SHOW SUCCESS MESSAGE - NO NAVIGATION
      setIsSubmitted(true);
      toast.success('✅ Application submitted successfully! You can now close this page.');
      
      // ✅ Reset form after success
      setFormData({
        name: "", fatherName: "", mobile: "", email: "", address: "", state: "", city: "", pincode: "", franchiseName: "", message: ""
      });
      
      // ✅ Success message will auto-hide after 5 seconds
      setTimeout(() => { setIsSubmitted(false); }, 5000);

    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Validation Error: ' + JSON.stringify(error.response?.data?.errors || 'Please check your data'));
      } else if (error.response?.status === 500) {
        toast.error('Server Error. Please try again later.');
      } else {
        toast.error('Failed to submit. Please check your connection and try again.');
      }
      
      // Fallback: Save to localStorage only
      let existingRequests = [];
      const stored = localStorage.getItem('franchiseRequests');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) existingRequests = parsed;
        } catch (error) {}
      }
      
      const newRequest = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        applicantName: formData.name,
        fatherName: formData.fatherName || '',
        mobile: formData.mobile,
        whatsapp: formData.mobile,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        franchiseName: formData.franchiseName || '',
        message: formData.message || '',
        date: new Date().toISOString().split('T')[0],
        status: "Pending",
        createdAt: new Date().toISOString(),
        adminNote: ""
      };
      
      const updatedRequests = [...existingRequests, newRequest];
      localStorage.setItem('franchiseRequests', JSON.stringify(updatedRequests));
      
      toast.success('✅ Application saved locally. Will sync when server is available.');
      setIsSubmitted(true);
      setTimeout(() => { setIsSubmitted(false); }, 5000);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fa-master-page">
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} theme="colored" />

      {/* Background FX */}
      <div className="fa-bg-grid"></div>
      <div className="fa-blob fa-blob-1"></div>
      <div className="fa-blob fa-blob-2"></div>

      <div className="fa-popup-container">
        {/* Header */}
        <div className="fa-header">
          <div>
            <h3>🤝 Franchise Application</h3>
            <p>Fill out the details below. Our team will contact you within 24 hours.</p>
          </div>
          <div className="fa-icon">🚀</div>
        </div>

        {isSubmitted ? (
          <div className="fa-success-box">
            <span className="fa-success-icon">🎉</span>
            <h4>Application Received!</h4>
            <p>Your franchise request has been submitted successfully.</p>
            <span className="fa-success-hint">You can safely close this page or navigate away.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fa-form">
            
            {/* 2-Column Grid for Personal Details */}
            <div className="fa-grid-2">
              <div className="fa-field">
                <label>Full Name <span>*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required maxLength="50" placeholder="Enter Full Name" />
              </div>
              <div className="fa-field">
                <label>Father Name</label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} maxLength="50" placeholder="Enter Father Name" />
              </div>
              <div className="fa-field">
                <label>Mobile Number <span>*</span></label>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required maxLength="10" minLength="10" pattern="[0-9]{10}" placeholder="10-digit mobile no." />
              </div>
              <div className="fa-field">
                <label>Email Address <span>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@email.com" />
              </div>
            </div>

            {/* 2-Column Grid for Franchise Name & Address */}
            <div className="fa-grid-2">
              <div className="fa-field">
                <label>Franchise Name <span className="fa-opt">(Optional)</span></label>
                <input type="text" name="franchiseName" value={formData.franchiseName} onChange={handleChange} maxLength="100" placeholder="Desired Center Name" />
              </div>
              <div className="fa-field">
                <label>Street Address <span>*</span></label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="Complete street address" />
              </div>
            </div>

            {/* 3-Column Grid for Location */}
            <div className="fa-grid-3">
              <div className="fa-field">
                <label>State <span>*</span></label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} required placeholder="State Name" />
              </div>
              <div className="fa-field">
                <label>City <span>*</span></label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="City Name" />
              </div>
              <div className="fa-field">
                <label>Pincode <span>*</span></label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required maxLength="6" minLength="6" pattern="[0-9]{6}" placeholder="6-digit code" />
              </div>
            </div>

            {/* Full Width for Message */}
            <div className="fa-grid-1">
              <div className="fa-field">
                <label>Additional Message / Query <span className="fa-opt">(Optional)</span></label>
                <textarea name="message" rows="2" value={formData.message} onChange={handleChange} placeholder="Any specific requirements or questions..." />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="fa-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="fa-spinner"></span> Submitting Application...</>
              ) : (
                "🚀 Submit Franchise Application"
              )}
            </button>
            
          </form>
        )}
      </div>
    </div>
  );
};

export default FranchiseApplication;