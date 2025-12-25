package com.plugin.vpn_helper

import android.util.Log

class VpnHelperImplementation {
    fun pong(value: String): String {
        Log.i("VPN_DEBUG", "收到消息: $value")
        return value
    }
}