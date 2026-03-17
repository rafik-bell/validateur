// mqttService.js
import { useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt/dist/mqtt';

const MQTT_BROKER_URL = 'ws://broker.hivemq.com:8000/mqtt'; // WebSocket URL
const DEVICE_TYPE = 'myDevice';
const DEVICE_UUID = 'device123';

const willTopic = `devices/${DEVICE_TYPE}/${DEVICE_UUID}/status`;

export default function useMqtt(subscriptions = []) {
  const clientRef = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId: DEVICE_UUID,
      keepalive: 5,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      clean: true,
      will: {
        topic: willTopic,
        payload: 'offline',
        qos: 1,
        retain: true,
      },
    });

    client.on('connect', () => {
      console.log('✅ MQTT Connected');
      client.publish(willTopic, 'online', { qos: 1, retain: true });

      if (subscriptions.length > 0) {
        client.subscribe(subscriptions, (err) => {
          if (!err) console.log('📥 Subscribed to:', subscriptions.join(', '));
        });
      }
    });

    client.on('message', (topic, message) => {
      const msg = message.toString();
      console.log(`📨 [${topic}]: ${msg}`);
      setMessages((prev) => [...prev, { topic, message: msg }]);
    });

    client.on('error', (err) => console.error('❌ MQTT Error:', err));
    client.on('reconnect', () => console.warn('🔄 MQTT Reconnecting...'));
    client.on('close', () => console.warn('⚠️ MQTT Connection closed'));

    clientRef.current = client;

    return () => client.end();
  }, [subscriptions]);

  const publish = (topic, payload, options = { qos: 1, retain: false }) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topic, payload, options);
    }
  };

  return { messages, publish, client: clientRef.current };
}