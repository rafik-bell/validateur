
import  {registerDevice}  from './src/hooks/registerDevice';
import  {connectMqtt}  from './src/hooks/mqttService';

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Animated,
  Platform,
  Button,
  NativeModules,NativeEventEmitter,
  ImageBackground
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Ticket } from './src/database/ticket';
import { Transaction } from './src/database/transaction';
import { Valideur } from './src/database/validuer';
import Config from './src/config/config';

import { verifyCertificate } from './src/utils/verifyCertificate';
import { verifyDate } from './src/utils/verifyDate';
import { verifyState } from './src/utils/verifyState';
import { verifyOfLigneTicket } from './src/utils/verifyOfLigneTicket';

import { Buffer } from 'buffer';
import {fetchAndSaveTickets} from './src/hooks/useFetchTickets'
import {fetchAndSaveTransaction} from './src/hooks/useFetchTtansaction'
import {fetchValideur} from './src/hooks/useFetchValideur'
import TicketStatus  from './src/components/TicketStatus';
const { ScannerModule } = NativeModules;
const scannerEmitter = new NativeEventEmitter(ScannerModule);





export default function ScannerScreen() {
  const ticketModel = new Ticket();
  const transactionModel = new Transaction();
  const valideurModel = new Valideur();

  const camera = useRef(null);
  const [scanned, setScanned] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);
  const scanLine = useRef(new Animated.Value(0)).current;
  const [ticketStatus, setTicketStatus] = useState(null);
  const [statusColor, setStatusColor] = useState('transparent');
  const [result, setResult] = useState('Waiting for scan...');



  fetchAndSaveTickets();
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


