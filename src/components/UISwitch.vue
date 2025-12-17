<script setup lang="ts">
import { Switch } from "@headlessui/vue"

interface Props {
  checked: boolean
  srText?: string
  disabled?: boolean
  size?: "small" | "medium" | "large"
}

const props = withDefaults(defineProps<Props>(), {
  srText: "开关",
  size: "medium",
})

const emit = defineEmits<{
  (e: "update:checked", value: boolean): void
}>()

const handleChange = (value: boolean) => {
  console.log("handleChange", value)
  emit("update:checked", value)
}

const getSizeClasses = () => {
  switch (props.size) {
    case "small":
      return {
        container: "h-[24px] w-[44px]",
        thumb: "h-[20px] w-[20px]",
        translate: props.checked ? "translate-x-5" : "translate-x-0",
      }
    case "large":
      return {
        container: "h-[48px] w-[88px]",
        thumb: "h-[44px] w-[44px]",
        translate: props.checked ? "translate-x-11" : "translate-x-0",
      }
    case "medium":
    default:
      return {
        container: "h-[38px] w-[74px]",
        thumb: "h-[34px] w-[34px]",
        translate: props.checked ? "translate-x-9" : "translate-x-0",
      }
  }
}
</script>

<template>
  <Switch
    :model-value="checked"
    :disabled="disabled"
    :class="[
      checked ? 'bg-primary' : 'bg-[#1B1D21]',
      getSizeClasses().container,
    ]"
    class="relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
    @update:model-value="handleChange"
  >
    <span class="sr-only">{{ srText }}</span>
    <span
      aria-hidden="true"
      class="pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
      :class="[getSizeClasses().thumb, getSizeClasses().translate]"
    />
  </Switch>
</template>
