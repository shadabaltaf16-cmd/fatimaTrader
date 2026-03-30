import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Entry {
  id: string;
  date: string;
  nos: number;
  weight: number;
  rate: number;
  total: number;
}

interface Bill {
  id: string;
  customer_id: string;
  customer_name: string;
  week_start: string;
  week_end: string;
  entries: Entry[];
  grand_total: number;
  total_paid: number;
  balance: number;
  status: string;
  generated_date: string;
}

export default function PastBillsScreen() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    fetchPastBills();
  }, []);

  const fetchPastBills = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/bills/past`);
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching past bills:', error);
      Alert.alert('Error', 'Failed to fetch past bills');
    } finally {
      setLoading(false);
    }
  };

  const shareBill = async () => {
    if (!selectedBill || !viewShotRef.current) return;

    try {
      const uri = await viewShotRef.current.capture?.();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Bill',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing bill:', error);
      Alert.alert('Error', 'Failed to share bill');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd-MMM-yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd-MMM');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading past bills...</Text>
      </View>
    );
  }

  if (selectedBill) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedBill(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#2196F3" />
          <Text style={styles.backText}>Back to List</Text>
        </TouchableOpacity>

        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
          <View style={styles.billContainer}>
            <View style={styles.billHeader}>
              <Text style={styles.billTitle}>FATIMA TRADER</Text>
              <Text style={styles.billDate}>
                {formatShortDate(selectedBill.week_start)} to{' '}
                {formatShortDate(selectedBill.week_end)}
              </Text>
              <Text style={styles.generatedDate}>
                Generated: {formatDate(selectedBill.generated_date)}
              </Text>
            </View>

            <View style={styles.customerSection}>
              <Text style={styles.customerLabel}>Customer:</Text>
              <Text style={styles.customerName}>{selectedBill.customer_name}</Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Date</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>NOS</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Rate</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Total</Text>
              </View>

              {selectedBill.entries.map((entry, index) => (
                <View key={entry.id || index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {formatShortDate(entry.date)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{entry.nos}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {entry.weight.toFixed(1)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{entry.rate}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {entry.total.toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total:</Text>
                <Text style={styles.totalValue}>
                  ₹ {selectedBill.grand_total.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Paid:</Text>
                <Text style={styles.totalValue}>
                  ₹ {selectedBill.total_paid.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.balanceRow]}>
                <Text style={styles.balanceLabel}>Balance:</Text>
                <Text style={styles.balanceValue}>
                  ₹ {selectedBill.balance.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.statusBadge}>
              <Text
                style={[
                  styles.statusText,
                  selectedBill.status === 'paid'
                    ? styles.statusPaid
                    : styles.statusUnpaid,
                ]}
              >
                {selectedBill.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </ViewShot>

        <TouchableOpacity style={styles.shareButton} onPress={shareBill}>
          <Ionicons name="share-social" size={24} color="#ffffff" />
          <Text style={styles.shareButtonText}>Share Bill</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const renderBill = ({ item }: { item: Bill }) => (
    <TouchableOpacity
      style={styles.billCard}
      onPress={() => setSelectedBill(item)}
    >
      <View style={styles.billCardHeader}>
        <Text style={styles.billCardName}>{item.customer_name}</Text>
        <View
          style={[
            styles.statusBadgeSmall,
            item.status === 'paid'
              ? styles.statusBadgePaid
              : styles.statusBadgeUnpaid,
          ]}
        >
          <Text style={styles.statusBadgeText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.billCardDetails}>
        <View style={styles.billCardRow}>
          <Ionicons name="calendar-outline" size={16} color="#757575" />
          <Text style={styles.billCardDate}>
            {formatShortDate(item.week_start)} to {formatShortDate(item.week_end)}
          </Text>
        </View>
        <View style={styles.billCardRow}>
          <Text style={styles.billCardLabel}>Grand Total:</Text>
          <Text style={styles.billCardValue}>
            ₹ {item.grand_total.toFixed(2)}
          </Text>
        </View>
        <View style={styles.billCardRow}>
          <Text style={styles.billCardLabel}>Balance:</Text>
          <Text
            style={[
              styles.billCardValue,
              item.balance > 0 ? styles.balanceDue : styles.balancePaid,
            ]}
          >
            ₹ {item.balance.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.billCardFooter}>
        <Text style={styles.generatedText}>
          Generated: {formatDate(item.generated_date)}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#757575" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={bills}
        renderItem={renderBill}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={64} color="#bdbdbd" />
            <Text style={styles.emptyText}>No past bills</Text>
            <Text style={styles.emptySubtext}>
              Generated bills will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdbdbd',
    marginTop: 8,
  },
  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  billCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  statusBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePaid: {
    backgroundColor: '#C8E6C9',
  },
  statusBadgeUnpaid: {
    backgroundColor: '#FFCDD2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  billCardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginBottom: 12,
  },
  billCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billCardDate: {
    fontSize: 13,
    color: '#757575',
    marginLeft: 6,
  },
  billCardLabel: {
    fontSize: 14,
    color: '#757575',
  },
  billCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  balanceDue: {
    color: '#f44336',
  },
  balancePaid: {
    color: '#4CAF50',
  },
  billCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  generatedText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 8,
  },
  billContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  billHeader: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    paddingBottom: 12,
  },
  billTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  billDate: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  generatedDate: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  customerSection: {
    marginBottom: 20,
  },
  customerLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 6,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 12,
    color: '#424242',
  },
  totalSection: {
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#424242',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  balanceRow: {
    backgroundColor: '#FFF9C4',
    marginTop: 8,
    padding: 12,
    borderRadius: 6,
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  statusBadge: {
    alignItems: 'center',
    marginTop: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusPaid: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
  },
  statusUnpaid: {
    backgroundColor: '#FFCDD2',
    color: '#C62828',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
