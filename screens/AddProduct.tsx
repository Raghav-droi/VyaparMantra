import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Camera, Eye, Package, DollarSign, Plus, X, Tag, Save, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path if needed
import { useRoute, useNavigation } from '@react-navigation/native';

export default function AddProductPage() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params || {};

  const [productImages, setProductImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: '', category: '', description: '', brand: '', manufacturer: '', stockQuantity: '', baseUnit: '',
    minOrder: '', maxOrder: '', weight: '', dimensions: '', expiryDate: '', processingTime: '', storageConditions: ""
  });

  const handleImageUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setProductImages([...productImages, result.assets[0].uri]);
  };
  const removeImage = idx => setProductImages(images => images.filter((_, i) => i !== idx));
  const addTag = () => {
    const tag = currentTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setCurrentTag('');
    }
  };
  const removeTag = tagToRemove => setTags(tags => tags.filter(tag => tag !== tagToRemove));

  const handleSave = async () => {
    if (!form.productName || !form.category) {
      Alert.alert('Missing Info', 'Product name and category are required.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        ...form,
        tags,
        images: productImages,
        isAvailable,
        isFeatured,
        ownerId: userId,
        createdAt: Timestamp.now(),
      });
      Alert.alert('Success', 'Product added successfully!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fde047' }}>
      <ScrollView style={{ flex: 1, padding: 10 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft stroke="#fff" width={24} /></TouchableOpacity>
          <Text style={styles.headerText}>Add New Product</Text>
          <TouchableOpacity><Eye stroke="#fff" width={24} /></TouchableOpacity>
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardTitle}><Camera stroke="#222" width={18} /><Text style={{ marginLeft: 7 }}>Product Images</Text></View>
          <View style={{ flexDirection: 'row', flexWrap: "wrap" }}>
            {productImages.map((uri, idx) => (
              <View key={uri} style={styles.imgWrap}>
                <Image source={{ uri }} style={styles.imgThumb} />
                <TouchableOpacity style={styles.imgRemove} onPress={() => removeImage(idx)}><X stroke="#fff" width={13} /></TouchableOpacity>
              </View>
            ))}
            {productImages.length < 6 && (
              <TouchableOpacity style={styles.imgAdd} onPress={handleImageUpload}>
                <Upload stroke="#888" width={26} height={26} />
                <Text style={{ fontSize: 10, color: "#888" }}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.hintText}>Upload up to 6 images.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitle}><Package stroke="#222" width={18} /><Text style={{ marginLeft: 7 }}>Basic Information</Text></View>
          <TextInput style={styles.input} placeholder="Product Name *" value={form.productName} onChangeText={t => setForm(f => ({ ...f, productName: t }))} />
          <TextInput style={styles.input} placeholder="Category *" value={form.category} onChangeText={t => setForm(f => ({ ...f, category: t }))} />
          <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={t => setForm(f => ({ ...f, description: t }))} />
          <TextInput style={styles.input} placeholder="Brand" value={form.brand} onChangeText={t => setForm(f => ({ ...f, brand: t }))} />
          <TextInput style={styles.input} placeholder="Manufacturer" value={form.manufacturer} onChangeText={t => setForm(f => ({ ...f, manufacturer: t }))} />
          <TextInput style={styles.input} placeholder="Stock Quantity" value={form.stockQuantity} onChangeText={t => setForm(f => ({ ...f, stockQuantity: t }))} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Base Unit" value={form.baseUnit} onChangeText={t => setForm(f => ({ ...f, baseUnit: t }))} />
          <TextInput style={styles.input} placeholder="Min Order" value={form.minOrder} onChangeText={t => setForm(f => ({ ...f, minOrder: t }))} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Max Order" value={form.maxOrder} onChangeText={t => setForm(f => ({ ...f, maxOrder: t }))} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Weight" value={form.weight} onChangeText={t => setForm(f => ({ ...f, weight: t }))} />
          <TextInput style={styles.input} placeholder="Dimensions" value={form.dimensions} onChangeText={t => setForm(f => ({ ...f, dimensions: t }))} />
          <TextInput style={styles.input} placeholder="Expiry Date" value={form.expiryDate} onChangeText={t => setForm(f => ({ ...f, expiryDate: t }))} />
          <TextInput style={styles.input} placeholder="Processing Time" value={form.processingTime} onChangeText={t => setForm(f => ({ ...f, processingTime: t }))} />
          <TextInput style={styles.input} placeholder="Storage Conditions" value={form.storageConditions} onChangeText={t => setForm(f => ({ ...f, storageConditions: t }))} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitle}><Tag stroke="#222" width={18} /><Text style={{ marginLeft: 7 }}>Tags & Settings</Text></View>
          <View style={{ flexDirection: "row" }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Add tag" value={currentTag} onChangeText={setCurrentTag} onSubmitEditing={addTag} />
            <TouchableOpacity onPress={addTag}><Plus stroke="#2563eb" width={18} /></TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 7 }}>
            {tags.map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}><X stroke="#111" width={13} /></TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.switchRow}>
            <Text>Product Available</Text>
            <Switch value={isAvailable} onValueChange={setIsAvailable} />
          </View>
          <View style={styles.switchRow}>
            <Text>Featured Product</Text>
            <Switch value={isFeatured} onValueChange={setIsFeatured} />
          </View>
        </View>

        <View style={{ flexDirection: "row", marginVertical: 12 }}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => navigation.goBack()}><Text style={{ color: "#222" }}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Save stroke="#fff" width={16} />}
            <Text style={{ color: "#fff", marginLeft: 8 }}>Save Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  headerText: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  card: { backgroundColor: "#fff", borderRadius: 13, marginVertical: 7, padding: 15, elevation: 2 },
  cardTitle: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 10, marginVertical: 6, backgroundColor: "#f9fafb" },
  imgWrap: { marginRight: 8, marginBottom: 8, position: "relative" },
  imgThumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#eee" },
  imgRemove: { position: "absolute", top: 2, right: 2, backgroundColor: "#e11d48", padding: 3, borderRadius: 9 },
  imgAdd: { width: 64, height: 64, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ddd", borderStyle: "dashed", marginBottom: 8, borderRadius: 8 },
  hintText: { color: "#999", fontSize: 11, marginTop: 4 },
  tagBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#e0e7ff", borderRadius: 10, padding: 6, marginRight: 7, marginTop: 5 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  btnCancel: { backgroundColor: "#fff", flex: 1, borderRadius: 10, justifyContent: "center", alignItems: "center", padding: 13, marginRight: 10 },
  btnSave: { backgroundColor: "#1e3a8a", flex: 1, borderRadius: 10, alignItems: "center", justifyContent: "center", padding: 13, flexDirection: "row" },
});
