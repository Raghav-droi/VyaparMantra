import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UserTable from './components/UserTable';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserTable />;
      case 'business':
        return <div>Business Analytics - Coming Soon</div>;
      case 'reports':
        return <div>Reports - Coming Soon</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="App">
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {renderPage()}
      </Layout>
    </div>
  );
}

export default App;
