// mqtt-service.js - React Native Compatible Version
// ⚠️ Add these polyfills FIRST in your index.js (see below)

import Config from 'react-native-config'; // ← instead of dotenv
import mqtt from 'mqtt';
import DeviceInfo from 'react-native-device-info'; // for unique ID

// --- Configuration ---
const DEVICE_TYPE = Config.DEVICE_TYPE || 'validator';
const DEVICE_UUID = '8e978861-dccd-57a0-b57c-65d3f107bc99';

const CONFIG = {
    url: 'ws://172.31.15.18:8083/mqtt', // Must be wss:// for production
    clientId: `${DEVICE_TYPE}_${DEVICE_UUID}`, // Ensure unique clientId
    keepalive: 5,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    will: {
        topic: `devices/${DEVICE_TYPE}/${DEVICE_UUID}/status`,
        payload: "offline",
        qos: 1,
        retain: true
    },
    subscriptions: ['devices/validator/broadcast/sync_device'] // Subscribe to all device status updates
};

let client = null;
let connectPromise = null;

async function connectMqtt() {
    if (client && client.connected) {
        return client;
    }

    if (connectPromise) {
        return connectPromise;
    }

    connectPromise = new Promise((resolve, reject) => {
        console.log(`📡 Connecting to MQTT: ${'ws://172.31.15.18:8083/mqtt'}`);

        const options = {
            clientId: CONFIG.clientId,
            keepalive: CONFIG.keepalive,
            reconnectPeriod: CONFIG.reconnectPeriod,
            connectTimeout: CONFIG.connectTimeout,
            clean: true,
            will: CONFIG.will,
            // 🔑 CRITICAL FIX FOR REACT NATIVE:
            transport: 'ws', // ← Required when using 'mqtt' package with WebSocket
        };
        const newClient = mqtt.connect('ws://172.31.15.18:8083/mqtt', options);

        newClient.on('connect', () => {
            console.log(`✅ MQTT Connected: ${CONFIG.clientId}`);
            newClient.publish(CONFIG.will.topic, "online", { qos: 1, retain: true });
            console.log(`📤 Published online stsatus to: ${CONFIG.will.topic}`);
            if (CONFIG.subscriptions.length > 0) {
                newClient.subscribe(CONFIG.subscriptions, (err) => {
                    if (!err) console.log(`📥 Subscribed to: ${CONFIG.subscriptions.join(', ')}`);
                });
            }

            client = newClient;
            resolve(client);
        });

        newClient.on('error', (err) => {
            console.error(`❌ MQTT Error: ${err.message}`);
        });

        newClient.on('reconnect', () => {
            console.warn('🔄 MQTT Reconnecting...');
        });

        newClient.on('message', (topic, message) => {
            console.log(`📨 [${topic}]: ${message.toString()}`);
        });

        newClient.on('close', () => {
            console.warn('⚠️ MQTT Connection closed.');
        });

        setTimeout(() => {
            if (!newClient.connected) {
                const err = new Error('MQTT Connection Timeout');
                console.error('💥', err.message);
                newClient.end(true);
                connectPromise = null;
                reject(err);
            }
        }, CONFIG.connectTimeout + 2000);
    });

    return connectPromise;
}

async function getClient() {
    if (!client || !client.connected) {
        return await connectMqtt();
    }
    return client;
}

// ✅ Keep your exact export style - works in RN
module.exports = {
    connectMqtt,
    getClient,
    CONFIG
};