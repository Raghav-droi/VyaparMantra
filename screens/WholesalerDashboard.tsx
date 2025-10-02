import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { CheckCircle, ShoppingCart, Clock, DollarSign, ArrowRight, ChevronLeft, ChevronRight, Bell, Shield, TrendingUp, Home, X } from "lucide-react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed

const { width } = Dimensions.get("window");

const WholesalerDashboard = ({ route, navigation }) => {
  const { userId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().userType === "wholesale") {
          setProfile(userSnap.data());
        } else {
          setProfile(null);
        }
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#fb923c" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <Text style={{ marginTop: 40, textAlign: "center", color: "#b91c1c" }}>
          Wholesaler not found or not authorized.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient colors={["#fb923c", "#fbbf24", "#fde047"]} style={StyleSheet.absoluteFill} />
      <ScrollView style={styles.content}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <View style={styles.shopInfo}>
            <Image source={{ uri: "https://via.placeholder.com/80" }} style={styles.avatarImg} />
            <View>
              <Text style={styles.shopHeading}>
                {profile.tradeName || "--"} <Shield stroke="#bae6fd" width={14} height={14} />
              </Text>
              <Text style={styles.shopSubhead}>Premium Verified</Text>
            </View>
          </View>
          <View style={{ position: "relative" }}>
            <Bell stroke="#fff" width={24} height={24} />
            <View style={styles.notiDot} />
          </View>
        </View>

        {/* PROFILE DETAILS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wholesaler Profile</Text>
          <Text><Text style={styles.label}>Owner:</Text> {profile.businessOwnerName || "--"}</Text>
          <Text><Text style={styles.label}>GSTIN:</Text> {profile.gstinNumber || "--"}</Text>
          <Text><Text style={styles.label}>Trade Name:</Text> {profile.tradeName || "--"}</Text>
          <Text><Text style={styles.label}>Type:</Text> {profile.userType || "--"}</Text>
          <Text><Text style={styles.label}>Address:</Text> {profile.address || "--"}</Text>
          <Text><Text style={styles.label}>Location:</Text> {profile.location || "--"}</Text>
          <Text><Text style={styles.label}>Bank Name:</Text> {profile.bankName || "--"}</Text>
          <Text><Text style={styles.label}>ID Proof:</Text> {profile.idProofType || "--"} - {profile.idProof || "--"}</Text>
          <Text><Text style={styles.label}>Status:</Text> {profile.status || "--"}</Text>
          <Text><Text style={styles.label}>Created At:</Text> {profile.createdAt?.toDate ? profile.createdAt.toDate().toLocaleString() : "--"}</Text>
        </View>

        {/* DASHBOARD STATS - placeholders for now */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ShoppingCart stroke="#2563eb" width={20} height={20} />
              <Text>{"--"}</Text>
              <Text>Today's orders</Text>
            </View>
            <View style={styles.statItem}>
              <Clock stroke="#fbbf24" width={20} height={20} />
              <Text>{"--"}</Text>
              <Text>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <DollarSign stroke="#16a34a" width={20} height={20}/>
              <Text>₹{"--"}</Text>
              <Text>Total Sales</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 10, paddingTop: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  shopInfo: { flexDirection: "row", alignItems: "center" },
  avatarImg: { width: 48, height: 48, borderRadius: 24, marginRight: 10 },
  shopHeading: { color: "#fff", fontWeight: "bold" },
  shopSubhead: { color: "#bae6fd" },
  notiDot: { position: "absolute", top: -4, right: -4, backgroundColor: "red", width: 12, height: 12, borderRadius: 6 },
  card: { backgroundColor: "#fff", borderRadius: 14, marginVertical: 6, padding: 18, shadowColor: "#222", shadowOpacity: 0.15, shadowRadius: 7, elevation: 4 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statItem: { alignItems: "center", flex: 1 },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
  label: { fontWeight: "bold", color: "#2563eb" },
});

export default WholesalerDashboard;