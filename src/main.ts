import { createApp } from "vue"
import App from "./App.vue"
import "./style.css"
import { createPinia } from "pinia"
import { router } from "./router"
import { warn, debug, info, error } from "@tauri-apps/plugin-log"
// import { warn, error } from "@tauri-apps/plugin-log"
import { forwardConsole } from "@/utils/utils"
import * as z from "zod"
import { zhCN } from "zod/locales"
import { appDataDir } from "@tauri-apps/api/path"
import { checkForUpdates } from "@/utils/updater.ts"

const pinia = createPinia()
z.config(zhCN())
// invoke("my_custom_command")
const appDataDirPath = await appDataDir()
console.log("resourceDir", appDataDirPath)
// forwardConsole("log", info)
forwardConsole("debug", debug)
forwardConsole("info", info)
forwardConsole("warn", warn)
forwardConsole("error", error)

// import { invoke } from "@tauri-apps/api/core"

// async function runVpnDebug() {
//   try {
//     console.log("正在调试 VPN 连接...")
//     // 调用的是 Rust 里的 debug_vpn_connection
//     const message = await invoke("debug_vpn_connection")
//     console.log(message)
//   } catch (error) {
//     console.error("调试失败:", error)
//   }
// }
//
// void runVpnDebug()

createApp(App).use(pinia).use(router).mount("#app")
