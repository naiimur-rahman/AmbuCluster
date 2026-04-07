import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PatientDashboard from './PatientDashboard';
import AdminDashboard from './AdminDashboard';
import HospitalDashboard from './HospitalDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <header className="bg-white shadow-sm p-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AmbuCluster Portals</h1>
            <nav className="flex gap-4">
              <Link to="/patient" className="text-blue-600 font-medium hover:underline">Patient</Link>
              <Link to="/hospital" className="text-teal-600 font-medium hover:underline">Hospital</Link>
              <Link to="/admin" className="text-indigo-600 font-medium hover:underline">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Welcome to AmbuCluster</h2>
                <p className="text-slate-600 max-w-lg mb-8">Select a portal above to view the respective dashboard.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                   <Link to="/patient" className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <h3 className="font-bold text-lg text-slate-800">Patient Portal</h3>
                   </Link>
                   <Link to="/hospital" className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center">
                      <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      </div>
                      <h3 className="font-bold text-lg text-slate-800">Hospital Portal</h3>
                   </Link>
                   <Link to="/admin" className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center">
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                      </div>
                      <h3 className="font-bold text-lg text-slate-800">Admin Portal</h3>
                   </Link>
                </div>
              </div>
            } />
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/hospital" element={<HospitalDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
