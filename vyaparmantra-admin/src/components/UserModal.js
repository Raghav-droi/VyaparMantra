import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';

const UserModal = ({ open, user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      console.log('User data in modal:', user);
      setFormData({
        ...user,
        status: user.status || 'active'
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onUpdate(formData);
  };

  if (!user) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          height: 'auto',
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#FF8C00',
        color: 'white',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        Edit User: {user.businessOwnerName}
        <Chip 
          label={user.userType || 'retail'} 
          sx={{ 
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white'
          }} 
        />
      </DialogTitle>
      
      <DialogContent 
        sx={{ 
          mt: 2,
          overflowY: 'auto',
          maxHeight: '70vh'
        }}
      >
        <Grid container spacing={3}>
          {/* Basic Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ color: '#FF8C00', fontWeight: 'bold', mb: 2 }}>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Business Owner Name"
              value={formData.businessOwnerName || ''}
              onChange={(e) => handleChange('businessOwnerName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Trade Name"
              value={formData.tradeName || ''}
              onChange={(e) => handleChange('tradeName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber || ''}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID Proof Type"
              value={formData.idProofType || ''}
              onChange={(e) => handleChange('idProofType', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID Proof Number"
              value={formData.idProof || ''}
              onChange={(e) => handleChange('idProof', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status || 'active'}
                label="Status"
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={3}
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </Grid>
          
          {/* Wholesaler specific fields */}
          {(user.userType === 'wholesaler' || formData.userType === 'wholesaler') && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#E53935', fontWeight: 'bold', mb: 2, mt: 2 }}>
                  Wholesaler Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GSTIN Number"
                  value={formData.gstinNumber || ''}
                  onChange={(e) => handleChange('gstinNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={formData.bankName || ''}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={formData.currentAccountDetails || ''}
                  onChange={(e) => handleChange('currentAccountDetails', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={formData.ifscCode || ''}
                  onChange={(e) => handleChange('ifscCode', e.target.value)}
                />
              </Grid>
            </>
          )}
          
          {/* Additional Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ color: '#3949AB', fontWeight: 'bold', mb: 2, mt: 2 }}>
              Additional Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Latitude, Longitude"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Created At"
              value={formData.createdAt || 'N/A'}
              disabled
              helperText="Registration date (read-only)"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          sx={{ 
            backgroundColor: '#FF8C00',
            '&:hover': {
              backgroundColor: '#e67c00'
            }
          }}
        >
          Update User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;
