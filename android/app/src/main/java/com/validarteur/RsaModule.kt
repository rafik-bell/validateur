package com.validarteur

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.util.Base64
import javax.crypto.Cipher
import java.security.KeyFactory
import java.security.spec.PKCS8EncodedKeySpec

class RsaModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "RsaModule"

    @ReactMethod
    fun decrypt(encryptedBase64: String, privateKeyPem: String, promise: Promise) {
        try {
            // Strip PEM headers and whitespace
            val cleanedKey = privateKeyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replace("\\s".toRegex(), "") // remove all whitespace/newlines

            val keyBytes = Base64.decode(cleanedKey, Base64.DEFAULT)
            val keySpec = PKCS8EncodedKeySpec(keyBytes)
            val privateKey = KeyFactory.getInstance("RSA").generatePrivate(keySpec)

            val cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")
            cipher.init(Cipher.DECRYPT_MODE, privateKey)

            val encryptedBytes = Base64.decode(encryptedBase64, Base64.DEFAULT)
            val decryptedBytes = cipher.doFinal(encryptedBytes)

            promise.resolve(String(decryptedBytes, Charsets.UTF_8))
        } catch (e: Exception) {
            promise.reject("DECRYPT_ERROR", e.message)
        }
    }
}