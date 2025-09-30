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
  Divider,
} from '@mui/material';

const UserModal = ({ open, user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit User: {user.businessOwnerName}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Info */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary">Basic Information</Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Business Owner Name"
              value={formData.businessOwnerName || ''}
              onChange={(e) => handleChange('businessOwnerName', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Trade Name"
              value={formData.tradeName || ''}
              onChange={(e) => handleChange('tradeName', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone Number"
              value={formData.phoneNumber || ''}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="ID Proof"
              value={formData.idProof || ''}
              onChange={(e) => handleChange('idProof', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="ID Proof Type"
              value={formData.idProofType || ''}
              onChange={(e) => handleChange('idProofType', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Location"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Status"
              value={formData.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              fullWidth
            />
          </Grid>
          
          {/* Wholesaler Extra Info */}
          {formData.userType === 'wholesale' && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" color="error">Wholesaler Details</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="GSTIN Number"
                  value={formData.gstinNumber || ''}
                  onChange={(e) => handleChange('gstinNumber', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Bank Name"
                  value={formData.bankName || ''}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Account Number"
                  value={formData.currentAccountDetails || ''}
                  onChange={(e) => handleChange('currentAccountDetails', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="IFSC Code"
                  value={formData.ifscCode || ''}
                  onChange={(e) => handleChange('ifscCode', e.target.value)}
                  fullWidth
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;
