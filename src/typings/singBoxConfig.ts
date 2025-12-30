import { z } from "zod"
import { isValidIP } from "@/utils/validate"

export type Protocol = "shadowsocks" | "trojan"

export interface TunnelIndexItem {
  name: string // 唯一性
  path: string // $APPDATA 相对路径
  type: Protocol | Protocol[] // 使用的协议
}

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

const AddressSchema = z.string().refine(
  (val) => {
    const ipRegex =
      /^(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
    const domainRegex = /^(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/
    return ipRegex.test(val) || domainRegex.test(val)
  },
  { message: "地址必须是合法的 IP 或域名" },
)

// 多路复用通用配置
const MultiplexSchema = z
  .object({
    enabled: z.boolean(),
    protocol: z.enum(["smux", "yamux", "h2mux"]).optional(),
    max_connections: z.number().int().optional(),
    min_streams: z.number().int().optional(),
  })
  .optional()

// --- Shadowsocks 出站定义 ---
const ShadowsocksOutboundSchema = z.object({
  type: z.literal("shadowsocks"),
  tag: z.string(),
  server: AddressSchema,
  server_port: z.number().int().min(1).max(65535),
  method: z.string(),
  password: z.string(),
  multiplex: MultiplexSchema,
})

// --- Trojan 出站定义 ---
const TrojanOutboundSchema = z.object({
  type: z.literal("trojan"),
  tag: z.string(),
  server: AddressSchema,
  server_port: z.number().int().min(1).max(65535),
  password: z.string(), // Trojan 出站通常直接在顶层有 password
  tls: z
    .object({
      enabled: z.boolean().default(true),
      server_name: z.string().optional(),
      insecure: z.boolean().optional(),
      utls: z // 可用的指纹值：
        .object({
          enabled: z.boolean(),
          fingerprint: z.string(),
        })
        .optional(),
    })
    .optional(),
  multiplex: MultiplexSchema,
  transport: z.object({}).passthrough().optional(), // 传输层配置
})

// 3. 完整的 SingBox 配置 Schema
export const SingBoxConfigSchema = z.object({
  log: z.object({
    level: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default("info"),
    timestamp: z.boolean().optional(), // 可选
    output: z.string().optional(), // 可选
  }),
  dns: z.object({
    servers: z.array(z.any()),
    rules: z.array(z.any()),
    final: z.string(),
    strategy: z.enum(["prefer_ipv4", "prefer_ipv6", "ipv4_only", "ipv6_only"]),
  }),
  inbounds: z.array(InboundSchema).min(1),
  outbounds: z
    .array(
      z.union([
        ShadowsocksOutboundSchema,
        TrojanOutboundSchema,
        z.object({ type: z.literal("direct"), tag: z.string() }),
      ]),
    )
    .refine(
      (items) =>
        items.some(
          (item) => item.type === "shadowsocks" || item.type === "trojan",
        ),
      {
        message: "配置中必须至少包含一个 shadowsocks 或 trojan 类型的节点",
      },
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
export type ShadowsocksOutbound = z.infer<typeof ShadowsocksOutboundSchema>

// 保持原有的状态和结果类型定义
export type ValidateResult =
  | { valid: true; errors: string[] }
  | { valid: false; errors: [string, ...string[]] }

export interface TrojanStatus {
  is_running: boolean
  name: string | null
  proxy_status: boolean
}
