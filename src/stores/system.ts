import { defineStore } from "pinia"
import { ref } from "vue"
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart"

export const useSystemStore = defineStore("system", () => {
  const autoStartEnabled = ref(true)

  const loadConfig = async () => {
    // 读取配置文件判断是否开启

    const status = await isEnabled()

    if (!status && autoStartEnabled) {
      console.log("自动启动成功")
      await enable()
    }
  }

  const closeAutoStart = async () => {
    await disable()
    autoStartEnabled.value = false
  }

  return {
    autoStartEnabled,
    loadConfig,
    closeAutoStart,
  }
})
