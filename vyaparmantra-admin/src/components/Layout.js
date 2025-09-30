import React from 'react';
import { 
  Box, 
  CssBaseline, 
  ThemeProvider 
} from '@mui/material';
import { theme } from '../styles/theme';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';

const Layout = ({ children, currentPage, setCurrentPage }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          display: 'flex', 
          minHeight: '100vh',
          background: theme.palette.background.gradient 
        }}
      >
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3,
              backgroundColor: 'rgba(255, 248, 225, 0.3)',
              minHeight: 'calc(100vh - 64px)'
            }}
          >
            <nav style={{ padding: '16px', background: '#FF8C00', color: 'white' }}>
              <Link to="/dashboard" style={{ marginRight: 16, color: 'white', textDecoration: 'none' }}>Dashboard</Link>
              <Link to="/users" style={{ marginRight: 16, color: 'white', textDecoration: 'none' }}>Users</Link>
              <Link to="/business" style={{ marginRight: 16, color: 'white', textDecoration: 'none' }}>Business Analytics</Link>
              <Link to="/reports" style={{ color: 'white', textDecoration: 'none' }}>Reports</Link>
            </nav>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
