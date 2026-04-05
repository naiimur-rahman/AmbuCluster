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
      const res = await axios.get('/api/analytics');
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hospital Ranking Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Hospital Load Analytics (Ranked)</h2>
          </div>
          <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 sticky top-0 uppercase tracking-wider font-semibold text-xs">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Hospital Name</th>
                  <th className="px-6 py-4">Emergencies Handled</th>
                  <th className="px-6 py-4">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.hospitals.map((hosp, idx) => (
                  <tr key={hosp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                        ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                        {hosp.demand_rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{hosp.name}</div>
                      <div className="text-xs text-gray-500">{hosp.type}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      {hosp.total_emergencies_handled}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div className={`h-2 rounded-full ${hosp.occupancy_rate_percent > 80 ? 'bg-rose-500' : hosp.occupancy_rate_percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${hosp.occupancy_rate_percent}%` }}></div>
                        </div>
                        <span className="font-bold text-xs">{hosp.occupancy_rate_percent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Audit Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Database Trigger Audit Log</h2>
          </div>
          <div className="p-6 overflow-y-auto max-h-[500px] custom-scrollbar space-y-4 bg-slate-50">
            {data.audits.length === 0 ? (
               <div className="text-center text-gray-400 py-8">No audit logs available yet. Make a request to trigger DB updates.</div>
            ) : (
               data.audits.map(audit => (
                 <div key={audit.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2">
                   <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
                     <span>Log ID: #{audit.id}</span>
                     <span>{new Date(audit.changed_at).toLocaleString()}</span>
                   </div>
                   <div className="text-sm font-medium mt-1">
                     Request <strong className="text-indigo-600">#{audit.request_id}</strong> status changed:
                   </div>
                   <div className="flex items-center gap-3 mt-1">
                     <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase">{audit.old_status}</span>
                     <span className="text-gray-400">→</span>
                     <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase
                       ${audit.new_status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                         audit.new_status === 'en_route_hospital' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                       {audit.new_status}
                     </span>
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SysAdminDashboard;
