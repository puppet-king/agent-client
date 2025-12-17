import { resourceDir, join } from "@tauri-apps/api/path"
import {
  TunnelConfigSchema,
  type ValidateResult,
  type TunnelConfig,
} from "@/typings/config.ts"

export function validateTunnelConfig(config: unknown): ValidateResult {
  const result = TunnelConfigSchema.safeParse(config)

  if (!result.success) {
    // 提取所有错误消息
    // issue.path 结合 issue.message 可以让错误更精准，例如 "router.enabled: 预期为布尔值"
    const messages = result.error.issues.map((issue) => {
      const path = issue.path.join(".")
      return path ? `${path}: ${issue.message}` : issue.message
    })

    // 确保 errors 符合 [string, ...string[]] 约束
    // 逻辑：Zod 校验失败时 result.error.issues 必然不为空
    return {
      valid: false,
      errors: messages as [string, ...string[]],
    }
  }

  return {
    valid: true,
    errors: [],
  }
}

// 验证 IP
export function isValidIP(value: string): boolean {
  const regex =
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
  return regex.test(value)
}

// 验证域名
export function isValidDomain(value: string): boolean {
  const regex = /^(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/
  return regex.test(value)
}

export async function replaceRouterConfig(
  config: TunnelConfig,
): Promise<TunnelConfig> {
  const dir = await resourceDir()
  console.log("dir", dir)

  if (config.router && config.router.enabled) {
    config.router.bypass = [
      "geoip:cn",
      "geoip:private",
      "geosite:cn",
      "geosite:private",
    ]

    config.router.block = ["geosite:category-ads"]
    config.router.proxy = ["geosite:geolocation-!cn"]
    config.router.default_policy = "proxy"
    config.router.geoip = await join(
      dir,
      "resources",
      "geoip-only-cn-private.dat",
    )
    config.router.geosite = await join(dir, "resources", "geosite.dat")
  }

  return config
}
