import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const TopBar = ({ admin, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileAnchor, setProfileAnchor] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      
      // Simple query to get all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const notificationData = [];
      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        notificationData.push({
          id: doc.id,
          type: 'new_user',
          title: `New ${user.userType || 'user'} registered`,
          message: `${user.businessOwnerName || 'Unknown'} from ${user.tradeName || 'Unknown Business'}`,
          timestamp: user.createdAt?.toDate?.() || new Date(),
          read: false,
          icon: user.userType === 'wholesaler' ? <BusinessIcon /> : <PersonIcon />
        });
      });

      console.log('Notifications:', notificationData);
      
      // Sort by most recent first
      notificationData.sort((a, b) => b.timestamp - a.timestamp);
      
      notificationData.forEach(n => n.read = false); // All unread by default
      setNotifications(notificationData);
      setUnreadCount(notificationData.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);

    // Mark all notifications as read when menu opens
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = (event) => setProfileAnchor(event.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: 'linear-gradient(135deg, #FF8C00 0%, #FFB347 50%, #FFD580 100%)',
        color: 'white',
        zIndex: 1201, // ensures it's above the sidebar
        ml: { sm: '275px' }, // add left margin for sidebar width
        width: { sm: 'calc(100% - 220px)' }, // shrink width to not overlap sidebar
        transition: 'margin-left 0.3s, width 0.3s',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box sx={{ 
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 3,
            px: 3,
            py: 1,
            backdropFilter: 'blur(10px)',
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              VyaparMantra Admin Control Center
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontSize: '13px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              Manage your business ecosystem • Real-time insights
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2,mr:7 }}>
          {/* Notifications */}
          <IconButton 
            sx={{ 
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease',
            }}
            onClick={handleNotificationClick}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          {/* Profile */}
          <IconButton onClick={handleProfileClick}>
            <Avatar>{admin?.username?.charAt(0).toUpperCase()}</Avatar>
          </IconButton>
          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={handleProfileClose}
          >
            <MenuItem disabled>
              <ListItemText primary={admin?.username} secondary={admin?.role || 'admin'} />
            </MenuItem>
            <MenuItem onClick={() => { handleProfileClose(); onLogout(); }}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 350,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF8C00' }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} new notifications
          </Typography>
        </Box>
        
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <MenuItem>
              <Typography color="text.secondary">No notifications yet</Typography>
            </MenuItem>
          ) : (
            notifications.map((notification) => (
              <MenuItem key={notification.id} sx={{ py: 2, borderBottom: '1px solid #f8f8f8' }}>
                <ListItemIcon sx={{ color: '#FF8C00' }}>
                  {notification.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatTimeAgo(notification.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </MenuItem>
            ))
          )}
        </Box>
        
        {notifications.length > 0 && (
          <Box sx={{ p: 1, borderTop: '1px solid #f0f0f0' }}>
            <MenuItem 
              onClick={handleNotificationClose}
              sx={{ 
                justifyContent: 'center',
                color: '#FF8C00',
                fontWeight: 'bold',
              }}
            >
              View All Notifications
            </MenuItem>
          </Box>
        )}
      </Menu>
    </AppBar>
  );
};

export default TopBar;
