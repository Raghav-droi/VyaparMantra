import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Camera, Eye, Package, DollarSign, Plus, X, Tag, Save, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, Timestamp, setDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path if needed
import { useRoute, useNavigation } from '@react-navigation/native';

type AddProductRouteParams = {
  userId: string;
  tradeName?: string;
};

export default function AddProductPage() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, tradeName } = (route.params as AddProductRouteParams) || {};

  const [productImages, setProductImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);

  // Master product info
  const [form, setForm] = useState({
    productName: '', brand: '', category: '', description: '', unit: '', image: ''
  });

  // Wholesaler-specific info
  const [priceTiers, setPriceTiers] = useState<
    { minQty: number; maxQty: number; pricePerUnit: number }[]
  >([]);
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [deliveryAreas, setDeliveryAreas] = useState<string[]>([]);

  // Add price tier
  const addPriceTier = () => {
    if (minQty && maxQty && pricePerUnit) {
      setPriceTiers([
        ...priceTiers,
        {
          minQty: Number(minQty),
          maxQty: Number(maxQty),
          pricePerUnit: Number(pricePerUnit),
        },
      ]);
      setMinQty('');
      setMaxQty('');
      setPricePerUnit('');
    }
  };

  // Add delivery area
  const addDeliveryArea = () => {
    const area = deliveryArea.trim();
    if (area && !deliveryAreas.includes(area)) {
      setDeliveryAreas([...deliveryAreas, area]);
      setDeliveryArea('');
    }
  };

  // Remove delivery area
  const removeDeliveryArea = (area: string) => {
    setDeliveryAreas(deliveryAreas.filter(a => a !== area));
  };

  // Image upload
  const handleImageUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) {
      setProductImages([...productImages, result.assets[0].uri]);
      setForm(f => ({ ...f, image: result.assets[0].uri }));
    }
  };
  const removeImage = idx => setProductImages(images => images.filter((_, i) => i !== idx));

  // Save product
  const handleSave = async () => {
    if (!form.productName || !form.category || !form.brand || !form.unit) {
      Alert.alert('Missing Info', 'Product name, brand, category, and unit are required.');
      return;
    }
    if (priceTiers.length === 0) {
      Alert.alert('Missing Info', 'Add at least one price tier.');
      return;
    }
    setLoading(true);
    try {
      // 1. Add to products (master catalog)
      const productId = form.productName.trim().replace(/\s+/g, "_").toLowerCase();
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        await setDoc(productRef, {
          productName: form.productName,
          brand: form.brand,
          category: form.category.trim().toUpperCase(),
          description: form.description,
          unit: form.unit,
          image: form.image,
          searchName: form.productName.trim().toUpperCase(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      // 2. Check for duplicate in wholesalerProducts
      const q = query(
        collection(db, 'wholesalerProducts'),
        where('wholesalerId', '==', userId),
        where('productId', '==', productId)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        Alert.alert('Duplicate', 'You have already listed this product.');
        setLoading(false);
        return;
      }

      // 3. Add to wholesalerProducts
      await addDoc(collection(db, 'wholesalerProducts'), {
        wholesalerId: userId,
        wholesalerName: tradeName || '',
        productId: productId,
        brand: form.brand,
        priceTiers,
        available: isAvailable,
        stock: null,
        deliveryArea: deliveryAreas,
        rating: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isFeatured,
        tags,
        images: productImages,
        description: form.description,
        unit: form.unit,
        pricePerUnit: priceTiers[0]?.pricePerUnit || 0,
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
        
        {/* Product Images */}
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

        {/* Master Product Info */}
        <View style={styles.card}>
          <View style={styles.cardTitle}><Package stroke="#222" width={18} /><Text style={{ marginLeft: 7 }}>Basic Information</Text></View>
          <TextInput style={styles.input} placeholder="Product Name *" value={form.productName} onChangeText={t => setForm(f => ({ ...f, productName: t }))} />
          <TextInput style={styles.input} placeholder="Brand *" value={form.brand} onChangeText={t => setForm(f => ({ ...f, brand: t }))} />
          <TextInput style={styles.input} placeholder="Category *" value={form.category} onChangeText={t => setForm(f => ({ ...f, category: t }))} />
          <TextInput style={styles.input} placeholder="Unit * (e.g. 1L, 1kg)" value={form.unit} onChangeText={t => setForm(f => ({ ...f, unit: t }))} />
          <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={t => setForm(f => ({ ...f, description: t }))} />
        </View>

        {/* Price Tiers */}
        <View style={styles.card}>
          <View style={styles.cardTitle}><DollarSign stroke="#222" width={18} /><Text style={{ marginLeft: 7 }}>Price Tiers</Text></View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min Qty" value={minQty} onChangeText={setMinQty} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Max Qty" value={maxQty} onChangeText={setMaxQty} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Price/Unit" value={pricePerUnit} onChangeText={setPricePerUnit} keyboardType="numeric" />
            <TouchableOpacity onPress={addPriceTier}><Plus stroke="#2563eb" width={18} /></TouchableOpacity>
          </View>
          <View style={{ marginTop: 8 }}>
            {priceTiers.map((tier, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: "#222" }}>
                  {tier.minQty} - {tier.maxQty} units: ₹{tier.pricePerUnit}
                </Text>
                <TouchableOpacity onPress={() => setPriceTiers(priceTiers.filter((_, i) => i !== idx))}>
                  <X stroke="#e11d48" width={13} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Areas */}
        <View style={styles.card}>
          <View style={styles.cardTitle}><Tag stroke="#222" width={18} /><Text style={{ marginLeft: 7 }}>Delivery Areas</Text></View>
          <View style={{ flexDirection: "row" }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Add area" value={deliveryArea} onChangeText={setDeliveryArea} onSubmitEditing={addDeliveryArea} />
            <TouchableOpacity onPress={addDeliveryArea}><Plus stroke="#2563eb" width={18} /></TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 7 }}>
            {deliveryAreas.map(area => (
              <View key={area} style={styles.tagBadge}>
                <Text>{area}</Text>
                <TouchableOpacity onPress={() => removeDeliveryArea(area)}><X stroke="#111" width={13} /></TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Tags & Settings */}
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
