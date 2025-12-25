package com.plugin.vpn_helper

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.IBinder
import android.os.ParcelFileDescriptor
import android.util.Log
import io.github.tim06.vpnprotocols.singbox.BoxService
import io.github.tim06.vpnprotocols.singbox.BoxOptions
import java.io.File

class MyVpnService : VpnService() {

    private var singBoxService: BoxService? = null
    private var vpnInterface: ParcelFileDescriptor? = null // 必须声明网卡句柄
    private val NOTIFICATION_CHANNEL_ID = "VpnServiceChannel"
    private val NOTIFICATION_ID = 1

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 1. 立即显示通知（Android 14+ 强制要求）
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())

        val configJson = intent?.getStringExtra("CONFIG") ?: ""
        if (configJson.isNotEmpty()) {
            // 2. 先建立安卓网卡
            setupVpnInterface()
            // 3. 启动 Sing-box 核心
            startSingBox(configJson)
        }

        return START_STICKY
    }

    // 核心：告诉安卓系统开启 VPN 网卡
    private fun setupVpnInterface() {
        try {
            val builder = Builder()
                .addAddress("172.19.0.1", 30) // 必须与 Sing-box 里的 tun 地址一致
                .addRoute("0.0.0.0", 0)       // 拦截全局流量
                .addDnsServer("8.8.8.8")
                .setSession("TauriVpn")
                .setMtu(1280)                 // 适配阿里云/移动网络

            vpnInterface = builder.establish()
            Log.i("MyVpnService", "Android VPN Interface established.")
        } catch (e: Exception) {
            Log.e("MyVpnService", "Failed to establish VPN interface", e)
        }
    }

    private fun startSingBox(configJson: String) {
        val options = BoxOptions()
        options.workingDirectory = File(filesDir, "sing-box").absolutePath

        try {
            singBoxService = BoxService.newService(configJson, options)
            singBoxService?.start()
            Log.i("MyVpnService", "Sing-box started.")
        } catch (e: Exception) {
            Log.e("MyVpnService", "Sing-box start failed", e)
        }
    }

    // 合并后的销毁逻辑
    override fun onDestroy() {
        Log.d("MyVpnService", "Stopping VPN Service...")

        // 1. 停止核心
        try {
            singBoxService?.stop()
            singBoxService = null
        } catch (e: Exception) { /* ignore */ }

        // 2. 关闭网卡（重要：不关闭会导致手机断网或下次启动失败）
        try {
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) { /* ignore */ }

        stopForeground(true)
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "VPN Service",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("VPN 连接中")
            .setContentText("流量已通过加密隧道保护")
            // 注意：你需要在 res/drawable 放入一个图标，否则可能显示空白或报错
            // .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()
    }
}