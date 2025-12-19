// import { CONF_DIR, USER_DIR } from "@/config/constants"
// import { platform } from "@tauri-apps/plugin-os"
// import {
//   BaseDirectory,
//   exists,
//   mkdir,
//   readTextFile,
//   writeTextFile,
// } from "@tauri-apps/plugin-fs"
// import { homeDir, join } from "@tauri-apps/api/path"
// // import { Command } from "@tauri-apps/plugin-shell"
// // import { toast } from "@/composables/useToast"
// import { invoke } from "@tauri-apps/api/core"
// import { listen } from "@tauri-apps/api/event"
// import type { TrojanStatus } from "@/typings/config.ts"
//
// // 全局单例
// // let trojanChild: Child | null = null
//
// /**
//  * 运行 Trojan-go
//  * @param name 配置文件名（不带 .json）
//  */
// export async function runTrojan(name: string) {
//   try {
//     // 获取主目录并拼接配置文件绝对路径
//     const home = await homeDir()
//     const configPath = await join(home, CONF_DIR, `${name}.json`)
//
//     console.log(`正在启动 Trojan: ${name}, 路径: ${configPath}`)
//
//     // 调用 Rust 命令
//     await invoke("run_trojan", {
//       configPath: configPath,
//       configName: name,
//     })
//
//     return { success: true }
//   } catch (error) {
//     console.error("启动 Trojan 失败:", error)
//     throw error
//   }
// }
//
// /**
//  * 停止 Trojan-go
//  */
// export async function stopTrojan() {
//   try {
//     await invoke("stop_trojan")
//     return { success: true }
//   } catch (error) {
//     console.error("停止 Trojan 失败:", error)
//     throw error
//   }
// }
//
// /**
//  * 获取当前运行状态（用于页面刷新后同步 UI）
//  */
// export async function getTrojanStatus(): Promise<TrojanStatus> {
//   try {
//     return await invoke<TrojanStatus>("get_trojan_status")
//   } catch (error) {
//     console.error("获取状态失败:", error)
//     return { is_running: false, name: null, proxy_status: false }
//   }
// }
//
// /**
//  * 监听日志输出（全局监听）
//  * @param callback 处理日志的回调函数
//  */
// export async function listenTrojanLog(callback: (log: string) => void) {
//   // 使用 listen 监听 Rust 中 emit 的事件
//   return await listen<string>("trojan-log", (event) => {
//     callback(event.payload)
//   })
// }
//
// // export async function runTrojanV2(name: string) {
// //   console.log("runTrojan", trojanChild)
// //   if (trojanChild) {
// //     console.log("trojan-go 已经在运行", trojanChild)
// //     await trojanChild.kill()
// //     trojanChild = null
// //   }
// //
// //   const dir = await homeDir()
// //   const configPath = await join(dir, CONF_DIR, name + ".json")
// //   console.log("configPath", configPath)
// //   const command = Command.sidecar("binaries/trojan-go", ["-config", configPath])
// //   command.stdout.on("data", (line) => {
// //     const text = line.trim()
// //     const log = parseTrojanGoLog(text)
// //     if (log) {
// //       console.log("Level:", log.level)
// //       console.log("Time:", log.timestamp)
// //       console.log("Message:", log.message)
// //
// //       // 如果是端口占用错误，可以再用正则提取端口
// //       const portConflictRegex = /listen (tcp|udp) 127\.0\.0\.1:(\d+): bind/i
// //       const conflictMatch = log.message.match(portConflictRegex)
// //       if (conflictMatch) {
// //         toast.error(` ${conflictMatch[2]}  端口被占用`)
// //         console.error(
// //           `[trojan-go] ${conflictMatch[1].toUpperCase()} port ${conflictMatch[2]} conflict`,
// //         )
// //       }
// //
// //       console.log("[trojan-go]", line)
// //     }
// //   })
// //
// //   command.on("close", (data) => {
// //     console.log(
// //       `command finished with code ${data.code} and signal ${data.signal}`,
// //     )
// //
// //     trojanChild = null
// //   })
// //
// //   command.stderr.on("data", (line) => console.error("[trojan-go stderr]", line))
// //   trojanChild = await command.spawn()
// //   console.log("trojan-go 运行成功", trojanChild)
// // }
// //
// // export async function stopTrojanV2() {
// //   if (trojanChild) {
// //     console.log("trojan-go 停止运行", trojanChild)
// //     await trojanChild.kill()
// //     trojanChild = null
// //   }
// // }
//
// export function parseTrojanGoLog(line: string) {
//   // 匹配 [LEVEL] YYYY/MM/DD HH:MM:SS message
//   const regex = /^\[(\w+)\]\s+(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.*)$/
//   const match = line.match(regex)
//   if (match) {
//     return {
//       level: match[1], // FATAL / INFO / etc.
//       timestamp: match[2], // 2025/12/15 19:16:03
//       message: match[3], // 剩余内容
//     }
//   }
//   return null
// }
//
// export async function writeTextFileToHome(
//   filePath: string,
//   content: string,
// ): Promise<boolean> {
//   try {
//     await writeTextFile(filePath, content, {
//       baseDir: BaseDirectory.Home,
//     })
//     return true
//   } catch (e) {
//     console.error("write Resource data failed", e)
//     return false
//   }
// }
//
// export async function readTextFileToHome(filePath: string): Promise<string> {
//   return await readTextFile(filePath, {
//     baseDir: await getBestBaseDir(),
//   })
// }
//
// export async function initHomeDir(): Promise<void> {
//   console.log("initHomeDir")
//   const cc = await exists("agent1215-client", {
//     baseDir: await getBestBaseDir(),
//   })
//
//   console.log("isExist", cc)
//
//   const isExist = await exists(USER_DIR, {
//     baseDir: await getBestBaseDir(),
//   })
//
//   if (!isExist) {
//     await mkdir(USER_DIR, {
//       baseDir: await getBestBaseDir(),
//     })
//   }
//
//   const isConfDirExist = await exists(CONF_DIR, {
//     baseDir: await getBestBaseDir(),
//   })
//
//   if (!isConfDirExist) {
//     await mkdir(CONF_DIR, {
//       baseDir: await getBestBaseDir(),
//     })
//   }
//
//   // const isPathExist = await exists(CONFIG_PATH, {
//   //   baseDir: await getBestBaseDir(),
//   // })
//
//   // if (!isPathExist) {
//   // const json = {
//   //   cc,
//   // }
//   //
//   // await writeTextFileToHome(CONFIG_PATH, JSON.stringify(obj, null, 2))
//   // }
// }
//
// export const getBestBaseDir = (() => {
//   let cache: Promise<BaseDirectory> | null = null
//   return async (): Promise<BaseDirectory> => {
//     // 如果缓存存在，直接返回缓存的 Promise
//     if (cache) return cache
//
//     // 否则，初始化子方法并赋值给 cache
//     cache = (async () => {
//       const osType = platform()
//       if (osType === "android" || osType === "ios") {
//         return BaseDirectory.AppData
//       }
//       return BaseDirectory.Home
//     })()
//
//     return cache
//   }
// })()
//
// export const isDesktop = (() => {
//   let cache: boolean = false
//   return (): boolean => {
//     if (cache) return cache
//     cache = (() => {
//       const osType = platform()
//       return !(osType === "android" || osType === "ios")
//     })()
//
//     return cache
//   }
// })()
