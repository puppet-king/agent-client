<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import NavBar from "@/components/NavBar.vue"
import { Save, Globe, Monitor, Eye, EyeOff, Layers, Zap } from "lucide-vue-next"
import { toast } from "@/composables/useToast.ts"
import {
  type ShadowsocksOutbound,
  type SingBoxConfig,
} from "@/typings/singBoxConfig.ts"
import { validateSingBoxConfig } from "@/utils/validate.ts"
import { useRoute, useRouter } from "vue-router"
import { useConfStore } from "@/stores/userConf.ts"
import UISwitch from "@/components/UISwitch.vue"
import { homeDir, join } from "@tauri-apps/api/path"
import { CACHE_DB_PATH } from "@/config/constants.ts"

const router = useRouter()
const route = useRoute()
const confStore = useConfStore()

// 响应式状态
const isEdit = computed(() => !!route.params.name)
const configName = ref("") // 对应文件名
const showPassword = ref(false) // 控制是否显示明文

const path = await join(await homeDir(), CACHE_DB_PATH)

// 初始化一个符合 TunnelConfig 结构的空表单
const form = reactive<SingBoxConfig>({
  log: {
    level: "error",
    timestamp: true,
  },
  dns: {
    servers: [
      { tag: "google", address: "tls://8.8.8.8" },
      { tag: "dns_block", address: "rcode://refused" },
      { tag: "local", address: "223.5.5.5", detour: "direct" },
    ],
    rules: [
      { domain: ["static.juqingsong.cn"], server: "local" },
      { protocol: "dns", server: "local" },
      { rule_set: "geosite-geolocation-cn", server: "local" },
      { rule_set: "geosite-geolocation-!cn", server: "google" },
    ],
    final: "local",
    strategy: "prefer_ipv4",
  },
  inbounds: [
    {
      type: "mixed",
      tag: "mixed-in",
      listen: "127.0.0.1",
      listen_port: 10808,
      sniff: true,
      sniff_override_destination: true,
    },
  ],
  outbounds: [
    {
      type: "shadowsocks",
      tag: "proxy",
      server: "", // 留空由用户在 UI 填入
      server_port: 8080,
      method: "2022-blake3-aes-128-gcm",
      password: "",
      multiplex: {
        enabled: true,
        protocol: "h2mux",
        max_connections: 4,
        min_streams: 4,
      },
    },
    {
      type: "direct",
      tag: "direct",
    },
  ],
  route: {
    rules: [
      { action: "sniff" },
      {
        type: "logical",
        mode: "or",
        rules: [{ protocol: "dns" }, { port: 53 }],
        action: "hijack-dns",
      },
      { ip_is_private: true, outbound: "direct" },
      {
        type: "logical",
        mode: "or",
        rules: [
          { port: 853 },
          { network: "udp", port: 443 },
          { protocol: "stun" },
        ],
        action: "reject",
      },
      { rule_set: "geosite-geolocation-cn", outbound: "direct" },
      { rule_set: "geoip-cn", outbound: "direct" },
      {
        type: "logical",
        mode: "and",
        rules: [
          { rule_set: "geosite-geolocation-!cn" },
          { rule_set: "geoip-cn", invert: true },
        ],
        outbound: "proxy",
      },
    ],
    rule_set: [
      {
        type: "remote",
        tag: "geosite-geolocation-!cn",
        format: "binary",
        url: "https://static.juqingsong.cn/geosite-geolocation-!cn.srs",
        download_detour: "direct",
      },
      {
        type: "remote",
        tag: "geoip-cn",
        format: "binary",
        url: "https://static.juqingsong.cn/geoip-cn.srs",
        download_detour: "direct",
      },
      {
        type: "remote",
        tag: "geosite-geolocation-cn",
        format: "binary",
        url: "https://static.juqingsong.cn/geosite-geolocation-cn.srs",
        download_detour: "direct",
      },
    ],
    final: "proxy",
    auto_detect_interface: true,
  },
  experimental: {
    cache_file: {
      enabled: true,
      path: path,
      store_rdrc: true,
    },
    clash_api: {
      default_mode: "Enhanced",
    },
  },
})

