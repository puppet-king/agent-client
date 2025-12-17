<template>
  <!-- 1. 修改容器定位：从 inset-0 改为 top-0 inset-x-0，并调整内边距 -->
  <div
    class="fixed top-0 inset-x-0 flex flex-col items-center z-[9999] pointer-events-none px-4 pt-6"
  >
    <!-- 2. 这里的 gap-2 保持，列表会自动向下堆叠 -->
    <div class="flex flex-col gap-2 pointer-events-auto">
      <TransitionRoot v-for="t in toasts" :key="t.id" :show="true" appear>
        <TransitionChild
          as="template"
          enter="transform transition duration-300 ease-out"
          enter-from="-translate-y-6 opacity-0"
          enter-to="translate-y-0 opacity-100"
          leave="transform transition duration-200 ease-in"
          leave-from="translate-y-0 opacity-100"
          leave-to="-translate-y-6 opacity-0"
        >
          <div
            class="flex items-center px-4 py-2.5 rounded-xl shadow-2xl text-white transition-all duration-300 border border-white/10 backdrop-blur-md"
            :class="bgColor(t.type)"
          >
            <!-- 增加图标支持（可选，建议） -->
            <span class="text-sm font-medium tracking-wide">{{
              t.message
            }}</span>
            <ButtonWrapper
              class="ml-4 hover:bg-white/20 rounded-full p-1"
              @click="remove(t.id)"
            >
              <X class="w-4 h-4 text-white" />
            </ButtonWrapper>
          </div>
        </TransitionChild>
      </TransitionRoot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "@/composables/useToast"
import { X } from "lucide-vue-next"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import { TransitionChild, TransitionRoot } from "@headlessui/vue"

const { toasts, remove } = useToast()

const bgColor = (type: string) => {
  switch (type) {
    case "success":
      return "bg-green-500"
    case "error":
      return "bg-red-500"
    case "info":
    default:
      return "bg-gray-800"
  }
}
</script>
