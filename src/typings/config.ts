import { z } from "zod"
import { isValidIP } from "@/utils/validate"

export const TunnelConfigSchema = z.object({
  run_type: z.enum(["client"]),
  local_addr: z.string().refine((val) => isValidIP(val), {
    message: "无效的本地 IP 地址格式",
  }),
  local_port: z
    .number()
    .int()
    .gt(0)
    .lte(65535, { message: "端口号必须在 1-65535 之间" }),
  remote_addr: z.string().refine(
    (val) => {
      // 兼容 IP 或 域名
      const ipRegex =
        /^(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
      const domainRegex = /^(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/
      return ipRegex.test(val) || domainRegex.test(val)
    },
    { message: "远程地址必须是合法的 IP 或域名" },
  ),
  remote_port: z.number().int().positive().max(65535),
  password: z.array(z.string()).min(1, "至少需要一个密码"),

  ssl: z
    .object({
      enabled: z.boolean(),
      sni: z.string().optional(),
      verify: z.boolean().optional(),
      verify_hostname: z.boolean().optional(),
    })
    .refine((data) => (data.enabled ? !!data.sni : true), {
      message: "当 ssl 开启时，sni 必填",
    })
    .optional(),

  mux: z
    .object({
      enabled: z.boolean(),
    })
    .optional(),

  router: z
    .object({
      enabled: z.boolean(),
      bypass: z.array(z.string()).optional(),
      block: z.array(z.string()).optional(),
      proxy: z.array(z.string()).optional(),
      default_policy: z.string().optional(),
      geoip: z.string().optional(),
      geosite: z.string().optional(),
    })
    .optional(),
})

export type TunnelConfig = z.infer<typeof TunnelConfigSchema>

export type ValidateResult =
  | { valid: true; errors: string[] }
  | { valid: false; errors: [string, ...string[]] }

export interface TrojanStatus {
  is_running: boolean
  name: string | null
  proxy_status: boolean
}

export interface SystemConfig {
  autoUpdate: boolean
  autoStart: boolean
}
