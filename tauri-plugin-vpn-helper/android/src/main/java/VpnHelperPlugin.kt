package com.plugin.vpn_helper

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import android.content.Intent
import android.net.VpnService
import android.os.Build

@InvokeArg
class PingArgs {
  var value: String? = null
}

@TauriPlugin
class VpnHelperPlugin(private val activity: Activity): Plugin(activity) {
    private val implementation = VpnHelperImplementation()

    @Command
    fun ping(invoke: Invoke) {
        val args = invoke.parseArgs(PingArgs::class.java)

        val ret = JSObject()
        ret.put("value", implementation.pong(args.value ?: "default value :("))
        invoke.resolve(ret)
    }

    @Command
    fun start_vpn(invoke: Invoke) {
        val configJson = invoke.getArgs().getString("config") ?: ""

        val intent = VpnService.prepare(activity)
        if (intent != null) {
            // 如果没有权限，启动系统授权窗口
            activity.startActivityForResult(intent, 0)
            invoke.reject("NEED_PERMISSION")
            return
        }

        // 启动服务
        val serviceIntent = Intent(activity, MyVpnService::class.java).apply {
            putExtra("CONFIG", configJson)
        }

        try {
             if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                 activity.startForegroundService(serviceIntent)
             } else {
                 activity.startService(serviceIntent)
             }

             // 返回成功
             val res = JSObject()
             res.put("status", "success")
             invoke.resolve(res)
         } catch (e: Exception) {
             // 处理可能的启动失败（如 Android 14+ 缺少前台服务类型权限）
             invoke.reject("START_SERVICE_FAILED", e.message)
         }
    }

    @Command
    fun stop_vpn(invoke: Invoke) {
        // 直接执行停止逻辑，不调用 invoke.parseArgs
         val serviceIntent = Intent(activity, MyVpnService::class.java)
         activity.stopService(serviceIntent)

         val ret = JSObject()
         ret.put("status", "stopped")
         invoke.resolve(ret)
    }
}
