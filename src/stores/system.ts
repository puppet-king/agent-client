import { defineStore } from "pinia"
import { ref } from "vue"
import { exists } from "@tauri-apps/plugin-fs"
import { SYSTEM_CONFIG_PATH } from "@/config/constants.ts"
import {
  getBestBaseDir,
  readTextFileToHome,
  writeTextFileToHome,
} from "@/utils/rustUtils.ts"
import type { SystemConfig } from "@/typings/config.ts"
import JSON5 from "json5"
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart"
import { isDesktop } from "@/utils/rustUtils.ts"

export const useSystemStore = defineStore("system", () => {
  const autoStart = ref(true)
  const autoUpdate = ref(false)

  const loadConfig = async () => {
    const isSystemFileExist = await exists(SYSTEM_CONFIG_PATH, {
      baseDir: await getBestBaseDir(),
    })

    if (!isSystemFileExist) {
      const defaultConfig: SystemConfig = {
        autoUpdate: false,
        autoStart: true,
      }

      // 默认开机自启
      if (isDesktop()) {
        const tempStatus = await isEnabled()
        if (!tempStatus) {
          void enable()
        }
      }

      await saveConfig(defaultConfig)
    } else {
      const data = await readTextFileToHome(SYSTEM_CONFIG_PATH)
      const jsonData = JSON5.parse(data)
      autoUpdate.value = Boolean(jsonData.autoUpdate)
      autoStart.value = Boolean(jsonData.autoStart)

      // 桌面系统 启动命令同步 防止人工禁止
      if (isDesktop()) {
        const tempStatus = await isEnabled()
        if (tempStatus !== autoStart.value) {
          await toggleAutoStart()
        }
      }
    }
  }

  const saveConfig = async (config: SystemConfig) => {
    await writeTextFileToHome(
      SYSTEM_CONFIG_PATH,
      JSON.stringify(config, null, 2),
    )
  }

  const toggleAutoStart = async () => {
    autoStart.value = !autoStart.value

    void saveConfig({
      autoUpdate: autoUpdate.value,
      autoStart: autoStart.value,
    })
  }

  const toggleAutoUpdate = async () => {
    autoUpdate.value = !autoUpdate.value
    if (autoStart.value) {
      await enable()
    } else {
      await disable()
    }

    void saveConfig({
      autoUpdate: autoUpdate.value,
      autoStart: autoStart.value,
    })
  }

  return {
    autoStart,
    autoUpdate,
    loadConfig,
    toggleAutoStart,
    toggleAutoUpdate,
  }
})
