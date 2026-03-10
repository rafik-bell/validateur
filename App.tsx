import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Animated,
  Platform,
  Button
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Ticket } from './src/database/ticket';
import { Transaction } from './src/database/transaction';
import { verifyCertificate } from './src/utils/verifyCertificate';
import { verifyDate } from './src/utils/verifyDate';
import { verifyState } from './src/utils/verifyState';
import { verifyOfLigneTicket } from './src/utils/verifyOfLigneTicket';

import { Buffer } from 'buffer';
import {fetchAndSaveTickets} from './src/hooks/useFetchTickets'
import {fetchAndSaveTransaction} from './src/hooks/useFetchTtansaction'


export default function ScannerScreen() {
  const ticketModel = new Ticket();
  const transactionModel = new Transaction();

  const camera = useRef(null);
  const [scanned, setScanned] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);
  const scanLine = useRef(new Animated.Value(0)).current;

  const device = useCameraDevice('back');


  fetchAndSaveTickets();

// Then run every 1 minute (60,000 ms)

setInterval(() => {
  fetchAndSaveTickets();
}, 60 * 1000); // 60 seconds
setInterval(async() => {
  const transactions = await transactionModel.all();
  fetchAndSaveTransaction(transactions);
}, 60 * 100); // 60 seconds
  // -------------------------------
  // Insert transaction safely
  // -------------------------------
  const addTransaction = async (ticket, result = 'REJECTED', mode) => {
    try {
      await transactionModel.insert({
        validation_id: `val_${Date.now()}`,
        ticket_num: ticket?.ticket_num || 'unknown',
        event_id: 'EVT2026',
        validator_id: 'GATE-000',
        location: 'Gate A',
        timestamp: Date.now(),
        validation_mode: mode,
        result,
        sync : '0'
      });
      //Alert.alert('Transaction inserted', `Ticket: ${ticket?.ticket_num}`);
    } catch (err) {
      console.error('Transaction insert failed:', err);
      //Alert.alert('Transaction insert failed', err.message);
    }
  };

  // -------------------------------
  // Ticket helper functions
  // -------------------------------
  const addTicket = async () => {
    await ticketModel.insert({
      ticket_num: "TICKET_002",
      status: "acsepte",
    });
    Alert.alert("Ticket inserted");
  };

  const loadTickets = async () => {
    const tickets = await ticketModel.all();
    const text = tickets
      .map(t => `--- ${t.id} -- ${t.status} --- ${t.ticket_num}`)
      .join("\n");
    Alert.alert("Tickets", text);
  };


  const loadTransaction = async () => {
  try {
    const transactions = await transactionModel.all();
    if (transactions.length === 0) {
      Alert.alert("Transactions", "No transactions found.");
      return;
    }

    const text = transactions
      .map(t => `${t.validation_mode} ------${t.validation_id} -- ${t.ticket_num} --  ${t.sync} ----${t.result} -- ${new Date(t.timestamp).toLocaleString()}`)
      .join("\n");

    Alert.alert("Transactions", text);
  } catch (err) {
    console.error("Failed to load transactions:", err);
    Alert.alert("Error", err.message);
  }
};

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
  // QR Code Scanner
  // -------------------------------
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: async (codes) => {
      if (!scanned && codes.length > 0) {
        setScanned(true);

        const ticketData = JSON.parse(codes[0].value);

        // Rename tickit_number to ticket_num
        const tr = {
            ticket_num: ticketData.ticket_number,
            ...ticketData // optional: keep other fields
        };
        

        // 1️⃣ Check certificate first
        const resultCertificate = await verifyCertificate(tr);
        if (resultCertificate === 0) {
          await addTransaction(tr, 'rejected','online');
          Alert.alert('Ticket REJECTED ❌', `Certificate is not valid., ${tr}`);
          setTimeout(() => setScanned(false), 3000);
          return;
        }

        // 2️⃣ Check date if certificate is valid
        const resultDate = await verifyDate(tr);
        if (resultDate === 0) {
          await addTransaction(tr, 'expired','online');
          // verifyDate already alerts about expiry
          Alert.alert('Ticket Expited ❌', `'date is not valid.' ${tr}`);
          setTimeout(() => setScanned(false), 3000);
          return;
        }

        // 3️⃣ Check State if valid
        const resultState = await verifyState(tr);
        if (resultState === 0) {
          const resultOfLigneTicket = await verifyOfLigneTicket(tr);
          if (resultOfLigneTicket === 1) {

            await addTransaction(tr, 'success','offline');
            Alert.alert('QR Code Detected ✅', codes[0].value);


          }

          await addTransaction(tr, 'invalid','online');
          // verifyState already alerts about expiry
          Alert.alert('Ticket INVALID ❌', `'date is not valid.'  ${tr}`);
          setTimeout(() => setScanned(false), 3000);
          return;
        }

        //  Ticket is valid
        await addTransaction(tr, 'SUCCESS','online');
        Alert.alert('QR Code Detected ✅', codes[0].value);
        setTimeout(() => setScanned(false), 3000);
      }
    }
  });

  // -------------------------------
  // NFC Scanner (Android)
  // -------------------------------
  useEffect(() => {
    let isMounted = true;

    const startNfcListener = async () => {
      if (Platform.OS !== 'android') return;

      while (isMounted) {
        try {
          await NfcManager.requestTechnology(NfcTech.Ndef);
          const tag = await NfcManager.getTag();

          if (tag && !nfcReading) {
            setNfcReading(true);

            // Parse NDEF message if exists
            if (tag.ndefMessage?.length > 0) {
              const firstRecord = tag.ndefMessage[0];
              const text = Buffer.from(firstRecord.payload.slice(3)).toString('utf8');

              Alert.alert('NFC Tag Detected', text);

              // Insert as transaction
              const tr = { ticket_num: text, date: new Date().toISOString(), certif_if: 'NFC' };
              await addTransaction(tr, 'ACCEPTED','');
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

  if (!device) return null;

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />

      <View style={styles.overlay}>
        <View style={styles.scanBox}>
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanLine }] }]}
          />
        </View>

        <Text style={styles.title}>
          Scan QR Code or Tap NFC
        </Text>

        <Button title="Add Ticket" onPress={addTicket} />
        <Button title="Load Tickets" onPress={loadTickets} />
         <Button title="Load transaction" onPress={loadTransaction} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00ffcc',
    borderRadius: 20,
    overflow: 'hidden'
  },
  scanLine: {
    height: 2,
    width: '100%',
    backgroundColor: '#00ffcc'
  },
  title: {
    marginTop: 30,
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  }
});