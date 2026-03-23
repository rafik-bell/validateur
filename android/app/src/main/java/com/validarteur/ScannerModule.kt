package com.validarteur // ← غيّرها إذا لازم

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.common.apiutil.decode.DecodeReader
import com.common.callback.IDecodeReaderListener

class ScannerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var decodeReader: DecodeReader? = null

    override fun getName(): String = "ScannerModule"

    @ReactMethod
    fun startScan(promise: Promise) {
        try {
            if (decodeReader != null) {
                promise.resolve("Scanner already started")
                return
            }

            decodeReader = DecodeReader(reactContext)

            decodeReader?.setDecodeReaderListener(object : IDecodeReaderListener {
                override fun onRecvData(data: ByteArray) {
                    try {
                        val scannedValue = String(data, Charsets.UTF_8).trim()

                        val map = Arguments.createMap()
                        map.putString("value", scannedValue)

                        sendEvent("onScanResult", map)

                    } catch (e: Exception) {
                        sendErrorEvent("Failed to parse data: ${e.message}")
                    }
                }
            })

            val result = decodeReader?.open(0)

            if (result == 0) {
                promise.resolve("Scanner started")
            } else {
                promise.reject("OPEN_ERROR", "Open failed with code: $result")
            }

        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopScan(promise: Promise) {
        try {
            decodeReader?.close()
            decodeReader = null
            promise.resolve("Scanner stopped")
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun sendErrorEvent(message: String) {
        val map = Arguments.createMap()
        map.putString("error", message)

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onScanError", map)
    }
}