"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Home, FileText, Calendar, CreditCard, Menu, X,
  Bell, User, AlertTriangle, MapPin, Activity,
  CheckCircle2, Clock, ChevronRight
} from 'lucide-react';

export default function PatientDashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await axios.get('/api/patient/demo/activity');
        setRecentActivity(response.data);
      } catch (error) {
        console.error("Error fetching patient activity", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full shadow-sm">
        <div className="p-6 flex items-center gap-3">
          <Activity className="text-blue-600" size={28} />
          <span className="text-xl font-bold text-slate-800 tracking-tight">HealthLogix</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<Home size={20} />} label="Home" active />
          <NavItem icon={<FileText size={20} />} label="Medical Records" />
          <NavItem icon={<Calendar size={20} />} label="Appointments" />
          <NavItem icon={<CreditCard size={20} />} label="Billing" />
        </nav>
      </aside>

      {/* Mobile Navigation overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`md:hidden fixed inset-y-0 left-0 bg-white w-64 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-600" size={28} />
            <span className="text-xl font-bold tracking-tight">HealthLogix</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} className="text-slate-500" />
          </button>
        </div>
        <nav className="px-4 space-y-2 mt-2">
          <NavItem icon={<Home size={20} />} label="Home" active />
          <NavItem icon={<FileText size={20} />} label="Medical Records" />
          <NavItem icon={<Calendar size={20} />} label="Appointments" />
          <NavItem icon={<CreditCard size={20} />} label="Billing" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 text-slate-600" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-slate-800">Good morning, Naimur</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors">
              <Bell size={22} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center border border-blue-200 font-semibold cursor-pointer">
              NR
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20">

          {/* HERO SECTION: Emergency & Map */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <button className="relative group w-full md:w-3/4 max-w-md">
                <div className="absolute inset-0 bg-red-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-300 animate-pulse"></div>
                <div className="relative bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-3 py-6 px-8 rounded-2xl shadow-xl transition-all active:scale-95">
                  <AlertTriangle size={32} strokeWidth={2.5} />
                  <span className="text-xl md:text-2xl font-bold tracking-wide">SOS / EMERGENCY AMBULANCE</span>
                </div>
              </button>

              <div className="w-full h-48 md:h-64 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative">
                {/* Placeholder for actual Google Maps Iframe */}
                <MapPin size={40} className="mb-2 text-slate-300" />
                <p className="font-medium">Live GPS Location Tracking</p>
                <p className="text-sm mt-1">Waiting for actual map integration...</p>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 to-transparent"></div>
              </div>
            </div>
          </section>

          {/* Quick Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              title="Upcoming Appointments"
              value="2"
              icon={<Calendar className="text-blue-600" size={24} />}
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Recent Test Reports"
              value="1 New"
              icon={<FileText className="text-emerald-600" size={24} />}
              bgColor="bg-emerald-50"
            />
            <StatCard
              title="Pending Bills"
              value="$145.00"
              icon={<CreditCard className="text-orange-600" size={24} />}
              bgColor="bg-orange-50"
            />
          </section>

          {/* Recent Activity Table */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
              <button className="text-sm text-blue-600 font-medium hover:underline flex items-center">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="4" className="text-center py-8">Loading data...</td></tr>
                  ) : recentActivity.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8">No recent activity found.</td></tr>
                  ) : (
                    recentActivity.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{item.date}</td>
                        <td className="px-6 py-4">{item.service}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.status === 'Completed' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 hover:text-blue-800 font-medium">Details</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// Sub-components for cleaner code
function NavItem({ icon, label, active = false }) {
  return (
    <a href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
      active
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}>
      <span className={active ? "text-blue-600" : "text-slate-400"}>{icon}</span>
      {label}
    </a>
  );
}

function StatCard({ title, value, icon, bgColor }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
      <div className={`p-4 rounded-2xl ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );
}
