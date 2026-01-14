<script setup lang="ts">
import {
  Loader2,
  ShieldCheck,
  ExternalLink,
  CalendarDays,
  RefreshCw,
} from "lucide-vue-next"
import { type SingBoxConfig } from "@/typings/singBoxConfig"
import { ref } from "vue"
import { useConfStore } from "@/stores/userConf"
import { fetch } from "@tauri-apps/plugin-http"
import { toast } from "@/composables/useToast"
import JSON5 from "json5"
import { replaceRouterConfig, validateSingBoxConfig } from "@/utils/validate"

const props = defineProps<{
  name: string
  url: string
  lastTimestamp: number
}>()

const conf = useConfStore()
const isDownloading = ref(false)

const handleRefresh = async () => {
  if (!props.name || !props.url) return
  isDownloading.value = true
  try {
    const response = await fetch(props.url, {
      method: "GET",
    })

    if (!response.ok) {
      if (response.status === 404) {
        toast.error("地址无法访问")
      } else {
        toast.error("网络错误，请检查网络连接")
      }

      return
    }

    // 重点：使用 .text() 获取字符串内容
    const readContent = await response.text()
    console.log("获取到的原始内容:", readContent)
    const configData = JSON5.parse(readContent)

    const { valid, errors } = validateSingBoxConfig(configData)
    if (valid) {
      const content = await replaceRouterConfig(configData as SingBoxConfig)
      const result = await conf.updateTunnel(
        props.name,
        content,
        "remote",
        props.url,
      )
      if (!result.success) {
        toast.error(result.message ?? "添加失败", 3000)
        return
      } else {
        toast.success("更新成功")
      }
    } else {
      console.error("validateTunnelConfig", errors)
      toast.error(errors[0], 3000)
    }
  } catch (err) {
    toast.error(`导入失败: ${err}`, 3000)
  } finally {
    isDownloading.value = false
  }
}

const formatFullTime = (ts?: number) => {
  if (!ts) return "从未更新"
  return new Date(ts * 1000).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
</script>

<template>
  <div class="px-6 pt-2 pb-6 space-y-7 text-slate-200">
    <div class="space-y-5">
      <!-- 1. 配置名称 -->
      <div class="space-y-2">
        <label
          class="block text-xs text-slate-500 uppercase font-black ml-1 tracking-[0.2em]"
          >名称</label
        >
        <div
          class="bg-dark-3/50 px-4 py-3.5 rounded-xl border border-white/5 flex items-center gap-3 cursor-default"
        >
          <ShieldCheck :size="16" class="text-primary-300" />
          <span class="text-indigo-400">{{ name }}</span>
        </div>
      </div>

      <!-- 2. 资源地址 -->
      <div class="space-y-2">
        <label
          class="block text-xs text-slate-500 uppercase font-black ml-1 tracking-[0.2em]"
          >资源地址</label
        >
        <div
          class="bg-dark-3/50 px-4 py-3.5 rounded-xl border border-white/5 group transition-colors cursor-default"
        >
          <div class="flex items-start gap-3">
            <ExternalLink :size="16" class="text-slate-500" />
            <span
              class="text-indigo-400 font-mono text-xs break-all leading-relaxed"
            >
              {{ url }}
            </span>
          </div>
        </div>
      </div>

      <!-- 3. 最后更新 (横向信息条) -->
      <div
        class="flex items-center justify-between px-1 pt-4 border-t border-white/5 cursor-default"
      >
        <div class="flex items-center gap-2">
          <CalendarDays :size="14" class="text-slate-500" />
          <span class="text-xs text-slate-500 font-black tracking-widest"
            >最后同步时间</span
          >
        </div>
        <span class="text-xs font-mono text-slate-400">
          {{ formatFullTime(lastTimestamp) }}
        </span>
      </div>
    </div>

    <!-- 确认按钮 -->
    <div class="pt-2">
      <button
        :disabled="isDownloading || !url || !name"
        class="group w-full h-14 bg-primary hover:bg-primary-400 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-primary/10"
        @click="handleRefresh"
      >
        <Loader2 v-if="isDownloading" class="animate-spin" :size="20" />
        <RefreshCw
          v-else
          :size="18"
          class="group-hover:rotate-180 transition-transform duration-700 ease-in-out"
        />
        <span class="tracking-[0.15em] text-sm uppercase">
          {{ isDownloading ? "加载中" : "刷新最新配置" }}
        </span>
      </button>
    </div>
  </div>
</template>
