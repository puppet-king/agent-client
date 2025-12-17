<script setup lang="ts">
import NavBar from "@/components/NavBar.vue"
import { config } from "@/config/config"
import { ArrowRight } from "lucide-vue-next"
import { onMounted, ref } from "vue"
import UISwitch from "@/components/UISwitch.vue"
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart"
import logoUrl from "@/assets/logo.png"

defineOptions({
  name: "ClientSettings",
})

const enabled = ref(false)

onMounted(async () => {
  enabled.value = await isEnabled()
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
    <div class="flex items-center gap-4 mb-8 px-4">
      <div
        class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
      >
        <img
          :src="logoUrl"
          alt="logo"
          class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
        />
      </div>
      <div>
        <h2 class="text-lg font-medium leading-tight">
          TrojanClient for windows {{ config.VERSION }}
        </h2>
        <p class="text-sm text-slate-500 mt-1">仅供个人学习研究使用</p>
      </div>
    </div>

    <div class="flex flex-1 flex-col pt-4 gap-2">
      <div
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
