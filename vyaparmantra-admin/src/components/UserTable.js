import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import UserModal from './UserModal';

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.businessOwnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tradeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
        status: doc.data().status || 'active'
      }));

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleUpdateUser = async (updatedData) => {
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), updatedData);
      setOpenModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Users Management
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#FF8C00', fontWeight: 'bold' }}>
              All Registered Users ({filteredUsers.length})
            </Typography>
            <TextField
              size="small"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#FF8C00' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          </Box>

          <TableContainer sx={{ maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FFF8E1' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: '#3949AB' }}>Owner Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#3949AB' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#3949AB' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#3949AB' }}>Trade Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#3949AB' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#3949AB' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#3949AB' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.businessOwnerName || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.userType || 'retail'}
                          color={user.userType === 'wholesale' ? 'primary' : 'secondary'}
                          size="small"
                          sx={{
                            bgcolor: user.userType === 'wholesale' ? '#FF8C00' : '#3949AB',
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                      <TableCell>{user.tradeName || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status || 'active'}
                          color={user.status === 'active' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.createdAt}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEditUser(user)}
                          sx={{ 
                            color: '#FF8C00', 
                            borderColor: '#FF8C00',
                            '&:hover': { backgroundColor: 'rgba(255,140,0,0.1)' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <UserModal
        open={openModal}
        user={selectedUser}
        onClose={() => setOpenModal(false)}
        onUpdate={handleUpdateUser}
      />
    </Box>
  );
};

export default UserTable;
