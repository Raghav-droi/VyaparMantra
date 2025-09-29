import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function WholesalerFields({ formData, errors, handleInputChange }) {
  return (
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
        placeholder="Enter account number"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
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
        onChangeText={text => handleInputChange('ifscCode', text.toUpperCase())}
        value={formData.ifscCode}
        placeholder="Enter IFSC code"
        placeholderTextColor="#aaa"
        autoCapitalize="characters"
      />
      {!!errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginTop: 10, marginBottom: 6, color: "#3949AB", fontSize: 15 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: "#FFF8E1", marginBottom: 4 },
  errorInput: { borderColor: 'red' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 4 },
});