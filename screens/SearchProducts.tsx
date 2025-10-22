import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, query as firestoreQuery, where, getDocs, limit } from '@react-native-firebase/firestore';
import { useNavigation } from '../App';

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
  const { initialQuery = '', category: initialCategory = 'ALL' } = navigation.params || {};
  
  // Ensure category is always set to 'ALL' if not provided or invalid
  const validCategory = CATEGORIES.includes(initialCategory) ? initialCategory : 'ALL';
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(validCategory);
  
  console.log('SearchProducts rendered with params:', { initialQuery, category: initialCategory });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProductDoc[]>([]);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const runSearch = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      
      // Get all products first, then filter client-side to avoid index issues
      let q = firestoreQuery(collection(db, 'products'), limit(100));
      const snap = await getDocs(q);
      let allProducts = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any;
      
      // Apply category filter
      if (category !== 'ALL') {
        allProducts = allProducts.filter((product: any) => product.category === category);
      }
      
      // Apply search filter
      if (normalizedQuery) {
        allProducts = allProducts.filter((product: any) => {
          const productName = (product.name || '').toLowerCase();
          const productSearchName = (product.searchName || '').toLowerCase();
          return productName.includes(normalizedQuery) || productSearchName.includes(normalizedQuery);
        });
      }
      
      // Limit results
      const searchResults = allProducts.slice(0, 50);
      setResults(searchResults);
    } catch (e) {
      console.error('Search error:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch();
    }, 300); // 300ms delay for search

    return () => clearTimeout(timer);
  }, [query, category]);

  useEffect(() => {
    // initial fetch
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products (e.g., rice, apple, milk)..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          autoCorrect={false}
          autoCapitalize="none"
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
              onPress={() => navigation.navigate('ProductWholesalers', { productId: item.id, productName: item.name })}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>{item.category} • {item.unit}</Text>
              <Text style={styles.cardMeta}>From ₹{item.pricePerUnit} • {item.wholesalerName}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
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



