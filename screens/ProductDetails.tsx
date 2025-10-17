import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '../App';
import { getAuth } from '@react-native-firebase/auth';

type RouteParams = { productId: string; name?: string };

type WholesalerOffer = {
  id: string;
  wholesalerId: string;
  wholesalerName: string;
  pricePerUnit: number;
  minQty?: number;
  unit?: string;
};

export default function ProductDetails() {
  const navigation = useNavigation();
  const { productId } = (navigation.params as RouteParams) || {};
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [offers, setOffers] = useState<WholesalerOffer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const db = firestore();
        const prodSnap = await db.collection('products').doc(productId).get();
        if (prodSnap.exists) {
          setProduct({ id: prodSnap.id, ...prodSnap.data() });
        }
        // Offers: either embedded in products or separate collection `wholesalerProducts`
        const offerSnap = await db
          .collection('wholesalerProducts')
          .where('productId', '==', productId)
          .limit(20)
          .get();
        const list: WholesalerOffer[] = offerSnap.docs.map(d => ({
          id: d.id,
          wholesalerId: (d.data() as any).wholesalerId,
          wholesalerName: (d.data() as any).wholesalerName,
          pricePerUnit: (d.data() as any).pricePerUnit ?? ((d.data() as any).priceTiers?.[0]?.pricePerUnit ?? 0),
          minQty: (d.data() as any).priceTiers?.[0]?.minQty,
          unit: (d.data() as any).unit,
        }));
        setOffers(list.sort((a, b) => a.pricePerUnit - b.pricePerUnit));
      } catch (e) {
        setProduct(null);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchData();
  }, [productId]);

  const requestProduct = async (offer: WholesalerOffer) => {
    const user = getAuth().currentUser;
    if (!user?.phoneNumber) {
      Alert.alert('Sign in required', 'Please login to request products');
      return;
    }
    try {
      const retailerId = user.phoneNumber.replace('+91', '');
      const db = firestore();
      const orderRef = await db.collection('orders').add({
        productId,
        productName: product?.name,
        unit: product?.unit,
        qty: offer.minQty || 1,
        pricePerUnit: offer.pricePerUnit,
        wholesalerId: offer.wholesalerId,
        wholesalerName: offer.wholesalerName,
        retailerId,
        status: 'requested',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert('Requested', 'Request sent to wholesaler for confirmation');
      navigation.navigate('OrderTracking', { orderId: orderRef.id });
    } catch (e) {
      Alert.alert('Error', 'Failed to create request');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 24 }} color="#1e3a8a" />;
  }

  if (!product) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#b91c1c' }}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.meta}>{product.category} • {product.unit}</Text>
      </View>
      <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
        <Text style={styles.section}>Wholesaler Offers</Text>
      </View>
      <FlatList
        data={offers}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        renderItem={({ item }) => (
          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>{item.wholesalerName}</Text>
            <Text style={styles.offerMeta}>₹{item.pricePerUnit} / {product.unit} {item.minQty ? `(Min ${item.minQty})` : ''}</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => requestProduct(item)}>
              <Text style={styles.ctaText}>Request</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#6b7280', paddingHorizontal: 12 }}>No offers yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#1e3a8a' },
  meta: { color: '#6b7280', marginTop: 4 },
  section: { color: '#1f2937', fontWeight: '700' },
  offerCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  offerTitle: { fontWeight: '700', color: '#111827' },
  offerMeta: { color: '#374151', marginTop: 4 },
  ctaBtn: { marginTop: 10, backgroundColor: '#1e3a8a', borderRadius: 8, alignItems: 'center', paddingVertical: 10 },
  ctaText: { color: '#fff', fontWeight: '700' },
});



