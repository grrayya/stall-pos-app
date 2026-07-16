import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INITIAL_STOCK = [
  { id: '1', name: 'Rasgulla (Spongy)', price: 12, qty: 15, category: 'Syrup', requiresCooler: true },
  { id: '2', name: 'Kalo Jam', price: 14, qty: 10, category: 'Fried', requiresCooler: false },
  { id: '3', name: 'Mishti Doi (Clay Pot)', price: 8, qty: 8, category: 'Yogurt', requiresCooler: true },
  { id: '4', name: 'Saffron Chomchom', price: 15, qty: 12, category: 'Syrup', requiresCooler: true },
  { id: '5', name: 'Kachagolla / Sandesh', price: 16, qty: 18, category: 'Dry', requiresCooler: true },
  { id: '6', name: 'Assorted Mishti Box', price: 35, qty: 5, category: 'Boxes', requiresCooler: false },
];

export default function MishtiStallPOS() {
  const [stockItems, setStockItems] = useState([]);
  const [shiftRevenue, setShiftRevenue] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [isReady, setIsReady] = useState(false);
  const [isRestockMode, setIsRestockMode] = useState(false);

  useEffect(() => {
    const hydrateStore = async () => {
      try {
        const savedStock = await AsyncStorage.getItem('@stall_inventory');
        const savedRev = await AsyncStorage.getItem('@stall_revenue');
        const savedLog = await AsyncStorage.getItem('@stall_history');

        setStockItems(savedStock ? JSON.parse(savedStock) : INITIAL_STOCK);
        setShiftRevenue(savedRev ? JSON.parse(savedRev) : 0);
        setActivityLog(savedLog ? JSON.parse(savedLog) : []);
      } catch (e) {
        console.error("Storage read error, defaulting to initial stock:", e);
      }
      setIsReady(true);
    };
    
    hydrateStore();
  }, []);

  const flushToDisk = async (newStock, newRev, newLogs) => {
    // using multiSet to avoid chaining awaits and blocking the UI thread
    await AsyncStorage.multiSet([
      ['@stall_inventory', JSON.stringify(newStock)],
      ['@stall_revenue', JSON.stringify(newRev)],
      ['@stall_history', JSON.stringify(newLogs)]
    ]).catch(err => console.error("Disk write failed on flush:", err));
  };

  const processMishti = (sweet) => {
    const isSale = !isRestockMode;
    if (isSale && sweet.qty <= 0) return;

    const cashDiff = isSale ? sweet.price : -sweet.price;
    const stockDiff = isSale ? -1 : 1;
    const actionPrefix = isSale ? 'Sold' : 'Restocked/Undo';

    const updatedRevenue = Math.max(0, shiftRevenue + cashDiff);
    
    const updatedInventory = stockItems.map(s => 
      s.id === sweet.id ? { ...s, qty: s.qty + stockDiff } : s
    );

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logEntry = { id: Date.now().toString(), text: `[${timeString}] ${actionPrefix} ${sweet.name}` };
    
    const updatedLogs = [logEntry, ...activityLog].slice(0, 50);

    setStockItems(updatedInventory);
    setShiftRevenue(updatedRevenue);
    setActivityLog(updatedLogs);
    
    flushToDisk(updatedInventory, updatedRevenue, updatedLogs);
  };

  const closeShift = () => {
    Alert.alert(
      "End Shift",
      `Total Revenue: $${shiftRevenue}\n\nThis will reset revenue and clear the activity log. Inventory stock will remain as is. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Close Shift", 
          style: "destructive",
          onPress: async () => {
            setShiftRevenue(0);
            setActivityLog([]);
            await flushToDisk(stockItems, 0, []);
          }
        }
      ]
    );
  };

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.revenueText}>Revenue: ${shiftRevenue}</Text>
        <TouchableOpacity onPress={() => setIsRestockMode(!isRestockMode)} style={styles.modeButton}>
          <Text style={styles.modeText}>{isRestockMode ? "RESTOCK MODE" : "SELL MODE"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stockItems.filter(s => activeCategory === 'All' || s.category === activeCategory)}
        keyExtractor={s => s.id}
        renderItem={({ item: sweet }) => (
          <TouchableOpacity style={styles.card} onPress={() => processMishti(sweet)}>
            <Text style={styles.sweetName}>{sweet.name}</Text>
            <Text>Stock: {sweet.qty}</Text>
            <Text>${sweet.price}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.closeShiftBtn} onPress={closeShift}>
        <Text style={styles.closeShiftText}>End Shift</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f8f8f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  revenueText: { fontSize: 24, fontWeight: 'bold' },
  modeButton: { padding: 10, backgroundColor: '#ddd', borderRadius: 5 },
  modeText: { fontWeight: 'bold' },
  card: { padding: 15, marginVertical: 5, backgroundColor: 'white', borderRadius: 8, elevation: 1 },
  sweetName: { fontSize: 16, fontWeight: '600' },
  closeShiftBtn: { padding: 15, backgroundColor: '#ff4444', borderRadius: 8, marginTop: 10, alignItems: 'center' },
  closeShiftText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
