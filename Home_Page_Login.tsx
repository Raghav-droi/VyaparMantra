import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import auth from '@react-native-firebase/auth';

import type { StackNavigationProp } from '@react-navigation/stack';

type HomePageLoginProps = {
  navigation: StackNavigationProp<any>;
};

export default function Home_Page_Login({ navigation }: HomePageLoginProps) {
  return (
    <LinearGradient
      colors={["#FF8C00", "#FFB347", "#FFD580"]}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1754765542024-c1320f23b75a?auto=format&fit=crop&w=100&q=80",
              }}
              style={styles.logo}
            />
          </View>

          {/* Header */}
          <Text style={styles.title}>Vyapar Mantra</Text>
          <Text style={styles.subtitle}>Your Business we deliver</Text>
          <View style={styles.divider} />

          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>Choose your login type to continue</Text>
          </View>

          {/* Login Options */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Login as</Text>
            <Button
  style={styles.wholesalerButton}
  onPress={() => navigation.navigate('Login', { userType: 'wholesale' })}
>
  <Icon name="warehouse" size={22} color="#fff" />
  <Text style={styles.buttonText}> Wholesaler Login</Text>
</Button>

<Button
  style={styles.retailerButton}
  onPress={() => navigation.navigate('Login', { userType: 'retail' })}
>
  <Icon name="shopping" size={22} color="#fff" />
  <Text style={styles.buttonText}> Retailer Login</Text>
</Button>

          </Card>

          {/* Register Section */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>New to Vyapar Mantra?</Text>
            <Button
              style={styles.registerButton}
              onPress={() => navigation.navigate('RegistrationForm')}
            >
              <Icon name="account-plus" size={22} color="#fff" />
              <Text style={styles.registerButtonText}> Register Your Business</Text>
            </Button>
            <Text style={styles.registerInfo}>
              Join thousands of businesses growing with us
            </Text>
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Connecting businesses, delivering success
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 60,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
    textAlign: "center",
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 6,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  wholesalerButton: {
    backgroundColor: "#E53935",
    width: "100%",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    elevation: 2,
  },
  retailerButton: {
    backgroundColor: "#3949AB",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  registerButton: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
    borderWidth: 2,
    width: "100%",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    elevation: 2,
  },
  registerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  registerInfo: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
    textAlign: "center",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
});
