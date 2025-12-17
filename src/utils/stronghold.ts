// import { Client, Stronghold } from "@tauri-apps/plugin-stronghold"
// import { appDataDir } from "@tauri-apps/api/path"
// import * as keytar from "keytar"
// import { SERVICE, ACCOUNT, VAULT_FILE } from "@/config/constants"
//
// type StrongholdStore = {
//   set: (key: string, value: string) => Promise<void>
//   get: (key: string) => Promise<string | null>
//   remove: (key: string) => Promise<void>
// }
//
// let strongholdInstance: Stronghold | null = null
// let clientInstance: Client | null = null
//
// /**
//  * 获取或创建 vaultPassword 并存入系统 Keychain
//  */
// async function getOrCreateVaultPassword(): Promise<string> {
//   let vaultPassword = await keytar.getPassword(SERVICE, ACCOUNT)
//
//   if (!vaultPassword) {
//     vaultPassword = crypto.randomUUID() // 随机生成 vault 密码
//     await keytar.setPassword(SERVICE, ACCOUNT, vaultPassword)
//   }
//
//   return vaultPassword
// }
//
// /**
//  * 初始化 Stronghold 单例
//  */
// export async function initStronghold(
//   clientName = SERVICE,
//   vaultFile = VAULT_FILE,
// ) {
//   if (strongholdInstance && clientInstance) {
//     return { stronghold: strongholdInstance, client: clientInstance }
//   }
//
//   // 获取或创建 vaultPassword
//   const vaultPassword = await getOrCreateVaultPassword()
//
//   const vaultPath = `${await appDataDir()}/${vaultFile}`
//   const stronghold = await Stronghold.load(vaultPath, vaultPassword)
//
//   let client: Client
//   try {
//     client = await stronghold.loadClient(clientName)
//   } catch {
//     client = await stronghold.createClient(clientName)
//   }
//
//   strongholdInstance = stronghold
//   clientInstance = client
//
//   return { stronghold, client }
// }
//
// /**
//  * 获取封装后的 Store 操作
//  */
// export async function getStrongholdStore(): Promise<StrongholdStore> {
//   if (!clientInstance || !strongholdInstance) {
//     await initStronghold()
//   }
//
//   const store = clientInstance!.getStore()
//
//   return {
//     set: async (key: string, value: string) => {
//       const data = Array.from(new TextEncoder().encode(value))
//       await store.insert(key, data)
//       await strongholdInstance!.save()
//     },
//     get: async (key: string) => {
//       const data = await store.get(key)
//       if (!data) return null
//       return new TextDecoder().decode(new Uint8Array(data))
//     },
//     remove: async (key: string) => {
//       await store.remove(key)
//       await strongholdInstance!.save()
//     },
//   }
// }
