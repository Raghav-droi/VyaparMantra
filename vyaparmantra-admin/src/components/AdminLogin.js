import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '../styles/theme';
import LockIcon from '@mui/icons-material/Lock';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      const q = query(
        collection(db, 'admins'),
        where('username', '==', username),
        where('password', '==', password)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const admin = snapshot.docs[0].data();
        onLogin({ username: admin.username, role: admin.role });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  //const logoUrl = 'https://your-image-url.com/logo.png'; // Use your logo URL

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.background.gradient,
        }}
      >
        <Card sx={{ maxWidth: 400, width: '100%', p: 2, boxShadow: 6, borderRadius: 3 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* <Box sx={{ mb: 2 }}>
              <img src={logoUrl} alt="App Logo" style={{ width: 64, height: 64, borderRadius: 12 }} />
            </Box> */}
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>
              VyaparMantra Admin
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Sign in to your dashboard
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
            <TextField
              label="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              }}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 1, fontWeight: 'bold', letterSpacing: 1 }}
              onClick={handleLogin}
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

export default AdminLogin;