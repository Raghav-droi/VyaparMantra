import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function LocationField({ value, loading, onFetch }) {
  return (
    <>
      <Text style={styles.label}>Location</Text>
      <View style={styles.locationRow}>
        <TextInput
          style={[styles.input, { flex: 1, textAlign: 'left' }]}
          value={value}
          placeholder="Location"
          placeholderTextColor="#aaa"
          editable={false}
          textAlign="left"
        />
        <TouchableOpacity
          style={[styles.locationButton, loading && { backgroundColor: '#aaa' }]}
          onPress={onFetch}
          disabled={loading}
        >
          <Text style={styles.locationButtonText}>
            {loading ? 'Fetching...' : 'Fetch Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginTop: 10, marginBottom: 6, color: "#3949AB", fontSize: 15 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: "#FFF8E1", marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  locationButton: { backgroundColor: '#FF8C00', marginLeft: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, elevation: 2 },
  locationButtonText: { color: '#fff', fontWeight: 'bold' },
});