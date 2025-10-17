import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

interface AnimatedCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: any;
  gradient?: boolean;
  gradientColors?: string[];
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  delay?: number;
  animationType?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'slideInUp';
  onPress?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  gradient = false,
  gradientColors = ['#ffffff', '#f8fafc'],
  shadowColor = '#000',
  shadowOpacity = 0.1,
  shadowRadius = 8,
  elevation = 3,
  borderRadius = 12,
  padding = 16,
  margin = 8,
  delay = 0,
  animationType = 'fadeInUp',
  onPress,
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const translateXAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const animationConfig = {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: true,
    };

    const springConfig = {
      toValue: 1,
      delay,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    };

    let animations = [Animated.timing(fadeAnim, animationConfig)];

    switch (animationType) {
      case 'fadeInUp':
        animations.push(Animated.timing(translateYAnim, animationConfig));
        break;
      case 'fadeInLeft':
        animations.push(Animated.timing(translateXAnim, animationConfig));
        break;
      case 'fadeInRight':
        animations.push(Animated.timing(translateXAnim, { ...animationConfig, toValue: -1 }));
        break;
      case 'scaleIn':
        animations.push(Animated.spring(scaleAnim, springConfig));
        break;
      case 'slideInUp':
        animations.push(Animated.spring(translateYAnim, springConfig));
        break;
    }

    Animated.parallel(animations).start();
  }, [delay]);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      animationType === 'fadeInUp' || animationType === 'slideInUp' 
        ? { translateY: translateYAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
        : { translateY: 0 },
      animationType === 'fadeInLeft' || animationType === 'fadeInRight'
        ? { translateX: translateXAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
        : { translateX: 0 },
      animationType === 'scaleIn'
        ? { scale: scaleAnim }
        : { scale: 1 },
    ],
  };

  const cardStyle = [
    styles.card,
    {
      borderRadius,
      padding,
      margin,
      shadowColor,
      shadowOpacity,
      shadowRadius,
      elevation,
    },
    style,
  ];

  const CardContent = () => (
    <Animated.View style={[cardStyle, animatedStyle]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{ margin }}
        {...props}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
});

export default AnimatedCard;
