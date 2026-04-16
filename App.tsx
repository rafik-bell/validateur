import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Animated,
  Platform,
  NativeModules,
  NativeEventEmitter,
  Button,
  Pressable,Modal, ScrollView, TouchableOpacity,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';



import { ImageBackground } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Buffer } from 'buffer';
import { InteractionManager } from 'react-native';
import { initDB } from './src/database/database'; // استدعاء دالة تهيئة DB


import { Ticket } from './src/database/ticket';
import { Transaction } from './src/database/transaction';
import { Valideur } from './src/database/validuer';
import { ProductValAll } from './src/database/ProductValAll';
import { decryptData } from './src/services/decrypt';

import { registerDevice } from './src/hooks/registerDevice';
import { connectMqtt } from './src/hooks/mqttService';
import { fetchAndSaveTickets } from './src/hooks/useFetchTickets';
import { fetchAndSaveTransaction } from './src/hooks/useFetchTtansaction';
import { fetchValideur } from './src/hooks/useFetchValideur';
import { getProductsAllow } from './src/hooks/useFetchProductValALL';
import { checkConnection } from './src/hooks/testconectDevice';


import { getItem } from './src/services/storageService';
import { handleScanResult } from './src/services/scanService';

import TransportCards from './src/components/SelectOperatur';
import TicketStatus from './src/components/TicketStatus';
import Config from './src/config/config';

const { ScannerModule } = NativeModules;
const scannerEmitter = new NativeEventEmitter(ScannerModule);

const transportImages = {
  '1': require('./assets/1.png'),
  '2': require('./assets/2.png'),
  '3': require('./assets/3.png'),
  '4': require('./assets/4.png'),
  '5': require('./assets/5.png'),
};

const MemoizedTicketStatus = React.memo(TicketStatus);

export default function ScannerScreen() {
  const ticketModel = useRef(new Ticket()).current;
  const transactionModel = useRef(new Transaction()).current;
  const valideurModel = useRef(new Valideur()).current;
  const productModel = useRef(new ProductValAll()).current;

  const [scanned, setScanned] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);
  const scanLine = useRef(new Animated.Value(0)).current;
  const [ticketStatus, setTicketStatus] = useState(null);
  const [statusColor, setStatusColor] = useState('transparent');
  const [result, setResult] = useState('Waiting for scan...');
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactionData, setTransactionData] = useState([]); // ✅ مرة واحدة فقط
  const [showNumberInput, setShowNumberInput] = useState(false);
  const [numberInput, setNumberInput] = useState("0");

  const handleToggleDebug = useCallback(() => {  // ✅ مرة واحدة فقط
    setShowDebug(prev => !prev);
  }, []);


