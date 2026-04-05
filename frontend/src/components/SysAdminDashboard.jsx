import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Users, Shield, Database, ListOrdered, BarChart2 } from 'lucide-react';

const SysAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // Refresh analytics every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/analytics');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading System Analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load analytics data.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Database className="w-48 h-48" /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-2 text-sm uppercase tracking-wider">
            <Shield className="w-4 h-4" /> System Administration
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">AmbuCluster Global Overview</h1>
          <p className="text-indigo-200 max-w-lg">Live system metrics powered by advanced PostgreSQL analytics.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl"><Activity className="w-8 h-8" /></div>
           <div>
             <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Requests</div>
             <div className="text-3xl font-extrabold text-gray-900">{data.overview.total_requests}</div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-4 bg-rose-50 text-rose-600 rounded-xl"><Shield className="w-8 h-8" /></div>
           <div>
             <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending Requests</div>
             <div className="text-3xl font-extrabold text-rose-600">{data.overview.pending_requests}</div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-8 h-8" /></div>
           <div>
             <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Ambulances</div>
             <div className="text-3xl font-extrabold text-gray-900">{data.overview.total_ambulances}</div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><Activity className="w-8 h-8" /></div>
           <div>
             <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Available Fleet</div>
             <div className="text-3xl font-extrabold text-emerald-600">{data.overview.available_ambulances}</div>
           </div>
        </div>
      </div>

    </div>
  );
};

export default SysAdminDashboard;
