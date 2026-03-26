const HOST = '172.31.15.16';
 
const ENV = {
  DEV: {
    API_URL: `http://${HOST}:8069/`,
    VALIDATE_KEY: 'aejaejaérzofnfoznfpnfpanf&pfn&&&3333',
    SR_NUM: '12345678910',
    D_TYPE: 'validator',
    MQTT_BROKER_URL: `ws://${HOST}:8083/mqtt`,
  },
  PROD: {
    API_URL: `http://${HOST}:8069/`,
    VALIDATE_KEY: 'aejaejaérzofnfoznfpnfpanf&pfn&&&3333',
    SR_NUM: '12345678910',
    D_TYPE: 'validator',
    MQTT_BROKER_URL: `ws://${HOST}:8083/mqtt`,
  },
};
 
const getEnv = () => {
  return __DEV__ ? ENV.DEV : ENV.PROD;
};
 
export default getEnv();