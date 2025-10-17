import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  children?: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  children,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmer.start();

    return () => shimmer.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
      {children}
    </View>
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; width?: string | number }> = ({
  lines = 1,
  width = '100%',
}) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        width={index === lines - 1 ? '80%' : width}
        height={16}
        borderRadius={4}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.cardContainer}>
    <SkeletonLoader width={60} height={60} borderRadius={30} style={{ marginBottom: 12 }} />
    <SkeletonText lines={2} />
    <SkeletonLoader width="60%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
  </View>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <View>
    {Array.from({ length: items }).map((_, index) => (
      <View key={index} style={styles.listItem}>
        <SkeletonLoader width={50} height={50} borderRadius={25} />
        <View style={styles.listContent}>
          <SkeletonText lines={2} width="90%" />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  textContainer: {
    flex: 1,
  },
  cardContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default SkeletonLoader;
