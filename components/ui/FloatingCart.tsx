import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { ShoppingCart } from 'lucide-react-native';

interface FloatingCartProps {
  itemCount: number;
  totalPrice: number;
  onPress: () => void;
  visible: boolean;
}

const FloatingCart: React.FC<FloatingCartProps> = ({
  itemCount,
  totalPrice,
  onPress,
  visible,
}) => {
  if (!visible || itemCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cartIcon}>
        <ShoppingCart color="#fff" size={24} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      </View>
      
      <View style={styles.cartInfo}>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        <Text style={styles.totalPrice}>₹{totalPrice.toFixed(2)}</Text>
      </View>
      
      <View style={styles.viewCartButton}>
        <Text style={styles.viewCartText}>View Cart</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Position above bottom navigation (estimated height: 60px + safe area + margin)
    left: 16,
    right: 16,
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  cartIcon: {
    position: 'relative',
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartInfo: {
    flex: 1,
  },
  itemCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  totalPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  viewCartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FloatingCart;
