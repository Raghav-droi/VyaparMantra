import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  LocalShipping,
  Inventory,
  Visibility,
} from '@mui/icons-material';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';

// eslint-disable-next-line no-unused-vars
import Typography from '@mui/material/Typography';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'requested': return <Inventory />;
      case 'confirmed': return <CheckCircle />;
      case 'shipped': return <LocalShipping />;
      case 'delivered': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return <Inventory />;
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Create notification for retailer
      await addDoc(
        collection(db, 'notifications'),
        {
          userId: selectedOrder.retailerId,
          type: 'order_status_update',
          message: `Your order for ${selectedOrder.productName} is now ${newStatus}.`,
          orderId: selectedOrder.id,
          status: 'unread',
          createdAt: serverTimestamp(),
        }
      );

      setDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const OrderTable = ({ ordersToShow }) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>Product</TableCell>
            <TableCell>Retailer</TableCell>
            <TableCell>Wholesaler</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordersToShow.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  #{order.id.slice(-8)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {order.productName}
                </Typography>
              </TableCell>
              <TableCell>{order.retailerId}</TableCell>
              <TableCell>{order.wholesalerName}</TableCell>
              <TableCell>
                {order.qty} {order.unit || 'units'}
              </TableCell>
              <TableCell>
                ₹{order.qty * order.pricePerUnit}
              </TableCell>
              <TableCell>
                <Chip
                  icon={getStatusIcon(order.status)}
                  label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  color={getStatusColor(order.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {order.createdAt.toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedOrder(order);
                      setDialogOpen(true);
                    }}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Order Management
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filterStatus}
              label="Filter Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Orders</MenuItem>
              <MenuItem value="requested">Requested</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Inventory color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{getOrdersByStatus('requested').length}</Typography>
                  <Typography color="text.secondary">Requested</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{getOrdersByStatus('confirmed').length}</Typography>
                  <Typography color="text.secondary">Confirmed</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocalShipping color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{getOrdersByStatus('shipped').length}</Typography>
                  <Typography color="text.secondary">Shipped</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{getOrdersByStatus('delivered').length}</Typography>
                  <Typography color="text.secondary">Delivered</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Order Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All Orders (${orders.length})`} />
          <Tab label={`Requested (${getOrdersByStatus('requested').length})`} />
          <Tab label={`Confirmed (${getOrdersByStatus('confirmed').length})`} />
          <Tab label={`Shipped (${getOrdersByStatus('shipped').length})`} />
          <Tab label={`Delivered (${getOrdersByStatus('delivered').length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <OrderTable ordersToShow={filteredOrders} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <OrderTable ordersToShow={getOrdersByStatus('requested')} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <OrderTable ordersToShow={getOrdersByStatus('confirmed')} />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <OrderTable ordersToShow={getOrdersByStatus('shipped')} />
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        <OrderTable ordersToShow={getOrdersByStatus('delivered')} />
      </TabPanel>

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    #{selectedOrder.id.slice(-8)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    icon={getStatusIcon(selectedOrder.status)}
                    label={selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    color={getStatusColor(selectedOrder.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                  <Typography variant="body1">{selectedOrder.productName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1">
                    {selectedOrder.qty} {selectedOrder.unit || 'units'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Wholesaler</Typography>
                  <Typography variant="body1">{selectedOrder.wholesalerName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Retailer ID</Typography>
                  <Typography variant="body1">{selectedOrder.retailerId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Price per unit</Typography>
                  <Typography variant="body1">₹{selectedOrder.pricePerUnit}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Total</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    ₹{selectedOrder.qty * selectedOrder.pricePerUnit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Ordered on</Typography>
                  <Typography variant="body1">
                    {selectedOrder.createdAt.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Last updated</Typography>
                  <Typography variant="body1">
                    {selectedOrder.updatedAt.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Update Status
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={newStatus}
                    label="New Status"
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus || newStatus === selectedOrder?.status}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderManagement;

