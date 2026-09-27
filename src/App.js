// App.js - Fixed with Proper Authentication Check
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./Component/Pages/Header";
import Home from "./Component/Pages/Home";
import Contact from "./Component/Pages/Contact";
import Footer from "./Component/Pages/Footer";
import Login from "./Component/Pages/Login";
import About from "./Component/Pages/About";
import Courses from "./Component/Pages/Courses";
import FranchiseeRequest from './Component/Pages/Franchisee';
import FranchiseApplication from './Component/Pages/FranchiseApplication';

// ===== ADMIN DASHBOARD LAYOUT =====
import AdminDashboard from "./Component/AdminDashboard/AdminDasboard";

// ===== ADMIN COMPONENTS =====
import AdminDashboardOverview from "./Component/AdminDashboard/DashboardOverview";
import AddCourse from "./Component/AdminDashboard/AddCourse";
import AddJob from "./Component/AdminDashboard/AddJob";
import CourseList from "./Component/AdminDashboard/CourseList";
import Payments from "./Component/AdminDashboard/Pyments/Pyments";
import PaymentsReport from "./Component/AdminDashboard/Pyments/PymentsReports";
import StudentAndVocationalPayment from "./Component/AdminDashboard/Pyments/StudentAndVocationalPayment";
import FranchiseRequestList from "./Component/AdminDashboard/FranchiseManage/FranchiseRequestList";
import FranchiseRequestReport from "./Component/AdminDashboard/FranchiseManage/FranchiseRequestReport";
import GenerateFranchise from "./Component/AdminDashboard/FranchiseManage/GenerateFranchise";
import GenerateFranchiseReport from "./Component/AdminDashboard/FranchiseManage/GenerateFranchiseReport";
import FranchiseUserManagement from "./Component/AdminDashboard/FranchiseManage/FranchiseUserManagement";
import AddimissionForm from "./Component/AdminDashboard/Students/AddimissionForm";
import StudentReport from "./Component/AdminDashboard/Students/StudentReport";
import VocationalForm from "./Component/AdminDashboard/Vocational/VocationalForm";
import VocationalReport from "./Component/AdminDashboard/Vocational/VocationalReport";
import Certificate from "./Component/AdminDashboard/Certificate";
import CertificateReport from "./Component/AdminDashboard/CertificateReport";
import FranchiseCertificate from "./Component/AdminDashboard/FranchiseCertificate";
import FranchiseCertificateReport from "./Component/AdminDashboard/FranchiseCertificateReport";
import JobReport from './Component/AdminDashboard/JobReports';
import FranchiseChangePassword from './Component/AdminDashboard/FranchiseManage/FranchiseChangePassword';

// ✅ NEW — Course & Enquiry Manager (Django API)
import AdminCourses from "./Component/AdminDashboard/AdminCourses";

// ============================================
// 💰 NEW — WALLET SYSTEM IMPORTS
// ============================================
import WalletDashboard from "./Component/AdminDashboard/WalletDashboard";
import WalletManagement from "./Component/AdminDashboard/WalletManagement";

import './App.css';

// ============================================
// ✅ PROTECTED ROUTE
// ============================================
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const franchiseUser = localStorage.getItem('franchiseUser');

  if (isAuthenticated || franchiseUser) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

// ============================================
// ✅ LAYOUT
// ============================================
const Layout = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/admin-dashboard');
  return (
    <>
      {!isDashboard && <Header />}
      {children}
      {!isDashboard && <Footer />}
    </>
  );
};

// ============================================
// ✅ MAIN APP
// ============================================
function App() {
  return (
    <Router>
      <Routes>

        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/courses" element={<Layout><Courses /></Layout>} />
        <Route path="/franchisee" element={<Layout><FranchiseeRequest /></Layout>} />
        <Route path="/franchise-apply" element={<Layout><FranchiseApplication /></Layout>} />

        {/* ===== LOGIN ROUTES ===== */}
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/login-admin" element={<Layout><Login /></Layout>} />
        <Route path="/login-franchise" element={<Layout><Login /></Layout>} />

        {/* ========================================
            ADMIN DASHBOARD - Protected
            ======================================== */}
        <Route
          path="/admin-dashboard/*"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        >
          {/* Overview */}
          <Route index element={<AdminDashboardOverview />} />
          <Route path="overview" element={<AdminDashboardOverview />} />

          {/* ✅ NEW — Course & Enquiry Manager */}
          <Route path="course-manager" element={<AdminCourses />} />

          {/* Franchise */}
          <Route path="franchisee/generate" element={<GenerateFranchise />} />
          <Route path="franchisee/generate-report" element={<GenerateFranchiseReport />} />
          <Route path="franchisee/list" element={<FranchiseRequestList />} />
          <Route path="franchisee/request-report" element={<FranchiseRequestReport />} />
          <Route path="franchisee/user-management" element={<FranchiseUserManagement />} />

          {/* Courses (existing) */}
          <Route path="courses/add" element={<AddCourse />} />
          <Route path="courses/list" element={<CourseList />} />

          {/* Jobs */}
          <Route path="jobs/add" element={<AddJob />} />
          <Route path="jobs/report" element={<JobReport />} />

          {/* Payments */}
          <Route path="payments" element={<Payments />} />
          <Route path="payments/report" element={<PaymentsReport />} />
          <Route path="student-vocational-payments" element={<StudentAndVocationalPayment />} />

          {/* Students */}
          <Route path="students/admission" element={<AddimissionForm />} />
          <Route path="students/report" element={<StudentReport />} />

          {/* Vocational */}
          <Route path="vocational" element={<VocationalForm />} />
          <Route path="vocational/report" element={<VocationalReport />} />

          {/* Certificates */}
          <Route path="certificates" element={<Certificate />} />
          <Route path="certificates-report" element={<CertificateReport />} />
          <Route path="franchise-certificate" element={<FranchiseCertificate />} />
          <Route path="franchise-certificate-report" element={<FranchiseCertificateReport />} />

          {/* ============================================ */}
          {/* 💰 WALLET ROUTES - NEW                      */}
          {/* ============================================ */}

          {/* Franchise Wallet Pages */}
          <Route path="wallet" element={<WalletDashboard />} />
          <Route path="wallet/packages" element={<WalletDashboard />} />
          <Route path="wallet/transactions" element={<WalletDashboard />} />

          {/* Admin Wallet Pages */}
          <Route path="wallet/management" element={<WalletManagement />} />
          <Route path="wallet/packages-manage" element={<WalletManagement />} />
          <Route path="wallet/all-transactions" element={<WalletManagement />} />
          <Route path="wallet/assign" element={<WalletManagement />} />

          {/* ============================================ */}
          {/* 💰 WALLET ROUTES END                        */}
          {/* ============================================ */}

          {/* Settings */}
          <Route path="change-password" element={<FranchiseChangePassword />} />
          <Route path="reports" element={<AdminDashboardOverview />} />

          {/* Fallback */}
          <Route path="*" element={<AdminDashboardOverview />} />
        </Route>

        {/* ===== CATCH ALL ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;