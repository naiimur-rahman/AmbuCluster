import React, { useState } from 'react';
import Login from './components/Login';
import PatientDashboard from './components/PatientDashboard';
import HospitalDashboard from './components/HospitalDashboard';
import DriverDashboard from './components/DriverDashboard';
import SysAdminDashboard from './components/SysAdminDashboard';
import { LogOut, Activity } from 'lucide-react';

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
      case 'sysadmin':
        return <SysAdminDashboard />;
      default:
        return <div>Unknown Role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      <nav className="bg-white shadow-sm border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-extrabold text-2xl text-emerald-700 flex items-center gap-2 tracking-tight">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
          AmbuCluster
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-gray-900 font-bold text-sm">{userState.user.name}</span>
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">{userState.user.role}</span>
          </div>
          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-rose-600 transition-colors bg-gray-50 hover:bg-rose-50 px-4 py-2 rounded-lg border border-gray-100 hover:border-rose-100"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="py-8 animate-fade-in-up">
        {renderDashboard()}
      </main>
    </div>
  );
}

export default App;