// Add this state at the top with other hooks
// -------------------------------
  // checkConnection
  // -------------------------------

  
  // -------------------------------
  // Load selected transport
  // -------------------------------
  useEffect(() => {
    const loadTransport = async () => {
      const id = await getItem('SELECTED_TRANSPORT_ID');
      setSelectedTransport(id);
      setLoading(false);
    };
    loadTransport();
  }, [refreshKey]);

  // -------------------------------
  // Init device and MQTT
  // -------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        await registerDevice();
        await connectMqtt();
      } catch (error) {
        console.error("Init error:", error);
      }
    };
    init();
  }, []);

  // -------------------------------
  // Fetch data periodically
  // -------------------------------
  useEffect(() => {
  initDB();
}, []);

  useEffect(() => {
    const fetchData = async () => {
      fetchValideur(Config.VALIDATE_KEY);
      fetchAndSaveTickets();
      const select_product = await getItem('SELECTED_TRANSPORT_ID');
      await getProductsAllow(select_product);
      const transactions = await transactionModel.all();
      fetchAndSaveTransaction(transactions);
    };

    const interval = setInterval(fetchData, 2 * 1000);

    // Initial fetch
    fetchData();

    return () => clearInterval(interval);
  }, [transactionModel]);

  // -------------------------------
  // Request permissions
  // -------------------------------
  useEffect(() => {
    (async () => {
      await Camera.requestCameraPermission();
      if (Platform.OS === 'android') {
        await NfcManager.start();
      }
    })();
  }, []);

  // -------------------------------
  // Animated scan line
  // -------------------------------
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 250, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // -------------------------------
  // QR Code scanner
  // -------------------------------
  useEffect(() => {
    ScannerModule.startScan()
      .then(() => console.log('Scanner ready'))
      .catch(err => console.error('Scanner error:', err));

    const onResult = scannerEmitter.addListener('onScanResult', (data) => {
      InteractionManager.runAfterInteractions(async () => {
                console.log("eeeeeeeeeeeeeeeeeeeeeee222222222222eeeeeeee",data.value)

        const qrText = await decryptData(data.value);

        console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",qrText)

        const source = {scanType : "qr" , serial_number :"qr_serial_number"} 
        await handleScanResult(qrText, setResult, setScanned, setTicketStatus, setStatusColor,source);
      });
    });

    const onError = scannerEmitter.addListener('onScanError', (data) => {
      console.error('Scan error:', data.error);
    });

    return () => {
      onResult.remove();
      onError.remove();
      ScannerModule.stopScan();
    };
  }, []);

  // -------------------------------
  // NFC Scanner (Android)
  // -------------------------------
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let isMounted = true;

    const startNfcListener = async () => {
      while (isMounted) {
        try {
          await NfcManager.requestTechnology(NfcTech.Ndef);
          const tag = await NfcManager.getTag();

          if (tag && !nfcReading) {
            setNfcReading(true);

            if (tag.ndefMessage?.length > 0) {
              const firstRecord = tag.ndefMessage[0];
              const nfcText = Buffer.from(firstRecord.payload.slice(3)).toString('utf8');
              const text = await decryptData(nfcText);

              const source = {scanType : "nfc" , serial_number :tag.id} 
              await handleScanResult(text, setResult, setScanned, setTicketStatus, setStatusColor,source);

              //Alert.alert('NFC Tag Detected', text);
            }

            setTimeout(() => setNfcReading(false), 3000);
          }
        } catch (error) {
          // ignore cancelled scans
        } finally {
          NfcManager.cancelTechnologyRequest();
        }
      }
    };

    startNfcListener();

    return () => {
      isMounted = false;
      NfcManager.cancelTechnologyRequest();
    };
  }, [nfcReading]);

  // -------------------------------
  // Transport selection screen
  // -------------------------------
  const handleSelectTransport = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (loading) return null;

  if (!selectedTransport) {
    return <TransportCards onSelect={handleSelectTransport} />;
  }

  // -------------------------------
  // Main render
  // -------------------------------
   const loadMUO = async () => {
   try {
    const value = await AsyncStorage.getItem("MAX_USES_OFFLINE");
    if (value !== null) {
      setNumberInput(value);
    }
    setShowNumberInput(true);
  } catch (e) {
    console.log("Error loading:", e);
    setShowNumberInput(true);
  }
};

    const loadTickets = async () => {
    const tickets = await ticketModel.all();
    console.log("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",tickets)
    const text = tickets
      .map(t => `--- ${t.id} -- ${t.status} --- ${t.ticket_num} ---${t.generated_by} --- ${t.max_uses} --- ${t.remaining_uses}`)
      .join("\n");
    Alert.alert("Tickets", text);
  };


  const cleanTicketNum = (num) => {
  if (!num) return 'N/A';
  const cleaned = num.replace(/\u0000/g, '').trim();
  return cleaned.length > 0 ? cleaned : 'N/A';
};

