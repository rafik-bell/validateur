// mqtt-service.js - React Native Compatible Version
// ⚠️ Add these polyfills FIRST in your index.js (see below)

import Config from '../config/config';

import mqtt from 'mqtt';
import DeviceInfo from 'react-native-device-info'; // for unique ID
import { setItem, getItem } from '../services/storageService';
import { Identification } from '../database/identification';

const identificationModel = new Identification();

// --- Configuration ---
const DEVICE_TYPE = Config.DEVICE_TYPE || 'validator';
//const DEVICE_UUID = '8e978861-dccd-57a0-b57c-65d3f107bc99';
async function createConfig() {
    let DEVICE_UUID = await getItem('DEVICE_UUID'); // انتظر القيمة هنا
 
    let CONFIG = {
        url: Config.MQTT_BROKER_URL,
        clientId: `${DEVICE_TYPE}_${DEVICE_UUID}`, // الآن يعمل بشكل صحيح
        keepalive: 5,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        will: {
            topic: `devices/${DEVICE_TYPE}/${DEVICE_UUID}/status`,
            payload: "offline",
            qos: 1,
            retain: true
        },
        subscriptions: ['devices/validator/broadcast/sync_device']
    };
 
    return CONFIG;
}
let client = null;
let connectPromise = null;

async function connectMqtt() {
    const CONFIG = await createConfig();
    if (client && client.connected) {
        return client;
    }

    if (connectPromise) {
        return connectPromise;
    }

    connectPromise = new Promise((resolve, reject) => {

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
        const newClient = mqtt.connect(Config.MQTT_BROKER_URL, options);

        newClient.on('connect', () => {
            // console.log(`✅ MQTT Connected: ${CONFIG.clientId}`);
            newClient.publish(CONFIG.will.topic, "online", { qos: 1, retain: true });
            // console.log(`📤 Published online stsatus to: ${CONFIG.will.topic}`);
            if (CONFIG.subscriptions.length > 0) {
                newClient.subscribe(CONFIG.subscriptions, (err) => {
                    if (!err) console.log(`📥 Subscribed to: ${CONFIG.subscriptions.join(', ')}`);
                });
            }

            client = newClient;
            resolve(client);
        });

        // newClient.on('error', (err) => {
        //     console.error(`❌ MQTT Error: ${err.message}`);
        // });

        // newClient.on('reconnect', () => {
        //     console.warn('🔄 MQTT Reconnecting...');
        // });

        newClient.on('message', async(topic, message) => {
            console.log(`📨 [${topic}]: ${message.toString()}`);
            try {
                const parsed = JSON.parse(message.toString());
                const uuid = parsed.device;
                const status = parsed.state;

                // البحث عن السجل الحالي
                const existing = await identificationModel.findOne({ uuid });

                if (existing) {
                // تحديث الحالة فقط إذا وجد السجل
                await identificationModel.updateById(existing.id, { status });
                console.log(`✅ Updated existing record for uuid ${uuid}`);
                } else {
                // إدراج سجل جديد إذا لم يوجد
                await identificationModel.insert({ uuid, status });
                console.log(`✅ Inserted new record for uuid ${uuid}`);
                }

            } catch (err) {
                console.error('❌ Failed to process message:', err);
            }
        });

        newClient.on('close', () => {
            console.warn('⚠️ MQTT Connection closed.');
        });

        setTimeout(() => {
            if (!newClient.connected) {
                const err = new Error('MQTT Connection Timeout');
                // console.error('💥', err.message);
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
};