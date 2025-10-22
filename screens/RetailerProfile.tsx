import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, MapPin, Phone, Mail, Store, Calendar, Edit, Save, X } from 'lucide-react-native';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { useNavigation } from '../App';
import ProfessionalHeader from '../components/ui/ProfessionalHeader';
import AnimatedCard from '../components/ui/AnimatedCard';

const db = getFirestore();

interface RetailerProfileData {
  storeName?: string;
  businessOwnerName?: string;
  location?: string;
  phoneNumber?: string;
  email?: string;
  businessType?: string;
  gstNumber?: string;
  createdAt?: any;
  userType?: string;
}

const RetailerProfile = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  
  console.log('RetailerProfile rendered');
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<RetailerProfileData>({});
  const [editedData, setEditedData] = useState<RetailerProfileData>({});
  const user = getAuth().currentUser;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let retailerId;
      if (user?.phoneNumber) {
        retailerId = user.phoneNumber.replace('+91', '');
      } else if (user?.uid) {
        retailerId = user.uid;
      } else {
        console.log('No user ID available for profile fetch');
        return;
      }

      console.log('Fetching retailer profile for ID:', retailerId);
      const userDoc = await getDoc(doc(db, 'retailer', retailerId));
      
      if (userDoc.exists()) {
        const data = userDoc.data() as RetailerProfileData;
        setProfileData(data);
        setEditedData(data);
        console.log('Retailer profile data:', data);
      } else {
        console.log('Retailer document not found');
        Alert.alert('Error', 'Profile not found');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      Alert.alert('Error', 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditedData({ ...profileData });
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedData({ ...profileData });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      let retailerId;
      if (user?.phoneNumber) {
        retailerId = user.phoneNumber.replace('+91', '');
      } else if (user?.uid) {
        retailerId = user.uid;
      } else {
        Alert.alert('Error', 'No user ID available');
        return;
      }

      await updateDoc(doc(db, 'retailer', retailerId), {
        ...editedData,
        updatedAt: new Date(),
      });

      setProfileData(editedData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      return new Date(date.toDate ? date.toDate() : date).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <ProfessionalHeader
          title="Profile"
          subtitle="Manage your account details"
          onMenuPress={() => navigation.goBack()}
          showGradient={true}
        />
        
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <AnimatedCard style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User color="#1e3a8a" size={48} />
            </View>
            <Text style={styles.storeName}>
              {profileData.storeName || profileData.businessOwnerName || 'Retailer'}
            </Text>
            <Text style={styles.businessType}>
              {profileData.businessType || 'Retail Business'}
            </Text>
            <Text style={styles.location}>
              <MapPin color="#6b7280" size={16} />
              {' '}{profileData.location || 'Location not set'}
            </Text>
          </AnimatedCard>

          {/* Profile Details */}
          <AnimatedCard style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Business Information</Text>
              {!editing ? (
                <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                  <Edit color="#1e3a8a" size={20} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <X color="#ef4444" size={20} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                    <Save color="#10b981" size={20} />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <Store color="#6b7280" size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Store Name</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={editedData.storeName || ''}
                      onChangeText={(text) => setEditedData({...editedData, storeName: text})}
                      placeholder="Enter store name"
                    />
                  ) : (
                    <Text style={styles.detailValue}>
                      {profileData.storeName || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailItem}>
                <User color="#6b7280" size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Owner Name</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={editedData.businessOwnerName || ''}
                      onChangeText={(text) => setEditedData({...editedData, businessOwnerName: text})}
                      placeholder="Enter owner name"
                    />
                  ) : (
                    <Text style={styles.detailValue}>
                      {profileData.businessOwnerName || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailItem}>
                <MapPin color="#6b7280" size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={editedData.location || ''}
                      onChangeText={(text) => setEditedData({...editedData, location: text})}
                      placeholder="Enter location"
                    />
                  ) : (
                    <Text style={styles.detailValue}>
                      {profileData.location || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailItem}>
                <Phone color="#6b7280" size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>
                    {profileData.phoneNumber || user?.phoneNumber || 'Not set'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Mail color="#6b7280" size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Email</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={editedData.email || ''}
                      onChangeText={(text) => setEditedData({...editedData, email: text})}
                      placeholder="Enter email"
                      keyboardType="email-address"
                    />
                  ) : (
                    <Text style={styles.detailValue}>
                      {profileData.email || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailItem}>
                <Calendar color="#6b7280" size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Member Since</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(profileData.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          </AnimatedCard>

          {/* Account Actions */}
          <AnimatedCard style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Account Actions</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Privacy Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Help & Support</Text>
            </TouchableOpacity>
          </AnimatedCard>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  businessType: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e7ff',
    borderRadius: 6,
  },
  editButtonText: {
    marginLeft: 4,
    color: '#1e3a8a',
    fontWeight: '500',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  cancelButtonText: {
    marginLeft: 4,
    color: '#ef4444',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 6,
  },
  saveButtonText: {
    marginLeft: 4,
    color: '#10b981',
    fontWeight: '500',
  },
  detailsList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1e3a8a',
    fontWeight: '500',
  },
});

export default RetailerProfile;