// Then run every 1 minute (60,000 ms)
setInterval(() => {
  fetchValideur(Config.VALIDATE_KEY);
}, 3 * 1000);
setInterval(() => {
  fetchAndSaveTickets();
}, 3 * 1000); // 60 seconds
setInterval(async() => {
  const transactions = await transactionModel.all();
  fetchAndSaveTransaction(transactions);
}, 10 * 1000); // 60 seconds
  // -------------------------------
  // Insert transaction safely
  // -------------------------------
  const addTransaction = async (ticket, result = 'REJECTED', mode) => {
  try {

    const transactions = await transactionModel.findWhere({
      ticket_num: ticket.ticket_num
    });

    

    if (transactions.length > 0) {

      const lastTransaction = transactions.reduce((prev, current) => {
        return prev.timestamp > current.timestamp ? prev : current;
      });
      
      const now = Date.now();
      const diff = now - lastTransaction.timestamp;

      const fifteenMinutes = 10 * 60 * 1000;

      if (diff < fifteenMinutes) {

        setTicketStatus('wait');
          setStatusColor('yeloww');
          setTimeout(() => {
            setScanned(false);
            setTicketStatus(null);
            setStatusColor('transparent');
          }, 3000);

        // Alert.alert(
        //   "⚠️ Ticket déjà utilisé",
        //   "Veuillez patienter 10 minutes avant de réessayer."
        // );
        return "0";
      }
    }
        const valideur = await valideurModel.all();


    await transactionModel.insert({
      validation_id: `val_${Date.now()}`,
      ticket_num: ticket.ticket_num,
      event_id: `EVT_${Date.now()}`,
      validator_id: valideur[0].name,
      location: 'Gate A',
      timestamp: Date.now(),
      validation_mode: mode,
      result,
      sync: '0'
    });

  } catch (err) {
    console.error('Transaction insert failed:', err);
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

  const loadValideur = async () => {
    const valideur = await valideurModel.all();
    const text = valideur
      .map(t => `--- ${t.id} -- ${t.status} --- ${t.name} _______--- ${t.operator_id}`)
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



  useEffect(() => {

    // تشغيل scanner
    ScannerModule.startScan()
      .then(() => console.log('Scanner ready'))
      .catch(err => console.error('Scanner error:', err));

    // استقبال النتيجة
    const onResult = scannerEmitter.addListener('onScanResult', async (data) => {
      console.log('Scanned value:', data.value);
      setResult(data.value);

    // scanningRef.current = true;
    setScanned(true);
    const ticketData = JSON.parse(data.value) || {};

        // Rename tickit_number to ticket_num
        const tr = {
            ticket_num: ticketData.ticket_number,
            ...ticketData // optional: keep other fields
        };
        

        // 1️⃣ Check certificate first
        const resultCertificate = await verifyCertificate(tr);
        if (resultCertificate === "0") {
          const transactin = await addTransaction(tr, 'rejected','online');
          if (transactin=== "0") {setTimeout(() => setScanned(false), 3000);return;}
          //Alert.alert('Ticket REJECTED ❌', `Certificate is not valid., ${tr}`);
          setTicketStatus('invalid');
          setStatusColor('red');
          setTimeout(() => {
            setScanned(false);
            setTicketStatus(null);
            setStatusColor('transparent');
          }, 3000);
          return;
        }

        // 2️⃣ Check date if certificate is valid
        const resultDate = await verifyDate(tr);
          if (resultDate === "0") {
            // إنشاء معاملة "منتهية الصلاحية"
            const transaction = await addTransaction(tr, 'expired', 'online');
            if (transaction === "0") {
              setTimeout(() => setScanned(false), 3000);
              return;
            }

            setTicketStatus('invalid');
            setStatusColor('red');
            
            // إيقاف كل الفحوصات الأخرى للتذكرة
            setTimeout(() => {
              setScanned(false);
              setTicketStatus(null);
              setStatusColor('transparent');
            }, 3000);
            return; // مهم جدًا: يمنع verifyState من التنفيذ
          }


        // 3️⃣ Check State if valid
        const resultState = await verifyState(tr);
        if (resultState === "0") {
          const resultOfLigneTicket = await verifyOfLigneTicket(tr);
          if (resultOfLigneTicket === "1") {

            const transaction = await addTransaction(tr, 'success','offline');
            if (transaction === "0") {
              setTimeout(() => setScanned(false), 3000);
              return;
            }
            //Alert.alert(`QR Code Detecteddddd ✅', ${resultOfLigneTicket}`);
            setTicketStatus('valid');
            setStatusColor('green');
            setTimeout(() => {
            setScanned(false);
            setTicketStatus(null);
            setStatusColor('transparent');
          }, 3000);

          return; // مهم جدا



          }else{
            const transactin = await addTransaction(tr, 'invalid','online');
          if (transactin === "0") {setTimeout(() => setScanned(false), 3000);return;}

          
          // verifyState already alerts about expiry
          //Alert.alert('Ticket INVALID ❌', `'date is not valid.'  ${tr}`);
          setTicketStatus('invalid');
          setStatusColor('red');
          //setTimeout(() => setScanned(false), 3000);
          setTimeout(() => {
            setScanned(false);
            setTicketStatus(null);
            setStatusColor('transparent');
          }, 3000);
          return;
          }

          
        }

        //  Ticket is valid
        const transaction = await addTransaction(tr, 'success','online');
        if (transaction === "0") {
              setTimeout(() => setScanned(false), 3000);
              return;
            }
        //Alert.alert('QR Code Detected ✅', codes[0].value);
        //setTimeout(() => setScanned(false), 3000);
        setTicketStatus('valid');
        setStatusColor('green');

        setTimeout(() => {
      // scanningRef.current = false;
      setScanned(false);
      setTicketStatus(null);
      setStatusColor('transparent');
    }, 3000);
    });

    // استقبال الأخطاء
    const onError = scannerEmitter.addListener('onScanError', (data) => {
      console.error('Scan error:', data.error);
    });

    // cleanup
    return () => {
      onResult.remove();
      onError.remove();
      ScannerModule.stopScan();
    };

  }, []);
  // -------------------------------
//   const scanningRef = useRef(false);

// const codeScanner = useCodeScanner({
//   codeTypes: ['qr'],
//   onCodeScanned: async (codes) => {

//     if (scanningRef.current || codes.length === 0) return;

//     scanningRef.current = true;
//     setScanned(true);

//     const ticketData = JSON.parse(codes[0].value);

//         // Rename tickit_number to ticket_num
//         const tr = {
//             ticket_num: ticketData.ticket_number,
//             ...ticketData // optional: keep other fields
//         };
        

//         // 1️⃣ Check certificate first
//         const resultCertificate = await verifyCertificate(tr);
//         if (resultCertificate === "0") {
//           const transactin = await addTransaction(tr, 'rejected','online');
//           if (transactin=== "0") {setTimeout(() => setScanned(false), 3000);return;}
//           //Alert.alert('Ticket REJECTED ❌', `Certificate is not valid., ${tr}`);
//           setTicketStatus('invalid');
//           setStatusColor('red');
//           setTimeout(() => {
//             setScanned(false);
//             setTicketStatus(null);
//             setStatusColor('transparent');
//           }, 3000);
//           return;
//         }

//         // 2️⃣ Check date if certificate is valid
//         const resultDate = await verifyDate(tr);
//           if (resultDate === "0") {
//             // إنشاء معاملة "منتهية الصلاحية"
//             const transaction = await addTransaction(tr, 'expired', 'online');
//             if (transaction === "0") {
//               setTimeout(() => setScanned(false), 3000);
//               return;
//             }

//             setTicketStatus('invalid');
//             setStatusColor('red');
            
//             // إيقاف كل الفحوصات الأخرى للتذكرة
//             setTimeout(() => {
//               setScanned(false);
//               setTicketStatus(null);
//               setStatusColor('transparent');
//             }, 3000);
//             return; // مهم جدًا: يمنع verifyState من التنفيذ
//           }


//         // 3️⃣ Check State if valid
//         const resultState = await verifyState(tr);
//         if (resultState === "0") {
//           const resultOfLigneTicket = await verifyOfLigneTicket(tr);
//           if (resultOfLigneTicket === "1") {

//             await addTransaction(tr, 'success','offline');
//             //Alert.alert(`QR Code Detecteddddd ✅', ${resultOfLigneTicket}`);
//             setTicketStatus('valid');
//             setStatusColor('green');
//             setTimeout(() => {
//             setScanned(false);
//             setTicketStatus(null);
//             setStatusColor('transparent');
//           }, 3000);

//           return; // مهم جدا



//           }else{
//             const transactin = await addTransaction(tr, 'invalid','online');
//           if (transactin === "0") {setTimeout(() => setScanned(false), 3000);return;}

          
//           // verifyState already alerts about expiry
//           //Alert.alert('Ticket INVALID ❌', `'date is not valid.'  ${tr}`);
//           setTicketStatus('invalid');
//           setStatusColor('red');
//           //setTimeout(() => setScanned(false), 3000);
//           setTimeout(() => {
//             setScanned(false);
//             setTicketStatus(null);
//             setStatusColor('transparent');
//           }, 3000);
//           return;
//           }

          
//         }

//         //  Ticket is valid
//         await addTransaction(tr, 'success','online');
//         //Alert.alert('QR Code Detected ✅', codes[0].value);
//         //setTimeout(() => setScanned(false), 3000);
//         setTicketStatus('valid');
//         setStatusColor('green');

//         setTimeout(() => {
//       scanningRef.current = false;
//       setScanned(false);
//       setTicketStatus(null);
//       setStatusColor('transparent');
//     }, 3000);
//   }
// });

    
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


  return (
    <ImageBackground
    source={require('./assets/images.png')} // 👈 حط الصورة هنا
    style={{ flex: 1 }}
    resizeMode="cover"
  >
     
    {/* <View style={styles.overlay}> */}
          {/* <View style={styles.scanBox}>
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanLine }] }]}
          />
        </View>

        <Text style={styles.title}>
          Scan QR Code or Tap NFC
        </Text> */}

         {ticketStatus && (
      <View style={styles.statusOverlay}>
        <TicketStatus status={ticketStatus} />
      </View>
    )}
 {/* <Text style={styles.label}>QR Result:</Text>
      <Text style={styles.value}>{result}</Text>

        <Button title="Add Ticket" onPress={addTicket} />
        <Button title="Load Tickets" onPress={loadTickets} />
         <Button title="Load transaction" onPress={loadTransaction} />
          <Button title="Load Valideur" onPress={loadValideur} />
      </View> */}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.5)'
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
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,  // covers full screen
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',             // clicks pass through to camera
  },
  label: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold'
  }
});
