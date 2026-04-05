import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userState, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session on load
    const storedUser = localStorage.getItem('ambucluster_session');
    if (storedUser) {
      setUserState(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      setUserState(res.data);
      localStorage.setItem('ambucluster_session', JSON.stringify(res.data));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem('ambucluster_session');
  };

  return (
    <AuthContext.Provider value={{ userState, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
