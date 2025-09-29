import React from 'react';
import { 
  Box, 
  CssBaseline, 
  ThemeProvider 
} from '@mui/material';
import { theme } from '../styles/theme';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

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
          <TopBar />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3,
              backgroundColor: 'rgba(255, 248, 225, 0.3)',
              minHeight: 'calc(100vh - 64px)'
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
