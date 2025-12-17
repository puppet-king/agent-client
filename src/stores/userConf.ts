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
import type { ActionResponse } from "@/typings/api"

interface TunnelIndexItem {
  name: string // 唯一性
  path: string // $APPDATA 相对路径
}

export const useConfStore = defineStore("conf", () => {
  const index = ref<TunnelIndexItem[]>([])
  const enabledName = ref<string>("")

  const isInitialized = ref(false)
  const initPromise = ref<Promise<void> | null>(null)

  const initConfig = async () => {
    // 1. 如果已经初始化完成，直接返回
    if (isInitialized.value) return

    // 2. 如果初始化正在进行中，返回现有的 Promise，避免重复触发文件读取
    if (initPromise.value) return initPromise.value

    // 3. 开始初始化并存入 Promise
    initPromise.value = (async () => {
      try {
        console.log("🚀 [Store] 执行全局初始化...")
        await initHomeDir()
        await loadIndex()
        await loadState()
        isInitialized.value = true
      } finally {
        initPromise.value = null // 结束后清除，方便后续手动重刷
      }
    })()

    return initPromise.value
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
    const item = index.value.find((i) => i.name === name)
    console.log("loadTunnel", name, "没有找到")
    console.log("loadTunnel", index.value)
    if (!item) return null
    console.debug("loadTunnel path", item.path)
    try {
      const data = await readTextFileToHome(item.path)
      return JSON.parse(data)
    } catch (e) {
      console.error("loadTunnel", e)
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

  const deleteTunnel = async (name: string): Promise<ActionResponse> => {
    if (enabledName.value === name) {
      return {
        success: false,
        message: "该配置正在运行中，无法删除",
      }
    }

    try {
      // 2. 内存状态更新
      const itemIndex = index.value.findIndex((i) => i.name === name)
      if (itemIndex !== -1) {
        index.value.splice(itemIndex, 1)
        await saveIndex()
      }

      // 3. 文件操作（沿用你原来的逻辑：写空字符串清空文件）
      const filePath = `${CONF_DIR}/${name}.json`
      await writeTextFileToHome(filePath, "")
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "删除过程中出现未知错误",
      }
    }
  }

  const addTunnel = async (
    name: string,
    config: TunnelConfig,
    isSafe: boolean = false,
  ): Promise<ActionResponse> => {
    const existing = index.value.find((i) => i.name === name)
    if (existing) {
      return {
        success: false,
        message: `配置文件： ${name} 已存在，请更换文件名重试`,
      }
    }

    try {
      await saveTunnel(name, config, isSafe)
      return { success: true }
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "Failed to save tunnel",
      }
    }
  }

  const updateTunnel = async (key: string, config: TunnelConfig) => {
    await deleteTunnel(key)
    await saveTunnel(key, config)
  }

  return {
    index,
    enabledName,
    isInitialized,
    initPromise,
    initConfig,
    addTunnel,
    loadTunnel,
    updateTunnel,
    deleteTunnel,
  }
})
