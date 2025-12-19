import {
  impactFeedback,
  selectionFeedback,
  notificationFeedback,
  vibrate,
} from "@tauri-apps/plugin-haptics"
import { isDesktop } from "@/utils/rustUtils.ts" // 假设你已有判断平台的函数

// 封装一个安全的执行器
const safeHaptic = async (fn: () => Promise<void>) => {
  // 只在非桌面端执行，且捕获可能的异常（防止插件未加载崩溃）
  if (!isDesktop()) {
    try {
      await fn()
    } catch (e) {
      console.warn("Haptics not supported or plugin missing", e)
    }
  }
}

export const haptic = {
  // 选择反馈（开关、拨轮）
  select: () => safeHaptic(async () => void selectionFeedback()),

  // 冲击反馈（点击按钮、成功确认）
  impact: (style: "light" | "medium" | "heavy" = "light") =>
    safeHaptic(async () => void impactFeedback(style)),

  // 提醒反馈（警告、错误、成功通知）
  notify: (type: "success" | "warning" | "error") =>
    safeHaptic(async () => void notificationFeedback(type)),

  // 基础震动
  vibrate: (ms: number) => safeHaptic(async () => void vibrate(ms)),
}
