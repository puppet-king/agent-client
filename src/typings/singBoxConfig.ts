import { z } from "zod"
import { isValidIP } from "@/utils/validate"

// 1. 定义入站 Schema (Mixed 模式)
const InboundSchema = z.object({
  type: z.literal("mixed"),
  tag: z.string(),
  listen: z.string().refine((val) => isValidIP(val), {
    message: "无效的监听地址",
  }),
  listen_port: z.number().int().min(1).max(65535),
  sniff: z.boolean().default(true),
  sniff_override_destination: z.boolean().default(true),
})

// 2. 定义出站 Schema (Shadowsocks 模式)
const OutboundSchema = z.object({
  type: z.literal("shadowsocks"),
  tag: z.literal("proxy"),
  server: z.string().refine(
    (val) => {
      const ipRegex =
        /^(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
      const domainRegex = /^(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/
      return ipRegex.test(val) || domainRegex.test(val)
    },
    { message: "远程地址必须是合法的 IP 或域名" },
  ),
  server_port: z.number().int().min(1).max(65535),
  method: z.string(), // 例如 "2022-blake3-aes-128-gcm"
  password: z.string(),
  multiplex: z
    .object({
      enabled: z.boolean(),
      protocol: z.enum(["smux", "yamux", "h2mux"]),
      max_connections: z.number().int(),
      min_streams: z.number().int(),
    })
    .optional(),
})

// 3. 完整的 SingBox 配置 Schema
export const SingBoxConfigSchema = z.object({
  log: z.object({
    level: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]),
    timestamp: z.boolean(),
  }),
  dns: z.object({
    servers: z.array(z.any()),
    rules: z.array(z.any()),
    final: z.string(),
    strategy: z.enum(["prefer_ipv4", "prefer_ipv6", "ipv4_only", "ipv6_only"]),
  }),
  inbounds: z.array(InboundSchema).min(1),
  outbounds: z.array(
    z.union([
      OutboundSchema,
      z.object({ type: z.literal("direct"), tag: z.string() }),
      // z.object({ type: z.literal("block"), tag: z.string() }), // 废弃
    ]),
  ),
  route: z.object({
    rules: z.array(z.any()),
    rule_set: z.array(
      z.object({
        type: z.literal("remote"),
        tag: z.string(),
        format: z.literal("binary"),
        url: z.string().url(),
        download_detour: z.string(),
      }),
    ),
    final: z.string(),
    auto_detect_interface: z.boolean(),
  }),
  experimental: z
    .object({
      cache_file: z.object({
        enabled: z.boolean(),
        store_rdrc: z.boolean(),
      }),
      clash_api: z
        .object({
          default_mode: z.string(),
        })
        .optional(),
    })
    .optional(),
})

export type SingBoxConfig = z.infer<typeof SingBoxConfigSchema>

// 保持原有的状态和结果类型定义
export type ValidateResult =
  | { valid: true; errors: string[] }
  | { valid: false; errors: [string, ...string[]] }

export interface TrojanStatus {
  is_running: boolean
  name: string | null
  proxy_status: boolean
}
