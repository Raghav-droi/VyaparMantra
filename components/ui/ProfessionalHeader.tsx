import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Bell, Menu, ShoppingCart, User, ChevronDown } from 'lucide-react-native';

interface ProfessionalHeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  onCartPress?: () => void;
  onNotificationPress?: () => void;
  cartItemCount?: number;
  notificationCount?: number;
  showGradient?: boolean;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
}

const { width } = Dimensions.get('window');

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  title,
  subtitle,
  onMenuPress,
  onCartPress,
  onNotificationPress,
  cartItemCount = 0,
  notificationCount = 0,
  showGradient = true,
  backgroundColor = '#1e3a8a',
  textColor = '#ffffff',
  iconColor = '#ffffff',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const HeaderContent = () => (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Top Row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Menu color={iconColor} size={24} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: textColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightIcons}>
          {onNotificationPress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotificationPress}
              activeOpacity={0.7}
            >
              <Bell color={iconColor} size={24} />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {onCartPress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onCartPress}
              activeOpacity={0.7}
            >
              <ShoppingCart color={iconColor} size={24} />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );

  if (showGradient) {
    return (
      <View style={[styles.gradientContainer, { backgroundColor: '#1e3a8a' }]}>
        <HeaderContent />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <HeaderContent />
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 2,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProfessionalHeader;
