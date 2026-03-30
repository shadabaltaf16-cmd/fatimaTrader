import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers');
    }
  };

  const addCustomer = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/customers`, {
        name: name.trim(),
        phone: phone.trim(),
      });
      setModalVisible(false);
      setName('');
      setPhone('');
      fetchCustomers();
      Alert.alert('Success', 'Customer added successfully');
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert('Error', 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = (customer: Customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/customers/${customer.id}`);
              fetchCustomers();
              Alert.alert('Success', 'Customer deleted');
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerInfo}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-circle" size={48} color="#2196F3" />
        </View>
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerPhone}>{item.phone}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => deleteCustomer(item)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash" size={24} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#bdbdbd" />
            <Text style={styles.emptyText}>No customers yet</Text>
            <Text style={styles.emptySubtext}>Add your first customer below</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter customer name"
                placeholderTextColor="#bdbdbd"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#bdbdbd"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, loading && styles.addButtonDisabled]}
              onPress={addCustomer}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                {loading ? 'Adding...' : 'Add Customer'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#757575',
  },
  deleteButton: {
    padding: 8,
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#fafafa',
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
