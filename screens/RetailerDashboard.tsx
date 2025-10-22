import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Home, ShoppingCart, Clock, Truck, Settings, X, Star, Heart, User, CreditCard, Search, Filter, Plus, Bell, Menu } from 'lucide-react-native';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc, addDoc, deleteDoc, serverTimestamp } from '@react-native-firebase/firestore';
import ProfessionalHeader from '../components/ui/ProfessionalHeader';
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedButton from '../components/ui/AnimatedButton';
import FloatingCart from '../components/ui/FloatingCart';
import { SkeletonLoader, SkeletonCard, SkeletonList } from '../components/ui/SkeletonLoader';
import { useNavigation } from '../App';

  const db = getFirestore();

type Screen = 'home' | 'productResults' | 'wholesalerResults' | 'cart' | 'confirmation' | 'payment' | 'tracking';

// Type definitions for dynamic data
interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  unit: string;
  image?: string;
  searchName: string;
  createdAt: any;
}

interface WholesalerProduct {
  id: string;
  wholesalerId: string;
  wholesalerName: string;
  productId: string;
  pricePerUnit: number;
  priceTiers: Array<{ minQty: number; maxQty: number; pricePerUnit: number }>;
  available: boolean;
  unit: string;
  rating?: number;
  deliveryArea: string[];
}

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  wholesalerId: string;
  wholesalerName: string;
  pricePerUnit: number;
  quantity: number;
  unit: string;
  status?: 'pending' | 'confirmed' | 'rejected';
  createdAt: any;
  totalPrice?: number;
}

interface Order {
  id: string;
  productId: string;
  productName: string;
  wholesalerId: string;
  wholesalerName: string;
  retailerId: string;
  qty: number;
  unit: string;
  pricePerUnit: number;
  status: 'requested' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: any;
  updatedAt: any;
}

