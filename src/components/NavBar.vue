<script setup lang="ts">
import { useRouter } from "vue-router"
import { ArrowLeft } from "lucide-vue-next"
import { haptic } from "@/utils/haptics.ts"
import { isDesktop } from "@/utils/rustUtils.ts"

interface Props {
  title?: string
  showBack?: boolean
}

interface Emits {
  (e: "back"): void
}

const props = withDefaults(defineProps<Props>(), {
  // 使用 props 变量名，便于TS推导
  title: "Puppet Trojan", // 添加一个默认的通用标题
  showBack: false,
})

const emit = defineEmits<Emits>()
const router = useRouter()

const handleBack = () => {
  void haptic.impact("light")
  emit("back")
  router.back()
}
</script>

<template>
  <header
    class="px-4 pb-2 shadow-md flex items-center justify-between sticky top-0 z-40 bg-dark-1/90 backdrop-blur-md"
    :class="isDesktop() ? 'pt-2' : 'pt-6'"
    data-tauri-drag-region
  >
    <div
      v-if="props.showBack"
      class="flex items-center z-10 min-w-[40px]"
      data-tauri-drag-region
    >
      <button
        class="rounded-full p-2 text-slate-400 hover:text-white hover:bg-dark-3 transition-colors cursor-pointer active:scale-95"
        data-tauri-drag-region="false"
        @click="handleBack"
      >
        <ArrowLeft :size="20" />
      </button>
    </div>

    <h1
      class="font-semibold text-white tracking-wide transition-all truncate"
      :class="[
        isDesktop()
          ? 'static flex-1 ml-3 text-base'
          : 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%-10px)] text-lg w-full max-w-[60%] text-center pointer-events-none',
      ]"
      data-tauri-drag-region
    >
      {{ props.title }}
    </h1>

    <!-- 右侧容器：固定在右边 -->
    <div
      class="flex items-center gap-2 z-10 min-w-[40px] justify-end"
      data-tauri-drag-region="false"
    >
      <slot name="right" />
    </div>
  </header>
</template>
