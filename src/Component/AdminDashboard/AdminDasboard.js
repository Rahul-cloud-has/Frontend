import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidbar';
import './AdminDasboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('admin');
  const [franchiseCode, setFranchiseCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check user type
    const userTypeStorage = localStorage.getItem('userType');
    const franchiseUser = JSON.parse(localStorage.getItem('franchiseUser'));
    const isAdmin = localStorage.getItem('isAuthenticated') === 'true';

    if (franchiseUser || userTypeStorage === 'franchise') {
      setUserType('franchise');
      setFranchiseCode(franchiseUser?.franchise_code || '');
      // Store franchise code for all components
      localStorage.setItem('currentFranchiseCode', franchiseUser?.franchise_code || '');
      localStorage.setItem('currentUserType', 'franchise');
    } else if (isAdmin || userTypeStorage === 'admin') {
      setUserType('admin');
      setFranchiseCode('');
      localStorage.setItem('currentFranchiseCode', '');
      localStorage.setItem('currentUserType', 'admin');
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar />
      <div className="admin-main-content">
        <Outlet context={{ userType, franchiseCode }} />
      </div>
    </div>
  );
};

export default AdminDashboard;