const loadTransaction = async () => {
  try {
    const transactions = await transactionModel.all();
    if (transactions.length === 0) {
      Alert.alert('Transactions', 'No transactions found.');
      return;
    }
    setTransactionData(transactions);
    setShowTransactions(true);
  } catch (err) {
    console.error('Failed to load transactions:', err);
    Alert.alert('Error', err.message);
  }
};
  return (

    <View style={{ flex: 1 }}>
    
<ImageBackground
  source={transportImages[selectedTransport]}
  style={{ flex: 1 }}
  resizeMode='cover'
  imageStyle= {{
  transform: [{ scale: 1 }], // تكبير 120%
}}
>
      {ticketStatus && (
        <View style={styles.statusOverlay}>
          <MemoizedTicketStatus status={ticketStatus} />
        </View>
      )}

       <Pressable style={styles.debugButton} onPress={handleToggleDebug}>
          <Text style={styles.debugButtonText}>⚙️</Text>
        </Pressable>
        <Pressable style={styles.connectionBtn} onPress={checkConnection}>
          <View style={styles.signalIcon}>
            {/* signal bars via View blocks */}
            <View style={[styles.bar, { height: 6, opacity: 0.4 }]} />
            <View style={[styles.bar, { height: 9, opacity: 0.7 }]} />
            <View style={[styles.bar, { height: 13 }]} />
            <View style={[styles.bar, { height: 16 }]} />
          </View>
          {/* <View style={styles.statusDot} /> */}
        </Pressable>

        {/* القائمة المنسدلة */}
        {showDebug && (
          <View style={styles.menuContainer}>
            <Pressable style={styles.menuItem} onPress={loadTickets}>
              <Text style={styles.menuText}>🎫 Tickets</Text>
            </Pressable> 
            <Pressable style={styles.menuItem} onPress={loadTransaction}>
              <Text style={styles.menuText}>💳 Transaction</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={loadMUO}>
              <Text style={styles.menuText}>📶 Max Use Offligne</Text>
            </Pressable>
            {/* <Pressable style={styles.menuItem} onPress={registerDevice}>
              <Text style={styles.menuText}>📱 Device</Text>
            </Pressable> */}
          </View>
        )}

        {/* <Button title="Load Tickets" onPress={loadTickets} />
         <Button title="Load transaction" onPress={loadTransaction} />
        <Button title="Devide" onPress={registerDevice} /> */}
</ImageBackground>

        <Modal
  visible={showTransactions}
  transparent
  animationType="slide"
  onRequestClose={() => setShowTransactions(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>

      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>📋 Transactions</Text>
        <TouchableOpacity onPress={() => setShowTransactions(false)}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Ticket</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Result</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Sync</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>MODE</Text>

        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Time</Text>
      </View>

      {/* Table Rows */}
      <ScrollView>
        {transactionData.map((t, index) => (
          <View
            key={t.id}
            style={[
              styles.tableRow,
              index % 2 === 0 ? styles.rowEven : styles.rowOdd,
            ]}
          >
            <Text style={[styles.tableCell, { flex: 1.2 }]}>
              {cleanTicketNum(t.ticket_num)}
            </Text>
            
            <Text
              style={[
                styles.tableCell,
                { flex: 1 },
                t.result === 'success' ? styles.success : styles.rejected,
              ]}
            >
              {t.result === 'success' ? `${t.result}✅` : `${t.result}❌`}
            </Text>
            <Text
              style={[
                styles.tableCell,
                { flex: 1 },
                t.sync === '1' ? styles.success : styles.pending,
              ]}
            >
              {t.sync === '1' ? '✅' : '⏳'}
            </Text>
            <Text style={[styles.tableCell, { flex: 2, fontSize: 10 }]}>
              {t.validation_mode}
            </Text>
            <Text style={[styles.tableCell, { flex: 2, fontSize: 10 }]}>
              {new Date(t.timestamp).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer count */}
      <View style={styles.modalFooter}>
        <Text style={styles.footerText}>
          Total: {transactionData.length} transactions
        </Text>
      </View>

    </View>
  </View>
</Modal>



{/* MODEL MAX USES OFFLIGNE */}
<Modal
      visible={showNumberInput}
      transparent
      animationType="slide"
      onRequestClose={() => setShowNumberInput(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Max Uses Offline</Text>
            <TouchableOpacity onPress={() => setShowNumberInput(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder={numberInput ? String(numberInput) : "Enter max uses"}
            keyboardType="numeric"
            value={numberInput}
            onChangeText={setNumberInput}
          />

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
               try {
                  await AsyncStorage.setItem("MAX_USES_OFFLINE", numberInput);
                  console.log("Saved:", numberInput);
                  setShowNumberInput(false);
                } catch (e) {
                  console.log("Error saving:", e);
                }
            }}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
</View>

    
  );
}

const styles = StyleSheet.create({
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  debugButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  debugButtonstatusdvice: {
    position: 'absolute',
    top: 30,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  debugButtonText: {
    fontSize: 22,
  },
  checkButtonText: {
    fontSize: 10,
  },
   menuContainer: {
    position: 'absolute',
    top: 85,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    paddingVertical: 10,
    width: 200,
    zIndex: 10,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
  // Add to StyleSheet.create({})
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  width: '95%',
  maxHeight: '80%',
  backgroundColor: '#1a1a2e',
  borderRadius: 16,
  overflow: 'hidden',
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#16213e',
  paddingHorizontal: 16,
  paddingVertical: 14,
},
modalTitle: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
},
closeBtn: {
  color: '#fff',
  fontSize: 20,
  fontWeight: 'bold',
},
tableHeader: {
  flexDirection: 'row',
  backgroundColor: '#0f3460',
  paddingVertical: 10,
  paddingHorizontal: 8,
},
tableHeaderCell: {
  color: '#e2e2e2',
  fontWeight: 'bold',
  fontSize: 12,
  textAlign: 'center',
},
tableRow: {
  flexDirection: 'row',
  paddingVertical: 10,
  paddingHorizontal: 8,
  alignItems: 'center',
},
rowEven: {
  backgroundColor: '#1a1a2e',
},
rowOdd: {
  backgroundColor: '#16213e',
},
tableCell: {
  color: '#ccc',
  fontSize: 12,
  textAlign: 'center',
},
success: {
  color: '#4ade80',
},
rejected: {
  color: '#f87171',
},
pending: {
  color: '#facc15',
},
modalFooter: {
  backgroundColor: '#16213e',
  padding: 12,
  alignItems: 'center',
},
footerText: {
  color: '#aaa',
  fontSize: 13,
},
input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    color: '#ccc',

  },
  saveBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },

  debugButtonTextof: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  debugButtonstatusdviceof: {
     position: 'absolute',
    top: 30,
    right: 20,
   backgroundColor: "#2196F3",
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center",
  justifyContent: "center",
  },

  connectionBtn: {
  position: 'absolute',
  top: 30,
  right: 20,
  width: 44,
  height: 44,
  borderRadius: 12,
  backgroundColor: '#2196F3',
  alignItems: 'center',
  justifyContent: 'center',
},
signalIcon: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: 3,
  height: 16,
},
bar: {
  width: 4,
  borderRadius: 2,
  backgroundColor: '#fff',
},
statusDot: {
  position: 'absolute',
  top: -3,
  right: -3,
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: '#4ade80',
  borderWidth: 2,
  borderColor: '#1a1a2e',
},

  




  
});