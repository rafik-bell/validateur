import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Animated,
  Platform,
  NativeModules,
  NativeEventEmitter
} from 'react-native';
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

import { registerDevice } from './src/hooks/registerDevice';
import { connectMqtt } from './src/hooks/mqttService';
import { fetchAndSaveTickets } from './src/hooks/useFetchTickets';
import { fetchAndSaveTransaction } from './src/hooks/useFetchTtansaction';
import { fetchValideur } from './src/hooks/useFetchValideur';
import { getProductsAllow } from './src/hooks/useFetchProductValALL';

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
    const fetchData = async () => {
      initDB()
      fetchValideur(Config.VALIDATE_KEY);
      fetchAndSaveTickets();
      const select_product = await getItem('SELECTED_TRANSPORT_ID');
      await getProductsAllow(select_product);
      const transactions = await transactionModel.all();
      fetchAndSaveTransaction(transactions);
    };

    const interval = setInterval(fetchData, 10 * 1000);

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
        const source = {scanType : "qr" , serial_number :"qr_serial_number"} 
        await handleScanResult(data, setResult, setScanned, setTicketStatus, setStatusColor,source);
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
              const text = Buffer.from(firstRecord.payload.slice(3)).toString('utf8');
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
  return (
    
<ImageBackground
  source={transportImages[selectedTransport]}
  style={{ flex: 1 }}
  resizeMode="cover"
>
      {ticketStatus && (
        <View style={styles.statusOverlay}>
          <MemoizedTicketStatus status={ticketStatus} />
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});