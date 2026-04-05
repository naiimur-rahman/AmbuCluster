import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, User as UserIcon, LayoutDashboard, Settings } from 'lucide-react';

const DashboardLayout = () => {
  const { userState, logout } = useAuth();

  if (!userState) {
    return <Navigate to="/login" replace />;
  }

  const { user } = userState;

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
           <div className="font-extrabold text-xl text-white flex items-center gap-2 tracking-tight">
            <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            AmbuCluster
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-3">Main Menu</div>
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg font-medium">
              <LayoutDashboard className="w-5 h-5" /> Overview
            </a>
            {/* Additional mock links for professional look */}
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-colors">
              <Settings className="w-5 h-5" /> Settings
            </a>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-3 py-3 bg-slate-800 rounded-xl mb-3">
             <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-inner">
               {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <div className="text-sm font-bold text-white truncate">{user.name}</div>
               <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider truncate">{user.role}</div>
             </div>
           </div>
           <button
             onClick={logout}
             className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
           >
             <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
           <div className="flex items-center md:hidden gap-2 text-emerald-700 font-extrabold text-xl">
             <Activity className="w-6 h-6" /> AmbuCluster
           </div>

           <div className="hidden md:flex items-center text-sm font-medium text-gray-500">
              <span className="hover:text-gray-900 cursor-pointer">Dashboard</span>
              <span className="mx-2">/</span>
              <span className="text-emerald-600 capitalize">{user.role} Portal</span>
           </div>

           <div className="flex items-center gap-4">
              <button className="md:hidden text-gray-400 hover:text-rose-600 p-2" onClick={logout}>
                <LogOut className="w-5 h-5" />
              </button>
           </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto animate-fade-in-up custom-scrollbar">
           <div className="p-4 sm:p-6 lg:p-8">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
