
import React from 'react';
import { View, Button, Alert, StyleSheet } from 'react-native';
 
 
  export const checkConnection = async () => {
    try {
      const response = await fetch('http://172.31.15.16:8069/connect');
      const data = await response.json();
 
      // Show popup with connection status
       Alert.alert(
        'Connection Status',
        '✅  Connected',
        [
          { text: 'OK', style: 'default' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {

      Alert.alert(
        'Connection Status',
        '❌  Unable to connect to server',
        [
          { text: 'OK', style: 'default' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      // Handle network errors
      //Alert.alert('Error', 'Unable to connect to server');
    }
  }
