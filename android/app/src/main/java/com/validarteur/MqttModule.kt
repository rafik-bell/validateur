package com.validarteur

import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.eclipse.paho.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*

class MqttModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val DEVICE_TYPE = BuildConfig.DEVICE_TYPE
        private const val BROKER_URL  = BuildConfig.MQTT_BROKER_URL

        fun getDeviceSerial(): String {
            return try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val serial = Build.getSerial()
                    if (serial != Build.UNKNOWN) serial
                    else getFallbackSerial()
                } else {
                    @Suppress("DEPRECATION")
                    val serial = Build.SERIAL
                    if (serial != Build.UNKNOWN) serial
                    else getFallbackSerial()
                }
            } catch (e: SecurityException) {
                getFallbackSerial()
            }
        }

        private fun getFallbackSerial(): String {
            val parts = listOf(
                Build.BOARD,
                Build.BRAND,
                Build.DEVICE,
                Build.HARDWARE,
                Build.MANUFACTURER,
                Build.MODEL,
                Build.PRODUCT
            ).joinToString(":")

            return parts.hashCode()
                .toUInt()
                .toString(16)
                .uppercase()
                .padStart(8, '0')
        }
    }

    private var client: MqttAndroidClient? = null
    private var isConnecting = false
    private val deviceSerial: String = getDeviceSerial()

    override fun getName() = "MqttModule"

    // ── required by NativeEventEmitter ───────────────────────────────────────
    override fun getConstants(): Map<String, Any> = emptyMap()

    // ─── getSerial ────────────────────────────────────────────────────────────
    @ReactMethod
    fun getSerial(promise: Promise) {
        promise.resolve(deviceSerial)
    }

    // ─── connect ──────────────────────────────────────────────────────────────
    @ReactMethod
    fun connect(subscriptions: ReadableArray, promise: Promise) {
        if (client?.isConnected == true) {
            promise.resolve("already_connected")
            return
        }
        if (isConnecting) {
            promise.reject("CONNECTING", "Connection already in progress")
            return
        }

        isConnecting = true

        val clientId  = deviceSerial
        val willTopic = "devices/$DEVICE_TYPE/$deviceSerial/status"

        try {
            client = MqttAndroidClient(reactContext, BROKER_URL, clientId)

            client?.setCallback(object : MqttCallbackExtended {
                override fun connectComplete(reconnect: Boolean, serverURI: String) {
                    publishStatus("online")
                    if (reconnect && subscriptions.size() > 0) subscribeAll(subscriptions)
                    val map = Arguments.createMap().apply {
                        putBoolean("reconnect", reconnect)
                        putString("serverURI", serverURI)
                        putString("serial", deviceSerial)
                    }
                    sendEvent("mqtt_connected", map)
                }

                override fun connectionLost(cause: Throwable?) {
                    sendEvent("mqtt_disconnected", cause?.message ?: "connection lost")
                }

                override fun messageArrived(topic: String, message: MqttMessage) {
                    val map = Arguments.createMap().apply {
                        putString("topic", topic)
                        putString("payload", message.toString())
                        putInt("qos", message.qos)
                        putBoolean("retained", message.isRetained)
                    }
                    sendEvent("mqtt_message", map)
                }

                override fun deliveryComplete(token: IMqttDeliveryToken?) {}
            })

            val options = MqttConnectOptions().apply {
                isCleanSession       = true
                isAutomaticReconnect = true
                keepAliveInterval    = 5
                connectionTimeout    = 30
                setWill(willTopic, "offline".toByteArray(), 1, true)
            }

            client?.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(token: IMqttToken?) {
                    isConnecting = false
                    if (subscriptions.size() > 0) subscribeAll(subscriptions)
                    promise.resolve(deviceSerial)
                }

                override fun onFailure(token: IMqttToken?, ex: Throwable?) {
                    isConnecting = false
                    sendEvent("mqtt_error", ex?.message ?: "connect failed")
                    promise.reject("CONNECT_FAILED", ex?.message ?: "unknown error")
                }
            })

        } catch (e: Exception) {
            isConnecting = false
            promise.reject("CONNECT_ERROR", e.message)
        }
    }

    // ─── subscribe ────────────────────────────────────────────────────────────
    @ReactMethod
    fun subscribe(topic: String, qos: Int, promise: Promise) {
        val c = client ?: return promise.reject("NOT_CONNECTED", "Call connect() first")
        c.subscribe(topic, qos, null, object : IMqttActionListener {
            override fun onSuccess(token: IMqttToken?) = promise.resolve("subscribed:$topic")
            override fun onFailure(token: IMqttToken?, ex: Throwable?) =
                promise.reject("SUBSCRIBE_FAILED", ex?.message)
        })
    }

    // ─── unsubscribe ──────────────────────────────────────────────────────────
    @ReactMethod
    fun unsubscribe(topic: String, promise: Promise) {
        val c = client ?: return promise.reject("NOT_CONNECTED", "Call connect() first")
        c.unsubscribe(topic, null, object : IMqttActionListener {
            override fun onSuccess(token: IMqttToken?) = promise.resolve("unsubscribed:$topic")
            override fun onFailure(token: IMqttToken?, ex: Throwable?) =
                promise.reject("UNSUBSCRIBE_FAILED", ex?.message)
        })
    }

    // ─── publish ──────────────────────────────────────────────────────────────
    @ReactMethod
    fun publish(topic: String, payload: String, qos: Int, retained: Boolean, promise: Promise) {
        val c = client ?: return promise.reject("NOT_CONNECTED", "Call connect() first")
        try {
            val msg = MqttMessage(payload.toByteArray()).apply {
                this.qos        = qos
                this.isRetained = retained
            }
            c.publish(topic, msg, null, object : IMqttActionListener {
                override fun onSuccess(token: IMqttToken?) = promise.resolve("published")
                override fun onFailure(token: IMqttToken?, ex: Throwable?) =
                    promise.reject("PUBLISH_FAILED", ex?.message)
            })
        } catch (e: Exception) {
            promise.reject("PUBLISH_ERROR", e.message)
        }
    }

    // ─── disconnect ───────────────────────────────────────────────────────────
    @ReactMethod
    fun disconnect(promise: Promise) {
        val c = client ?: return promise.resolve("already_disconnected")
        publishStatus("offline")
        c.disconnect(null, object : IMqttActionListener {
            override fun onSuccess(token: IMqttToken?) {
                client = null
                promise.resolve("disconnected")
            }
            override fun onFailure(token: IMqttToken?, ex: Throwable?) =
                promise.reject("DISCONNECT_FAILED", ex?.message)
        })
    }

    // ─── isConnected ──────────────────────────────────────────────────────────
    @ReactMethod
    fun isConnected(promise: Promise) = promise.resolve(client?.isConnected ?: false)

    // ─── helpers ──────────────────────────────────────────────────────────────
    private fun publishStatus(status: String) {
        try {
            val msg = MqttMessage(status.toByteArray()).apply {
                qos        = 1
                isRetained = true
            }
            client?.publish("devices/$DEVICE_TYPE/$deviceSerial/status", msg)
        } catch (_: Exception) {}
    }

    private fun subscribeAll(topics: ReadableArray) {
        for (i in 0 until topics.size()) {
            client?.subscribe(topics.getString(i) ?: continue, 1)
        }
    }

    private fun sendEvent(name: String, params: Any?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(name, params)
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}