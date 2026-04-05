import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, ShieldAlert, Navigation, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Default for demo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For the demo, we look up the user by email to get their ID,
      // then use the existing login endpoint.
      const usersRes = await axios.get('http://localhost:5000/api/users');
      const targetUser = usersRes.data.find(u => u.email === email);

      if (!targetUser) {
        setError('Invalid credentials. Please use a demo account.');
        setLoading(false);
        return;
      }

      const result = await login(targetUser.id);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('System error connecting to server.');
    }
    setLoading(false);
  };

  const setDemoCredentials = (role) => {
    if (role === 'sysadmin') setEmail('admin@ambucluster.com');
    if (role === 'hospital') setEmail('admin0@hospital.bd');
    if (role === 'driver') setEmail('driver1@ambulance.bd');
    if (role === 'patient') setEmail('patient@ambucluster.com');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Left side branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 bg-emerald-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-800 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-teal-900 opacity-50 blur-3xl"></div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
               <Activity className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">AmbuCluster</h1>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-6">Emergency Response,<br/>Reimagined.</h2>
          <p className="text-emerald-100/80 text-lg leading-relaxed mb-12">
            The next-generation intelligent dispatch and hospital management system. Real-time routing, instant SOS, and seamless clinical integration.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="p-3 bg-emerald-800 rounded-lg"><ShieldAlert className="w-6 h-6 text-emerald-300" /></div>
              <div>
                <h3 className="font-semibold text-lg text-emerald-50">Rapid SOS Response</h3>
                <p className="text-emerald-200/70 text-sm">One-tap emergency dispatch routing</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="p-3 bg-emerald-800 rounded-lg"><Navigation className="w-6 h-6 text-emerald-300" /></div>
              <div>
                <h3 className="font-semibold text-lg text-emerald-50">Live Tracker</h3>
                <p className="text-emerald-200/70 text-sm">Real-time telemetry and GPS monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 py-12 relative">
         <div className="absolute top-8 right-8 flex gap-2">
           <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">System Status:</span>
           <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online</span>
         </div>

        <div className="max-w-md w-full">
          <div className="lg:hidden flex items-center gap-3 mb-10">
             <div className="bg-emerald-100 p-2 rounded-lg"><Activity className="w-8 h-8 text-emerald-700" /></div>
             <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AmbuCluster</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">Sign in to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <a href="#" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500">Forgot password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider text-center">Lab Demo Credentials</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setDemoCredentials('patient')} className="py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">Patient</button>
              <button type="button" onClick={() => setDemoCredentials('hospital')} className="py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">Hospital</button>
              <button type="button" onClick={() => setDemoCredentials('driver')} className="py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">Ambulance</button>
              <button type="button" onClick={() => setDemoCredentials('sysadmin')} className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-700 transition-colors">SysAdmin</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
