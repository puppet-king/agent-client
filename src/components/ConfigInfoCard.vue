<script setup lang="ts">
import { Monitor, EyeOff, Eye, ShieldCheck } from "lucide-vue-next"
import { type SingBoxConfig } from "@/typings/singBoxConfig"
import { computed, ref } from "vue"
import UIDisclosure from "@/components/Disclosure.vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import { useConfStore } from "@/stores/userConf"

const props = defineProps<{
  name: string
  tunnel: SingBoxConfig
  listenAddr?: string
}>()

const conf = useConfStore()

const mixedInbounds = computed(() => {
  if (!props.tunnel?.inbounds) return []
  return props.tunnel.inbounds.filter((i) => i.type === "mixed")
})

const socksProxy = computed(() => {
  // 1. 在 outbounds 中查找 shadowsocks 节点
  const node = props.tunnel?.outbounds?.find((o) => o.type === "shadowsocks")

  // 2. 如果找到了，返回“原数据 + enabled: true”
  if (node) {
    return {
      ...node,
      multiplex: {
        enabled: node.multiplex?.enabled ?? false,
        protocol: node.multiplex?.protocol ?? "h2mux",
        max_connections: node.multiplex?.max_connections ?? 4,
        min_streams: node.multiplex?.min_streams ?? 4,
      },
      enabled: true, // 补充的新字段
    }
  }

  // 3. 如果没找到，返回“默认空结构 + enabled: false”
  // 这样模板里访问 scoksProxy.server 就不会报错，而是显示空字符串
  return {
    type: "shadowsocks",
    tag: "proxy",
    server: "",
    server_port: 0,
    method: "",
    multiplex: {
      enabled: false,
      protocol: "h2mux",
      max_connections: 4,
      min_streams: 4,
    },
    password: "",
    enabled: false, // 标志位：当前配置中没有有效的 SS 节点
  }
})

const isPasswordVisible = ref(false)
const togglePassword = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

const localAddr = computed(() => {
  return `${socksProxy.value.server}:${socksProxy.value.server_port}`
})

const routerInfo = computed(() => {
  const route = props.tunnel?.route
  if (!route) return { enabled: false, hijack: false, remoteSets: [] }

  // 1. 检查是否开启了 DNS 劫持 (逻辑规则中包含 hijack-dns)
  const hasDnsHijack = route.rules?.some((r) => r.action === "hijack-dns")

  // 2. 提取所有的远程规则集名称
  const remoteSets =
    route.rule_set?.map((s) => {
      // 区分 remote 和 local 类型
      if (s.type === "remote") {
        return {
          tag: s.tag,
          url: s.url.split("/").pop() || "", // 加空值兜底，避免 split 后返回 undefined
          type: s.type,
        }
      } else {
        // local 类型返回 path 相关（或根据需求调整）
        return {
          tag: s.tag,
          path: s.path.split("/").pop() || "", // 取本地路径的文件名
          type: s.type,
        }
      }
    }) || []

  // 3. 简化分流逻辑说明
  const strategy = route.final === "proxy" ? "全局加速" : "直连优先"

  return {
    enabled: true,
    hijack: hasDnsHijack,
    remoteSets,
    strategy,
    final: route.final,
    rulesCount: route.rules?.length || 0,
  }
})
</script>

