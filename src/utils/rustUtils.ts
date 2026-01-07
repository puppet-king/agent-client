import {
  CONF_DIR,
  INDEX_FILE,
  SYSTEM_CONFIG_PATH,
  USER_DIR,
} from "@/config/constants"
import { platform } from "@tauri-apps/plugin-os"
import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs"
import { homeDir, join } from "@tauri-apps/api/path"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import type { SystemConfig, TrojanStatus } from "@/typings/config.ts"
import { useSystemStore } from "@/stores/system.ts"

/**
 * 仅 桌面应用
 * 运行 Trojan-go
 * @param name 配置文件名（不带 .json）
 */
export async function runTrojan(name: string) {
  try {
    // 获取主目录并拼接配置文件绝对路径
    const home = await homeDir()
    const configPath = await join(home, CONF_DIR, `${name}.json`)

    console.log(`正在启动 Trojan: ${name}, 路径: ${configPath}`)

    // 调用 Rust 命令
    await invoke("run_trojan", {
      configPath: configPath,
      configName: name,
    })

    return { success: true }
  } catch (error) {
    console.error("启动 Trojan 失败:", error)
    throw error
  }
}

/**
 * 仅 桌面应用
 * 停止 Trojan-go
 */
export async function stopTrojan() {
  try {
    await invoke("stop_trojan")
    return { success: true }
  } catch (error) {
    console.error("停止 Trojan 失败:", error)
    throw error
  }
}

/**
 * 仅 桌面应用
 * 获取当前运行状态（用于页面刷新后同步 UI）
 */
export async function getTrojanStatus(): Promise<TrojanStatus> {
  try {
    return await invoke<TrojanStatus>("get_trojan_status")
  } catch (error) {
    console.error("获取状态失败:", error)
    return { is_running: false, name: null, proxy_status: false }
  }
}

/**
 * 仅 桌面应用
 * 监听日志输出（全局监听）
 * @param callback 处理日志的回调函数
 */
export async function listenTrojanLog(callback: (log: string) => void) {
  // 使用 listen 监听 Rust 中 emit 的事件
  return await listen<string>("trojan-log", (event) => {
    callback(event.payload)
  })
}

/**
 * 格式化日志
 * @param line
 */
export function parseTrojanGoLog(line: string) {
  // 匹配 [LEVEL] YYYY/MM/DD HH:MM:SS message
  // eslint-disable-next-line no-control-regex
  // const cleanLine = line.replace(/\x1b\[[0-9;]*[mK]/g, "")

  // 2. 匹配标准格式: [级别] 消息内容
  // ^\[        -> 以 [ 开头
  // ([^\]]+)   -> 匹配第一个 ] 之前的所有字符，并捕获为 match[1] (级别)
  // \]         -> 匹配 ]
  // \s*        -> 匹配可选的空格
  // (.*)$      -> 匹配剩余所有内容为 match[2] (消息)
  const regex = /^\[([^\]]+)\]\s*(.*)$/
  const match = line.match(regex)
  if (match) {
    return {
      level: match[1], // 例如: level ERROR / FATAL
      message: match[2],
    }
  }

  return null
}

/**
 * 根据环境自适应写入文件
 * @param filePath
 * @param content
 */
export async function writeTextFileToHome(
  filePath: string,
  content: string,
): Promise<boolean> {
  try {
    await writeTextFile(filePath, content, {
      baseDir: await getBestBaseDir(),
    })
    return true
  } catch (e) {
    console.error("write Resource data failed", e)
    return false
  }
}

// 根据环境自适应读取文件
export async function readTextFileToHome(filePath: string): Promise<string> {
  return await readTextFile(filePath, {
    baseDir: await getBestBaseDir(),
  })
}

// 自适应初始化目录
export async function initHomeDir(): Promise<void> {
  console.log("initHomeDir")
  const isExist = await exists(USER_DIR, {
    baseDir: await getBestBaseDir(),
  })

  if (!isExist) {
    await mkdir(USER_DIR, {
      baseDir: await getBestBaseDir(),
    })
  }

  // 加载系统配置
  const systemStore = useSystemStore()
  systemStore.loadConfig()

  const isConfDirExist = await exists(CONF_DIR, {
    baseDir: await getBestBaseDir(),
  })

  if (!isConfDirExist) {
    await mkdir(CONF_DIR, {
      baseDir: await getBestBaseDir(),
    })
  }
}

// 获取符合条件的权限目录
export const getBestBaseDir = (() => {
  let cache: Promise<BaseDirectory> | null = null
  return async (): Promise<BaseDirectory> => {
    // 如果缓存存在，直接返回缓存的 Promise
    if (cache) return cache

    // 否则，初始化子方法并赋值给 cache
    cache = (async () => {
      if (isDesktop()) {
        return BaseDirectory.Home
      }

      return BaseDirectory.AppData
    })()

    return cache
  }
})()

// 判断平台环境
export const isDesktop = (() => {
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
