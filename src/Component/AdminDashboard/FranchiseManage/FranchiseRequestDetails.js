// FranchiseManage/FranchiseRequestDetails.jsx - Updated with API Integration
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, apiConfig } from '../../../Api'
import './FranchiseRequestDetails.css';

const FranchiseRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ===== LOAD DATA FROM API =====
  const loadData = async () => {
    setLoading(true);
    try {
      // API से Data लाएं
      const response = await fetch(`${API_URL}/franchise-requests/${id}/`, {
        method: 'GET',
        ...apiConfig(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch request');
      }
      
      const data = await response.json();
      
      // Data को Frontend के Format में Map करें
      const mappedData = {
        id: data.id,
        applicantName: data.applicant_name || data.applicantName || '',
        fatherName: data.father_name || data.fatherName || '',
        mobile: data.mobile || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        franchiseName: data.franchise_name || data.franchiseName || '',
        message: data.message || '',
        status: data.status || 'Pending',
        date: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        adminNote: data.admin_note || data.adminNote || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      setRequest(mappedData);
      setAdminNote(mappedData.adminNote || '');
      
    } catch (error) {
      console.error('Error loading request:', error);
      // अगर API Fail हो तो LocalStorage से Load करें (Backup)
      loadFromLocalStorage();
    }
    setLoading(false);
  };

  // ===== BACKUP: LocalStorage से Load करें =====
  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('franchiseRequests');
    if (stored) {
      const allRequests = JSON.parse(stored);
      const found = allRequests.find(req => req.id === Number(id) || req.id === id);
      if (found) {
        setRequest(found);
        setAdminNote(found.adminNote || '');
      }
    }
  };

  // ===== UPDATE REQUEST STATUS =====
  const updateRequestStatus = async (status) => {
    try {
      // API को Update भेजें
      const response = await fetch(`${API_URL}/franchise-requests/${id}/`, {
        method: 'PUT',
        ...apiConfig(),
        body: JSON.stringify({
          status: status,
          admin_note: adminNote || '',
          ...request
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      // Local State Update करें
      const updatedRequest = {
        ...request,
        status: status,
        adminNote: adminNote || request.adminNote,
        [`${status.toLowerCase()}At`]: new Date().toISOString()
      };
      setRequest(updatedRequest);
      
      // LocalStorage भी Update करें (Backup के लिए)
      updateLocalStorage(status);
      
      return true;
      
    } catch (error) {
      console.error('Error updating status:', error);
      // अगर API Fail हो तो LocalStorage Update करें
      updateLocalStorage(status);
      return true;
    }
  };

  // ===== BACKUP: LocalStorage Update =====
  const updateLocalStorage = (status) => {
    const stored = localStorage.getItem('franchiseRequests');
    if (stored) {
      const allRequests = JSON.parse(stored);
      const updated = allRequests.map(req =>
        req.id === Number(id) || req.id === id ? { 
          ...req, 
          status: status, 
          adminNote: adminNote || req.adminNote,
          [`${status.toLowerCase()}At`]: new Date().toISOString() 
        } : req
      );
      localStorage.setItem('franchiseRequests', JSON.stringify(updated));
    }
  };

  const handleApprove = async () => {
    if (!adminNote.trim()) {
      if (!window.confirm('No admin notes added. Continue with approval?')) {
        return;
      }
    }
    await updateRequestStatus('Approved');
    alert('✅ Request approved successfully!');
    navigate('/admin-dashboard/franchisee/list');
  };

  const handleReject = async () => {
    if (window.confirm('Are you sure you want to reject this request?')) {
      await updateRequestStatus('Rejected');
      alert('❌ Request rejected!');
      navigate('/admin-dashboard/franchisee/list');
    }
  };

  const handleBack = () => {
    navigate('/admin-dashboard/franchisee/list');
  };

  if (loading) {
    return <div className="frd-loading-spinner">Loading...</div>;
  }

  if (!request) {
    return (
      <div className="frd-not-found">
        <div className="frd-not-found-content">
          <h2>🔍 Request Not Found</h2>
          <p>The franchise request with ID #{id} does not exist.</p>
          <button className="frd-back-btn" onClick={handleBack}>
            ← Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="frd-container">
      {/* Header */}
      <div className="frd-header">
        <div className="frd-header-left">
          <button className="frd-back-btn" onClick={handleBack}>
            ← Back
          </button>
          <div>
            <h1>Franchise Request Details</h1>
            <div className="frd-header-meta">
              <span className="frd-request-id">Request ID: #{request.id}</span>
              <span className="frd-request-date">Applied: {request.date}</span>
              <span className={`frd-status-badge frd-${request.status?.toLowerCase() || 'pending'}`}>
                {request.status || 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="frd-content">
        {/* Applicant Information */}
        <div className="frd-section">
          <h3 className="frd-section-title">👤 Applicant Information</h3>
          <div className="frd-info-grid">
            <div className="frd-info-item"><label>Full Name</label><span>{request.applicantName || 'N/A'}</span></div>
            <div className="frd-info-item"><label>Father Name</label><span>{request.fatherName || 'N/A'}</span></div>
            <div className="frd-info-item"><label>Mobile Number</label><span>{request.mobile || 'N/A'}</span></div>
            <div className="frd-info-item"><label>Email</label><span>{request.email || 'N/A'}</span></div>
            <div className="frd-info-item"><label>Address</label><span>{request.address || 'N/A'}</span></div>
            <div className="frd-info-item"><label>City</label><span>{request.city || 'N/A'}</span></div>
            <div className="frd-info-item"><label>State</label><span>{request.state || 'N/A'}</span></div>
            <div className="frd-info-item"><label>Pincode</label><span>{request.pincode || 'N/A'}</span></div>
          </div>
        </div>

        {/* Franchise Details */}
        <div className="frd-section">
          <h3 className="frd-section-title">🏪 Franchise Details</h3>
          <div className="frd-info-grid">
            <div className="frd-info-item" style={{ gridColumn: '1 / -1' }}>
              <label>Franchise Name</label>
              <span>{request.franchiseName || '—'}</span>
              {!request.franchiseName && (
                <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px' }}>
                  (Not provided)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {request.message && (
          <div className="frd-section">
            <h3 className="frd-section-title">📝 Message</h3>
            <p className="frd-message-text">{request.message}</p>
          </div>
        )}

        {/* Admin Notes */}
        <div className="frd-section">
          <h3 className="frd-section-title">📝 Admin Notes</h3>
          <textarea
            className="frd-admin-notes"
            rows="4"
            placeholder="Write your remarks here..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="frd-action-buttons">
        <button className="frd-action-btn frd-secondary" onClick={handleBack}>
          ← Back
        </button>
        {request.status === 'Pending' && (
          <>
            <button className="frd-action-btn frd-success" onClick={handleApprove}>
              ✅ Approve
            </button>
            <button className="frd-action-btn frd-danger" onClick={handleReject}>
              ❌ Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FranchiseRequestDetails;