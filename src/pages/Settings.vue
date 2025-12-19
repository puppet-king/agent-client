<script setup lang="ts">
import NavBar from "@/components/NavBar.vue"
import { ArrowRight } from "lucide-vue-next"
import { onMounted, ref } from "vue"
import UISwitch from "@/components/UISwitch.vue"
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart"
import logoUrl from "@/assets/logo.png"
import { getVersion } from "@tauri-apps/api/app"
import { isDesktop } from "@/utils/rustUtils.ts"

defineOptions({
  name: "ClientSettings",
})

const enabled = ref(false)
const version = ref("")
const platformName = import.meta.env.VITE_BUILD_PLATFORM
const desktop = isDesktop()

onMounted(async () => {
  if (desktop) {
    enabled.value = await isEnabled()
  }

  version.value = await getVersion()
  console.debug("version", version.value)
})

const onAutoStartEnabled = async () => {
  enabled.value = !enabled.value
  if (enabled.value) {
    await enable()
  } else {
    await disable()
  }
}
</script>

<template>
  <!-- Header -->
  <NavBar title="Puppet Tunnel" :show-back="true"></NavBar>

  <!-- Content -->
  <main class="flex-1 pt-4">
    <!-- App Info Card -->
    <div class="flex items-center gap-4 px-4">
      <div
        class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
      >
        <img
          :src="logoUrl"
          alt="logo"
          class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
        />
      </div>
      <div class="flex flex-col text-center py-6">
        <div
          class="flex flex-row text-xl font-bold tracking-tight text-white leading-tight"
        >
          Client
          <span class="text-slate-500 font-normal pl-2"> for</span>
          <span
            class="pl-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent"
          >
            {{ platformName }}
          </span>
          <div class="ml-2 p-1 flex items-center gap-2">
            <span
              class="px-2 py-0.5 rounded-full bg-dark-1 border border-white/10 text-[10px] font-mono text-primary font-bold tracking-wider"
            >
              v{{ version }}
            </span>
          </div>
        </div>
        <p
          class="text-left text-xs text-slate-500 uppercase tracking-[0.6em] font-medium leading-relaxed"
        >
          仅供个人学习研究使用
        </p>
      </div>
    </div>

    <div class="flex flex-1 flex-col pt-2 gap-2">
      <div
        v-if="desktop"
        class="flex flex-col bg-dark-2 py-3 px-4 hover:bg-slate-800 cursor-pointer transition-colors border-b border-white/5"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium text-lg text-white">自动启动</div>
          </div>

          <UISwitch
            size="medium"
            :checked="enabled"
            @update:checked="onAutoStartEnabled()"
          />
        </div>
      </div>

      <div
        class="flex flex-col bg-dark-2 py-3 px-4 hover:bg-slate-800 cursor-pointer transition-colors border-b border-white/5"
        @click="$router.push('/logs')"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium text-lg text-white">查看应用日志</div>
            <div class="text-slate-600 text-sm pt-0.5">
              日志信息有助于调试连接问题
            </div>
          </div>

          <ArrowRight :size="24" class="text-slate-600" />
        </div>
      </div>
    </div>
  </main>
</template>
