import { createApp } from "vue"
import App from "./App.vue"
import "./style.css"
import { createPinia } from "pinia"
import { router } from "./router"
import { warn, debug, info, error } from "@tauri-apps/plugin-log"
import { forwardConsole } from "@/utils/utils"
import * as z from "zod"
import { zhCN } from "zod/locales"

const pinia = createPinia()
z.config(zhCN())
// invoke("my_custom_command")
// const appDataDirPath = await homeDir()
// console.log("resourceDir", appDataDirPath)
forwardConsole("log", info)
forwardConsole("debug", debug)
forwardConsole("info", info)
forwardConsole("warn", warn)
forwardConsole("error", error)

createApp(App).use(pinia).use(router).mount("#app")
