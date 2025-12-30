import { open } from "@tauri-apps/plugin-dialog"
import { readTextFile } from "@tauri-apps/plugin-fs"
import JSON5 from "json5"

export type FileReaderOptions = {
  multiple?: boolean
  json?: boolean
  filters?: { name: string; extensions: string[] }[]
  returnPath?: boolean
}

// 定义带路径的返回结构
export type FileResultWithPath<T> = {
  content: T
  path: string
}

/**
 * 函数重载：根据 options 定义精确的返回类型
 */
export async function readFile<T>(
  options: { multiple: true; returnPath: true } & FileReaderOptions,
): Promise<FileResultWithPath<T>[]>
export async function readFile<T>(
  options: { multiple: true } & FileReaderOptions,
): Promise<T[]>
export async function readFile<T>(
  options: { returnPath: true } & FileReaderOptions,
): Promise<FileResultWithPath<T>>
export async function readFile<T>(options?: FileReaderOptions): Promise<T>

/**
 * 统一实现逻辑
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export async function readFile<T>(
  options: FileReaderOptions = {},
): Promise<any> {
  const { multiple = false, json = true, filters, returnPath = false } = options

  const selected = await open({
    multiple,
    filters,
  })

  if (!selected) {
    throw new Error("No file selected") // 2025 建议直接 throw 而不是 Promise.reject
  }

  const readSingleFile = async (path: string) => {
    try {
      const contentRaw = await readTextFile(path)
      const content = json
        ? (JSON5.parse(contentRaw) as T)
        : (contentRaw as unknown as T)

      // 如果需要返回路径，封装成对象
      if (returnPath) {
        return { content, path }
      }
      return content
    } catch (err) {
      throw new Error(
        `Failed to read file ${path}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  // 处理多选
  if (multiple && Array.isArray(selected)) {
    return Promise.all(selected.map((p) => readSingleFile(p)))
  }

  const singlePath = Array.isArray(selected) ? selected[0] : selected
  if (!singlePath) throw new Error("Path is invalid")
  return readSingleFile(singlePath)
}
