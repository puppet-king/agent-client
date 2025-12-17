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

withDefaults(defineProps<Props>(), {
  title: "",
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
    class="pt-2 px-4 shadow-sm flex items-center justify-between sticky z-10"
  >
    <div class="flex items-center gap-2">
      <button
        v-if="showBack"
        class="rounded-full p-2 hover:bg-dark-3 transition-colors cursor-pointer"
        @click="handleBack"
      >
        <ArrowLeft :size="24" class="text-white" />
      </button>

      <h1 class="text-xl font-medium">
        {{ title }}
      </h1>
    </div>

    <div>
      <slot name="right" />
    </div>
  </header>
</template>
