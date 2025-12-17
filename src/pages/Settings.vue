<script setup lang="ts">
import NavBar from "@/components/NavBar.vue"
import { config } from "@/config/config"
import { ArrowRight } from "lucide-vue-next"

defineOptions({
  name: "ClientSettings",
})
</script>

<template>
  <!-- Header -->
  <NavBar title="Puppet Tunnel" :show-back="true"></NavBar>

  <!-- Content -->
  <main class="flex-1 pt-4">
    <!-- App Info Card -->
    <div class="flex items-center gap-4 mb-8 px-4">
      <div
        class="w-16 h-16 bg-[#881111] rounded-2xl flex items-center justify-center shadow-sm"
      >
        <!-- Simplified SVG Logo mimicking WireGuard -->
        <svg
          viewBox="0 0 24 24"
          stroke="currentColor"
          class="w-10 h-10 text-white"
          stroke-width="2"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
            stroke="none"
            fill="white"
          />
          <path
            d="M7 10C7 10 9 8 12 8C15 8 17 10 17 10"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            d="M12 8V16"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle cx="12" cy="16" r="2" fill="white" />
        </svg>
      </div>
      <div>
        <h2 class="text-lg font-medium leading-tight">
          TrojanClient for windows {{ config.VERSION }}
        </h2>
        <p class="text-sm text-slate-500 mt-1">仅供个人学习研究使用</p>
      </div>
    </div>

    <div class="flex flex-1 flex-col pt-4">
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
