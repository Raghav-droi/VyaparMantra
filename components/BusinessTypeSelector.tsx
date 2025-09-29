import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function BusinessTypeSelector({ value, onChange }) {
  return (
    <View>
      <Text style={styles.label}>Business Type *</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => onChange('retail')}
        >
          <View style={[styles.radioCircle, value === 'retail' && styles.selectedRadio]} />
          <Text style={styles.radioText}>Retail Business</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => onChange('wholesaler')}
        >
          <View style={[styles.radioCircle, value === 'wholesaler' && styles.selectedRadio]} />
          <Text style={styles.radioText}>Wholesaler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginTop: 10, marginBottom: 6, color: "#3949AB", fontSize: 15 },
  radioGroup: { flexDirection: 'row', marginBottom: 10, justifyContent: "space-between" },
  radioButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  radioCircle: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#FF8C00', alignItems: 'center', justifyContent: 'center', backgroundColor: "#fff" },
  selectedRadio: { backgroundColor: '#FF8C00' },
  radioText: { marginLeft: 6, fontSize: 16, color: "#333" },
});