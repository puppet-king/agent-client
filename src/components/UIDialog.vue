<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue"
import { X } from "lucide-vue-next"

interface Props {
  show: boolean
  title?: string
}

defineProps<Props>()
const emit = defineEmits(["close"])

const close = () => emit("close")
</script>

<template>
  <TransitionRoot appear :show="show" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
      <!-- 1. 背景遮罩：将 as="template" 改为 as="div" -->
      <TransitionChild
        as="div"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      />

      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center"
        >
          <!-- 2. 面板过渡：同样将 as="template" 改为 as="div" -->
          <TransitionChild
            as="div"
            class="w-full max-w-md transform transition-all"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <!-- 此时 DialogPanel 就不再是 TransitionChild 的直接子代，而是嵌套在里面 -->
            <DialogPanel
              class="overflow-hidden rounded-2xl bg-dark-2 border border-dark-3 p-6 text-left align-middle shadow-2xl"
            >
              <!-- 头部 -->
              <div class="flex items-center justify-between mb-4">
                <DialogTitle as="h3" class="text-lg font-bold text-white">
                  {{ title }}
                </DialogTitle>
                <button
                  type="button"
                  class="rounded-full p-1 text-slate-500 hover:bg-dark-3 hover:text-white transition-colors"
                  @click="close"
                >
                  <X :size="20" />
                </button>
              </div>

              <!-- 内容插槽 -->
              <div class="mt-2 text-slate-300">
                <slot />
              </div>

              <!-- 底部操作插槽 -->
              <div v-if="$slots.footer" class="mt-6 flex justify-end gap-3">
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
