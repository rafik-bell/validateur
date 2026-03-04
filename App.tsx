import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Animated,
  Platform, Button
} from 'react-native'
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera'
import NfcManager, { NfcTech } from 'react-native-nfc-manager'
import { Ticket } from './src/database/ticket';


export default function ScannerScreen() {
  const ticketModel = new Ticket();

  const addTicket = async () => {
    const id = await ticketModel.insert({ status: true });
    console.log('Inserted ticket ID:', id);
    Alert.alert(`Inserted ticket ID:, ${id} , `)
  };

  const loadTickets = async () => {
    const tickets = await ticketModel.all();
    console.log('All tickets:', tickets);
    Alert.alert(`All tickets:', ${tickets[0].ticket_num}  `)
  };
  const camera = useRef(null)
  const [scanned, setScanned] = useState(false)
  const [nfcReading, setNfcReading] = useState(false)
  const scanLine = useRef(new Animated.Value(0)).current

  const device = useCameraDevice('back')

  // 🔐 Request permissions
  useEffect(() => {
    ;(async () => {
      await Camera.requestCameraPermission()
      if (Platform.OS === 'android') {
        await NfcManager.start()
      }
    })()
  }, [])

  // 🎞 Animated scan line
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 250,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start()
  }, [])

  // 📷 QR Scanner
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (!scanned && codes.length > 0) {
        setScanned(true)

        Alert.alert('QR Code Detected', codes[0].value)

        setTimeout(() => setScanned(false), 3000)
      }
    }
  })

  // 📡 Automatic NFC Scanner (Android)
  useEffect(() => {
    let isMounted = true

    const startNfcListener = async () => {
      if (Platform.OS !== 'android') return

      while (isMounted) {
        try {
          await NfcManager.requestTechnology(NfcTech.Ndef)
          const tag = await NfcManager.getTag()

          if (tag && !nfcReading) {
            setNfcReading(true)

            Alert.alert(
              'NFC Tag Detected',
              JSON.stringify(tag, null, 2)
            )

            setTimeout(() => setNfcReading(false), 3000)
          }
        } catch (error) {
          // scan cancelled
        } finally {
          NfcManager.cancelTechnologyRequest()
        }
      }
    }

    startNfcListener()

    return () => {
      isMounted = false
      NfcManager.cancelTechnologyRequest()
    }
  }, [nfcReading])

  if (!device) return null

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />

      {/* Dark overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanBox}>
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLine }] }
            ]}
          />
        </View>

        <Text style={styles.title}>
          Scan QR Code or Tap NFC
        </Text>
        <Button title="Add Ticket" onPress={addTicket} />
      <Button title="Load Tickets" onPress={loadTickets} />
      </View>
    </View>
  )
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
})