import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100">Loading...</div>;

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Ambulance Management System</h1>
        <p className="text-center text-gray-600 mb-6">Select a role to login for the lab demo:</p>

        <div className="space-y-3">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.id)}
              className="w-full py-3 px-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-semibold block text-left text-gray-800">{user.name}</span>
                <span className="text-sm text-gray-500 capitalize">{user.role}</span>
              </div>
              <span className="text-blue-500">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
