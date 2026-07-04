import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';

export default function MishtiStallPOS() {
  // 1. Authentic Bangladeshi Sweet Inventory
  const initialInventory = [
    { id: '1', name: 'Rasgulla (Spongy)', price: 12, stock: 15, category: 'Syrup', requiresCooler: true },
    { id: '2', name: 'Kalo Jam', price: 14, stock: 10, category: 'Fried', requiresCooler: false },
    { id: '3', name: 'Mishti Doi (Clay Pot)', price: 8, stock: 8, category: 'Yogurt', requiresCooler: true },
    { id: '4', name: 'Saffron Chomchom', price: 15, stock: 12, category: 'Syrup', requiresCooler: true },
    { id: '5', name: 'Kachagolla / Sandesh', price: 16, stock: 18, category: 'Dry', requiresCooler: true },
    { id: '6', name: 'Assorted Mishti Box (1kg)', price: 35, stock: 5, category: 'Boxes', requiresCooler: false },
  ];

  // 2. State Management
  const [inventory, setInventory] = useState(initialInventory);
  const [revenue, setRevenue] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [salesHistory, setSalesHistory] = useState([]);

  // 3. Process Sale
  const handleSale = (item) => {
    if (item.stock <= 0) return;

    setRevenue(prevRevenue => prevRevenue + item.price);

    setInventory(prevInventory => 
      prevInventory.map(invItem => 
        invItem.id === item.id ? { ...invItem, stock: invItem.stock - 1 } : invItem
      )
    );

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSalesHistory(prevHistory => [
      { id: Date.now().toString(), text: `[${timestamp}] Sold ${item.name} (-1)` },
      ...prevHistory
    ].slice(0, 3)); 
  };

  // 4. Advanced Filtering Logic (Handles both product categories and the structural Cooler rule)
  const filteredInventory = inventory.filter(item => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Cooler') return item.requiresCooler;
    return item.category === selectedFilter;
  });

  // 5. Item Card Renderer
  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          {/* Conditional rendering for the cooler badge */}
          {item.requiresCooler && (
            <View style={styles.coolerBadge}>
              <Text style={styles.coolerBadgeText}>❄️ Chilled</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemMeta}>Price: ${item.price} | Stock: {item.stock}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.sellButton, item.stock === 0 && styles.disabledButton]}
        onPress={() => handleSale(item)}
        disabled={item.stock === 0}
      >
        <Text style={styles.sellButtonText}>{item.stock > 0 ? '+$ Sale' : 'Out'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Revenue Tracker Dashboard */}
      <View style={styles.dashboard}>
        <Text style={styles.dashboardTitle}>Mishti Register</Text>
        <Text style={styles.revenueText}>Total Revenue: ${revenue}</Text>
      </View>

      {/* Filter Navigation Bar */}
      <View style={styles.tabBar}>
        {['All', 'Cooler', 'Syrup', 'Dry', 'Boxes'].map(filterOption => (
          <TouchableOpacity 
            key={filterOption} 
            style={[
              styles.tab, 
              selectedFilter === filterOption && styles.activeTab,
              filterOption === 'Cooler' && styles.coolerTab
            ]}
            onPress={() => setSelectedFilter(filterOption)}
          >
            <Text style={[
              styles.tabText, 
              selectedFilter === filterOption && styles.activeTabText,
              filterOption === 'Cooler' && selectedFilter !== 'Cooler' && styles.coolerTabText
            ]}>
              {filterOption === 'Cooler' ? '❄️ Cooler' : filterOption}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main List */}
      <FlatList 
        data={filteredInventory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Transaction Feed */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Recent Shift Activity</Text>
        {salesHistory.length === 0 ? (
          <Text style={styles.emptyHistoryText}>Ready for first order...</Text>
        ) : (
          salesHistory.map(log => (
            <Text key={log.id} style={styles.logText}>{log.text}</Text>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  dashboard: { backgroundColor: '#4A3525', padding: 20, alignItems: 'center' },
  dashboardTitle: { color: '#F5E6D3', fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 },
  revenueText: { color: '#2ECC71', fontSize: 28, fontWeight: 'bold', marginTop: 5 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EADBC8' },
  tab: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 15 },
  activeTab: { backgroundColor: '#D2B48C' }, 
  coolerTab: { borderWidth: 1, borderColor: '#3498db' },
  tabText: { color: '#7A6B58', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#fff' },
  coolerTabText: { color: '#3498db' },
  listContainer: { padding: 15 },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EADBC8', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#4A3525' },
  coolerBadge: { backgroundColor: '#E1F5FE', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  coolerBadgeText: { color: '#0288D1', fontSize: 11, fontWeight: 'bold' },
  itemMeta: { fontSize: 14, color: '#8A7A68', marginTop: 6 },
  sellButton: { backgroundColor: '#E67E22', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  disabledButton: { backgroundColor: '#BDC3C7' },
  sellButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  historySection: { backgroundColor: '#fff', padding: 15, borderTopWidth: 2, borderColor: '#4A3525' },
  historyTitle: { fontSize: 13, fontWeight: 'bold', color: '#4A3525', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  logText: { fontSize: 13, color: '#E67E22', marginVertical: 2, fontFamily: 'monospace' },
  emptyHistoryText: { fontSize: 13, color: '#95A5A6', fontStyle: 'italic' }
});
