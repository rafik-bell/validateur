const ENV = {
  DEV: {
   // API_URL: 'http://10.217.175.202:8070/',
        //API_URL: 'http://10.217.175.1:8070/',
        API_URL: 'http://10.174.219.1:8069/',
        VALIDATE_KEY: 'aejaejaérzofnfoznfpnfpanf&pfn&&&3333',

        

  },
  PROD: {
    API_URL: 'http://10.217.175.202:8070/',
    VALIDATE_KEY: 'aejaejaérzofnfoznfpnfpanf&pfn&&&3333',

  },
};

const getEnv = () => {
  return __DEV__ ? ENV.DEV : ENV.PROD;
};

export default getEnv();