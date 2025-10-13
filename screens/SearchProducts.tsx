import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

type ProductDoc = {
  id: string;
  productId: string;
  name: string;
  searchName?: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  imageUrl?: string;
  wholesalerId: string;
  wholesalerName: string;
};

const CATEGORIES = [
  'ALL',
  'GRAINS & CEREALS',
  'VEGETABLES',
  'FRUITS',
  'DAIRY PRODUCTS',
  'OIL & SPICES',
  'BEVERAGES',
  'SNACKS',
  'MEAT & POULTRY',
  'FROZEN FOODS',
];

export default function SearchProducts() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductDoc[]>([]);

  const normalizedQuery = useMemo(() => query.trim().toUpperCase(), [query]);

  const runSearch = async () => {
    setLoading(true);
    try {
      const db = firestore();
      let ref = db.collection('products');

      const filters: Promise<FirebaseFirestoreTypes.QuerySnapshot> | null = null;

      // We support either category filter, name search, or both (category + prefix range on searchName)
      if (category !== 'ALL' && normalizedQuery) {
        const snap = await ref
          .where('category', '==', category)
          .where('searchName', '>=', normalizedQuery)
          .where('searchName', '<=', normalizedQuery + '\uf8ff')
          .limit(20)
          .get();
        setResults(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any);
      } else if (category !== 'ALL') {
        const snap = await ref.where('category', '==', category).limit(30).get();
        setResults(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any);
      } else if (normalizedQuery) {
        const snap = await ref
          .where('searchName', '>=', normalizedQuery)
          .where('searchName', '<=', normalizedQuery + '\uf8ff')
          .limit(30)
          .get();
        setResults(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any);
      } else {
        // Default: show a few featured/recent
        const snap = await ref.orderBy('createdAt', 'desc').limit(20).get();
        setResults(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by product name"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={runSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, item === category && styles.categoryChipActive]}
              onPress={() => {
                setCategory(item);
                // auto-run search when category changes
                setTimeout(runSearch, 0);
              }}
            >
              <Text style={[styles.categoryText, item === category && styles.categoryTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color="#1e3a8a" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.productId, name: item.name })}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>{item.category} • {item.unit}</Text>
              <Text style={styles.cardMeta}>From ₹{item.pricePerUnit} • {item.wholesalerName}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f3f4f6',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchBtn: {
    marginLeft: 8,
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  categoryRow: { paddingHorizontal: 8, paddingVertical: 6 },
  categoryChip: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#1e3a8a' },
  categoryText: { color: '#1e3a8a', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a8a' },
  cardMeta: { color: '#4b5563', marginTop: 4, fontSize: 12 },
});



