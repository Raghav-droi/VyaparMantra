import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';

type RouteParams = { orderId: string };

const STAGES = [
  { key: 'requested', label: 'Order Requested', icon: Package },
  { key: 'confirmed', label: 'Confirmed by Wholesaler', icon: CheckCircle },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
] as const;

export default function OrderTracking() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { orderId } = (route.params as RouteParams) || {};
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot((snap) => {
        setOrder(snap.exists ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      });
    return () => unsub();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#1e3a8a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
        </View>
        <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#1e3a8a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
        </View>
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#dc2626', fontSize: 16 }}>Order not found</Text>
        </View>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#16a34a';
      case 'shipped': return '#2563eb';
      case 'confirmed': return '#fbbf24';
      default: return '#dc2626';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return CheckCircle;
      case 'shipped': return Truck;
      case 'confirmed': return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#1e3a8a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Info Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>Order #{order.id.slice(-8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusBadgeText}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Text>
            </View>
          </View>
          
          <View style={styles.orderDetails}>
            <Text style={styles.productName}>{order.productName}</Text>
            <Text style={styles.wholesalerName}>{order.wholesalerName}</Text>
            
            <View style={styles.orderMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Quantity:</Text>
                <Text style={styles.metaValue}>{order.qty} {order.unit}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Price per unit:</Text>
                <Text style={styles.metaValue}>₹{order.pricePerUnit}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Total:</Text>
                <Text style={[styles.metaValue, styles.totalValue]}>₹{order.qty * order.pricePerUnit}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ordered on:</Text>
                <Text style={styles.metaValue}>
                  {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                </Text>
              </View>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Last updated:</Text>
                  <Text style={styles.metaValue}>
                    {order.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Progress Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Order Progress</Text>
          
          <View style={styles.timeline}>
            {STAGES.map((stage, index) => {
              const isAchieved = STAGES.findIndex(s => s.key === order.status) >= index;
              const isCurrent = stage.key === order.status;
              const IconComponent = stage.icon;
              
              return (
                <View key={stage.key} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <View style={[
                      styles.timelineIcon,
                      isAchieved && styles.timelineIconAchieved,
                      isCurrent && styles.timelineIconCurrent
                    ]}>
                      <IconComponent 
                        color={isAchieved ? '#fff' : '#9ca3af'} 
                        size={16} 
                        fill={isAchieved ? '#fff' : 'transparent'}
                      />
                    </View>
                    {index < STAGES.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        isAchieved && styles.timelineLineAchieved
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineLabel,
                      isAchieved && styles.timelineLabelAchieved
                    ]}>
                      {stage.label}
                    </Text>
                    <Text style={styles.timelineStatus}>
                      {isCurrent ? 'In Progress' : isAchieved ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            If you have any questions about this order, please contact the wholesaler directly.
          </Text>
          <Text style={styles.contactDetails}>
            Wholesaler: {order.wholesalerName}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDetails: {
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  wholesalerName: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderMeta: {
    marginTop: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineIconContainer: {
    alignItems: 'center',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconAchieved: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  timelineIconCurrent: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  timelineLineAchieved: {
    backgroundColor: '#16a34a',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  timelineLabelAchieved: {
    color: '#111827',
  },
  timelineStatus: {
    fontSize: 12,
    color: '#9ca3af',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  contactDetails: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});


