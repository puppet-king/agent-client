import { ref } from "vue"
import { defineStore } from "pinia"
import type { TunnelConfig, TrojanStatus } from "@/typings/config.ts"
import { validateTunnelConfig } from "@/utils/validate"
import { CONF_DIR, INDEX_FILE } from "@/config/constants"
import {
  getTrojanStatus,
  initHomeDir,
  readTextFileToHome,
  stopTrojan,
  writeTextFileToHome,
} from "@/utils/rustUtils"

interface TunnelIndexItem {
  name: string // 唯一性
  path: string // $APPDATA 相对路径
}

export const useConfStore = defineStore("conf", () => {
  const index = ref<TunnelIndexItem[]>([])
  const enabledName = ref<string>("")

  const initConfig = async () => {
    console.log("initConfig")
    await initHomeDir()
    await loadIndex()
    await loadState()
  }

  const loadState = async () => {
    const state: TrojanStatus = await getTrojanStatus()
    if (state.is_running) {
      if (index.value.some((item) => item.name === state.name)) {
        enabledName.value = state.name ?? ""
      } else {
        // 不存在就关闭该进程
        await stopTrojan()
      }
    }
  }

  const loadIndex = async () => {
    console.log("loadIndex")
    try {
      const data = await readTextFileToHome(INDEX_FILE)
      index.value = JSON.parse(data)
      console.log("loadIndex index.value ", index.value)
    } catch (error) {
      console.error("loadIndex catch", error)
      index.value = []
    }
  }

  const saveIndex = async () => {
    await writeTextFileToHome(INDEX_FILE, JSON.stringify(index.value, null, 2))
    await loadIndex()
  }

  const loadTunnel = async (name: string): Promise<TunnelConfig | null> => {
    console.log("loadTunnel1", index.value, name)
    const item = index.value.find((i) => i.name === name)
    if (!item) return null

    console.log("loadTunnel2", item.path)

    try {
      const data = await readTextFileToHome(item.path)
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  const saveTunnel = async (
    name: string,
    config: TunnelConfig,
    isSafe: boolean = false,
  ) => {
    if (!isSafe) {
      validateTunnelConfig(config)
    }

    const fileName = `${name}.json`
    const filePath = `${CONF_DIR}/${fileName}`
    const contents = JSON.stringify(config)
    await writeTextFileToHome(filePath, contents)

    const existing = index.value.find((i) => i.name === name)
    if (!existing) {
      index.value.push({ name: name, path: filePath })
    }

    console.log("saveTunnel", index.value)
    await saveIndex()
  }

  const deleteTunnel = async (name: string): Promise<string> => {
    const itemIndex = index.value.findIndex((i) => i.name === name)

    if (itemIndex !== -1) {
      index.value.splice(itemIndex, 1)
      await saveIndex()
    }

    const filePath = `${CONF_DIR}/${name}.conf`
    await writeTextFileToHome(filePath, "")
    return name
  }

  const addTunnel = async (
    name: string,
    config: TunnelConfig,
    isSafe: boolean = false,
  ) => {
    const existing = index.value.find((i) => i.name === name)
    if (existing) {
      throw new Error(`Tunnel with name ${name} already exists`)
    }

    await saveTunnel(name, config, isSafe)
  }

  const updateTunnel = async (key: string, config: TunnelConfig) => {
    await deleteTunnel(key)
    await saveTunnel(key, config)
  }

  return {
    index,
    enabledName,
    initConfig,
    addTunnel,
    loadTunnel,
    updateTunnel,
    deleteTunnel,
  }
})
