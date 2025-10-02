import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CheckCircle, Store, Truck, DollarSign, ArrowRight } from 'lucide-react-native'; // Make sure to install lucide-react-native or substitute with any icon library
import LinearGradient from 'react-native-linear-gradient';

export default function RetailerSuccessPage({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#fb923c', '#fbbf24', '#fde047']}
        style={StyleSheet.absoluteFill}
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.innerPadding}>
            {/* Success Icon */}
            <View style={styles.iconWrapperGreen}>
              <CheckCircle stroke="#16a34a" width={40} height={40} />
            </View>

            {/* Success Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.successTitle}>Registration Successful!</Text>
              <Text style={styles.successSubtitle}>Welcome to our retailer network</Text>
            </View>

            {/* Motivational Quote */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                Grow smarter with us. Reliable delivery, fair prices, and everything you need to take your business forward.
              </Text>
            </View>

            {/* Features Grid */}
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <View style={[styles.iconCircle, { backgroundColor: '#fed7aa' }]}>
                  <Store stroke="#ea580c" width={20} height={20} />
                </View>
                <Text style={styles.featureText}>Quality Products</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Truck stroke="#ca8a04" width={20} height={20} />
                </View>
                <Text style={styles.featureText}>Fast Delivery</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.iconCircle, { backgroundColor: '#fef9c3' }]}>
                  <DollarSign stroke="#b45309" width={20} height={20} />
                </View>
                <Text style={styles.featureText}>Best Prices</Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Home')}>
              <Text style={styles.buttonText}>Continue</Text>
              <ArrowRight stroke="#fff" width={16} height={16} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {/* Additional Info */}
            <Text style={styles.additionalInfo}>
              Check your email for account verification and next steps
            </Text>
          </View>
        </View>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorative1} />
      <View style={styles.decorative2} />
      <View style={styles.decorative3} />
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // For gradients, use react-native-linear-gradient component instead of backgroundImage
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    // backdropFilter: 'blur(10px)', // not supported in RN, ignore or use libraries for blur
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    padding: 0,
  },
  innerPadding: {
    padding: 24,
    alignItems: 'center',
  },
  iconWrapperGreen: {
    width: 64,
    height: 64,
    backgroundColor: '#bbf7d0',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    color: '#16a34a',
    fontWeight: 'bold',
    fontSize: 20,
  },
  successSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  quoteBox: {
    backgroundColor: '#ffedd5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 24,
  },
  quoteText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#f97316',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  additionalInfo: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  decorative1: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 64,
    opacity: 0.4,
    // Blur not natively supported; would require expo-blur or similar
  },
  decorative2: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 80,
    opacity: 0.4,
  },
  decorative3: {
    position: 'absolute',
    top: height / 2 - 48,
    left: 0,
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 48,
    opacity: 0.4,
  },
});
