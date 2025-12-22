package com.puppet4105.client

import android.app.*
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import android.util.Log

class MyVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null

    // 声明 Rust 中的函数
    private external fun onVpnReady(fd: Int)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 1. 启动前台通知 (Android 15 强制)
        startForeground(1, createNotification())

        // 2. 建立 VPN 接口
        establishVpn()

        return START_STICKY
    }

    private fun establishVpn() {
        try {
            val builder = Builder()
                .setSession("TauriProxy")
                .addAddress("10.0.0.2", 24)
                .addRoute("0.0.0.0", 0) // 拦截全局
                .setMtu(1500)

            vpnInterface = builder.establish()

            // 核心：反射获取底层整型 FD
            val pfd = vpnInterface ?: return
            val fdField = pfd.fileDescriptor.javaClass.getDeclaredField("descriptor")
            fdField.isAccessible = true
            val nativeFd = fdField.getInt(pfd.fileDescriptor)

            Log.d("VPN", "VPN 接口建立，FD 为: $nativeFd")

            // 3. 将 FD 扔给 Rust (进而交给 Go)
            onVpnReady(nativeFd)

        } catch (e: Exception) {
            Log.e("VPN", "建立失败: ${e.message}")
        }
    }

    private fun createNotification(): Notification {
        val channelId = "vpn_status"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "VPN运行状态", NotificationManager.IMPORTANCE_MIN)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("安全代理已启动")
            .setContentText("正在保护您的网络连接")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .build()
    }

    override fun onDestroy() {
        vpnInterface?.close()
        super.onDestroy()
    }

    companion object {
        init {
            // 加载 Rust 编译生成的库 (假设名为 main_lib)
            System.loadLibrary("main_lib")
        }
    }
}