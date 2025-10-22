import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, ShoppingCart, Package, DollarSign, Truck, Phone } from 'lucide-react-native';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc, addDoc } from '@react-native-firebase/firestore';
import { useNavigation } from '../App';
import ProfessionalHeader from '../components/ui/ProfessionalHeader';
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedButton from '../components/ui/AnimatedButton';

const db = getFirestore();

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
  location?: string;
  distance?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  description?: string;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  image?: string;
  description?: string;
}

const ProductWholesalers = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [wholesalerProducts, setWholesalerProducts] = useState<WholesalerProduct[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');
  const [filterAvailable, setFilterAvailable] = useState(true);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WholesalerProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const user = getAuth().currentUser;

  const { productId, productName } = navigation.params || {};
  
  console.log('ProductWholesalers rendered with params:', { productId, productName });

  useEffect(() => {
    if (productName) {
      fetchProductDetails();
      fetchWholesalerProducts();
    }
  }, [productName]);

  const fetchProductDetails = async () => {
    try {
      // Search for product by name in the products collection
      const productsQuery = query(
        collection(db, 'products'),
        where('name', '==', productName)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      
      if (productsSnapshot.docs.length > 0) {
        // Use the first matching product
        const productDoc = productsSnapshot.docs[0];
        const productData = productDoc.data() as Product;
        setProduct({ id: productDoc.id, ...productData });
        console.log('Product details found:', productData);
      } else {
        console.log('No product found with name:', productName);
        // Set a default product structure
        setProduct({
          id: productId || 'unknown',
          name: productName || 'Unknown Product',
          category: 'N/A',
          unit: 'unit',
          description: 'N/A',
          imageUrl: '',
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Set a default product structure on error
      setProduct({
        id: productId || 'unknown',
        name: productName || 'Unknown Product',
        category: 'N/A',
        unit: 'unit',
        description: 'N/A',
        imageUrl: '',
      });
    }
  };

  const fetchWholesalerProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching wholesaler products for product:', productName);
      
      // First, get all wholesalers
      const wholesalersSnapshot = await getDocs(collection(db, 'wholesaler'));
      console.log('Found wholesalers:', wholesalersSnapshot.docs.length);
      
      const enrichedWholesalerProducts: WholesalerProduct[] = [];
      
      // Search through each wholesaler's products subcollection
      for (const wholesalerDoc of wholesalersSnapshot.docs) {
        const wholesalerId = wholesalerDoc.id;
        const wholesalerData = wholesalerDoc.data();
        
        try {
          console.log('Searching products for wholesaler:', wholesalerId);
          
          // Query products subcollection for this wholesaler
          const productsQuery = query(
            collection(db, 'wholesaler', wholesalerId, 'products'),
            where('name', '==', productName) // Search by product name
          );
          
          const productsSnapshot = await getDocs(productsQuery);
          
          if (productsSnapshot.docs.length > 0) {
            console.log(`Found ${productsSnapshot.docs.length} products for wholesaler ${wholesalerId}`);
            
            for (const productDoc of productsSnapshot.docs) {
              const productData = productDoc.data();
              console.log('Product data:', productData);
              
              // Create enriched product data
              const enrichedProduct: WholesalerProduct = {
                id: productDoc.id,
                productId: productId,
                wholesalerId: wholesalerId,
                wholesalerName: wholesalerData?.tradeName || wholesalerData?.businessOwnerName || 'N/A',
                location: wholesalerData?.location || 'N/A',
                rating: wholesalerData?.rating || 0,
                pricePerUnit: productData?.pricePerUnit || 0,
                unit: productData?.unit || 'unit',
                priceTiers: productData?.priceRanges || [],
                minOrderQty: productData?.minOrderQty || 1,
                maxOrderQty: productData?.maxOrderQty || 999,
                available: true,
                stock: productData?.stock || 0,
                category: productData?.category || 'N/A',
                description: productData?.description || 'N/A',
                imageUrl: productData?.imageUrl || '',
                // Add distance calculation (mock for now)
                distance: Math.random() * 50 + 1, // Random distance between 1-50 km
              };
              
              enrichedWholesalerProducts.push(enrichedProduct);
            }
          }
        } catch (wholesalerError) {
          console.error('Error fetching products for wholesaler:', wholesalerId, wholesalerError);
        }
      }
      
      console.log('Total enriched wholesaler products found:', enrichedWholesalerProducts.length);
      setWholesalerProducts(enrichedWholesalerProducts);
    } catch (error) {
      console.error('Error fetching wholesaler products:', error);
      Alert.alert('Error', 'Failed to fetch wholesaler data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWholesalerProducts().finally(() => setRefreshing(false));
  }, [productName]);

  const handleAddToCart = (wholesalerProduct: WholesalerProduct) => {
    if (!user) {
      Alert.alert('Error', 'Please login to add items to cart');
      return;
    }

    setSelectedProduct(wholesalerProduct);
    setQuantity(wholesalerProduct.minOrderQty || 1);
    setShowQuantityModal(true);
  };

  const addToCart = async () => {
    if (!selectedProduct || !user) {
      console.log('Cannot add to cart: selectedProduct or user is null');
      return;
    }

    try {
      // Get retailer ID from phone number or use UID as fallback
      let retailerId = user.phoneNumber?.replace('+91', '');
      if (!retailerId) {
        retailerId = user.uid;
      }

      // Calculate price based on quantity and price tiers
      const finalPrice = calculatePrice(selectedProduct, quantity);

      const cartItem = {
        retailerId,
        wholesalerId: selectedProduct.wholesalerId,
        productId: selectedProduct.productId,
        productName: product?.name || productName || 'Unknown Product',
        wholesalerName: selectedProduct.wholesalerName,
        pricePerUnit: finalPrice,
        unit: selectedProduct.unit,
        quantity: quantity,
        status: 'pending' as const,
        createdAt: new Date(),
        totalPrice: finalPrice * quantity,
      };

      await addDoc(collection(db, 'cart'), cartItem);
      Alert.alert('Success', `Added ${quantity} ${selectedProduct.unit} to cart`);
      setShowQuantityModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart');
    }
  };

  const calculatePrice = (product: WholesalerProduct | null, qty: number) => {
    if (!product) {
      return 0;
    }

    if (!product.priceTiers || product.priceTiers.length === 0) {
      return product.pricePerUnit || 0;
    }

    // Sort price tiers by minQty in descending order
    const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQty - a.minQty);
    
    // Find the appropriate tier for the quantity
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return tier.price;
      }
    }
    
    // If no tier matches, return the base price
    return product.pricePerUnit || 0;
  };

  const getSortedWholesalers = () => {
    let sorted = [...wholesalerProducts];
    
    if (filterAvailable) {
      sorted = sorted.filter(wp => wp.available);
    }

    switch (sortBy) {
      case 'price':
        return sorted.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'distance':
        return sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      default:
        return sorted;
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'N/A';
    }
    return `₹${price.toFixed(2)}`;
  };

  const formatDistance = (distance?: number) => {
    if (!distance || distance <= 0) return 'N/A';
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const renderWholesalerCard = ({ item }: { item: WholesalerProduct }) => {
    console.log('Rendering wholesaler card for:', item.wholesalerName, 'Price:', item.pricePerUnit, 'Unit:', item.unit, 'PriceTiers:', item.priceTiers);
    
    return (
      <AnimatedCard style={styles.wholesalerCard} animationType="fadeInUp">
        <View style={styles.cardHeader}>
          <View style={styles.wholesalerInfo}>
            <Text style={styles.wholesalerName}>{item.wholesalerName || 'N/A'}</Text>
          <View style={styles.locationRow}>
            <MapPin color="#6b7280" size={14} />
            <Text style={styles.locationText}>
              {item.location || 'N/A'}
            </Text>
          </View>
          <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Star color="#fbbf24" size={16} fill="#fbbf24" />
          <Text style={styles.ratingText}>
            {item.rating && item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.priceSection}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>Price per {item.unit || 'unit'}</Text>
          <Text style={styles.priceValue}>
            {item.pricePerUnit ? formatPrice(item.pricePerUnit) : 'N/A'}
          </Text>
        </View>
        {item.minOrderQty && item.minOrderQty > 0 && (
          <Text style={styles.minOrderText}>
            Min. order: {item.minOrderQty} {item.unit || 'unit'}
          </Text>
        )}
      </View>

      {item.priceTiers && item.priceTiers.length > 0 && (
        <View style={styles.priceTiersSection}>
          <Text style={styles.tiersTitle}>Bulk Pricing:</Text>
          {item.priceTiers.slice(0, 3).map((tier, index) => (
            <Text key={index} style={styles.tierText}>
              {tier.minQty || 0}+ {item.unit || 'unit'}: {formatPrice(tier.price)}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            // TODO: Implement contact functionality
            Alert.alert('Contact', `Contact ${item.wholesalerName || 'Wholesaler'}`);
          }}
        >
          <Phone color="#1e3a8a" size={16} />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
        <AnimatedButton
          title="Add to Cart"
          size="small"
          onPress={() => handleAddToCart(item)}
          style={styles.addToCartButton}
        />
      </View>
    </AnimatedCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Loading wholesalers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sortedWholesalers = getSortedWholesalers();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <ProfessionalHeader
          title="Wholesalers"
          subtitle={product?.name || productName || 'Product Details'}
          onMenuPress={() => navigation.goBack()}
          showGradient={true}
        />
        
        <View style={styles.container}>
          {/* Product Info */}
          <AnimatedCard style={styles.productCard}>
            <View style={styles.productHeader}>
              <Package color="#1e3a8a" size={32} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product?.name || productName || 'Unknown Product'}</Text>
                <Text style={styles.productCategory}>{product?.category || 'General'}</Text>
                <Text style={styles.productUnit}>Unit: {product?.unit || 'Piece'}</Text>
              </View>
            </View>
            {product?.description && (
              <Text style={styles.productDescription}>{product.description}</Text>
            )}
          </AnimatedCard>

          {/* Filters and Sort */}
          <AnimatedCard style={styles.filtersCard}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>
                {sortedWholesalers.length} Wholesaler{sortedWholesalers.length !== 1 ? 's' : ''} Found
              </Text>
              <TouchableOpacity
                style={[styles.filterToggle, filterAvailable && styles.filterToggleActive]}
                onPress={() => setFilterAvailable(!filterAvailable)}
              >
                <Text style={[styles.filterToggleText, filterAvailable && styles.filterToggleTextActive]}>
                  Available Only
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
                onPress={() => setSortBy('price')}
              >
                <DollarSign color={sortBy === 'price' ? '#fff' : '#1e3a8a'} size={16} />
                <Text style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonTextActive]}>
                  Lowest Price
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
                onPress={() => setSortBy('rating')}
              >
                <Star color={sortBy === 'rating' ? '#fff' : '#1e3a8a'} size={16} />
                <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
                  Top Rated
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
                onPress={() => setSortBy('distance')}
              >
                <Truck color={sortBy === 'distance' ? '#fff' : '#1e3a8a'} size={16} />
                <Text style={[styles.sortButtonText, sortBy === 'distance' && styles.sortButtonTextActive]}>
                  Nearest
                </Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>

          {/* Wholesalers List */}
          {sortedWholesalers.length > 0 ? (
            <FlatList
              data={sortedWholesalers}
              renderItem={renderWholesalerCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={styles.wholesalersList}
            />
          ) : (
            <AnimatedCard style={styles.emptyCard}>
              <Package color="#9ca3af" size={48} />
              <Text style={styles.emptyTitle}>No Wholesalers Found</Text>
              <Text style={styles.emptySubtitle}>
                No wholesalers are currently offering this product.
              </Text>
            </AnimatedCard>
          )}
        </View>
      </View>

      {/* Quantity Selection Modal */}
      <Modal
        visible={showQuantityModal && selectedProduct !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowQuantityModal(false);
          setSelectedProduct(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Quantity</Text>
            <Text style={styles.modalSubtitle}>
              {selectedProduct?.wholesalerName} - {selectedProduct?.unit}
            </Text>
            
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setQuantity(Math.max(1, num));
                  }}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Tiers Display */}
            {selectedProduct?.priceTiers && selectedProduct.priceTiers.length > 0 && (
              <View style={styles.priceTiersModal}>
                <Text style={styles.priceTiersTitle}>Bulk Pricing:</Text>
                {selectedProduct.priceTiers.map((tier, index) => (
                  <Text key={index} style={[
                    styles.priceTierText,
                    quantity >= tier.minQty && styles.priceTierActive
                  ]}>
                    {tier.minQty}+ {selectedProduct.unit}: {formatPrice(tier.price)}
                    {quantity >= tier.minQty && ' (Selected)'}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.modalPriceSection}>
              <Text style={styles.modalPriceLabel}>Total Price:</Text>
              <Text style={styles.modalPriceValue}>
                {selectedProduct ? formatPrice(calculatePrice(selectedProduct, quantity) * quantity) : 'N/A'}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowQuantityModal(false);
                  setSelectedProduct(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={addToCart}
              >
                <Text style={styles.modalAddText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  productCard: {
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productInfo: {
    marginLeft: 12,
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  productUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  productDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  filtersCard: {
    marginBottom: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  filterToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
  },
  filterToggleActive: {
    backgroundColor: '#1e3a8a',
  },
  filterToggleText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterToggleTextActive: {
    color: '#fff',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: '#1e3a8a',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#1e3a8a',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  wholesalersList: {
    paddingBottom: 16,
  },
  wholesalerCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wholesalerInfo: {
    flex: 1,
  },
  wholesalerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  priceSection: {
    marginBottom: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  minOrderText: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceTiersSection: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  tiersTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  tierText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e0e7ff',
    borderRadius: 6,
    gap: 4,
  },
  contactButtonText: {
    fontSize: 12,
    color: '#1e3a8a',
    fontWeight: '500',
  },
  addToCartButton: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  quantityInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  priceTiersModal: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  priceTiersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  priceTierText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceTierActive: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  modalPriceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProductWholesalers;
