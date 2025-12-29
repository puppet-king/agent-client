import { TunnelConfigSchema, type ValidateResult } from "@/typings/config.ts"
import {
  type SingBoxConfig,
  SingBoxConfigSchema,
} from "@/typings/singBoxConfig.ts"

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
  config: SingBoxConfig,
): Promise<SingBoxConfig> {
  // 不用替换读取远程资源
  // const dir = await resourceDir()
  // console.log("dir", dir)
  //
  // if (config.router && config.router.enabled) {
  //   config.router.bypass = [
  //     "geoip:cn",
  //     "geoip:private",
  //     "geosite:cn",
  //     "geosite:private",
  //   ]
  //
  //   config.router.block = ["geosite:category-ads"]
  //   config.router.proxy = ["geosite:geolocation-!cn"]
  //   config.router.default_policy = "proxy"
  //   config.router.geoip = await join(
  //     dir,
  //     "resources",
  //     "geoip-only-cn-private.dat",
  //   )
  //   config.router.geosite = await join(dir, "resources", "geosite.dat")
  // }

  return config
}

/**
 * 校验 Sing-box 配置文件格式
 * @param config 从 JSON.parse 或 JSON5.parse 得到的数据
 */
export function validateSingBoxConfig(config: unknown): ValidateResult {
  // 使用新的 SingBoxConfigSchema 进行安全解析
  const result = SingBoxConfigSchema.safeParse(config)

  if (!result.success) {
    // 1. 提取 Zod 产生的错误项
    const messages = result.error.issues.map((issue) => {
      // 2. 将路径数组 [ "inbounds", 0, "listen_port" ] 转换为字符串 "inbounds[0].listen_port"
      const path = issue.path
        .map((p) => (typeof p === "number" ? `[${p}]` : p))
        .join(".")
        .replace(/\.\[/g, "[") // 修复路径显示，如 outbounds.[0] -> outbounds[0]

      return path ? `${path}: ${issue.message}` : issue.message
    })

    // 3. 返回符合 [string, ...string[]] 约束的错误对象
    return {
      valid: false,
      errors: messages as [string, ...string[]],
    }
  }

  // 校验成功
  return {
    valid: true,
    errors: [],
  }
}
