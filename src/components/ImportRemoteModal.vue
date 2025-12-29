<script setup lang="ts">
import { ref, reactive } from "vue"
import { CloudDownload, Loader2, X } from "lucide-vue-next"
import BottomSheet from "./BottomSheet.vue" // 确保引入你的基础 BottomSheet
import { fetch } from "@tauri-apps/plugin-http"
import JSON5 from "json5"
import { toast } from "@/composables/useToast.ts"
import {
  replaceRouterConfig,
  validateSingBoxConfig,
  validateTunnelConfig,
} from "@/utils/validate.ts"
import type { TunnelConfig } from "@/typings/config.ts"
import { useConfStore } from "@/stores/userConf.ts"
import type { SingBoxConfig } from "@/typings/singBoxConfig.ts"

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(["update:modelValue", "success"])
const conf = useConfStore()
const isDownloading = ref(false)
const urlError = ref("")

const form = reactive({
  name: "cc",
  url: "https://jp.juqingsong.cn/conf.json",
})

// URL 校验逻辑
const validateUrl = () => {
  if (!form.url) {
    urlError.value = ""
    return
  }
  try {
    const url = new URL(form.url)
    if (!["https:"].includes(url.protocol)) {
      urlError.value = "仅支持 HTTPS 协议"
    } else {
      urlError.value = ""
    }
  } catch {
    urlError.value = "请输入合法的 URL 地址"
  }
}

// 提交逻辑
const handleSubmit = async () => {
  if (!form.name || !form.url || urlError.value) return

  isDownloading.value = true
  try {
    const response = await fetch(form.url, {
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
      const result = await conf.addTunnel(form.name, content, true)
      if (!result.success) {
        toast.error(result.message ?? "添加失败", 3000)
        return
      }
    } else {
      console.error("validateTunnelConfig", errors)
      toast.error(errors[0], 3000)
    }

    // 成功后重置并关闭
    form.name = ""
    form.url = ""
    emit("success")
    emit("update:modelValue", false)
  } catch (err) {
    alert(`导入失败: ${err}`)
  } finally {
    isDownloading.value = false
  }
}

const close = () => {
  console.log("close")
  emit("update:modelValue", false)
}
</script>

<template>
  <BottomSheet :model-value="modelValue" @update:model-value="close">
    <div class="px-6 pt-2 pb-6 space-y-6 text-slate-200 rounded-t-3xl">
      <!-- 头部 -->
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <div class="p-2 bg-indigo-500/20 rounded-lg">
            <CloudDownload :size="20" class="text-indigo-400" />
          </div>
          <h3 class="text-lg font-bold tracking-tight">导入远程配置</h3>
        </div>
        <button
          class="p-1 hover:bg-white/5 rounded-full transition-colors"
          @click="close"
        >
          <X :size="20" class="text-slate-500" />
        </button>
      </div>

      <!-- 表单区域 -->
      <div class="space-y-5">
        <!-- 配置名称 -->
        <div class="group">
          <label
            class="block text-[10px] text-slate-500 uppercase font-black mb-1.5 ml-1 tracking-widest"
            >名称</label
          >
          <input
            v-model="form.name"
            type="text"
            placeholder="例如: client"
            class="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 focus:border-indigo-500/50 focus:bg-black/60 outline-none transition-all placeholder:text-slate-700"
          />
        </div>

        <!-- 订阅链接 -->
        <div class="group">
          <label
            class="block text-[10px] text-slate-500 uppercase font-black mb-1.5 ml-1 tracking-widest"
            >资源地址</label
          >
          <input
            v-model="form.url"
            type="text"
            placeholder="https://example.com/config.json"
            class="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 focus:border-indigo-500/50 focus:bg-black/60 outline-none transition-all font-mono text-sm placeholder:text-slate-700"
            @input="validateUrl"
          />
          <Transition name="fade">
            <p
              v-if="urlError"
              class="text-red-400 text-[10px] mt-2 ml-1 flex items-center gap-1"
            >
              <span class="w-1 h-1 bg-red-400 rounded-full"></span>
              {{ urlError }}
            </p>
          </Transition>
        </div>
      </div>

      <!-- 确认按钮 -->
      <button
        :disabled="isDownloading || !form.url || !form.name || !!urlError"
        class="w-full h-14 bg-primary hover:bg-primary-400 disabled:bg-slate-800 disabled:text-slate-600 text-primary-100/90 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        @click="handleSubmit"
      >
        <Loader2 v-if="isDownloading" class="animate-spin" :size="20" />
        <span class="tracking-wide">{{
          isDownloading ? "正在连接并解析..." : "确认导入配置"
        }}</span>
      </button>
    </div>
  </BottomSheet>
</template>
