import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Original default inventory for when the app first launches or is hard-reset
const DEFAULT_INVENTORY = [
  { id: '1', name: 'Rasgulla (Spongy)', price: 12, stock: 15, category: 'Syrup', requiresCooler: true },
  { id: '2', name: 'Kalo Jam', price: 14, stock: 10, category: 'Fried', requiresCooler: false },
  { id: '3', name: 'Mishti Doi (Clay Pot)', price: 8, stock: 8, category: 'Yogurt', requiresCooler: true },
  { id: '4', name: 'Saffron Chomchom', price: 15, stock: 12, category: 'Syrup', requiresCooler: true },
  { id: '5', name: 'Kachagolla / Sandesh', price: 16, stock: 18, category: 'Dry', requiresCooler: true },
  { id: '6', name: 'Assorted Mishti Box', price: 35, stock: 5, category: 'Boxes', requiresCooler: false },
];

export default function MishtiStallPOS() {
  const [inventory, setInventory] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [salesHistory, setSalesHistory] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // New States for Production Features
  const [isReady, setIsReady] = useState(false);
  const [isRestockMode, setIsRestockMode] = useState(false);

  // --- 1. PERSISTENCE: Load Data on Startup ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedInventory = await AsyncStorage.getItem('@stall_inventory');
        const storedRevenue = await AsyncStorage.getItem('@stall_revenue');
        const storedHistory = await AsyncStorage.getItem('@stall_history');

        setInventory(storedInventory ? JSON.parse(storedInventory) : DEFAULT_INVENTORY);
        setRevenue(storedRevenue ? JSON.parse(storedRevenue) : 0);
        setSalesHistory(storedHistory ? JSON.parse(storedHistory) : []);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsReady(true);
      }
    };
    loadData();
  }, []);

  // Helper to save all state to disk simultaneously 
  const saveToDisk = async (newInventory, newRevenue, newHistory) => {
    try {
      await AsyncStorage.setItem('@stall_inventory', JSON.stringify(newInventory));
      await AsyncStorage.setItem('@stall_revenue', JSON.stringify(newRevenue));
      await AsyncStorage.setItem('@stall_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  };

  // --- 2. UNDO & RESTOCK LOGIC ---
  const handleTransaction = (item) => {
    const isSelling = !isRestockMode;
    if (isSelling && item.stock <= 0) return;

    const priceAdjustment = isSelling ? item.price : -item.price;
    const stockAdjustment = isSelling ? -1 : 1;
    const actionText = isSelling ? 'Sold' : 'Restocked/Undo';

    const newRevenue = Math.max(0, revenue + priceAdjustment); // Prevent negative revenue
    
    const newInventory = inventory.map(invItem => 
      invItem.id === item.id ? { ...invItem, stock: invItem.stock + stockAdjustment } : invItem
    );

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = { id: Date.now().toString(), text: `[${timestamp}] ${actionText} ${item.name}` };
    
    // Keep a much longer log for the shift (e.g., 50 items) instead of just 3
    const newHistory = [newLog, ...salesHistory].slice(0, 50);

    // Update UI and save to disk immediately
    setInventory(newInventory);
    setRevenue(newRevenue);
    setSalesHistory(newHistory);
    saveToDisk(newInventory, newRevenue, newHistory);
  };

  // --- 3. END OF SHIFT SYSTEM ---
  const handleCloseShift = () => {
    Alert.alert(
      "End Shift",
      `Total Revenue: $${revenue}\n\nThis will reset revenue and clear the activity log. Inventory stock will remain as is. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Close Shift", 
          style: "destructive",
          on
