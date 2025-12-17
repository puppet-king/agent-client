<script setup lang="ts">
import { TransitionRoot, TransitionChild } from "@headlessui/vue"

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(["update:modelValue"])

const close = () => emit("update:modelValue", false)
</script>

<template>
  <TransitionRoot :show="modelValue">
    <!-- Backdrop -->
    <TransitionChild
      as="template"
      enter="transition-opacity duration-200"
      enter-from="opacity-0"
      enter-to="opacity-100"
      leave="transition-opacity duration-200"
      leave-from="opacity-100"
      leave-to="opacity-0"
    >
      <div
        class="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm"
        @click="close"
      />
    </TransitionChild>

    <!-- Bottom Sheet -->
    <TransitionChild
      as="template"
      enter="transform transition duration-300"
      enter-from="translate-y-full"
      enter-to="translate-y-0"
      leave="transform transition duration-300"
      leave-from="translate-y-0"
      leave-to="translate-y-full"
    >
      <div
        class="absolute inset-x-0 bottom-0 z-40 bg-dark-2 rounded-t-xl py-4 shadow-2xl"
      >
        <!-- 内容插槽 -->
        <slot />
      </div>
    </TransitionChild>
  </TransitionRoot>
</template>
