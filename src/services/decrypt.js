import forge from 'node-forge';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';




export const decryptData = async (encryptedBase64) => {
  try {

    let cachedKey = `
    -----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDcYBYwzy3tjy/P
cEX4kp/LWDozIRg7FSvmnZB8DI7IVwSj0l1+YNryMHBIQYVmrwU/z8+R8QTCA6yt
f55b1yEUJwkq+Oqqk31LyVyBJ0EeAWYxS3M00LN+q5uW5Bz3f89hvU95VM9C4W6d
LazNDqeuZl1V6fWAc5lTAO2xsV4zYn13G27gbgGaQwM1QtUnhShUVtixvOkX10yL
FSqFdMQc8+cpxg1yojjS8aK+rykECJW29oDfx+y+DDeR6U0iQw+t76v/Znad1AQU
WxQXbRBj7uBDJMrv6DXkXDOjjyjeUJoIAZgQ/X4t1Lh98XkxiZ7AbdEup4omgBKm
tHQ9m8DPAgMBAAECggEAMJhBnG67FnTqGoiL7WXLtcfVQZwNH04qWZaqGyibvaKu
o79KHYmXDivPPqewFnYGps0Y3Po0TeIIjFOlZGQaZ7q5409zU7zlNraG3vX8fnTZ
h4o3M9DHm+mUjB/uIUd+P/PCWCNy9rEGNsOxJKCUKjlpYH4QREx5ZVvBjlrpxlOL
S/TRbifIA85JhGdshC+XkgdMLexFNqXtmOoZUkk+V7vNzawSY5NEEQZto72vbgW9
HnWGBYObD4uAYk3NpTTfwZZZVWJzv6MVZ+YcvnhWK1oxJXn1zXzml74WFyfZUlgU
v/mEFyk5XqIvSqYN1tpOUIJDpd4w67CUmlTsxHCRXQKBgQDwD06CT3VQa8FpH5il
jT77cZ6mpQB8Svx6b/GztPWteNhekAnMyfnEMJNO3n5GqHIq++DyYzAex8YhI0GX
Ep2lp2mo+St/V2nbcAhbjmkmEM3T7TH8fXAmpoKasN1c8ymRcrSunBn32Oa+glYd
XUCq+COlB5Al3BrI7dDxJuGERQKBgQDrAiu5jt5ZBjfi7oskkInCmxWwRRzyz6/C
77eNclfXAJwT4W/LyQmJeFmWC4PCFBJKl+RYpJ3ROALKspq1rhnwt8EillmObj+g
K5cUCaEjIaxBy32aVQzypeI1qcq4nYMKY5tVIW44Ikq9SY2WAUt0thPyIrgA2lEE
emRJCn+kAwKBgQDL2QOeziBdaRM01DrIIffghqvk8GpIIVjiE1sYccrJQrvhGMjp
mH06ZtFAANkT4QgJjheHXEjJanTJQOn6gjlSKKYlcWjJWo4uY6UFMhoB0/UkR9/R
eycX+v8eop9mxal/s/rP5wh6GTpffcfoaX53b/y8r35tV8l6488waAbKTQKBgQCR
4ZUW6LLpfEyw1/cTyY1aej6qXxyrNXUbgwbkDPiuBDjetnBZhgAfj8+8roUpsp/w
If2jcPxuZWCGRvx2jw6XONnxCHerTJC+cpCj5Z5bWom9hf4AEY+qCIM1YKLwmwY/
Krm/zLLIsbDHc6MqXL9kQap8AkVKcjscloUuOhAl1QKBgAVridd06wRlsUzeOpfX
kXKSRauPlhaQxhTTftzpdekX/pXxsHyjYbPoVjVDCCwqfWsrtfcpWqNQqUDOvQN2
AnaE4Xl5GyQHGl2Tc5XkBk1uKDrya2xjEby4ZBGcAQYjoKQcWLbH/97O6Rbmsq8p
1iA74c5QCiAJCaawN0fd4S8U
-----END PRIVATE KEY-----
`;

    

    const encryptedBytes = forge.util.decode64(encryptedBase64);
    const privateKey = forge.pki.privateKeyFromPem(cachedKey);

    const decrypted = privateKey.decrypt(encryptedBytes, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
    });

    console.log('✅ ==> Decrypted:', decrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    //throw new Error('Invalid QR code');
  }
};