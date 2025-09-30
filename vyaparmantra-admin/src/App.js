import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UserTable from './components/UserTable';
import TopBar from './components/TopBar';
import './App.css';

function App() {
  const [admin, setAdmin] = useState(null);

  // Check localStorage for login info on mount
  useEffect(() => {
    const stored = localStorage.getItem('adminSession');
    if (stored) {
      const { admin, loginTime } = JSON.parse(stored);
      const now = Date.now();
      // 6 hours = 21600000 ms
      if (now - loginTime < 21600000) {
        setAdmin(admin);
      } else {
        localStorage.removeItem('adminSession');
      }
    }
  }, []);

  // When logging in, save to localStorage with timestamp
  const handleLogin = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem('adminSession', JSON.stringify({
      admin: adminData,
      loginTime: Date.now()
    }));
  };

  // On logout, clear localStorage
  const handleLogout = () => {
    setAdmin(null);
    localStorage.removeItem('adminSession');
  };

  return (
    <Router>
      {!admin ? (
        <Routes>
          <Route path="*" element={<AdminLogin onLogin={handleLogin} />} />
        </Routes>
      ) : (
        <>
          <TopBar admin={admin} onLogout={handleLogout} />
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UserTable />} />
              <Route path="/business" element={<div>Business Analytics - Coming Soon</div>} />
              <Route path="/reports" element={<div>Reports - Coming Soon</div>} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
        </>
      )}
    </Router>
  );
}

export default App;
