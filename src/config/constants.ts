import { platform } from "@tauri-apps/plugin-os"

const isDesktop = (() => {
  let cache: boolean = false
  return (): boolean => {
    if (cache) return cache
    cache = (() => {
      const osType = platform()
      return !(osType === "android" || osType === "ios")
    })()

    return cache
  }
})()

const prefix = isDesktop() ? ".agent1215-client/" : ""

// client 配置的目录
export const CONF_DIR = `${prefix}conf`

// 用户目录
export const USER_DIR = isDesktop() ? ".agent1215-client" : "data"
export const SYSTEM_CONFIG_PATH = `${prefix}system.json`
export const INDEX_FILE = `${prefix}index.json`
export const CACHE_DB_PATH = `${prefix}cache.db`
export const LOG_FILE = `app.log`
