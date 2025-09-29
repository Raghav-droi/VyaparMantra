import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'users', label: 'Users Management', icon: <PeopleIcon /> },
    { id: 'business', label: 'Business Analytics', icon: <BusinessIcon /> },
    { id: 'reports', label: 'Reports', icon: <AnalyticsIcon /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #FF8C00 0%, #FFB347 50%, #FFD580 100%)',
          color: 'white',
        },
      }}
    >
      {/* Logo Section */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Vyapar Mantra
        </Typography>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255,255,255,0.8)', 
          mt: 1,
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}>
          Admin Dashboard
        </Typography>
      </Box>
      
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

      {/* Menu Items */}
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => setCurrentPage(item.id)}
              selected={currentPage === item.id}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{
                  fontSize: 15,
                  fontWeight: currentPage === item.id ? 'bold' : 'medium',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
