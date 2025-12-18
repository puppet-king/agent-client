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