onMounted(async () => {
  if (isEdit.value) {
    const nameParam = String(route.params.name || "")
    configName.value = nameParam

    // 从 Store/后端 加载现有配置
    const data = await confStore.loadTunnel(nameParam)
    if (data) {
      Object.assign(form, {
        ...form, // 默认值
        ...data, // 加载的值
        // 对特定的深层对象进行合并（可选，如果 data 结构很碎）
        log: { ...form.log, ...data.log },
        dns: { ...form.dns, ...data.dns },
        route: { ...form.route, ...data.route },
      })
    } else {
      console.error("未找到配置数据")
      await router.push("/")
    }
  }
})

// 保存操作
const handleSave = async () => {
  // 基础名称校验
  if (!configName.value.trim()) {
    toast.info("请输入配置名称")
    return
  }

  // Zod 格式校验
  const check = validateSingBoxConfig(form)
  if (!check.valid) {
    toast.info(`配置格式错误:\n${check.errors[0]}`)
    return
  }

  try {
    const result = isEdit.value
      ? await confStore.updateTunnel(configName.value, { ...form })
      : await confStore.addTunnel(configName.value, { ...form })
    if (result.success) {
      if (isEdit.value) {
        router.back()
      } else {
        void router.push(`/`)
      }
    } else {
      toast.error(result.message || "保存失败")
    }
  } catch (e) {
    toast.error("系统错误")
    console.error("系统错误: " + e)
  }
}

// 1. 快捷访问 proxy outbound
const proxyNode = computed(() => {
  return form.outbounds.find((o) => o.tag === "proxy") as ShadowsocksOutbound
})

// 2. 快捷访问 mixed inbound
const mixedInbound = computed(() => {
  return form.inbounds.find((o) => o.type === "mixed")!
})

// 3. 急速模式逻辑简化
// 通过计算属性监听或控制 route 里的规则是否存在来实现
const isFastMode = computed({
  get: () => {
    // 检查规则集中是否有 geosite-geolocation-cn
    return form.route.rule_set.some((r) => r.tag === "geosite-geolocation-cn")
  },
  set: (val: boolean) => {
    if (val) {
      // 启用：添加对应的规则集和路由规则
      enableFastModeRules()
    } else {
      // 禁用：清空相关规则
      disableFastModeRules()
    }
  },
})

// 模拟开启急速模式：注入规则
function enableFastModeRules() {
  // 设置 DNS 规则
  form.dns.rules = [
    { rule_set: "geosite-geolocation-cn", server: "local" },
    { rule_set: "geosite-geolocation-!cn", server: "google" },
  ]

  // 设置路由规则集
  form.route.rule_set = [
    {
      type: "remote",
      tag: "geosite-geolocation-!cn",
      format: "binary",
      url: "https://static.juqingsong.cn/geosite-geolocation-!cn.srs",
      download_detour: "direct",
    },
    {
      type: "remote",
      tag: "geoip-cn",
      format: "binary",
      url: "https://static.juqingsong.cn/geoip-cn.srs",
      download_detour: "direct",
    },
    {
      type: "remote",
      tag: "geosite-geolocation-cn",
      format: "binary",
      url: "https://static.juqingsong.cn/geosite-geolocation-cn.srs",
      download_detour: "direct",
    },
  ]
  // 设置路由规则
  form.route.rules = [
    { action: "sniff" },
    {
      type: "logical",
      mode: "or",
      rules: [{ protocol: "dns" }, { port: 53 }],
      action: "hijack-dns",
    },
    { ip_is_private: true, outbound: "direct" },
    {
      type: "logical",
      mode: "or",
      rules: [
        { port: 853 },
        { network: "udp", port: 443 },
        { protocol: "stun" },
      ],
      action: "reject",
    },
    { rule_set: "geosite-geolocation-cn", outbound: "direct" },
    { rule_set: "geoip-cn", outbound: "direct" },
    {
      type: "logical",
      mode: "and",
      rules: [
        { rule_set: "geosite-geolocation-!cn" },
        { rule_set: "geoip-cn", invert: true },
      ],
      outbound: "proxy",
    },
  ]
}

function disableFastModeRules() {
  form.dns.rules = []
  form.route.rule_set = []
  form.route.rules = [
    { action: "sniff" },
    {
      type: "logical",
      mode: "or",
      rules: [{ protocol: "dns" }, { port: 53 }],
      action: "hijack-dns",
    },
    { ip_is_private: true, outbound: "direct" },
  ]
}

