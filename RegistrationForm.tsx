import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Checkbox from '@react-native-community/checkbox';
import DropDownPicker from 'react-native-dropdown-picker';
import Geolocation from '@react-native-community/geolocation';

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
  termsAccepted: boolean | string;
}

export default function RegistrationForm() {
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

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [otpSent, setOtpSent] = useState(false);

  const [openIdProofType, setOpenIdProofType] = useState(false);
  const [idProofTypeItems, setIdProofTypeItems] = useState([
    { label: 'Aadhar Card', value: 'aadhar' },
    { label: 'PAN Card', value: 'pan' },
    { label: 'Passport', value: 'passport' },
    { label: 'Driving License', value: 'driving_license' },
    { label: 'Voter ID', value: 'voter_id' },
  ]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.businessOwnerName.trim()) newErrors.businessOwnerName = 'Required';
    if (!formData.idProofType.trim()) newErrors.idProofType = 'Required';
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
    const isBasicValid = formData.businessOwnerName.trim() !== '' &&
      formData.idProofType.trim() !== '' &&
      formData.idProof.trim() !== '' &&
      formData.tradeName.trim() !== '' &&
      formData.address.trim() !== '' &&
      /^\d{10}$/.test(formData.phoneNumber) &&
      formData.termsAccepted &&
      otpSent;

    if (formData.userType === 'wholesaler') {
      return isBasicValid &&
        formData.gstinNumber.trim() !== '' &&
        formData.currentAccountDetails.trim() !== '' &&
        formData.bankName.trim() !== '' &&
        formData.ifscCode.trim() !== '';
    }
    return isBasicValid;
  };

  const handleSendOTP = () => {
    if (formData.phoneNumber && /^\d{10}$/.test(formData.phoneNumber)) {
      setOtpSent(true);
      Alert.alert('OTP Sent', `OTP sent to ${formData.phoneNumber}`);
    } else {
      setErrors(prev => ({ ...prev, phoneNumber: 'Enter valid 10-digit phone' }));
    }
  };

  const handleFetchLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleInputChange('location', `${latitude}, ${longitude}`);
      },
      (error) => {
        Alert.alert('Location Error', 'Unable to fetch location.');
      }
    );
  };

  const handleSubmit = () => {
    if (validateForm()) {
      Alert.alert('Success', "Registration submitted successfully!");
      console.log(formData);
    } else {
      Alert.alert('Validation Error', 'Please fix errors before submitting.');
    }
  };

  return (
    <LinearGradient
      colors={["#FF8C00", "#FFB347", "#FFD580"]}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Business Registration</Text>

          {/* User Type */}
          <Text style={styles.label}>Business Type *</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => handleInputChange('userType', 'retail')}
            >
              <View style={[styles.radioCircle, formData.userType === 'retail' && styles.selectedRadio]} />
              <Text style={styles.radioText}>Retail Business</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => handleInputChange('userType', 'wholesaler')}
            >
              <View style={[styles.radioCircle, formData.userType === 'wholesaler' && styles.selectedRadio]} />
              <Text style={styles.radioText}>Wholesaler</Text>
            </TouchableOpacity>
          </View>

          {/* Owner Name */}
          <Text style={styles.label}>Business Owner Name *</Text>
          <TextInput
            style={[styles.input, errors.businessOwnerName && styles.errorInput]}
            onChangeText={text => handleInputChange('businessOwnerName', text)}
            value={formData.businessOwnerName}
            placeholder="Enter owner name"
            placeholderTextColor="#aaa"
          />
          {!!errors.businessOwnerName && <Text style={styles.errorText}>{errors.businessOwnerName}</Text>}

          {/* ID Proof Type */}
          <Text style={styles.label}>ID Proof Type *</Text>
          <DropDownPicker
            open={openIdProofType}
            value={formData.idProofType}
            items={idProofTypeItems}
            setOpen={setOpenIdProofType}
            setValue={value => handleInputChange('idProofType', value)}
            setItems={setIdProofTypeItems}
            style={styles.dropdown}
            containerStyle={{ marginBottom: 10 }}
            placeholder="Select ID Proof"
            placeholderStyle={{ color: "#aaa" }}
          />
          {!!errors.idProofType && <Text style={styles.errorText}>{errors.idProofType}</Text>}

          {/* ID Proof Number */}
          <Text style={styles.label}>ID Proof Number *</Text>
          <TextInput
            style={[styles.input, errors.idProof && styles.errorInput]}
            onChangeText={text => handleInputChange('idProof', text)}
            value={formData.idProof}
            placeholder="Enter ID proof number"
            placeholderTextColor="#aaa"
          />
          {!!errors.idProof && <Text style={styles.errorText}>{errors.idProof}</Text>}

          {/* Trade Name */}
          <Text style={styles.label}>Trade Name *</Text>
          <TextInput
            style={[styles.input, errors.tradeName && styles.errorInput]}
            onChangeText={text => handleInputChange('tradeName', text)}
            value={formData.tradeName}
            placeholder="Enter trade name"
            placeholderTextColor="#aaa"
          />
          {!!errors.tradeName && <Text style={styles.errorText}>{errors.tradeName}</Text>}

          {/* Address */}
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.errorInput]}
            onChangeText={text => handleInputChange('address', text)}
            value={formData.address}
            placeholder="Enter address"
            placeholderTextColor="#aaa"
          />
          {!!errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

          {/* Location */}
          <View style={styles.locationRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.location}
              placeholder="Location (lat, long)"
              placeholderTextColor="#aaa"
              editable={false}
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleFetchLocation}
            >
              <Text style={styles.locationButtonText}>Fetch</Text>
            </TouchableOpacity>
          </View>

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
            />
            <TouchableOpacity
              style={[styles.locationButton, otpSent && { backgroundColor: '#aaa' }]}
              onPress={handleSendOTP}
              disabled={otpSent}
            >
              <Text style={styles.locationButtonText}>{otpSent ? 'OTP Sent' : 'Send OTP'}</Text>
            </TouchableOpacity>
          </View>
          {!!errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

          {/* Wholesaler Fields */}
          {formData.userType === 'wholesaler' && (
            <>
              <Text style={styles.label}>GSTIN Number *</Text>
              <TextInput
                style={[styles.input, errors.gstinNumber && styles.errorInput]}
                onChangeText={text => handleInputChange('gstinNumber', text)}
                value={formData.gstinNumber}
                placeholder="Enter GSTIN number"
                placeholderTextColor="#aaa"
              />
              {!!errors.gstinNumber && <Text style={styles.errorText}>{errors.gstinNumber}</Text>}

              <Text style={styles.label}>Current Account Details *</Text>
              <TextInput
                style={[styles.input, errors.currentAccountDetails && styles.errorInput]}
                onChangeText={text => handleInputChange('currentAccountDetails', text)}
                value={formData.currentAccountDetails}
                placeholder="Enter account details"
                placeholderTextColor="#aaa"
              />
              {!!errors.currentAccountDetails && <Text style={styles.errorText}>{errors.currentAccountDetails}</Text>}

              <Text style={styles.label}>Bank Name *</Text>
              <TextInput
                style={[styles.input, errors.bankName && styles.errorInput]}
                onChangeText={text => handleInputChange('bankName', text)}
                value={formData.bankName}
                placeholder="Enter bank name"
                placeholderTextColor="#aaa"
              />
              {!!errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}

              <Text style={styles.label}>IFSC Code *</Text>
              <TextInput
                style={[styles.input, errors.ifscCode && styles.errorInput]}
                onChangeText={text => handleInputChange('ifscCode', text)}
                value={formData.ifscCode}
                placeholder="Enter IFSC code"
                placeholderTextColor="#aaa"
              />
              {!!errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
            </>
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
            style={[styles.submitButton, !isFormValidAndReady() && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!isFormValidAndReady()}
          >
            <Text style={styles.submitButtonText}>Register Business</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});
