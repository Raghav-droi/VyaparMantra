import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Feather from "react-native-vector-icons/Feather";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

// Replace these with your DB data when ready
const stats = {};
const products = [];
const orders = [];

export default function WholesalerDashboard() {
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const ordersPerPage = 4;
  const totalOrderPages = Math.ceil(orders.length / ordersPerPage || 1);
  const currentOrders = orders.slice(
    (currentOrderPage - 1) * ordersPerPage,
    currentOrderPage * ordersPerPage
  );

  const renderStatCard = (iconName, label, value, bg = "#EFF6FF", iconColor = "#1e3a8a") => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={iconName} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value ?? "--"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const OrderCard = ({ order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{order?.retailerName ?? "--"}</Text>
        <View style={styles.badgeNew}>
          <Text style={styles.badgeNewText}>New</Text>
        </View>
      </View>
      <Text style={styles.cardText}>{order?.items ?? "--"}</Text>
      <Text style={styles.cardSubText}>{order?.quantity ?? "--"}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardAmount}>₹{order?.amount ? order.amount.toLocaleString() : "--"}</Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity style={[styles.btnConfirm]}>
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.btnConfirmText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnReject]}>
            <Feather name="x" size={14} color="#D14343" />
            <Text style={styles.btnRejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ProductCard = ({ product }) => (
    <View style={styles.cardSmall}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={styles.prodThumb}>
          <Text style={{ fontSize: 20 }}>{product?.image ?? "?"}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.prodTitle}>{product?.name ?? "--"}</Text>
          <Text style={styles.prodCat}>{product?.category ?? "--"}</Text>
          <View style={{ flexDirection: "row", marginTop: 6 }}>
            {(product?.pricing ?? []).map((p, i) => (
              <View key={i} style={styles.pricePill}>
                <Text style={styles.pricePillText}>
                  {p.range} • ₹{p.price}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
        <View style={[styles.availPill, { backgroundColor: product?.available ? "#DCFCE7" : "#FEE2E2" }]}>
          <Text style={{ color: product?.available ? "#059669" : "#B91C1C", fontWeight: "600" }}>
            {product?.available ? "Available" : "Not Available"}
          </Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="edit-2" size={16} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fb923c" />
      <LinearGradient colors={["#fb923c", "#fbbf24", "#fde047"]} style={styles.background} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.profileRow}>
              <View style={styles.avatar}>
                <Image
                  source={require("./placeholder-shop.jpg")}
                  style={styles.avatarImg}
                  onError={() => {}}
                />
              </View>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.shopName}>Wholesale Central</Text>
                  <MaterialIcons name="verified" size={16} color="rgba(255,255,255,0.9)" style={{ marginLeft: 6 }} />
                </View>
                <Text style={styles.shopSub}>Premium Verified</Text>
              </View>
            </TouchableOpacity>
            <View>
              <Feather name="bell" size={22} color="#fff" />
              <View style={styles.notificationDot} />
            </View>
          </View>

          {/* Main Dashboard */}
          <View style={{ width: "100%", paddingHorizontal: 16 }}>
            {/* Stats Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleDark}>Today's Overview</Text>
              <View style={styles.statsRow}>
                {renderStatCard("shopping-cart", "Today's Orders", stats.todayOrders)}
                {renderStatCard("clock", "Pending", stats.pendingConfirmations, "#FEF3C7", "#92400E")}
                {renderStatCard("dollar-sign", "Total Sales", stats.totalSales ? `₹${stats.totalSales.toLocaleString()}` : undefined, "#DCFCE7", "#047857")}
              </View>
            </View>

            {/* New Order Requests */}
            <View style={{ marginTop: 18 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>New Order Requests</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{orders.length} Total</Text>
                </View>
              </View>

              <FlatList
                data={currentOrders}
                keyExtractor={(item, idx) => String(item?.id ?? idx)}
                renderItem={({ item }) => <OrderCard order={item} />}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                style={{ marginTop: 10 }}
                ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>No orders yet.</Text>}
              />

              {/* Pagination */}
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, currentOrderPage === 1 && { opacity: 0.5 }]}
                  disabled={currentOrderPage === 1}
                  onPress={() => setCurrentOrderPage((p) => Math.max(1, p - 1))}
                >
                  <Feather name="chevron-left" size={18} color="#1f2937" />
                  <Text style={{ marginLeft: 6 }}>Previous</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((page) => (
                    <TouchableOpacity
                      key={page}
                      onPress={() => setCurrentOrderPage(page)}
                      style={[
                        styles.pageNumber,
                        currentOrderPage === page ? { backgroundColor: "#fff" } : { backgroundColor: "transparent" },
                      ]}
                    >
                      <Text style={[styles.pageNumText, currentOrderPage === page ? { fontWeight: "bold" } : {}]}>
                        {page}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.pageBtn, currentOrderPage === totalOrderPages && { opacity: 0.5 }]}
                  disabled={currentOrderPage === totalOrderPages}
                  onPress={() => setCurrentOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                >
                  <Text style={{ marginRight: 6 }}>Next</Text>
                  <Feather name="chevron-right" size={18} color="#1f2937" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Products Section */}
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionTitle}>Products</Text>
              <FlatList
                data={products}
                keyExtractor={(item, idx) => String(item?.id ?? idx)}
                renderItem={({ item }) => <ProductCard product={item} />}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                style={{ marginTop: 10 }}
                ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>No products yet.</Text>}
              />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fb923c",
  },
  background: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 2,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  shopName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  shopSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  notificationDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    elevation: 2,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  sectionTitleDark: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
    marginRight: 12,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    color: "#1e3a8a",
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "#4ade80",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  badgeNew: {
    backgroundColor: "#4ade80",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeNewText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
  },
  cardText: {
    fontSize: 13,
    color: "#374151",
    marginTop: 8,
  },
  cardSubText: {
    fontSize: 12,
    color: "#6b7280",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  cardAmount: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  btnConfirm: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4ade80",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 2,
  },
  btnConfirmText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  btnReject: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f87171",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
    elevation: 2,
  },
  btnRejectText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  cardSmall: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  prodThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  prodTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  prodCat: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  pricePill: {
    backgroundColor: "#e0f2fe",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  pricePillText: {
    fontSize: 12,
    color: "#0d9488",
    fontWeight: "500",
  },
  availPill: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    marginLeft: 8,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 2,
  },
  pageNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  pageNumText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
});
