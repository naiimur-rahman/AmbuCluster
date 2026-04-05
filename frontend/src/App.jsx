import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import DashboardLayout from './layouts/DashboardLayout';

import PatientDashboard from './components/PatientDashboard';
import HospitalDashboard from './components/HospitalDashboard';
import DriverDashboard from './components/DriverDashboard';
import SysAdminDashboard from './components/SysAdminDashboard';

// A wrapper to render the correct dashboard based on role
const RoleBasedDashboard = () => {
  const { userState } = useAuth();

  if (!userState) return <Navigate to="/login" />;

  switch (userState.user.role) {
    case 'Patient':
    case 'patient':
      return <PatientDashboard user={userState.user} profile={userState.profile} />;
    case 'Hospital':
    case 'hospital':
      return <HospitalDashboard hospital={userState.hospital} />;
    case 'Driver':
    case 'driver':
      return <DriverDashboard ambulance={userState.ambulance} />;
    case 'Admin':
    case 'sysadmin':
      return <SysAdminDashboard />;
    default:
      return <div className="p-8 text-center text-red-500">Error: Unknown User Role</div>;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RoleBasedDashboard />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
