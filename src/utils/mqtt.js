import { NativeModules, NativeEventEmitter } from 'react-native';

const { MqttModule, DeviceRegistrationModule } = NativeModules;
const mqttEmitter = new NativeEventEmitter(MqttModule);

export async function startupDevice() {
  // Step 1 — get hardware serial
  const serial = await MqttModule.getSerial();
  console.log('Serial:', serial);

  // Step 2 — register with backend, get UUID
  const uuid = await DeviceRegistrationModule.registerDevice();
  console.log('UUID:', uuid);

  // Step 3 — connect MQTT (serial is used as clientId internally)
  await MqttModule.connect([
    `devices/sensor/${serial}/commands`,
    `devices/sensor/${serial}/config`,
  ]);

  // Step 4 — listen to events
  mqttEmitter.addListener('mqtt_connected',    ({ serial, serverURI, reconnect }) => {
    console.log(`Connected to ${serverURI} — serial: ${serial}`);
  });

  mqttEmitter.addListener('mqtt_disconnected', (reason) => {
    console.warn('Disconnected:', reason);
  });

  mqttEmitter.addListener('mqtt_message',      ({ topic, payload, retained }) => {
    console.log(`[${topic}] ${payload} (retained=${retained})`);
  });

  mqttEmitter.addListener('mqtt_error',        (err) => {
    console.error('MQTT error:', err);
  });
}