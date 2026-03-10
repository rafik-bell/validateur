const ENV = {
  DEV: {
    API_URL: 'http://10.174.219.1:8069/',
  },
  PROD: {
    API_URL: 'http://10.174.219.1:8069/',
  },
};

const getEnv = () => {
  return __DEV__ ? ENV.DEV : ENV.PROD;
};

export default getEnv();