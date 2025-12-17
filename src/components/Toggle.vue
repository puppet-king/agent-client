<script setup lang="ts">
defineProps<{
  checked: boolean
}>()

const emit = defineEmits<{
  (e: "update:checked", value: boolean): void
}>()

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit("update:checked", target.checked)
}
</script>

<template>
  <label class="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      class="sr-only peer"
      :checked="checked"
      @change="handleChange"
    />
    <div
      class="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors duration-200 ease-in-out bg-gray-300 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"
    ></div>
  </label>
</template>