<template>
  <!-- 核心状态卡片 -->
  <div
    class="bg-gradient-to-br from-dark-2 to-dark-3 p-6 rounded-2xl border border-dark-3 shadow-xl relative overflow-hidden"
  >
    <!-- 装饰性背景 -->
    <div
      class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"
    ></div>

    <div class="flex items-center gap-3 mb-2">
      <h1 class="text-2xl font-bold text-white tracking-tight">
        {{ name }}
      </h1>
      <span
        class="px-2 py-0.5 text-xs leading-none font-bold tracking-wider bg-primary/50 border border-primary/30 rounded"
      >
        客户端
      </span>
    </div>
    <p class="text-slate-400 font-mono text-sm flex items-center gap-2">
      <span
        class="w-2 h-2 rounded-full"
        :class="
          conf.enabledName === name
            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
            : 'bg-gray-500'
        "
      >
      </span>
      {{ localAddr }}
    </p>
  </div>

  <!-- 2. 基础配置网格 (2列布局) -->
  <section class="grid grid-cols-2 gap-3">
    <div class="bg-dark-2 p-4 rounded-xl border border-dark-3">
      <div class="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
        <Monitor :size="12" /> 本地监听
      </div>
      <div class="font-mono text-white text-sm break-all">
        {{ mixedInbounds[0]?.listen }}:{{ mixedInbounds[0]?.listen_port }}
      </div>
    </div>
    <div class="bg-dark-2 p-4 rounded-xl border border-dark-3">
      <div class="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
        <ShieldCheck :size="12" /> 协议
      </div>
      <div class="font-mono text-primary text-sm uppercase cursor-default">
        shadowSocks
      </div>
    </div>
  </section>

  <!-- 3. 密码区域 (全宽) -->
  <div class="bg-dark-2 p-4 rounded-xl border border-dark-3">
    <div class="text-xs text-slate-500 mb-2">授权凭证</div>
    <div class="flex flex-wrap gap-2">
      <span
        class="inline-flex items-center justify-between px-2 py-1 bg-black/20 text-slate-300 font-mono text-xs rounded border border-white/5 min-w-64"
      >
        {{ isPasswordVisible ? socksProxy.password : "***********" }}

        <ButtonWrapper class="pl-0.5" @click="togglePassword">
          <!-- 动态切换组件 -->
          <component :is="isPasswordVisible ? EyeOff : Eye" :size="14" />
        </ButtonWrapper>
      </span>
    </div>
  </div>

  <!-- 4. 功能模块组 (Disclosure) -->
  <div class="space-y-2">
    <!-- SSL 设置 -->
    <!--        <UIDisclosure>-->
    <!--          <template #title>-->
    <!--            <div class="flex justify-between items-center w-full">-->
    <!--              <span class="text-sm font-semibold tracking-wide">SSL 加密</span>-->
    <!--              <span-->
    <!--                :class="-->
    <!--                  tunnel.ssl?.enabled ? 'text-green-500' : 'text-slate-600'-->
    <!--                "-->
    <!--                class="text-xs uppercase font-black"-->
    <!--              >-->
    <!--                {{ tunnel.ssl?.enabled ? "启用" : "禁用" }}-->
    <!--              </span>-->
    <!--            </div>-->
    <!--          </template>-->
    <!--          <template #content>-->
    <!--            <div class="grid grid-cols-1 gap-4 pt-2">-->
    <!--              <div class="flex justify-between border-b border-white/5 pb-2">-->
    <!--                <span class="text-xs text-slate-500">SNI 域名</span>-->
    <!--                <span class="text-xs font-mono text-slate-200">{{-->
    <!--                  tunnel.ssl?.sni || "-"-->
    <!--                }}</span>-->
    <!--              </div>-->
    <!--              <div class="flex justify-between border-b border-white/5 pb-2">-->
    <!--                <span class="text-xs text-slate-500">验证证书 (Verify)</span>-->
    <!--                <span class="text-xs font-mono text-slate-200">{{-->
    <!--                  tunnel.ssl?.verify-->
    <!--                }}</span>-->
    <!--              </div>-->
    <!--              <div class="flex justify-between">-->
    <!--                <span class="text-xs text-slate-500">主机名验证</span>-->
    <!--                <span class="text-xs font-mono text-slate-200">{{-->
    <!--                  tunnel.ssl?.verify_hostname-->
    <!--                }}</span>-->
    <!--              </div>-->
    <!--            </div>-->
    <!--          </template>-->
    <!--        </UIDisclosure>-->

    <!-- Mux 设置 -->
    <UIDisclosure>
      <template #title>
        <div class="flex justify-between items-center w-full">
          <span class="text-sm font-semibold tracking-wide">
            多路复用 (Mux)
          </span>
          <span
            :class="
              socksProxy.multiplex?.enabled
                ? 'text-green-500'
                : 'text-slate-600'
            "
            class="text-xs uppercase font-black"
          >
            {{ socksProxy.multiplex?.enabled ? "启用" : "禁用" }}
          </span>
        </div>
      </template>
      <template #content>
        <p class="text-xs text-slate-500 leading-relaxed">
          开启 Mux 可以减少握手延迟，提高在高延迟网络下的并发连接性能。
        </p>
      </template>
    </UIDisclosure>

    <!-- Router 设置 -->
    <UIDisclosure>
      <template #title>
        <div class="flex justify-between items-center w-full">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold tracking-wide"
              >路由规则 (Sing-box)</span
            >
            <!-- 显示规则总数 -->
            <span
              class="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-xs leading-none rounded border border-white/5"
            >
              {{ routerInfo.rulesCount }} Rules
            </span>
          </div>
          <span
            :class="routerInfo.enabled ? 'text-green-500' : 'text-slate-600'"
            class="text-xs font-black uppercase tracking-tighter"
          >
            {{ routerInfo.enabled ? "启用" : "禁用" }}
          </span>
        </div>
      </template>

      <template #content>
        <div class="space-y-4 pt-3">
          <!-- 核心动作状态 -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <!-- DNS 代理 -->
            <div
              class="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5 transition-colors hover:bg-white/[0.08]"
            >
              <div class="flex flex-col gap-0.5">
                <span
                  class="text-xs leading-none text-slate-500 uppercase font-medium tracking-tight"
                  >DNS 代理</span
                >
                <span
                  class="text-xs font-bold font-mono"
                  :class="
                    routerInfo.hijack ? 'text-emerald-400' : 'text-slate-500'
                  "
                >
                  {{ routerInfo.hijack ? "● 已启用" : "○ 未启用" }}
                </span>
              </div>
              <!-- 提示小标签 -->
              <span class="text-[9px] text-slate-600 bg-black/20 px-1 rounded"
                >P53</span
              >
            </div>

            <!-- 默认网关 -->
            <div
              class="flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5 transition-colors hover:bg-white/[0.08]"
            >
              <div class="flex flex-col gap-0.5">
                <span
                  class="text-xs text-slate-500 uppercase font-medium tracking-tight"
                  >默认网关</span
                >
                <span
                  class="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wide"
                >
                  {{ routerInfo.final || "direct" }}
                </span>
              </div>
              <!-- 提示小标签 -->
              <span class="text-[9px] text-slate-600 bg-black/20 px-1 rounded"
                >FINAL</span
              >
            </div>
          </div>
          <!-- 规则订阅集 Rule Sets -->
          <div>
            <div
              class="text-xs text-slate-500 uppercase mb-2 px-1 flex justify-between"
            >
              <span>资源订阅 (Rule Sets)</span>
              <span>Binary / Remote</span>
            </div>
            <div class="space-y-1.5">
              <div
                v-for="set in routerInfo.remoteSets"
                :key="set.tag"
                class="flex items-center justify-between p-2 bg-black/30 rounded-md border border-white/5 group hover:border-indigo-500/30 transition-colors"
              >
                <div class="flex flex-col">
                  <span class="text-[11px] text-slate-200 font-mono">{{
                    set.tag
                  }}</span>
                  <span
                    class="text-[9px] text-slate-500 truncate max-w-[180px]"
                    >{{ set.url ?? set.path }}</span
                  >
                </div>
                <!-- 对应规则出口显示 -->
                <div
                  class="px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 text-[9px] border border-indigo-500/20 uppercase"
                >
                  Download Detour: Direct
                </div>
              </div>
            </div>
          </div>

          <!-- 简易策略描述 -->
          <div
            class="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
              ></div>
              <span class="text-xs text-indigo-200/80">{{
                routerInfo.strategy
              }}</span>
            </div>
          </div>
        </div>
      </template>
    </UIDisclosure>
  </div>
</template>