const multiplexEnabled = computed({
  get: () => {
    // 安全导航：不存在或 enabled 为 false 都视为关闭
    return proxyNode.value.multiplex?.enabled ?? false
  },
  set: (val: boolean) => {
    if (val) {
      // 开启时：如果不存在 multiplex 对象，则立即初始化一个完整的默认结构
      if (!proxyNode.value.multiplex) {
        proxyNode.value.multiplex = {
          enabled: true,
          protocol: "h2mux",
          max_connections: 4,
          min_streams: 4,
        }
      } else {
        proxyNode.value.multiplex.enabled = true
      }
    } else {
      // 关闭时：如果对象存在，仅将 enabled 设为 false
      if (proxyNode.value.multiplex) {
        proxyNode.value.multiplex.enabled = false
      }
    }
  },
})
</script>
<template>
  <NavBar :title="configName ? '编辑配置' : '创建配置'" :show-back="true">
    <template #right>
      <ButtonWrapper @click="handleSave">
        <Save :size="24" class="text-blue-600" />
      </ButtonWrapper>
    </template>
  </NavBar>

  <!-- 主体表单区域 -->
  <main class="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-24">
    <!-- 区块一：代理服务器信息 (对应 outbounds 中的 proxy 节点) -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 px-1 text-slate-400">
        <Globe :size="16" class="text-primary" />
        <span class="text-xs uppercase font-bold tracking-widest">
          代理服务器
        </span>
      </div>

      <div
        class="bg-dark-2 rounded-2xl border border-dark-3 p-5 space-y-4 shadow-sm"
      >
        <!-- 配置文件名 -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-500 ml-1">配置文件名称</label>
          <input
            v-model="configName"
            type="text"
            placeholder="my-server"
            class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm transition-all outline-none focus:border-primary/50"
            :disabled="isEdit"
          />
        </div>

        <!-- 远程地址与端口 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2 space-y-1.5">
            <label class="text-xs text-slate-500 ml-1">服务器地址</label>
            <input
              v-model="proxyNode.server"
              type="text"
              placeholder="8.8.8.8"
              class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-500 ml-1">端口</label>
            <input
              v-model.number="proxyNode.server_port"
              type="number"
              class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none"
            />
          </div>
        </div>

        <!-- 密码 -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-500 ml-1">连接密码 (Password)</label>
          <div class="relative flex items-center">
            <input
              v-model="proxyNode.password"
              :type="showPassword ? 'text' : 'password'"
              class="flex-1 bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none"
            />
            <button
              class="absolute right-3 text-slate-500"
              @click="showPassword = !showPassword"
            >
              <component :is="showPassword ? Eye : EyeOff" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 区块二：本地入站 (对应 inbounds 中的 mixed 节点) -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 px-1 text-slate-400">
        <Monitor :size="16" class="text-primary" />
        <span class="text-xs uppercase font-bold tracking-widest"
          >本地监听</span
        >
      </div>
      <div class="bg-dark-2 rounded-2xl border border-dark-3 p-5 shadow-sm">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-500 ml-1">监听地址</label>
            <input
              v-model="mixedInbound.listen"
              type="text"
              class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-500 ml-1">端口</label>
            <input
              v-model.number="mixedInbound.listen_port"
              type="number"
              class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 区块三：高级功能 -->
    <section class="space-y-3">
      <!-- 多路复用 Multiplex -->
      <div class="bg-dark-2 rounded-2xl border border-dark-3 p-5 shadow-sm">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Layers :size="18" />
            </div>
            <div>
              <div class="text-sm font-bold">多路复用 (Multiplex)</div>
              <div class="text-[10px] text-slate-500">减少延迟 / 提高并发</div>
            </div>
          </div>
          <UISwitch v-model:checked="multiplexEnabled" size="small" />
        </div>
      </div>

      <!-- 急速模式 (路由分流) -->
      <div class="bg-dark-2 rounded-2xl border border-dark-3 p-5 shadow-sm">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <Zap :size="18" />
            </div>
            <div>
              <div class="text-sm font-bold">急速模式 (分流)</div>
              <div class="text-[10px] text-slate-500">绕过中国大陆流量</div>
            </div>
          </div>
          <!-- 这里使用一个独立的 Ref 或计算属性来简化控制 -->
          <UISwitch v-model:checked="isFastMode" size="small" />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* 动画：当开启 SSL 时平滑滑出 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

/* 输入框聚焦效果 */
input:focus {
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

/* 针对端口等数字输入框隐藏箭头 */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
