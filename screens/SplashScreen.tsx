import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulsing ring animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Bouncing dots animation
    const createBounceAnimation = (animValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    setTimeout(() => createBounceAnimation(dot1Anim, 0).start(), 0);
    setTimeout(() => createBounceAnimation(dot2Anim, 100).start(), 100);
    setTimeout(() => createBounceAnimation(dot3Anim, 200).start(), 200);

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#fb923c" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <View style={styles.logoImageContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1754765542024-c1320f23b75a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMHBlcnNvbiUyMG1vdG9yY3ljbGUlMjBiaWtlJTIwZ29vZHMlMjBjb3VyaWVyfGVufDF8fHx8MTc1ODI2NjQyMHww&ixlib=rb-4.1.0&q=80&w=1080',
                }}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </View>
          
          {/* Animated ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        </View>

        {/* App Name */}
        <View style={styles.titleContainer}>
          <Text style={styles.appName}>Vyapar Mantra</Text>
          <View style={styles.titleLine} />
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Your Business we deliver</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [{ translateY: dot1Anim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [{ translateY: dot2Anim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [{ translateY: dot3Anim }],
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Background decoration circles */}
      <View style={[styles.bgDecoration, styles.bgDecorationTopLeft]} />
      <View style={[styles.bgDecoration, styles.bgDecorationBottomRight]} />
      <View style={[styles.bgDecoration, styles.bgDecorationTopRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fb923c',
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logoBackground: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  logoImageContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  titleLine: {
    width: 96,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 32,
  },
  loadingContainer: {
    paddingTop: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 4,
  },
  bgDecoration: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  bgDecorationTopLeft: {
    top: 40,
    left: 40,
    width: 80,
    height: 80,
  },
  bgDecorationBottomRight: {
    bottom: 80,
    right: 32,
    width: 64,
    height: 64,
  },
  bgDecorationTopRight: {
    top: height * 0.33,
    right: 48,
    width: 48,
    height: 48,
  },
});