<script setup lang="ts">
import { useRouter } from "vue-router"
import { ArrowLeft } from "lucide-vue-next"

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
  emit("back")
  router.back()
}
</script>

<template>
  <header
    class="pt-2 px-4 pb-2 shadow-md flex items-center justify-between sticky top-0 z-40 bg-dark-1/90 backdrop-blur-md"
    data-tauri-drag-region
  >
    <div class="flex items-center gap-3" data-tauri-drag-region>
      <button
        v-if="props.showBack"
        class="rounded-full p-2 text-slate-400 hover:text-white hover:bg-dark-3 transition-colors cursor-pointer active:scale-95"
        data-tauri-drag-region="false"
        @click="handleBack"
      >
        <ArrowLeft :size="20" />
      </button>

      <h1
        class="text-base font-semibold text-white tracking-wide"
        data-tauri-drag-region
      >
        {{ props.title }}
      </h1>
    </div>

    <!-- 右侧插槽，确保插槽内容不会被拖动窗口影响 -->
    <div class="flex items-center gap-2" data-tauri-drag-region="false">
      <slot name="right" />
    </div>
  </header>
</template>
