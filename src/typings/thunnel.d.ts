// export interface TunnelConfig {
//   id: string
//   name: string
//   isEnabled: boolean
//   interface: {
//     privateKey: string
//     publicKey: string
//     addresses: string
//     dns: string
//     mtu?: string
//     listenPort?: string
//   }
//   peer: {
//     publicKey: string
//     presharedKey?: string
//     endpoint: string
//     allowedIps: string
//     persistentKeepalive?: string
//   }
// }
//
// export type TunnelContextType = {
//   tunnels: TunnelConfig[]
//   addTunnel: (tunnel: TunnelConfig) => void
//   updateTunnel: (id: string, tunnel: Partial<TunnelConfig>) => void
//   toggleTunnel: (id: string) => void
//   deleteTunnel: (id: string) => void
//   getTunnel: (id: string) => TunnelConfig | undefined
// }
//
// // 客户端默认配置
// export interface ClientConfig {
//   name: string
//   password: string
//
//   localAddr: "127.0.0.1"
//   enableAutoPort: boolean // 默认 true
//   enabledSSL: boolean
//   sni: string // ssl sni
//   localPort: ""
//   remote_addr: string
//   remote_port: string
// }
