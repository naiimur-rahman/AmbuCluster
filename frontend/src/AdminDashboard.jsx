"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Activity, Ambulance, Users, BedDouble, AlertTriangle,
  Settings, LayoutDashboard, Database, Map, Search, Bell, Menu
} from 'lucide-react';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [metrics, setMetrics] = useState({
    activeAmbulances: 0,
    standbyAmbulances: 0,
    totalERPatients: 0,
    bedOccupancyPercent: 0,
    activeAlerts: 0
  });
  const [hourlyData, setHourlyData] = useState([]);
  const [hospitalData, setHospitalData] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, hourlyRes, hospitalRes, maintenanceRes] = await Promise.all([
          axios.get('/api/admin/metrics'),
          axios.get('/api/admin/hourly-requests'),
          axios.get('/api/admin/hospital-efficiency'),
          axios.get('/api/admin/maintenance-alerts')
        ]);

        setMetrics(metricsRes.data);
        setHourlyData(hourlyRes.data);
        setHospitalData(hospitalRes.data);
        setMaintenanceAlerts(maintenanceRes.data);
      } catch (error) {
        console.error("Error fetching admin data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden selection:bg-blue-500/30">

      {/* Sidebar */}
      <aside className={`transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-900 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <Activity className="text-blue-500 shrink-0" size={28} />
            <span className={`font-bold text-xl tracking-tight transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
              HealthLogix
            </span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white shrink-0">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active isOpen={sidebarOpen} />
          <NavItem icon={<Map size={20} />} label="Live Dispatch" isOpen={sidebarOpen} />
          <NavItem icon={<Database size={20} />} label="System Data" isOpen={sidebarOpen} />
          <NavItem icon={<Settings size={20} />} label="Settings" isOpen={sidebarOpen} />
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10">
          <div className="flex items-center bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 w-64 focus-within:border-blue-500 transition-colors">
            <Search size={16} className="text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search network..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              {metrics.activeAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              )}
            </button>
            <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">Sohan</p>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold shadow-lg">
                S
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Network Overview</h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Active Ambulances" value={metrics.activeAmbulances.toString()} subtext={`${metrics.standbyAmbulances} on standby`} icon={<Ambulance size={24} className="text-blue-400" />} trend="+4.5%" />
            <MetricCard title="Total ER Patients" value={metrics.totalERPatients.toString()} subtext="Today's aggregate" icon={<Users size={24} className="text-indigo-400" />} trend="+12.2%" />
            <MetricCard title="Network Bed Occupancy" value={`${metrics.bedOccupancyPercent}%`} subtext="Across hospitals" icon={<BedDouble size={24} className="text-emerald-400" />} trend="-2.1%" />
            <MetricCard title="System Alerts" value={metrics.activeAlerts.toString()} subtext="Requires immediate action" icon={<AlertTriangle size={24} className="text-rose-400" />} alert={metrics.activeAlerts > 0} />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Line Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity size={18} className="text-slate-400"/> Emergency Requests (24h)
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-slate-400"/> Avg Response Time (Mins)
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hospitalData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#1e293b' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    />
                    <Bar dataKey="time" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Data Grid: Predictive Maintenance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings size={18} className="text-slate-400"/> Predictive Maintenance Alerts
              </h2>
              <button className="text-sm font-medium text-blue-400 hover:text-blue-300">View Report</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Hospital Name</th>
                    <th className="px-6 py-4 font-medium">Machine Type</th>
                    <th className="px-6 py-4 font-medium">Usage Hours</th>
                    <th className="px-6 py-4 font-medium">Risk Level</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {maintenanceAlerts.length === 0 ? (
                     <tr><td colSpan="5" className="text-center py-4 text-slate-500">No alerts found.</td></tr>
                  ) : maintenanceAlerts.map((alert, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{alert.hospital || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-300">{alert.machine}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{alert.hours}h</td>
                      <td className="px-6 py-4">
                        <RiskBadge level={alert.risk} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-4 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-md text-xs font-semibold transition-colors">
                          Take Action
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

// --- Sub Components ---

function NavItem({ icon, label, active, isOpen }) {
  return (
    <a href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors overflow-hidden ${
      active ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`}>
      <div className="shrink-0">{icon}</div>
      <span className={`font-medium whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {label}
      </span>
    </a>
  );
}

function MetricCard({ title, value, subtext, icon, trend, alert }) {
  return (
    <div className={`bg-slate-900 border rounded-xl p-5 shadow-sm relative overflow-hidden ${alert ? 'border-rose-500/30' : 'border-slate-800'}`}>
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full"></div>}
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <p className="text-xs text-slate-500">{subtext}</p>
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const styles = {
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[level] || styles.Low}`}>
      {level}
    </span>
  );
}

// Missing icon fallback for Bar chart header
function Clock(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
