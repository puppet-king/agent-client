<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import {
  Trash2,
  Terminal,
  RefreshCcw,
  Loader2,
  CheckCircle2,
} from "lucide-vue-next"
import NavBar from "@/components/NavBar.vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs"
import { LOG_FILE } from "@/config/constants.ts"
import { invoke } from "@tauri-apps/api/core"
import { appLogDir, join } from "@tauri-apps/api/path"

const logs = ref<
  { time: string; msg: string; type: "info" | "error" | "warn" }[]
>([])
const isLoading = ref(false)
const hasMore = ref(true) // 是否还有更多日志可以加载
const PAGE_SIZE = 50 // 每页加载条数
const currentPage = ref(0) // 记录当前读到第几页

const LOG_REGEX =
  /^\[(?<date>[^\]]+)\]\[(?<time>[^\]]+)\]\[(?<level>[A-Z]+)\]\[(?<origin>[^\]]+)\]\s*(?<content>.*)$/
function handleLog(line: string) {
  if (line.includes("[vite]")) return

  // console.log(line)
  const match = line.match(LOG_REGEX)

  // 使用 match?.groups 进行严格判断
  if (match && match.groups) {
    const [, , time = "", level = "", , content = ""] = match
    const lowerLevel = (level || "").toLowerCase()
    logs.value.push({
      time: time,
      msg: content.trim(),
      type: lowerLevel.includes("err")
        ? "error"
        : lowerLevel.includes("warn")
          ? "warn"
          : "info",
    })
  } else {
    // 回退逻辑
    logs.value.push({
      time: new Date().toLocaleTimeString(),
      msg: line,
      type: "info",
    })
  }
}

onMounted(async () => {
  console.log("onMounted")
  // await invoke("flush_logs")
  void loadLogs(true)
})

onUnmounted(() => {})

const clearLogs = async () => {
  await writeTextFile(LOG_FILE, "", {
    baseDir: BaseDirectory.AppLog,
  })

  // 清空前端显示的数组
  logs.value = []
  hasMore.value = false
}

const loadLogs = async (isRefresh = false) => {
  if (isLoading.value) return
  isLoading.value = true

  try {
    // 如果是刷新或首次加载，初始化迭代器
    if (isRefresh) {
      currentPage.value = 0
      logs.value = []
      hasMore.value = true
    }
    const logDir = await appLogDir()
    const logPath = await join(logDir, LOG_FILE)
    const newLines = await invoke<string[]>("get_logs_page", {
      path: logPath,
      page: currentPage.value,
      pageSize: PAGE_SIZE,
    })

    newLines.forEach((line) => {
      handleLog(line)
    })

    // 如果返回的条数少于请求条数，说明到底了
    if (newLines.length < PAGE_SIZE) {
      hasMore.value = false
    }

    currentPage.value++ // 页码增加，下次滚动读更旧的
  } catch (e) {
    console.error("读取日志流失败:", e)
  } finally {
    isLoading.value = false
  }
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  // 距离底部小于 20px 时触发加载
  const bottom = target.scrollHeight - target.scrollTop - target.clientHeight
  if (bottom < 50 && !isLoading.value && hasMore.value) {
    loadLogs(false)
  }
}
</script>

<template>
  <div class="flex flex-col h-screen bg-[#0f0f0f] text-slate-400 font-sans">
    <!-- 自定义导航栏 -->
    <NavBar title="系统日志" :show-back="true">
      <template #right>
        <ButtonWrapper
          :class="{ 'opacity-50 pointer-events-none': isLoading }"
          @click="loadLogs(true)"
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
      @scroll="handleScroll"
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

      <!-- 加载中状态 -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-4 text-blue-500 bg-blue-50/5 rounded-lg my-2"
      >
        <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        <span class="text-sm font-medium">正在读取后续日志...</span>
      </div>

      <!-- 已加载全部状态 -->
      <div
        v-if="!hasMore"
        class="flex flex-col items-center justify-center py-8 text-slate-500"
      >
        <div class="flex items-center w-full px-4 mb-2">
          <div class="flex-grow h-px bg-slate-200/20"></div>
          <CheckCircle2 class="w-4 h-4 mx-3 opacity-50" />
          <div class="flex-grow h-px bg-slate-200/20"></div>
        </div>
        <span class="text-xs tracking-tighter uppercase opacity-40"
          >日志文件流读取完毕</span
        >
      </div>
    </main>
  </div>
</template>

<style></style>
