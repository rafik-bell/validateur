package com.validarteur

import com.facebook.react.bridge.*
import okhttp3.Call
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException

class DeviceRegistrationModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "DeviceRegistrationModule"

    private val httpClient = OkHttpClient()

    // ─── registerDevice ───────────────────────────────────────────────────────
    @ReactMethod
    fun registerDevice(promise: Promise) {
        val serialNumber = MqttModule.getDeviceSerial()
        val deviceType   = BuildConfig.DEVICE_TYPE
        val backendUrl   = BuildConfig.ODOO_URL

        val body = JSONObject().apply {
            put("serial_number", serialNumber)
            put("device_type",   deviceType)
        }

        val requestBody = body.toString()
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$backendUrl/api/register_device")
            .post(requestBody)
            .header("Content-Type", "application/json")
            .build()

        httpClient.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: Call, e: IOException) {
                promise.reject("NETWORK_ERROR", e.message)
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()

                if (!response.isSuccessful) {
                    promise.reject("HTTP_ERROR", "HTTP error: ${response.code}")
                    return
                }

                try {
                    val json   = JSONObject(responseBody ?: "")
                    val result = json.optString("result", "")

                    if (result.isEmpty()) {
                        promise.reject(
                            "REGISTRATION_FAILED",
                            "Device registration failed: No device UUID returned."
                        )
                        return
                    }

                    saveDeviceUUID(result)
                    promise.resolve(result)

                } catch (e: Exception) {
                    promise.reject("PARSE_ERROR", e.message)
                }
            }
        })
    }

    // ─── getDeviceUUID ────────────────────────────────────────────────────────
    @ReactMethod
    fun getDeviceUUID(promise: Promise) {
        val prefs = reactContext
            .getSharedPreferences("mqtt_config", android.content.Context.MODE_PRIVATE)
        val uuid = prefs.getString("DEVICE_UUID", null)
        if (uuid != null) promise.resolve(uuid)
        else promise.reject("NOT_REGISTERED", "Device not registered yet")
    }

    // ─── saveDeviceUUID ───────────────────────────────────────────────────────
    private fun saveDeviceUUID(uuid: String) {
        reactContext
            .getSharedPreferences("mqtt_config", android.content.Context.MODE_PRIVATE)
            .edit()
            .putString("DEVICE_UUID", uuid)
            .apply()
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}