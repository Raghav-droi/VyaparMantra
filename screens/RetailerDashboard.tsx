import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { LogOut, Home, ShoppingCart, Clock, Truck, Settings, X, Star, Heart, User, CreditCard } from 'lucide-react-native';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

const db = getFirestore();

const mockCategories = [
  'All Categories',
  'Grains & Cereals',
  'Vegetables',
  'Fruits',
  'Dairy Products',
  'Oil & Spices',
  'Beverages',
  'Snacks',
  'Meat & Poultry',
  'Frozen Foods',
];

const mockProducts = [
  {
    id: '1',
    name: 'Premium Basmati Rice',
    category: 'Grains & Cereals',
    image: '🌾',
    rating: 4.5,
    reviewCount: 128,
    inStock: true,
    wholesalers: [
      { name: 'Wholesale Central', price: 120, location: '2.5 km', rating: 4.8 },
      { name: 'Global Foods Ltd', price: 115, location: '5.1 km', rating: 4.6 },
      { name: 'Grain Masters', price: 125, location: '3.2 km', rating: 4.7 },
    ],
  },
  {
    id: '2', 
    name: 'Fresh Vegetables Mix',
    category: 'Vegetables',
    image: '🥬',
    rating: 4.2,
    reviewCount: 89,
    inStock: true,
    wholesalers: [
      { name: 'Farm Fresh Co', price: 80, location: '1.8 km', rating: 4.5 },
      { name: 'Green Valley', price: 75, location: '4.2 km', rating: 4.3 }
    ]
  },
  {
    id: '3',
    name: 'Refined Cooking Oil',
    category: 'Oil & Spices', 
    image: '🛢️',
    rating: 4.7,
    reviewCount: 203,
    inStock: false,
    wholesalers: [
      { name: 'Oil Masters', price: 150, location: '3.5 km', rating: 4.9 },
      { name: 'Pure Oils Inc', price: 145, location: '6.8 km', rating: 4.6 }
    ]
  }
];

const mockWholesalers = [
  {
    id: '1',
    name: 'Wholesale Central', 
    location: 'Mumbai, Maharashtra',
    distance: '2.5 km',
    rating: 4.8,
    reviewCount: 245,
    productCount: 127,
    verified: true,
    specialties: ['Grains', 'Oil & Spices']
  },
  {
    id: '2',
    name: 'Farm Fresh Co',
    location: 'Pune, Maharashtra', 
    distance: '1.8 km',
    rating: 4.5,
    reviewCount: 189,
    productCount: 89,
    verified: true,
    specialties: ['Vegetables', 'Fruits']
  },
  {
    id: '3',
    name: 'Global Foods Ltd',
    location: 'Delhi, NCR',
    distance: '5.1 km', 
    rating: 4.6,
    reviewCount: 156,
    productCount: 203,
    verified: false,
    specialties: ['Grains', 'Beverages']
  }
];

const mockCartItems = [
  {
    id: '1',
    productName: 'Premium Basmati Rice',
    wholesalerName: 'Wholesale Central',
    price: 120,
    quantity: 50,
    unit: 'kg',
    status: 'confirmed'
  },
  {
    id: '2', 
    productName: 'Fresh Vegetables Mix',
    wholesalerName: 'Farm Fresh Co',
    price: 80,
    quantity: 25,
    unit: 'kg', 
    status: 'pending'
  },
  {
    id: '3',
    productName: 'Refined Cooking Oil',
    wholesalerName: 'Oil Masters',
    price: 150,
    quantity: 10,
    unit: 'L',
    status: 'confirmed'
  }
];

const mockOrders = [
  {
    id: 'ORD001',
    date: '2024-01-15',
    total: 8750,
    status: 'delivered',
    wholesaler: 'Wholesale Central',
    items: ['Rice 50kg', 'Oil 10L'],
    deliveryDate: '2024-01-18'
  },
  {
    id: 'ORD002', 
    date: '2024-01-14',
    total: 2250,
    status: 'shipped',
    wholesaler: 'Farm Fresh Co',
    items: ['Vegetables 30kg'],
    deliveryDate: '2024-01-16'
  },
  {
    id: 'ORD003',
    date: '2024-01-13', 
    total: 1500,
    status: 'confirmed',
    wholesaler: 'Oil Masters',
    items: ['Oil 5L', 'Spices 2kg']
  }
];

type Screen = 'home' | 'productResults' | 'wholesalerResults' | 'cart' | 'confirmation' | 'payment' | 'tracking';

