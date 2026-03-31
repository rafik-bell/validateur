
import { Alert } from 'react-native';
import Config from '../config/config';
import { db } from '../database/database';
import DeviceInfo from 'react-native-device-info';
import { setItem } from '../services/storageService';



export async function registerDevice() {
  

  const deviceInfo = {
    serial_number: await DeviceInfo.getUniqueId(),
    device_type: Config.D_TYPE,
  };

  const URL_BACKEND = Config.API_URL;

  try {


    const response = await fetch(`${URL_BACKEND}/api/register_device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceInfo),
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const data = await response.json();


    if (!data.result) {
      throw new Error("Device registration failed: No device UUID returned.");
    }

    const uuid = data.result;
    setItem('DEVICE_UUID', uuid);
    

        db.transaction((tx) => {
    tx.executeSql(`INSERT INTO device (uuid) VALUES (?);`, [uuid]);
        }, (err) => {
        console.log("Failed to save UUID:", err);
        }, () => {
    Alert.alert(
                  `
                  ${uuid}`
                );    });





    return uuid;

  } catch (err) {

    console.error(err.message || err);

  }
}

