import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    retailers: 0,
    wholesalers: 0,
    verifiedUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users from Firestore...');
      
      // Simple query without ordering first
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      console.log('Raw snapshot:', usersSnapshot);
      console.log('Number of documents:', usersSnapshot.docs.length);
      
      const users = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log('User data:', userData);
        users.push({
          id: doc.id,
          ...userData
        });
      });
      
      console.log('All users:', users);
      
      // Calculate stats
      const totalUsers = users.length;
      const retailers = users.filter(u => u.userType === 'retail' || u.userType === 'retailer').length;
      const wholesalers = users.filter(u => u.userType === 'wholesaler').length;
      const verifiedUsers = users.filter(u => u.phoneVerified === true || u.isOtpVerified === true).length;
      
      const newStats = {
        totalUsers,
        retailers,
        wholesalers,
        verifiedUsers
      };
      
      console.log('Calculated stats:', newStats);
      
      setStats(newStats);
      setDebugInfo(`Found ${totalUsers} users: ${retailers} retailers, ${wholesalers} wholesalers`);
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(`Error: ${error.message}`);
      setDebugInfo(`Error details: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
      },
      transition: 'all 0.3s ease',
    }}>
      <CardContent sx={{ position: 'relative', zIndex: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box sx={{ 
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 3,
            p: 1.5,
            backdropFilter: 'blur(10px)',
          }}>
            {icon}
          </Box>
          {trend && (
            <Chip 
              label={trend} 
              size="small"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '11px'
              }}
            />
          )}
        </Box>
        
        <Typography variant="h6" sx={{ 
          fontWeight: 'bold',
          mb: 1,
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}>
          {title}
        </Typography>
        
        {loading ? (
          <CircularProgress size={40} sx={{ color: 'white' }} />
        ) : (
          <Typography variant="h2" sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            {value}
          </Typography>
        )}
        
        {subtitle && (
          <Typography variant="body2" sx={{ 
            opacity: 0.9,
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
      
      {/* Background decoration */}
      <Box sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 1,
      }} />
    </Card>
  );

  return (
    <Box>
      {/* Header Section */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        background: 'linear-gradient(135deg, #FF8C00 0%, #FFB347 50%, #FFD580 100%)',
        color: 'white',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 'bold', 
            mb: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Dashboard Overview
          </Typography>
          <Typography variant="h6" sx={{ 
            opacity: 0.9,
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}>
            Monitor your VyaparMantra ecosystem in real-time
          </Typography>
        </Box>
        
        {/* Background decorative circles */}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          zIndex: 1,
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          zIndex: 1,
        }} />
      </Paper>

      {/* Debug Information */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {debugInfo && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Debug: {debugInfo}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Businesses"
            value={stats.totalUsers}
            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
            color="#FF8C00"
            subtitle="Registered on platform"
            trend="All Users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Retail Partners"
            value={stats.retailers}
            icon={<BusinessIcon sx={{ fontSize: 28 }} />}
            color="#3949AB"
            subtitle="Small & medium retailers"
            trend="Retail"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Wholesale Partners"
            value={stats.wholesalers}
            icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
            color="#E53935"
            subtitle="Bulk suppliers"
            trend="Wholesale"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Verified Users"
            value={stats.verifiedUsers}
            icon={<VerifiedUserIcon sx={{ fontSize: 28 }} />}
            color="#4CAF50"
            subtitle="Phone verified businesses"
            trend="Verified"
          />
        </Grid>
      </Grid>

      {/* Quick Stats Summary */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #dee2e6'
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            mb: 3, 
            color: '#FF8C00', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            Platform Health
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" sx={{ 
                  color: '#4CAF50', 
                  fontWeight: 'bold',
                  mb: 1
                }}>
                  {stats.totalUsers > 0 && stats.verifiedUsers > 0 ? 
                    Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verification Rate
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" sx={{ 
                  color: '#FF8C00', 
                  fontWeight: 'bold',
                  mb: 1
                }}>
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Businesses
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" sx={{ 
                  color: '#3949AB', 
                  fontWeight: 'bold',
                  mb: 1
                }}>
                  {stats.totalUsers > 0 && stats.wholesalers > 0 ? 
                    Math.round((stats.wholesalers / stats.totalUsers) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Wholesale Ratio
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
