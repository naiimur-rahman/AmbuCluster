import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ShieldAlert, Navigation } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  useEffect(() => {
    axios.get('http://localhost:5000/api/users')
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleLogin = async (userId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', { userId });
      onLogin(res.data);
    } catch (err) {
      alert('Login failed');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-100">
      <div className="animate-pulse flex flex-col items-center">
        <Activity className="w-12 h-12 text-emerald-600 mb-4" />
        <p className="text-emerald-800 font-semibold text-lg">Loading AmbuCluster...</p>
      </div>
    </div>
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedRole === "all" || user.role === selectedRole)
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-50 to-emerald-100 overflow-hidden">
      {/* Left side branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 bg-emerald-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-600 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-800 opacity-50 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-12 h-12 text-emerald-300" />
            <h1 className="text-5xl font-extrabold tracking-tight">AmbuCluster</h1>
          </div>
          <p className="text-emerald-100 text-xl leading-relaxed max-w-md">
            Next-generation intelligent emergency response system for Bangladesh. Real-time routing, instant dispatch, and seamless hospital integration.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-600 rounded-lg"><ShieldAlert className="w-6 h-6 text-emerald-200" /></div>
              <div>
                <h3 className="font-semibold text-lg">Rapid SOS Response</h3>
                <p className="text-emerald-200 text-sm">One tap emergency dispatch</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-600 rounded-lg"><Navigation className="w-6 h-6 text-emerald-200" /></div>
              <div>
                <h3 className="font-semibold text-lg">Live Tracking</h3>
                <p className="text-emerald-200 text-sm">Real-time GPS ambulance monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 overflow-y-auto max-h-screen">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
             <Activity className="w-8 h-8 text-emerald-600" />
             <h1 className="text-3xl font-extrabold text-emerald-800 tracking-tight">AmbuCluster</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Demo</h2>
          <p className="text-gray-500 mb-8">Please select a profile to log in to the system.</p>

          <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Search user..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex gap-2">
              {['all', 'patient', 'hospital', 'driver'].map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    selectedRole === role
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No users found matching your search.</p>
            ) : (
              filteredUsers.slice(0, 50).map(user => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user.id)}
                  className="w-full p-4 bg-white hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-xl flex items-center justify-between transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner
                      ${user.role === 'patient' ? 'bg-blue-500' : user.role === 'hospital' ? 'bg-rose-500' : 'bg-amber-500'}`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <span className="font-semibold block text-gray-900 group-hover:text-emerald-700 transition-colors">{user.name}</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{user.role}</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all">→</span>
                </button>
              ))
            )}
            {filteredUsers.length > 50 && (
              <p className="text-center text-sm text-gray-400 pt-4">Showing 50 of {filteredUsers.length} users. Use search to find others.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
