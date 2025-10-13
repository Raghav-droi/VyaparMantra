import React from 'react';
import { Box, Typography } from '@mui/material';
import OrderManagement from '../components/OrderManagement';

const OrdersPage = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <OrderManagement />
    </Box>
  );
};

export default OrdersPage;


