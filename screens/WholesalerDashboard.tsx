import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { 
  Bell, Shield, ShoppingCart, Clock, DollarSign, Package, CheckCircle, X, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, Home, Settings, CreditCard, LogOut, Plus
} from "lucide-react-native";
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
const db = getFirestore();

const WholesalerDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [tradeName, setTradeName] = useState("--");
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getAuth().currentUser;

  // Mock data for demonstration
  const mockStats = {
    todayOrders: 24,
    pendingConfirmations: 8,
    totalSales: 45670
  };

  const mockOrders = [
    { id: 1, retailerName: "Green Valley Store", items: "Rice 50kg, Oil 10L", quantity: "60 items", amount: 8750 },
    { id: 2, retailerName: "City Fresh Mart", items: "Vegetables 30kg", quantity: "30 items", amount: 2250 },
    { id: 3, retailerName: "Metro Supermarket", items: "Rice 25kg, Vegetables 15kg", quantity: "40 items", amount: 5200 },
    { id: 4, retailerName: "Local Grocery", items: "Oil 20L", quantity: "20 items", amount: 2900 },
    { id: 5, retailerName: "Fresh Foods Ltd", items: "Mixed Items 100kg", quantity: "100 items", amount: 12500 },
    { id: 6, retailerName: "Corner Store", items: "Vegetables 10kg", quantity: "10 items", amount: 750 }
  ];

  const mockSalesData = {
    thisMonth: 156780,
    lastMonth: 142350,
    growth: 10.1,
    totalProducts: 47,
    activeOrders: 23
  };

  useEffect(() => {
    if (!user?.phoneNumber) return;
    const fetchProfile = async () => {
      try {
        const userDocRef = doc(db, 'wholesaler', user.phoneNumber.replace('+91', ''));
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists() && userSnap.data().userType === "wholesale") {
          setTradeName(userSnap.data().tradeName || "--");
        } else {
          setTradeName("--");
        }
      } catch (err) {
        setTradeName("--");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const ordersPerPage = 4;
  const totalOrderPages = Math.ceil(mockOrders.length / ordersPerPage);
  const currentOrders = mockOrders.slice(
    (currentOrderPage - 1) * ordersPerPage,
    currentOrderPage * ordersPerPage
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#fb923c" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (tradeName === "--") {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={{ marginTop: 40, textAlign: "center", color: "#b91c1c" }}>
          Wholesaler not found or not authorized.
        </Text>
        <TouchableOpacity
          style={{ marginTop: 20, alignSelf: 'center', backgroundColor: '#FF8C00', padding: 12, borderRadius: 8 }}
          onPress={async () => {
            await getAuth().signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#fb923c", "#fbbf24", "#fde047"]} style={{ position: "absolute", width: "100%", height: "100%" }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10, paddingTop: 40 }}>
        {/* Top Bar */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }} onPress={() => setSidebarOpen(true)}>
            <View style={{ width: 48, height: 48, borderRadius: 24, marginRight: 10, backgroundColor: "#eee" }} />
            <View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>{tradeName}</Text>
                <Shield stroke="#bae6fd" width={16} height={16} style={{ marginLeft: 6 }} />
              </View>
              <Text style={{ color: "#bae6fd" }}>Premium Verified</Text>
            </View>
          </TouchableOpacity>
          <View style={{ position: "relative" }}>
            <Bell stroke="#fff" width={24} height={24} />
            <View style={{ position: "absolute", top: -4, right: -4, backgroundColor: "red", width: 12, height: 12, borderRadius: 6 }} />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={{ backgroundColor: "#fff", borderRadius: 14, marginVertical: 6, padding: 18, shadowColor: "#222", shadowOpacity: 0.15, shadowRadius: 7, elevation: 4 }}>
          <Text style={{ fontSize: 16, color: "#111827", fontWeight: "bold", marginBottom: 8 }}>Today's Overview</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8, backgroundColor: "#DBEAFE" }}>
                <ShoppingCart stroke="#2563eb" width={20} height={20} />
              </View>
              <Text style={{ fontSize: 18, color: "#1e3a8a", fontWeight: "600" }}>{mockStats.todayOrders}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Today's Orders</Text>
            </View>
            <View style={{ alignItems: "center", flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8, backgroundColor: "#FEF3C7" }}>
                <Clock stroke="#fbbf24" width={20} height={20} />
              </View>
              <Text style={{ fontSize: 18, color: "#1e3a8a", fontWeight: "600" }}>{mockStats.pendingConfirmations}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Pending</Text>
            </View>
            <View style={{ alignItems: "center", flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8, backgroundColor: "#DCFCE7" }}>
                <DollarSign stroke="#16a34a" width={20} height={20} />
              </View>
              <Text style={{ fontSize: 18, color: "#1e3a8a", fontWeight: "600" }}>₹{mockStats.totalSales.toLocaleString()}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Total Sales</Text>
            </View>
          </View>
        </View>

        {/* New Order Requests */}
        <View style={{ marginTop: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: "#111827", fontWeight: "500" }}>New Order Requests</Text>
            <View style={{ backgroundColor: "#4ade80", borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 12, color: "#fff", fontWeight: "500" }}>{mockOrders.length} Total</Text>
            </View>
          </View>
          {currentOrders.map((order) => (
            <View key={order.id} style={{ backgroundColor: "#fff", borderRadius: 14, marginVertical: 6, padding: 18, shadowColor: "#222", shadowOpacity: 0.15, shadowRadius: 7, elevation: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 16, color: "#111827", fontWeight: "bold", marginBottom: 8 }}>{order.retailerName}</Text>
                <View style={{ backgroundColor: "#fb923c", borderRadius: 10, paddingVertical: 4, paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 10, color: "#fff", fontWeight: "500" }}>New</Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: "#374151", marginTop: 8 }}>{order.items}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>{order.quantity}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <Text style={{ fontSize: 16, color: "#111827", fontWeight: "600" }}>₹{order.amount.toLocaleString()}</Text>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#4ade80", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, elevation: 2 }}>
                    <CheckCircle stroke="#fff" width={16} />
                    <Text style={{ fontSize: 14, color: "#fff", fontWeight: "500", marginLeft: 4 }}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff7ed", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginLeft: 8, elevation: 2 }}>
                    <X stroke="#D14343" width={14} />
                    <Text style={{ fontSize: 14, color: "#D14343", fontWeight: "500", marginLeft: 4 }}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Pagination */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, elevation: 2 }}
              disabled={currentOrderPage === 1}
              onPress={() => setCurrentOrderPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft stroke="#1e3a8a" width={18} />
              <Text style={{ marginLeft: 6 }}>Previous</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((page) => (
                <TouchableOpacity
                  key={page}
                  onPress={() => setCurrentOrderPage(page)}
                  style={[
                    { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginHorizontal: 4 },
                    currentOrderPage === page ? { backgroundColor: "#fff" } : { backgroundColor: "transparent" },
                  ]}
                >
                  <Text style={[{ fontSize: 14, color: "#111827", fontWeight: "500" }, currentOrderPage === page ? { fontWeight: "bold" } : {}]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, elevation: 2 }}
              disabled={currentOrderPage === totalOrderPages}
              onPress={() => setCurrentOrderPage((p) => Math.min(totalOrderPages, p + 1))}
            >
              <Text style={{ marginRight: 6 }}>Next</Text>
              <ChevronRight stroke="#1e3a8a" width={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Products Card */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 16, color: "#111827", fontWeight: "500" }}>Your Products</Text>
          <TouchableOpacity style={{ backgroundColor: "#fff", borderRadius: 14, marginVertical: 6, padding: 18, shadowColor: "#222", shadowOpacity: 0.15, shadowRadius: 7, elevation: 4 }} onPress={() => navigation.navigate("AddProduct", { userId })}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center" }}>
                  <Package stroke="#2563eb" width={28} height={28} />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, color: "#111827", fontWeight: "500" }}>Manage Your Products</Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{mockSalesData.totalProducts} Active Products</Text>
                </View>
              </View>
              <ArrowRight stroke="#aaa" width={22} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sales Overview */}
        <View style={{ backgroundColor: "#fff", borderRadius: 14, marginVertical: 6, padding: 18, shadowColor: "#222", shadowOpacity: 0.15, shadowRadius: 7, elevation: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: "#111827", fontWeight: "bold" }}>Sales Overview</Text>
            <TrendingUp stroke="#16a34a" width={20} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 18, color: "#1e3a8a", fontWeight: "600" }}>₹{mockSalesData.thisMonth.toLocaleString()}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>This Month</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 18, color: "#1e3a8a", fontWeight: "600" }}>₹{mockSalesData.lastMonth.toLocaleString()}</Text>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Last Month</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
            <TrendingUp stroke="#16a34a" width={16} />
            <Text style={{ color: "#16a34a", fontWeight: "600", marginLeft: 6 }}>
              +{mockSalesData.growth}% growth
            </Text>
          </View>
        </View>

        {/* Subscription Status */}
        <View style={{ backgroundColor: "#14b8a6", flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, padding: 18, marginTop: 18 }}>
          <View>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Premium Active</Text>
            <Text style={{ color: "#bae6fd", fontSize: 12 }}>Valid until 31 Dec 2024</Text>
          </View>
          <Shield stroke="#bae6fd" width={32} height={32} />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#ddd", flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, zIndex: 10 }}>
        <View style={{ alignItems: "center", flex: 1, backgroundColor: "#1e3a8a", borderRadius: 16, paddingVertical: 4 }}>
          <Home stroke="#fff" width={20} height={20} />
          <Text style={{ fontSize: 12, color: "#fff", marginTop: 2, fontWeight: "bold" }}>Home</Text>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Package stroke="#888" width={20} height={20} />
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Products</Text>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <ShoppingCart stroke="#888" width={20} height={20} />
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Orders</Text>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <CreditCard stroke="#888" width={20} height={20} />
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Payments</Text>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Settings stroke="#888" width={20} height={20} />
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Settings</Text>
        </View>
      </View>

      {/* Sidebar */}
      <Modal visible={sidebarOpen} animationType="slide" transparent>
        <View style={{ flex: 1, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSidebarOpen(false)} />
          <View style={{ width: "80%", backgroundColor: "#fff", height: "100%", padding: 24, justifyContent: "flex-start" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18, backgroundColor: "#1e3a8a", padding: 10, borderRadius: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>Profile & Menu</Text>
              <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                <X stroke="#fff" width={24} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#eee" }} />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontWeight: "bold", fontSize: 16, color: "#1e3a8a" }}>{tradeName}</Text>
                <Text style={{ color: "#bae6fd", fontSize: 13 }}>Premium Verified</Text>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>ID: WS-2024-001</Text>
              </View>
            </View>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1e3a8a", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, marginTop: 12 }} onPress={() => {
              setSidebarOpen(false);
              navigation.navigate("AddProduct", { userId });
            }}>
              <Plus stroke="#fff" width={18} />
              <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 10, fontSize: 15 }}>Add New Product</Text>
            </TouchableOpacity>
            {/* Add more sidebar options as needed */}
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, marginTop: 10 }} onPress={async () => {
              setSidebarOpen(false);
              await getAuth().signOut();
              // REMOVE navigation.replace('Home');
              // No navigation needed here!
            }}>
              <LogOut stroke="#D14343" width={18} />
              <Text style={{ color: "#D14343", fontWeight: "bold", marginLeft: 10, fontSize: 15 }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WholesalerDashboard;