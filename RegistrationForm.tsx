import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Checkbox from '@react-native-community/checkbox';
import DropDownPicker from 'react-native-dropdown-picker';
import Geolocation from '@react-native-community/geolocation';
import auth, { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import BusinessTypeSelector from './components/BusinessTypeSelector';
import LocationField from './components/LocationField';
import OtpModal from './components/OtpModal';
import WholesalerFields from './components/WholesalerFields';
import FormInput from './components/FormInput';

interface FormData {
  userType: 'wholesaler' | 'retail';
  businessOwnerName: string;
  idProofType: string;
  idProof: string;
  tradeName: string;
  address: string;
  location: string;
  phoneNumber: string;
  gstinNumber: string;
  currentAccountDetails: string;
  bankName: string;
  ifscCode: string;
  termsAccepted: boolean;
}

export default function RegistrationForm({ navigation }: any) {
  const [formData, setFormData] = useState<FormData>({
    userType: 'retail',
    businessOwnerName: '',
    idProofType: '',
    idProof: '',
    tradeName: '',
    address: '',
    location: '',
    phoneNumber: '',
    gstinNumber: '',
    currentAccountDetails: '',
    bankName: '',
    ifscCode: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmation, setConfirmation] = useState<any>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false); // <-- Add this line

  const [openIdProofType, setOpenIdProofType] = useState(false);
  const [idProofTypeItems, setIdProofTypeItems] = useState([
    { label: 'Aadhar Card', value: 'aadhar' },
    { label: 'PAN Card', value: 'pan' },
    { label: 'Passport', value: 'passport' },
    { label: 'Driving License', value: 'driving_license' },
    { label: 'Voter ID', value: 'voter_id' },
  ]);
  const [idProofTypeValue, setIdProofTypeValue] = useState(formData.idProofType);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  React.useEffect(() => {
    handleInputChange('idProofType', idProofTypeValue);
    // eslint-disable-next-line
  }, [idProofTypeValue]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.businessOwnerName.trim()) newErrors.businessOwnerName = 'Required';
    if (!formData.idProofType || !formData.idProofType.trim()) newErrors.idProofType = 'Required';
    if (!formData.idProof.trim()) newErrors.idProof = 'Required';
    if (!formData.tradeName.trim()) newErrors.tradeName = 'Required';
    if (!formData.address.trim()) newErrors.address = 'Required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Required';
    else if (!/^\d{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Enter valid 10-digit phone';

    if (formData.userType === 'wholesaler') {
      if (!formData.gstinNumber.trim()) newErrors.gstinNumber = 'Required for wholesalers';
      if (!formData.currentAccountDetails.trim()) newErrors.currentAccountDetails = 'Required for wholesalers';
      if (!formData.bankName.trim()) newErrors.bankName = 'Required for wholesalers';
      if (!formData.ifscCode.trim()) newErrors.ifscCode = 'Required for wholesalers';
    }

    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValidAndReady = () => {
    const idProofType = typeof formData.idProofType === 'string' ? formData.idProofType : '';
    const isBasicValid = formData.businessOwnerName.trim() !== '' &&
      idProofType.trim() !== '' &&
      formData.idProof.trim() !== '' &&
      formData.tradeName.trim() !== '' &&
      formData.address.trim() !== '' &&
      /^\d{10}$/.test(formData.phoneNumber) &&
      formData.termsAccepted &&
      isOtpVerified;

    if (formData.userType === 'wholesaler') {
      return isBasicValid &&
        formData.gstinNumber.trim() !== '' &&
        formData.currentAccountDetails.trim() !== '' &&
        formData.bankName.trim() !== '' &&
        formData.ifscCode.trim() !== '';
    }
    return isBasicValid;
  };

  const handleSendOTP = async () => {
    if (!formData.phoneNumber || !/^\d{10}$/.test(formData.phoneNumber)) {
      setErrors(prev => ({ ...prev, phoneNumber: 'Enter valid 10-digit phone' }));
      return;
    }

    try {
      setLoading(true);
      const phoneWithCountryCode = `+91${formData.phoneNumber}`;
      const authInstance = getAuth();
      const confirmationResult = await signInWithPhoneNumber(authInstance, phoneWithCountryCode);
      setConfirmation(confirmationResult);
      setShowOtpModal(true); // <-- This shows the OTP modal
      Alert.alert('OTP Sent', `OTP sent to ${formData.phoneNumber}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      setShowOtpModal(true); // <-- Optionally show modal for manual entry/debug
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmation) {
      Alert.alert('Error', 'No OTP confirmation found. Please request OTP again.');
      return;
    }
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter valid 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      await confirmation.confirm(otp);
      setIsOtpVerified(true);
      setShowOtpModal(false);
      Alert.alert('Success', 'Phone number verified successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Helper function to convert coordinates to address using Google Geocoding API
  const getLocationName = async (latitude: number, longitude: number) => {
    try {
      const apiKey = 'AIzaSyBwvBIp9KarqwiBMQMTYdYCXcFZJpUDO6Y';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await response.json();
      console.log('Geocoding API response:', data); // <-- Add this line
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return `${latitude}, ${longitude}`;
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${latitude}, ${longitude}`;
    }
  };

  const handleFetchLocation = async () => {
    setLocationLoading(true);
    try {
      let permissionResult;
      if (Platform.OS === 'ios') {
        permissionResult = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      } else {
        permissionResult = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      }

      if (permissionResult === RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const locationName = await getLocationName(latitude, longitude);
            handleInputChange('location', locationName);
            setLocationLoading(false);
          },
          (error) => {
            setLocationLoading(false);
            Alert.alert('Location Error', `Unable to fetch location: ${error.message}`);
            console.error('Location error:', error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        setLocationLoading(false);
        Alert.alert('Permission Denied', 'Location permission is required.');
      }
    } catch (error) {
      setLocationLoading(false);
      Alert.alert('Error', 'Failed to request location permission.');
      console.error(error);
    }
  };

  const validateIFSC = async (ifscCode: string) => {
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.BANK) {
          return { valid: true, bank: data.BANK, branch: data.BRANCH };
        }
      }
      return { valid: false };
    } catch (error) {
      console.error('IFSC validation error:', error);
      return { valid: false };
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix errors before submitting.');
      return;
    }

    if (!isOtpVerified) {
      Alert.alert('Error', 'Please verify your phone number with OTP first.');
      return;
    }

    try {
      setLoading(true);

      // Validate IFSC code for wholesalers
      if (formData.userType === 'wholesaler' && formData.ifscCode) {
        const ifscValidation = await validateIFSC(formData.ifscCode);
        if (!ifscValidation.valid) {
          Alert.alert('Error', 'Invalid IFSC Code. Please check and try again.');
          setLoading(false);
          return;
        }
        // Update bank name with validated bank name
        setFormData(prev => ({
          ...prev,
          bankName: ifscValidation.bank || prev.bankName
        }));
      }

      // Save user data to Firestore
      const userId = auth().currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Authentication error. Please try again.');
        setLoading(false);
        return;
      }

      const userData = {
        ...formData,
        userId,
        phoneVerified: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        status: 'active'
      };

      await firestore().collection('users').doc(userId).set(userData);

      Alert.alert(
        'Registration Successful!', 
        'Your business has been registered successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to appropriate profile screen based on user type
              const profileScreen = formData.userType === 'retail' ? 'RetailerProfile' : 'WholesalerProfile';
              navigation.replace(profileScreen);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#FF8C00", "#FFB347", "#FFD580"]} style={styles.gradient}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.formCard}>
              <Text style={styles.title}>Business Registration</Text>

              {/* Business Type */}
              <BusinessTypeSelector value={formData.userType} onChange={(val: 'wholesaler' | 'retail') => handleInputChange('userType', val)} />

              {/* Owner Name */}
              <FormInput
                label="Business Owner Name *"
                value={formData.businessOwnerName}
                onChangeText={(text: string) => handleInputChange('businessOwnerName', text)}
                placeholder="Enter owner name"
                error={errors.businessOwnerName}
              />

              {/* ID Proof Type */}
              <Text style={styles.label}>ID Proof Type *</Text>
              <DropDownPicker
                open={openIdProofType}
                value={idProofTypeValue}
                items={idProofTypeItems}
                setOpen={setOpenIdProofType}
                setValue={setIdProofTypeValue}
                setItems={setIdProofTypeItems}
                style={styles.dropdown}
                containerStyle={{ marginBottom: 10 }}
                placeholder="Select ID Proof"
                placeholderStyle={{ color: "#aaa" }}
                listMode="SCROLLVIEW"
              />
              {!!errors.idProofType && <Text style={styles.errorText}>{errors.idProofType}</Text>}

              {/* ID Proof Number */}
              <FormInput
                label="ID Proof Number *"
                value={formData.idProof}
                onChangeText={(text: string) => handleInputChange('idProof', text)}
                placeholder="Enter ID proof number"
                error={errors.idProof}
              />

              {/* Trade Name */}
              <FormInput
                label="Trade Name *"
                value={formData.tradeName}
                onChangeText={(text: string) => handleInputChange('tradeName', text)}
                placeholder="Enter trade name"
                error={errors.tradeName}
              />

              {/* Address */}
              <FormInput
                label="Address *"
                value={formData.address}
                onChangeText={(text: string) => handleInputChange('address', text)}
                placeholder="Enter address"
                error={errors.address}
              />

              {/* Location */}
              <LocationField
                value={formData.location}
                loading={locationLoading}
                onFetch={handleFetchLocation}
              />

              {/* Phone Number (OTP) */}
              <Text style={styles.label}>Phone Number (OTP) *</Text>
              <View style={styles.locationRow}>
                <TextInput
                  style={[styles.input, errors.phoneNumber && styles.errorInput, { flex: 1 }]}
                  onChangeText={(text) => handleInputChange('phoneNumber', text)}
                  value={formData.phoneNumber}
                  placeholder="Enter 10-digit phone number"
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor="#aaa"
                  editable={!isOtpVerified}
                />
                <TouchableOpacity
                  style={[styles.locationButton, (isOtpVerified || loading) && { backgroundColor: '#aaa' }]}
                  onPress={handleSendOTP}
                  disabled={isOtpVerified || loading}
                >
                  <Text style={styles.locationButtonText}>
                    {isOtpVerified ? 'Verified' : loading ? 'Sending...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
              {!!errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

              {/* Wholesaler Fields */}
              {formData.userType === 'wholesaler' && (
                <WholesalerFields
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                />
              )}

              {/* Terms Acceptance */}
              <View style={styles.checkboxRow}>
                <Checkbox
                  value={!!formData.termsAccepted}
                  onValueChange={(val) => handleInputChange('termsAccepted', val)}
                  tintColors={{ true: '#FF8C00', false: '#aaa' }}
                />
                <Text style={styles.checkboxText}>I accept the terms and conditions *</Text>
              </View>
              {!!errors.termsAccepted && <Text style={styles.errorText}>{errors.termsAccepted}</Text>}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, (!isFormValidAndReady() || loading) && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={!isFormValidAndReady() || loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Registering...' : 'Register Business'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* OTP Modal */}
      <OtpModal
        visible={showOtpModal}
        phoneNumber={formData.phoneNumber}
        otp={otp}
        setOtp={setOtp}
        loading={loading}
        onCancel={() => setShowOtpModal(false)}
        onVerify={handleVerifyOTP}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "95%",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF8C00",
    marginBottom: 18,
    textAlign: "center",
    textShadowColor: "#FFD580",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  label: {
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
    color: "#3949AB",
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#FFF8E1",
    marginBottom: 4,
  },
  dropdown: {
    borderColor: '#bbb',
    borderRadius: 8,
    backgroundColor: "#FFF8E1",
    marginBottom: 4,
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: "space-between",
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#fff",
  },
  selectedRadio: {
    backgroundColor: '#FF8C00',
  },
  radioText: {
    marginLeft: 6,
    fontSize: 16,
    color: "#333",
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationButton: {
    backgroundColor: '#FF8C00',
    marginLeft: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    backgroundColor: '#FF8C00',
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#bbb',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FF8C00',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    width: '100%',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  verifyButton: {
    backgroundColor: '#FF8C00',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
