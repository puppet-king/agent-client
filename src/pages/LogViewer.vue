<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { Trash2, Terminal, RefreshCcw } from "lucide-vue-next"
import NavBar from "@/components/NavBar.vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import { BaseDirectory, readTextFileLines } from "@tauri-apps/plugin-fs"

const logs = ref<{ time: string; msg: string; type: "info" | "error" }[]>([])
const isLoading = ref(false)

// 流式读取日志文件
const loadLogs = async () => {
  if (isLoading.value) return

  isLoading.value = true
  logs.value = [] // 刷新时清空旧列表

  try {
    const lines = await readTextFileLines("app.log", {
      baseDir: BaseDirectory.AppLog,
    })

    for await (const line of lines) {
      if (!line.trim()) continue

      logs.value.push({
        time: new Date().toLocaleTimeString(), // 如果日志里没时间戳，前端补一个
        msg: line,
        type:
          line.includes("[ERROR]") || line.includes("fatal") ? "error" : "info",
      })

      // 性能保险：虽然是流式读取，但展示层如果超过 2000 行会卡顿
      if (logs.value.length > 2000) logs.value.shift()
    }
  } catch (e) {
    console.error("读取日志失败:", e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadLogs()
})

onUnmounted(() => {
  clearLogs()
})

const clearLogs = () => {
  logs.value = []
}
</script>

<template>
  <div class="flex flex-col h-screen bg-[#0f0f0f] text-slate-400 font-sans">
    <!-- 自定义导航栏 -->
    <NavBar title="系统日志" :show-back="true">
      <template #right>
        <ButtonWrapper
          :class="{ 'opacity-50 pointer-events-none': isLoading }"
          @click="loadLogs"
        >
          <RefreshCcw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </ButtonWrapper>

        <ButtonWrapper @click="clearLogs">
          <Trash2 class="w-5 h-5" title="清空日志" />
        </ButtonWrapper>
      </template>
    </NavBar>

    <!-- 日志显示区域 -->
    <main
      class="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-6 scroll-smooth"
    >
      <div
        v-if="logs.length === 0"
        class="h-full flex flex-col items-center justify-center text-slate-600"
      >
        <Terminal class="w-12 h-12 mb-2 opacity-20" />
        <p class="text-sm italic">等待进程输出流...</p>
      </div>

      <div
        v-for="(item, index) in logs"
        :key="index"
        class="flex gap-3 mb-1 group"
      >
        <span class="text-slate-600 shrink-0 select-none"
          >[{{ item.time }}]</span
        >
        <span
          :class="[
            'break-all whitespace-pre-wrap',
            item.type === 'error' ? 'text-red-400' : 'text-slate-300',
          ]"
        >
          {{ item.msg }}
        </span>
      </div>
    </main>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
