export function generateTimestampRandom(): string {
  // 当前时间戳（毫秒）
  const timestamp = Date.now()

  // 生成一个 0~999999 的随机数
  const randomNum = Math.floor(Math.random() * 1_000_000)

  // 拼接成字符串
  const str = `${timestamp}${randomNum}`

  // 返回 MD5
  return str
}

/**
 * 转发控制台输出到 Tauri 日志插件
 * @param fnName
 * @param logger
 */
export function forwardConsole(
  fnName: "log" | "debug" | "info" | "warn" | "error",
  logger: (message: string) => Promise<void>,
) {
  const original = console[fnName]
  console[fnName] = (...args: unknown[]) => {
    original(...args) // 原始控制台输出
    setTimeout(() => {
      const message = args
        .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
        .join(" ")
      logger(message).catch(() => {})
    }, 0)
  }
}

export const formatTime = (ts: number) => {
  const date = new Date(ts * 1000)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${month}/${day} ${hours}:${minutes}`
}