export default function RetailerDashboard({ navigation }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [retailerName, setRetailerName] = useState('--');
  const [retailerLocation, setRetailerLocation] = useState('--');
  const user = getAuth().currentUser;

  useEffect(() => {
    if (!user?.phoneNumber) return;
    const fetchProfile = async () => {
      try {
        const userDocRef = doc(db, 'retailer', user.phoneNumber.replace('+91', ''));
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setRetailerName(userSnap.data().storeName || '--');
          setRetailerLocation(userSnap.data().location || '--');
        } else {
          setRetailerName('--');
          setRetailerLocation('--');
        }
      } catch (err) {
        setRetailerName('--');
        setRetailerLocation('--');
      }
    };
    fetchProfile();
  }, [user]);

  // Navigation function
  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
    setSidebarOpen(false);
  };

  // Sidebar sign out
  const handleLogout = () => {
    setSidebarOpen(false);
    // Replace with your sign out logic
    Alert.alert('Signed Out', 'You have been signed out.');
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  // Screens
  const renderHomeScreen = () => (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.header}>Welcome, {retailerName}</Text>
      <Text style={styles.subHeader}>{retailerLocation}</Text>
      <Text style={styles.sectionTitle}>Popular Categories</Text>
      <View style={styles.categoryRow}>
        {mockCategories.slice(1, 5).map((cat) => (
          <TouchableOpacity key={cat} style={styles.categoryBtn}>
            <Text style={styles.categoryText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Featured Products</Text>
      <FlatList
        data={mockProducts}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Text style={styles.productImage}>{item.image}</Text>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Text style={styles.productRating}>⭐ {item.rating}</Text>
            <TouchableOpacity style={styles.addCartBtn}>
              <Text style={styles.addCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </ScrollView>
  );

  const renderCartScreen = () => (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.header}>My Cart</Text>
      {cartItems.map((item) => (
        <View key={item.id} style={styles.cartItem}>
          <Text style={styles.cartProduct}>{item.productName}</Text>
          <Text style={styles.cartWholesaler}>{item.wholesalerName}</Text>
          <Text style={styles.cartQty}>Qty: {item.quantity} {item.unit}</Text>
          <Text style={styles.cartPrice}>₹{item.price * item.quantity}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigateToScreen('confirmation')}>
        <Text style={styles.primaryBtnText}>Request Confirmation</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ...add renderProductResults, renderWholesalerResults, renderConfirmationScreen, renderPaymentScreen, renderTrackingScreen as needed...

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fbbf24' }}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <User color="#fff" size={32} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Retailer Dashboard</Text>
        <TouchableOpacity onPress={() => navigateToScreen('cart')}>
          <ShoppingCart color="#fff" size={32} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {currentScreen === 'home' && renderHomeScreen()}
        {currentScreen === 'cart' && renderCartScreen()}
        {/* Add other screens here */}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigateToScreen('home')}>
          <Home color={currentScreen === 'home' ? '#1e3a8a' : '#888'} size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateToScreen('cart')}>
          <ShoppingCart color={currentScreen === 'cart' ? '#1e3a8a' : '#888'} size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <Settings color="#888" size={28} />
        </TouchableOpacity>
      </View>

      {/* Sidebar */}
      <Modal visible={sidebarOpen} animationType="slide" transparent>
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Profile & Menu</Text>
              <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                <X color="#1e3a8a" size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.sidebarProfile}>
              <User color="#1e3a8a" size={48} />
              <Text style={styles.sidebarProfileName}>{retailerName}</Text>
              <Text style={styles.sidebarProfileLocation}>{retailerLocation}</Text>
            </View>
            <TouchableOpacity style={styles.sidebarBtn} onPress={handleLogout}>
              <LogOut color="#D14343" size={20} />
              <Text style={styles.sidebarBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
    padding: 12,
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  screenContainer: {
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginVertical: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryBtn: {
    backgroundColor: '#fde047',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 180,
    alignItems: 'center',
    elevation: 2,
  },
  productImage: {
    fontSize: 32,
    marginBottom: 8,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1e3a8a',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  productRating: {
    fontSize: 14,
    color: '#fbbf24',
    marginBottom: 8,
  },
  addCartBtn: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addCartText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  cartProduct: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1e3a8a',
  },
  cartWholesaler: {
    fontSize: 14,
    color: '#555',
  },
  cartQty: {
    fontSize: 13,
    color: '#888',
  },
  cartPrice: {
    fontSize: 15,
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  primaryBtn: {
    backgroundColor: '#1e3a8a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#fff',
    height: '100%',
    padding: 16,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sidebarTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1e3a8a',
  },
  sidebarProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sidebarProfileName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1e3a8a',
    marginTop: 8,
  },
  sidebarProfileLocation: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  sidebarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#ffe4e6',
    borderRadius: 8,
  },
  sidebarBtnText: {
    color: '#D14343',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 15,
  },
});