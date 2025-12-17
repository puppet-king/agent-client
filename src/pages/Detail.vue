<script setup lang="ts">
import { useRouter, useRoute } from "vue-router"
import { Trash2, Pencil, Monitor, ShieldCheck } from "lucide-vue-next"
import { useConfStore } from "@/stores/userConf"
import { onMounted, ref, computed } from "vue"
import type { TunnelConfig } from "@/typings/config.ts"
// import UISwitch from "@/components/UISwitch.vue"
// import { storeToRefs } from "pinia"
import NavBar from "@/components/NavBar.vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import UIDisclosure from "@/components/Disclosure.vue"

defineOptions({
  name: "ConfigDetail",
})

const router = useRouter()
const route = useRoute()
const conf = useConfStore()
// const { enabledName } = storeToRefs(conf)

const name = ref("")
const tunnel = ref<TunnelConfig | null>(null)

onMounted(async () => {
  console.debug("onMounted")
  console.debug("route.params", route.params)
  name.value = String(route.params.name || "")

  if (name.value) {
    tunnel.value = await conf.loadTunnel(name.value)
    console.log("tunnel", tunnel.value)
  }
})

const localAddr = computed(() => {
  if (tunnel.value?.local_port === 0) {
    return tunnel.value?.local_addr
  }

  return tunnel.value?.local_addr + ":" + tunnel.value?.local_port
})

const handleDelete = () => {
  if (confirm("Are you sure you want to delete this tunnel?")) {
    conf.deleteTunnel(name.value)
    router.push("/")
  }
}

// const onConnect = async () => {
//   if (enabledName.value === name.value) {
//     return
//   }
//
//   console.log("onConnect")
//   enabledName.value = name.value
// }
</script>

<template>
  <!-- 加载中状态 -->
  <div
    v-if="!tunnel"
    class="flex flex-col items-center justify-center h-[80vh] animate-pulse"
  >
    <p class="text-slate-500 mb-4 text-lg">数据丢失...</p>
    <button
      class="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-all"
      @click="router.push('/')"
    >
      返回首页
    </button>
  </div>

  <template v-else>
    <!-- 顶部导航栏 -->
    <NavBar title="配置详情" :show-back="true">
      <template #right>
        <div class="flex gap-1">
          <ButtonWrapper
            class="hover:bg-dark-3 rounded-full p-2"
            @click="router.push(`/edit/${name}`)"
          >
            <Pencil
              :size="20"
              class="text-slate-400 hover:text-primary transition-colors"
            />
          </ButtonWrapper>
          <ButtonWrapper
            class="hover:bg-red-500/10 rounded-full p-2"
            @click="handleDelete"
          >
            <Trash2
              :size="20"
              class="text-slate-400 hover:text-red-500 transition-colors"
            />
          </ButtonWrapper>
        </div>
      </template>
    </NavBar>

    <main class="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-12">
      <!-- 1. 核心状态卡片 -->
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
            class="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-primary/50 border border-primary/30 rounded"
          >
            客户端
          </span>
        </div>
        <p class="text-slate-400 font-mono text-sm flex items-center gap-2">
          <span
            class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          ></span>
          {{ tunnel.remote_addr }}:{{ tunnel.remote_port }}
        </p>
      </div>

      <!-- 2. 基础配置网格 (2列布局) -->
      <section class="grid grid-cols-2 gap-3">
        <div class="bg-dark-2 p-4 rounded-xl border border-dark-3">
          <div class="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
            <Monitor :size="12" /> 本地监听
          </div>
          <div class="font-mono text-white text-sm break-all">
            {{ localAddr }}
          </div>
        </div>
        <div class="bg-dark-2 p-4 rounded-xl border border-dark-3">
          <div class="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
            <ShieldCheck :size="12" /> 安全协议
          </div>
          <div class="font-mono text-primary text-sm">Trojan-Go</div>
        </div>
      </section>

      <!-- 3. 密码区域 (全宽) -->
      <div class="bg-dark-2 p-4 rounded-xl border border-dark-3">
        <div class="text-xs text-slate-500 mb-2">连接密码</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="pwd in tunnel.password || []"
            :key="pwd"
            class="px-2 py-1 bg-black/20 text-slate-300 font-mono text-xs rounded border border-white/5"
          >
            {{ pwd || "-" }}
          </span>
        </div>
      </div>

      <!-- 4. 功能模块组 (Disclosure) -->
      <div class="space-y-2">
        <!-- SSL 设置 -->
        <UIDisclosure>
          <template #title>
            <div class="flex justify-between items-center w-full">
              <span class="text-sm font-semibold tracking-wide">SSL 加密</span>
              <span
                :class="
                  tunnel.ssl?.enabled ? 'text-green-500' : 'text-slate-600'
                "
                class="text-xs uppercase font-black"
              >
                {{ tunnel.ssl?.enabled ? "启用" : "禁用" }}
              </span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 gap-4 pt-2">
              <div class="flex justify-between border-b border-white/5 pb-2">
                <span class="text-xs text-slate-500">SNI 域名</span>
                <span class="text-xs font-mono text-slate-200">{{
                  tunnel.ssl?.sni || "-"
                }}</span>
              </div>
              <div class="flex justify-between border-b border-white/5 pb-2">
                <span class="text-xs text-slate-500">验证证书 (Verify)</span>
                <span class="text-xs font-mono text-slate-200">{{
                  tunnel.ssl?.verify
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-xs text-slate-500">主机名验证</span>
                <span class="text-xs font-mono text-slate-200">{{
                  tunnel.ssl?.verify_hostname
                }}</span>
              </div>
            </div>
          </template>
        </UIDisclosure>

        <!-- Mux 设置 -->
        <UIDisclosure>
          <template #title>
            <div class="flex justify-between items-center w-full">
              <span class="text-sm font-semibold tracking-wide">
                多路复用 (Mux)
              </span>
              <span
                :class="
                  tunnel.mux?.enabled ? 'text-green-500' : 'text-slate-600'
                "
                class="text-xs uppercase font-black"
              >
                {{ tunnel.mux?.enabled ? "启用" : "禁用" }}
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
              <span class="text-sm font-semibold tracking-wide">
                路由规则 (Router)
              </span>
              <span
                :class="
                  tunnel.router?.enabled ? 'text-green-500' : 'text-slate-600'
                "
                class="text-xs font-black"
              >
                {{ tunnel.router?.enabled ? "启用" : "禁用" }}
              </span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4 pt-2">
              <!-- 路由详情列表 -->
              <div
                v-for="(val, key) in {
                  bypass: '绕过规则',
                  block: '阻断规则',
                  proxy: '代理规则',
                }"
                :key="key"
              >
                <div class="text-xs text-slate-500 uppercase mb-2">
                  {{ val }}
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in tunnel.router?.[key]"
                    :key="tag"
                    class="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded-md border border-blue-500/20"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="!tunnel.router?.[key]?.length"
                    class="text-xs text-slate-700 italic"
                    >空</span
                  >
                </div>
              </div>

              <div
                class="grid grid-cols-2 gap-4 mt-4 p-3 bg-black/20 rounded-lg"
              >
                <div>
                  <div class="text-[10px] text-slate-500 uppercase">
                    默认策略
                  </div>
                  <div class="text-xs text-slate-300 font-mono">
                    {{ tunnel.router?.default_policy || "-" }}
                  </div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-500 uppercase">
                    GeoIP 数据
                  </div>
                  <div class="text-xs text-slate-300 font-mono truncate">
                    {{ tunnel.router?.geoip?.split("/").pop() }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </UIDisclosure>
      </div>
    </main>
  </template>
</template>
