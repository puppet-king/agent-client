<template>
  <div
    class="fixed inset-0 flex flex-col items-center justify-center z-50 pointer-events-none"
  >
    <div class="flex flex-col gap-2 pointer-events-auto">
      <TransitionRoot v-for="t in toasts" :key="t.id" :show="true">
        <TransitionChild
          as="template"
          enter="transform transition duration-300"
          enter-from="translate-y-6 opacity-0"
          enter-to="translate-y-0 opacity-100"
          leave="transform transition duration-200"
          leave-from="translate-y-0 opacity-100"
          leave-to="translate-y-6 opacity-0"
        >
          <div
            class="flex items-center px-4 py-2 rounded-lg shadow-lg text-white transition-all duration-300"
            :class="bgColor(t.type)"
          >
            <span>{{ t.message }}</span>
            <ButtonWrapper class="ml-4" @click="remove(t.id)">
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