export default function RetailerDashboard() {
  const navigation = useNavigation();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Dynamic data state
  const [categories, setCategories] = useState<string[]>(['ALL']);
  const [products, setProducts] = useState<Product[]>([]);
  const [wholesalerProducts, setWholesalerProducts] = useState<WholesalerProduct[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate input state
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortByPrice, setSortByPrice] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);
  const [within5km, setWithin5km] = useState(false);
  
  // User data
  const [retailerName, setRetailerName] = useState('--');
  const [retailerLocation, setRetailerLocation] = useState('--');
  const [error, setError] = useState<string | null>(null);
  const user = getAuth().currentUser;

  // Debug logging
  console.log('RetailerDashboard rendered:', {
    currentScreen,
    user: user?.phoneNumber,
    loading,
    error,
    productsCount: products.length,
    categoriesCount: categories.length
  });

  // Fetch retailer profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let retailerId;
        if (user?.phoneNumber) {
          // User has phone number in auth object
          retailerId = user.phoneNumber.replace('+91', '');
        } else if (user?.uid) {
          // User doesn't have phone number (custom token login), use UID
          retailerId = user.uid;
        } else {
          console.log('No user ID available for profile fetch');
          return;
        }

        console.log('Fetching retailer profile for ID:', retailerId);
        const userDoc = await getDoc(doc(db, 'retailer', retailerId));
        console.log('Retailer doc exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const name = data?.storeName || data?.businessOwnerName || '--';
          const location = data?.location || '--';
          console.log('Retailer profile data:', { name, location });
          setRetailerName(name);
          setRetailerLocation(location);
        } else {
          console.log('Retailer document not found');
          setRetailerName('--');
          setRetailerLocation('--');
        }
      } catch (err) {
        console.error('Error fetching retailer profile:', err);
        setRetailerName('--');
        setRetailerLocation('--');
      }
    };
    
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Fetch categories dynamically
  const fetchCategories = useCallback(async () => {
    try {
      console.log('Fetching categories...');
      const categoriesSnapshot = await getDocs(collection(db, 'products'));
      const uniqueCategories = new Set<string>();
      uniqueCategories.add('ALL');
      
      categoriesSnapshot.docs.forEach((doc: any) => {
        const category = doc.data().category;
        if (category) uniqueCategories.add(category);
      });
      
      setCategories(Array.from(uniqueCategories));
      console.log('Categories fetched successfully:', Array.from(uniqueCategories));
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  }, []);

  // Fetch products dynamically
  const fetchProducts = useCallback(async () => {
    try {
      console.log('Fetching products...');
      setLoading(true);
      setError(null);
      let q = query(collection(db, 'products'));
      
      // Apply category filter
      if (selectedCategory !== 'ALL') {
        q = query(q, where('category', '==', selectedCategory));
      }
      
      // Apply search filter - case insensitive partial search
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.trim().toLowerCase();
        q = query(q, 
          where('searchName', '>=', searchTerm),
          where('searchName', '<=', searchTerm + '\uf8ff')
        );
      }
      
      q = query(q, limit(50));
      const snapshot = await getDocs(q);
      const productsList: Product[] = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsList);
      console.log('Products fetched successfully:', productsList.length);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch wholesaler products for price comparison
  const fetchWholesalerProducts = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return;
    
    try {
      console.log('Fetching wholesaler products for productIds:', productIds);
      const q = query(
        collection(db, 'wholesalerProducts'),
        where('productId', 'in', productIds),
        where('available', '==', true)
      );
      const snapshot = await getDocs(q);
      
      console.log('Wholesaler products snapshot size:', snapshot.docs.length);
      
      const wholesalerProductsList: WholesalerProduct[] = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as WholesalerProduct[];
      
      console.log('Wholesaler products found:', wholesalerProductsList);
      setWholesalerProducts(wholesalerProductsList);
      
      // If no wholesaler products found, log the issue for debugging
      if (wholesalerProductsList.length === 0) {
        console.log('No wholesaler products found in Firestore for productIds:', productIds);
        console.log('This means either:');
        console.log('1. No wholesalers have added these products yet');
        console.log('2. The products are not marked as available');
        console.log('3. The productIds do not match the wholesalerProducts collection');
      }
    } catch (err) {
      console.error('Error fetching wholesaler products:', err);
    }
  }, []);

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get retailer ID from phone number or use UID as fallback
      let retailerId = user.phoneNumber?.replace('+91', '');
      if (!retailerId) {
        retailerId = user.uid;
      }
      
      console.log('Fetching cart items for retailerId:', retailerId);
      
      const q = query(
        collection(db, 'cart'),
        where('retailerId', '==', retailerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      console.log('Cart items found:', snapshot.docs.length);
      
      const cartItemsList: CartItem[] = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as CartItem[];
      
      console.log('Cart items data:', cartItemsList);
      setCartItems(cartItemsList);
    } catch (err) {
      console.error('Error fetching cart items:', err);
    }
  }, [user]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!user?.phoneNumber) return;
    
    try {
      const retailerId = user.phoneNumber.replace('+91', '');
      const q = query(
        collection(db, 'orders'),
        where('retailerId', '==', retailerId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      
      const ordersList: Order[] = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setOrders(ordersList);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, [user]);

  // Initial data load
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchCartItems();
    fetchOrders();
  }, [fetchCategories, fetchProducts, fetchCartItems, fetchOrders]);

  // Refresh cart when component comes into focus
  useEffect(() => {
    const refreshCart = () => {
      fetchCartItems();
    };

    // Refresh cart every time the component mounts or when currentScreen changes
    refreshCart();
  }, [currentScreen, fetchCartItems]);

  // Periodic cart refresh (every 5 seconds when on dashboard)
  useEffect(() => {
    if (currentScreen === 'home' || currentScreen === 'cart') {
      const interval = setInterval(() => {
        fetchCartItems();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentScreen, fetchCartItems]);

  // Update wholesaler products when products change
  useEffect(() => {
    const productIds = products.map(p => p.productId);
    fetchWholesalerProducts(productIds);
  }, [products, fetchWholesalerProducts]);

  // Navigation function
  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
    setSidebarOpen(false);
  };

  // Add to cart function
  const addToCart = async (productId: string, wholesalerId: string, pricePerUnit: number) => {
    if (!user) {
      Alert.alert('Error', 'Please login to add items to cart');
      return;
    }

    try {
      // Get retailer ID from phone number or use UID as fallback
      let retailerId = user.phoneNumber?.replace('+91', '');
      if (!retailerId) {
        // For password login, use UID as retailer ID
        retailerId = user.uid;
      }
      
      const product = products.find(p => p.productId === productId);
      const wholesalerProduct = wholesalerProducts.find(wp => 
        wp.productId === productId && wp.wholesalerId === wholesalerId
      );

      if (!product || !wholesalerProduct) {
        Alert.alert('Error', 'Product or wholesaler not found');
        return;
      }

      // Check if item already exists in cart
      const existingItem = cartItems.find(item => 
        item.productId === productId && item.wholesalerId === wholesalerId
      );

      if (existingItem) {
        Alert.alert('Already in Cart', 'This item is already in your cart');
        return;
      }

      const cartItem = {
        productId,
        productName: product.name,
        wholesalerId,
        wholesalerName: wholesalerProduct.wholesalerName,
        pricePerUnit,
        quantity: wholesalerProduct.priceTiers[0]?.minQty || 1,
        unit: product.unit,
        status: 'pending' as const,
        retailerId,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'cart'), cartItem);
      await fetchCartItems(); // Refresh cart
      Alert.alert('Success', 'Item added to cart');
    } catch (err) {
      console.error('Error adding to cart:', err);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  // Remove from cart function
  const removeFromCart = async (cartItemId: string) => {
    try {
      await deleteDoc(doc(db, 'cart', cartItemId));
      await fetchCartItems(); // Refresh cart
      Alert.alert('Success', 'Item removed from cart');
    } catch (err) {
      console.error('Error removing from cart:', err);
      Alert.alert('Error', 'Failed to remove item from cart');
    }
  };

  // Request confirmation for cart items
  const requestConfirmation = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    try {
      const retailerId = user?.phoneNumber?.replace('+91', '');
      if (!retailerId) return;

      // Create orders for each cart item
      const orderPromises = cartItems.map(async (item) => {
        const orderData = {
          productId: item.productId,
          productName: item.productName,
          wholesalerId: item.wholesalerId,
          wholesalerName: item.wholesalerName,
          retailerId,
          qty: item.quantity,
          pricePerUnit: item.pricePerUnit,
          status: 'requested' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        return addDoc(collection(db, 'orders'), orderData);
      });

      await Promise.all(orderPromises);
      
      // Clear cart after creating orders
      const deletePromises = cartItems.map(item => 
        deleteDoc(doc(db, 'cart', item.id))
      );
      await Promise.all(deletePromises);
      
      await fetchCartItems();
      await fetchOrders();
      
      Alert.alert('Success', 'Order requests sent to wholesalers');
      navigateToScreen('confirmation');
    } catch (err) {
      console.error('Error requesting confirmation:', err);
      Alert.alert('Error', 'Failed to send order requests');
    }
  };

  // Sidebar sign out
  const handleLogout = async () => {
    setSidebarOpen(false);
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await signOut(auth);
        console.log('Retailer signed out successfully');
        Alert.alert('Signed Out', 'You have been signed out.');
      } else {
        console.log('No user to sign out (already signed out)');
        Alert.alert('Already Signed Out', 'You are already signed out.');
      }
      navigation.navigate('Home');
    } catch (err) {
      console.error('Error signing out:', err);
      Alert.alert('Error', 'Failed to sign out, but redirecting to home.');
      navigation.navigate('Home');
    }
  };

  // Helper function to get wholesalers for a product
  const getProductWholesalers = (productId: string) => {
    return wholesalerProducts.filter(wp => wp.productId === productId);
  };

  // Helper function to get best price for a product
  const getBestPrice = (productId: string) => {
    const productWholesalers = getProductWholesalers(productId);
    if (productWholesalers.length === 0) {
      console.log('No wholesalers found for product:', productId);
      return null;
    }
    
    // Get all prices from all wholesalers for this product
    const allPrices = productWholesalers.map(wp => wp.pricePerUnit);
    console.log('Prices for product', productId, ':', allPrices);
    
    const minPrice = Math.min(...allPrices);
    console.log('Minimum price for product', productId, ':', minPrice);
    
    return minPrice;
  };

  // Helper function to get average rating for a product
  const getAverageRating = (productId: string) => {
    const productWholesalers = getProductWholesalers(productId);
    if (productWholesalers.length === 0) return 0;
    
    const ratings = productWholesalers.map(wp => wp.rating || 0).filter(r => r > 0);
    if (ratings.length === 0) return 0;
    
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };

  // Get sorted products based on active filters
  const getSortedProducts = () => {
    let sortedProducts = [...products];
    
    if (sortByPrice) {
      sortedProducts.sort((a, b) => {
        const priceA = getBestPrice(a.productId) || Infinity;
        const priceB = getBestPrice(b.productId) || Infinity;
        return priceA - priceB;
      });
    } else if (sortByRating) {
      sortedProducts.sort((a, b) => {
        const ratingA = getAverageRating(a.productId);
        const ratingB = getAverageRating(b.productId);
        return ratingB - ratingA; // Higher rating first
      });
    }
    
    return sortedProducts.slice(0, 10);
  };

  // Helper function to create sample wholesaler product data (for development/testing)
  const createSampleWholesalerData = async (productId: string) => {
    try {
      const sampleData = {
        wholesalerId: 'sample-wholesaler-1',
        wholesalerName: 'Sample Wholesaler',
        productId: productId,
        pricePerUnit: Math.floor(Math.random() * 100) + 50,
        priceTiers: [
          { minQty: 1, maxQty: 10, pricePerUnit: Math.floor(Math.random() * 100) + 50 },
          { minQty: 11, maxQty: 50, pricePerUnit: Math.floor(Math.random() * 80) + 40 },
          { minQty: 51, maxQty: 100, pricePerUnit: Math.floor(Math.random() * 60) + 30 }
        ],
        available: true,
        unit: 'BOX',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'wholesalerProducts'), sampleData);
      console.log('Sample wholesaler data created for product:', productId);
      
      // Refresh the data
      const productIds = products.map(p => p.productId);
      fetchWholesalerProducts(productIds);
    } catch (error) {
      console.error('Error creating sample data:', error);
    }
  };

  // Screens
  const renderHomeScreen = () => (
    <ScrollView contentContainerStyle={styles.screenContainer} showsVerticalScrollIndicator={false}>
      {/* Welcome Card */}
      <AnimatedCard
        animationType="fadeInUp"
        delay={0}
        style={[styles.welcomeCard, { backgroundColor: '#fef3c7' }]}
      >
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSubtitle}>{retailerName || 'Retailer'}</Text>
            <Text style={styles.welcomeLocation}>{retailerLocation}</Text>
          </View>
          <View style={styles.welcomeIcon}>
            <User color="#92400e" size={40} />
          </View>
        </View>
      </AnimatedCard>

      {/* Error Display */}
      {error && (
        <AnimatedCard animationType="fadeInUp" delay={100} style={styles.errorCard}>
          <View style={styles.errorContent}>
            <X color="#dc2626" size={20} />
            <Text style={styles.errorText}>{error}</Text>
            <AnimatedButton
              title="Retry"
              size="small"
              variant="outline"
              onPress={() => {
                setError(null);
                fetchCategories();
                fetchProducts();
              }}
            />
          </View>
        </AnimatedCard>
      )}
      
      {/* Search Section */}
      <AnimatedCard animationType="fadeInUp" delay={200} style={styles.searchCard}>
        <View style={styles.searchSection}>
          <Text style={styles.searchTitle}>Find Products</Text>
          <TouchableOpacity 
            style={styles.searchContainer}
            onPress={() => {
              console.log('Search field clicked, navigating to SearchProducts');
              navigation.navigate('SearchProducts', { 
                initialQuery: searchInput,
                category: selectedCategory 
              });
            }}
          >
            <View style={styles.searchInputContainer}>
              <Search color="#6b7280" size={20} />
              <Text style={styles.searchPlaceholder}>
                Search products (e.g., rice, apple, milk)...
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </AnimatedCard>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.categoryRow}>
        {categories.slice(1, 9).map((cat, index) => (
          <TouchableOpacity 
            key={`${cat}-${index}`} 
            style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
            onPress={() => {
              setSelectedCategory(cat);
              fetchProducts();
            }}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filterBtn, sortByPrice && styles.filterBtnActive]}
          onPress={() => {
            if (sortByPrice) {
              setSortByPrice(false);
            } else {
              setSortByPrice(true);
              setSortByRating(false);
            }
          }}
        >
          <Text style={[styles.filterText, sortByPrice && styles.filterTextActive]}>Lowest Price</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, sortByRating && styles.filterBtnActive]}
          onPress={() => {
            if (sortByRating) {
              setSortByRating(false);
            } else {
              setSortByRating(true);
              setSortByPrice(false);
            }
          }}
        >
          <Text style={[styles.filterText, sortByRating && styles.filterTextActive]}>Top Rated</Text>
        </TouchableOpacity>
      </View>

      {/* Products */}
      <Text style={styles.sectionTitle}>Available Products</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubText}>Try adjusting your search or category filter</Text>
        </View>
      ) : (
        <FlatList
          data={getSortedProducts()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const productWholesalers = getProductWholesalers(item.productId);
            const bestPrice = getBestPrice(item.productId);
            
            return (
              <TouchableOpacity 
                style={styles.productCard}
                onPress={() => {
                  console.log('Product card clicked, navigating to ProductWholesalers for product:', item.name);
                  navigation.navigate('ProductWholesalers', { 
                    productId: item.productId, 
                    productName: item.name 
                  });
                }}
              >
                <Text style={styles.productImage}>{item.image || '📦'}</Text>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productUnit}>{item.unit}</Text>
                {bestPrice ? (
                  <Text style={styles.productPrice}>From ₹{bestPrice}</Text>
                ) : (
                  <Text style={styles.productPrice}>Price on request</Text>
                )}
                <Text style={styles.productOffers}>
                  {productWholesalers.length > 0 
                    ? `${productWholesalers.length} wholesaler${productWholesalers.length !== 1 ? 's' : ''}`
                    : 'No wholesalers yet'
                  }
                </Text>
              </TouchableOpacity>
            );
          }}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );

  const renderCartScreen = () => (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.header}>My Cart</Text>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigateToScreen('home')}>
            <Text style={styles.primaryBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.cartItemHeader}>
                <Text style={styles.cartProduct}>{item.productName}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <X color="#dc2626" size={20} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cartWholesaler}>{item.wholesalerName}</Text>
              <Text style={styles.cartQty}>Qty: {item.quantity} {item.unit}</Text>
              <Text style={styles.cartPrice}>₹{item.pricePerUnit * item.quantity}</Text>
              <View style={styles.cartStatusContainer}>
                <View style={[styles.statusDot, { backgroundColor: 
                  item.status === 'confirmed' ? '#16a34a' : 
                  item.status === 'pending' ? '#fbbf24' : 
                  item.status === 'rejected' ? '#dc2626' : '#fbbf24'
                }]} />
                <Text style={styles.cartStatus}>
                  {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
          
          <View style={styles.cartSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                ₹{cartItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery:</Text>
              <Text style={styles.summaryValue}>₹50</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.summaryLabel}>Total:</Text>
              <Text style={styles.summaryValue}>
                ₹{cartItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0) + 50}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.primaryBtn} onPress={requestConfirmation}>
            <Text style={styles.primaryBtnText}>Request Confirmation</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  const renderTrackingScreen = () => (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.header}>Order Tracking</Text>
      {orders.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartText}>No orders found</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigateToScreen('home')}>
            <Text style={styles.primaryBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        orders.map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.id.slice(-8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: 
                order.status === 'delivered' ? '#16a34a' : 
                order.status === 'shipped' ? '#2563eb' :
                order.status === 'confirmed' ? '#fbbf24' : '#dc2626'
              }]}>
                <Text style={styles.statusBadgeText}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Text>
              </View>
            </View>
            <Text style={styles.orderProduct}>{order.productName}</Text>
            <Text style={styles.orderWholesaler}>{order.wholesalerName}</Text>
            <View style={styles.orderDetails}>
              <Text style={styles.orderQty}>{order.qty} {order.unit}</Text>
              <Text style={styles.orderPrice}>₹{order.qty * order.pricePerUnit}</Text>
            </View>
            <Text style={styles.orderDate}>
              Ordered: {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  // Show loading screen if user is not authenticated
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fbbf24' }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1e3a8a' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <ProfessionalHeader
        title="Retailer Dashboard"
        subtitle={retailerName ? `Welcome, ${retailerName}` : undefined}
        onMenuPress={() => setSidebarOpen(true)}
        onCartPress={() => navigateToScreen('cart')}
        cartItemCount={cartItems.length}
        showGradient={true}
      />

      {/* Main Content */}
      <View style={{ 
        flex: 1, 
        paddingBottom: cartItems.length > 0 && currentScreen !== 'cart' ? 100 : 0 
      }}>
        {currentScreen === 'home' && renderHomeScreen()}
        {currentScreen === 'cart' && renderCartScreen()}
        {currentScreen === 'tracking' && renderTrackingScreen()}
      </View>

      {/* Bottom Navigation */}
      <SafeAreaView style={styles.bottomNavContainer} edges={['bottom']}>
        <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigateToScreen('home')}>
          <Home color={currentScreen === 'home' ? '#1e3a8a' : '#888'} size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateToScreen('cart')}>
          <ShoppingCart color={currentScreen === 'cart' ? '#1e3a8a' : '#888'} size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateToScreen('tracking')}>
          <Truck color={currentScreen === 'tracking' ? '#1e3a8a' : '#888'} size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <Settings color="#888" size={28} />
        </TouchableOpacity>
        </View>
      </SafeAreaView>

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
            <TouchableOpacity 
              style={styles.sidebarBtn} 
              onPress={() => {
                console.log('View Profile clicked, navigating to RetailerProfile');
                setSidebarOpen(false);
                navigation.navigate('RetailerProfile');
              }}
            >
              <User color="#1e3a8a" size={20} />
              <Text style={styles.sidebarBtnText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarBtn} onPress={handleLogout}>
              <LogOut color="#D14343" size={20} />
              <Text style={styles.sidebarBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Cart */}
      <FloatingCart
        itemCount={cartItems.length}
        totalPrice={cartItems.reduce((sum, item) => sum + (item.totalPrice || (item.pricePerUnit * item.quantity)), 0)}
        onPress={() => navigateToScreen('cart')}
        visible={cartItems.length > 0 && currentScreen !== 'cart'}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Welcome Card Styles
  welcomeCard: {
    marginBottom: 16,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a16207',
    marginBottom: 2,
  },
  welcomeLocation: {
    fontSize: 14,
    color: '#a16207',
    opacity: 0.8,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(146, 64, 14, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Error Card Styles
  errorCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Search Card Styles
  searchCard: {
    marginBottom: 16,
  },
  searchSection: {
    width: '100%',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  bottomNavContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  // New styles for dynamic components
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  searchPlaceholder: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#9ca3af',
  },
  searchBtn: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterBtnActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  filterText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
  },
  categoryBtnActive: {
    backgroundColor: '#1e3a8a',
  },
  categoryTextActive: {
    color: '#fff',
  },
  productUnit: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  productOffers: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cartStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  cartStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  cartSummary: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 10,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  orderWholesaler: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderQty: {
    fontSize: 14,
    color: '#374151',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Error styles
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Loading and empty states
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});