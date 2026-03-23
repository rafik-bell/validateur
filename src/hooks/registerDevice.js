
import { Alert } from 'react-native';
import Config from '../config/config';
import { db } from '../database/database';



export async function registerDevice() {
  const deviceInfo = {
    serial_number: Config.SR_NUM,
    device_type: Config.D_TYPE,
  };

  const URL_BACKEND = Config.API_URL;

  try {

    console.log(deviceInfo);

    const response = await fetch(`${URL_BACKEND}/api/register_device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceInfo),
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const data = await response.json();

    console.log("Device registration response:", data);

    if (!data.result) {
      throw new Error("Device registration failed: No device UUID returned.");
    }

    const uuid = data.result;
    // Alert.alert(
    //           `
    //           ${uuid}`
    //         );

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

