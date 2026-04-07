"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity, Ambulance, BedDouble, Users, UserPlus,
  Package, Stethoscope, Clock, AlertCircle, MapPin,
  CheckCircle2, Bell, Search, Settings, HeartPulse
} from 'lucide-react';

export default function HospitalDashboard() {
  const [activeTab, setActiveTab] = useState('er');

  const [incomingAmbulances, setIncomingAmbulances] = useState([]);
  const [stats, setStats] = useState({ availableBeds: 0, activeERPatients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incomingRes, statsRes] = await Promise.all([
          axios.get('/api/hospital/demo/incoming'),
          axios.get('/api/hospital/demo/stats')
        ]);
        setIncomingAmbulances(incomingRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Error fetching hospital data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Generate bed map based on real available/occupied counts
  const bedData = Array.from({ length: Math.max(24, stats.availableBeds + stats.activeERPatients) }, (_, i) => {
    let status = 'Available';
    if (i < stats.activeERPatients) {
       status = 'Occupied';
    } else if (i === stats.activeERPatients) { // Just to add some variety
       status = 'Cleaning';
    }
    return { id: `ER-${i + 1}`, status };
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <HeartPulse className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">City Central Hospital</h1>
              <p className="text-xs text-slate-500 font-medium">ER & Triage Command Center</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search patient, bed..."
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64"
              />
            </div>
            <button className="relative p-2 text-slate-500 hover:text-teal-600 transition-colors">
              <Bell size={22} />
              {incomingAmbulances.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <div className="w-9 h-9 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold border border-teal-200">
              Dr
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-6 shrink-0">
          <TabButton
            active={activeTab === 'er'}
            onClick={() => setActiveTab('er')}
            icon={<Activity size={18} />}
            label="ER Overview"
          />
          <TabButton
            active={activeTab === 'beds'}
            onClick={() => setActiveTab('beds')}
            icon={<BedDouble size={18} />}
            label="Bed Management"
          />
          <TabButton
            active={activeTab === 'staff'}
            onClick={() => setActiveTab('staff')}
            icon={<Users size={18} />}
            label="Staffing"
          />
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ER OVERVIEW TAB */}
          {activeTab === 'er' && (
            <div className="space-y-6 max-w-5xl">
              {/* Quick Action Panel */}
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ActionCard icon={<UserPlus />} title="Admit Patient" desc="Manual walk-in registration" color="bg-teal-600 hover:bg-teal-700 text-white" />
                  <ActionCard icon={<Package />} title="Request Supply" desc="Order blood, meds, or tools" color="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm" />
                  <ActionCard icon={<Settings />} title="Update Machine" desc="Log equipment maintenance" color="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm" />
                </div>
              </section>

              {/* ER Stats Overview */}
              <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Current Wait Time" value="14 mins" icon={<Clock className="text-amber-500" />} />
                <StatCard title="Active ER Patients" value={stats.activeERPatients.toString()} icon={<Users className="text-teal-500" />} />
                <StatCard title="Available Beds" value={stats.availableBeds.toString()} icon={<BedDouble className="text-emerald-500" />} />
                <StatCard title="Incoming Patients" value={incomingAmbulances.length.toString()} icon={<AlertCircle className="text-rose-500" />} />
              </section>
            </div>
          )}

          {/* BED MANAGEMENT TAB */}
          {activeTab === 'beds' && (
            <div className="max-w-5xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">ER Ward Bed Map</h2>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Available</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Occupied</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Cleaning</div>
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {bedData.map((bed) => (
                  <div key={bed.id} className="relative p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center gap-2 transition-transform hover:scale-105 cursor-pointer">
                    <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                      bed.status === 'Available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                      bed.status === 'Occupied' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,113,0.8)]' :
                      'bg-amber-400'
                    }`}></span>
                    <BedDouble size={28} className={
                      bed.status === 'Available' ? 'text-emerald-600' :
                      bed.status === 'Occupied' ? 'text-rose-600' : 'text-amber-500'
                    } />
                    <span className="font-bold text-slate-700">{bed.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFFING TAB (Placeholder) */}
          {activeTab === 'staff' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Stethoscope size={64} className="mb-4 opacity-20" />
              <h2 className="text-xl font-semibold text-slate-600">Shift Management</h2>
              <p>Staff scheduling interface will be loaded here.</p>
            </div>
          )}

        </main>
      </div>

      {/* Right Sidebar: Incoming Ambulance Tracker */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Ambulance size={20} className="text-teal-600" />
            Incoming Dispatch
          </h2>
          {incomingAmbulances.length > 0 && (
             <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
               LIVE
             </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
             <div className="text-center py-8 text-slate-500">Loading dispatcher data...</div>
          ) : incomingAmbulances.length === 0 ? (
             <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <CheckCircle2 size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">No ambulances<br/>currently en route.</p>
             </div>
          ) : incomingAmbulances.map((amb, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${amb.color} relative overflow-hidden transition-all hover:shadow-md cursor-pointer`}>
              {/* ETA Badge */}
              <div className="absolute top-0 right-0 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-bl-xl font-bold text-sm">
                ETA: {amb.eta}
              </div>

              <h3 className="font-bold text-lg mb-1">{amb.id}</h3>
              <p className="font-semibold text-sm mb-3 opacity-90">{amb.status}</p>

              <div className="flex items-center justify-between text-sm opacity-80 font-medium">
                <span className="flex items-center gap-1"><MapPin size={14}/> {amb.distance}</span>
                <span className="flex items-center gap-1"><Users size={14}/> {amb.patient}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

    </div>
  );
}

// --- Sub Components ---

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-1 py-4 font-semibold text-sm border-b-2 transition-colors ${
        active
          ? 'border-teal-600 text-teal-600'
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ActionCard({ icon, title, desc, color }) {
  return (
    <button className={`flex items-start gap-4 p-5 rounded-2xl transition-all active:scale-95 text-left ${color}`}>
      <div className="mt-1">{icon}</div>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm opacity-90 font-medium">{desc}</p>
      </div>
    </button>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
