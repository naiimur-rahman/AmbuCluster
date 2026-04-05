import React, { useState } from 'react';
import Login from './components/Login';
import PatientDashboard from './components/PatientDashboard';
import HospitalDashboard from './components/HospitalDashboard';
import DriverDashboard from './components/DriverDashboard';
import { LogOut } from 'lucide-react';

function App() {
  const [userState, setUserState] = useState(null);

  const handleLogout = () => {
    setUserState(null);
  };

  if (!userState) {
    return <Login onLogin={setUserState} />;
  }

  const renderDashboard = () => {
    switch (userState.user.role) {
      case 'patient':
        return <PatientDashboard user={userState.user} profile={userState.profile} />;
      case 'hospital':
        return <HospitalDashboard hospital={userState.hospital} />;
      case 'driver':
        return <DriverDashboard ambulance={userState.ambulance} />;
      default:
        return <div>Unknown Role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="font-bold text-xl text-blue-600 flex items-center gap-2">
          <span>🚑</span> AMS Demo
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm font-medium">Logged in as {userState.user.name} ({userState.user.role})</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <main className="py-6">
        {renderDashboard()}
      </main>
    </div>
  );
}

export default App;
