import { reactive, readonly } from "vue"

export type ToastType = "success" | "error" | "info"

export interface ToastMessage {
  id: number
  message: string
  type: ToastType
  duration: number
}

const state = reactive<{
  toasts: ToastMessage[]
}>({
  toasts: [],
})

let counter = 0

function addToast(message: string, type: ToastType = "info", duration = 3000) {
  const id = counter++
  state.toasts.push({ id, message, type, duration })

  setTimeout(() => {
    removeToast(id)
  }, duration)

  return id
}

function removeToast(id: number) {
  const index = state.toasts.findIndex((t) => t.id === id)
  if (index !== -1) state.toasts.splice(index, 1)
}

export const toast = {
  success: (msg: string, duration?: number) =>
    addToast(msg, "success", duration),
  error: (msg: string, duration?: number) => addToast(msg, "error", duration),
  info: (msg: string, duration?: number) => addToast(msg, "info", duration),
  remove: removeToast,
}

export function useToast() {
  return {
    toasts: readonly(state.toasts),
    ...toast,
  }
}
