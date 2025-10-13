import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Checkbox from '@react-native-community/checkbox';
import DropDownPicker from 'react-native-dropdown-picker';
import Geolocation from '@react-native-community/geolocation';
import auth, { PhoneAuthProvider } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CryptoJS from 'crypto-js';
import BusinessTypeSelector from './components/BusinessTypeSelector';
import LocationField from './components/LocationField';
import OtpModal from './components/OtpModal';
import WholesalerFields from './components/WholesalerFields';
import FormInput from './components/FormInput';
import uuid from 'react-native-uuid';

interface FormData {
  userType: 'wholesale' | 'retail';
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
  password: string;
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
    password: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [businessCategories, setBusinessCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');

  const handleFetchLocation = () => {
    setLocationLoading(true);
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        handleInputChange('location', `${latitude},${longitude}`);
        setLocationLoading(false);
      },
      error => {
        Alert.alert('Error', 'Unable to fetch location');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

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
    if (!formData.password.trim()) newErrors.password = 'Password required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (formData.userType === 'wholesale') {
      if (!formData.gstinNumber.trim()) newErrors.gstinNumber = 'Required for wholesalers';
      if (!formData.currentAccountDetails.trim()) newErrors.currentAccountDetails = 'Required for wholesalers';
      if (!formData.bankName.trim()) newErrors.bankName = 'Required for wholesalers';
      if (!formData.ifscCode.trim()) newErrors.ifscCode = 'Required for wholesalers';
    }

    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept terms';
    if (!selectedCategories.length) newErrors.businessCategory = 'Select at least one category';

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
      formData.password.trim().length >= 6 &&
      formData.termsAccepted &&
      isOtpVerified;

    if (formData.userType === 'wholesale') {
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
      const snapshot = await auth().verifyPhoneNumber(phoneWithCountryCode);
      setVerificationId(snapshot.verificationId);
      setShowOtpModal(true);
      Alert.alert('OTP Sent', `OTP sent to ${formData.phoneNumber}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationId) {
      Alert.alert('Error', 'No verification ID found. Please request OTP again.');
      return;
    }
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter valid 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      setIsOtpVerified(true);
      setShowOtpModal(false);
      Alert.alert('Success', 'Phone number verified!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isOtpVerified) {
      Alert.alert('Error', 'Please verify your phone number with OTP first.');
      return;
    }
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix errors before submitting.');
      return;
    }
    try {
      setLoading(true);
      const collection = formData.userType === 'wholesale' ? 'wholesaler' : 'retailer';
      const docName = formData.phoneNumber;
      // Hash the password before saving
      const hashedPassword = CryptoJS.SHA256(formData.password).toString();

      await firestore().collection(collection).doc(docName).set({
        ...formData,
        businessCategory: selectedCategories, // <-- add this line
        password: hashedPassword,
        uuid: uuid.v4(),
        createdAt: new Date(),
      });
      navigation.replace('Re_regs', { userType: formData.userType, docName });
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snap = await firestore()
          .collection('businessCategories')
          .doc('HgJx3qMGO3bWeCJWtbBU')
          .get();
        if (snap.exists) {
          const arr = snap.data()['Category Name'];
          if (Array.isArray(arr)) setBusinessCategories(arr);
        }
      } catch (err) {}
    };
    fetchCategories();
  }, []);

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
              <BusinessTypeSelector value={formData.userType} onChange={(val: 'wholesale' | 'retail') => handleInputChange('userType', val)} />

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

              {/* Password Field */}
              <View style={{ position: 'relative' }}>
                <FormInput
                  label="Create Password *"
                  value={formData.password}
                  onChangeText={(text: string) => handleInputChange('password', text)}
                  placeholder="Create a password (min 6 chars)"
                  error={errors.password}
                  secureTextEntry={!showPassword}
                  inputStyle={{ color: '#333' }} // <-- set visible text color
                />
                <TouchableOpacity
                  style={{ position: 'absolute', right: 12, top: 38 }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={{ color: '#FF8C00', fontWeight: 'bold' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Wholesaler Fields */}
              {formData.userType === 'wholesale' && (
                <WholesalerFields
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                />
              )}

              {/* Business Category */}
              <Text style={styles.label}>Business Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="Type to search category"
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                {selectedCategories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={{ backgroundColor: '#FF8C00', borderRadius: 12, padding: 6, margin: 4 }}
                    onPress={() =>
                      setSelectedCategories(selectedCategories.filter(c => c !== cat))
                    }
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{cat} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {businessCategories
                .filter(cat =>
                  cat.toLowerCase().includes(categorySearch.toLowerCase()) &&
                  !selectedCategories.includes(cat)
                )
                .slice(0, 5) // show max 5 suggestions
                .map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={{
                      backgroundColor: '#FFF8E1',
                      borderRadius: 8,
                      padding: 8,
                      marginVertical: 2,
                      borderWidth: 1,
                      borderColor: '#bbb',
                    }}
                    onPress={() => {
                      setSelectedCategories([...selectedCategories, cat]);
                      setCategorySearch('');
                    }}
                  >
                    <Text style={{ color: '#333' }}>{cat}</Text> {/* <-- dark text color */}
                  </TouchableOpacity>
                ))}
              {!!errors.businessCategory && (
                <Text style={styles.errorText}>{errors.businessCategory}</Text>
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
