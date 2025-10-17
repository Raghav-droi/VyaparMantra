import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface AnimatedButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  gradient?: boolean;
  gradientColors?: string[];
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  gradient = false,
  gradientColors,
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = {
      borderRadius: 12,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };

    // Size styles
    const sizeStyles = {
      small: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 36 },
      medium: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 48 },
      large: { paddingHorizontal: 32, paddingVertical: 16, minHeight: 56 },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: '#1e3a8a',
      },
      secondary: {
        backgroundColor: '#64748b',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#1e3a8a',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = {
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    };

    const sizeTextStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantTextStyles = {
      primary: { color: '#ffffff' },
      secondary: { color: '#ffffff' },
      outline: { color: '#1e3a8a' },
      ghost: { color: '#1e3a8a' },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  const getGradientColors = (): string[] => {
    if (gradientColors) return gradientColors;
    
    switch (variant) {
      case 'primary':
        return ['#1e3a8a', '#2563eb', '#3b82f6'];
      case 'secondary':
        return ['#64748b', '#475569', '#334155'];
      case 'outline':
        return ['transparent', 'transparent'];
      case 'ghost':
        return ['transparent', 'transparent'];
      default:
        return ['#1e3a8a', '#2563eb'];
    }
  };

  const ButtonContent = () => (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {loading ? (
        <Text style={[getTextStyle(), textStyle]}>Loading...</Text>
      ) : (
        <>
          {icon && <>{icon}</>}
          {icon && <Text style={{ width: 8 }} />}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </Animated.View>
  );


  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[getButtonStyle(), style]}
      {...props}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};

export default AnimatedButton;
