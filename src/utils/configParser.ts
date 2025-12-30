import type { Protocol, SingBoxConfig } from "@/typings/singBoxConfig.ts"

/**
 * 提取配置文件中启用的代理协议
 */
export const getEnabledProtocols = (
  config: SingBoxConfig,
): Protocol | Protocol[] => {
  const allowedSet: ReadonlySet<string> = new Set(["shadowsocks", "trojan"])

  const protocols = config.outbounds
    .map((o) => o.type)
    .filter((t): t is Protocol => allowedSet.has(t))

  return protocols.length === 1 ? protocols[0]! : protocols
}
