<script setup lang="ts">
interface Props {
  label?: string
  modelValue?: string
  placeholder?: string
  readOnly?: boolean
}

interface Emits {
  (e: "update:modelValue", value: string): void
  (e: "action"): void
}

withDefaults(defineProps<Props>(), {
  label: "",
  modelValue: "",
  placeholder: "",
  readOnly: false,
})

const emit = defineEmits<Emits>()

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit("update:modelValue", target.value)
}

const handleAction = () => {
  emit("action")
}
</script>

<template>
  <div
    class="border border-slate-300 rounded-md px-3 py-2 bg-dark-2 focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500 relative transition-all"
  >
    <div class="flex justify-between items-start">
      <label class="text-xs block mb-0.5">{{ label }}</label>
      <button
        v-if="$slots.actionIcon"
        class="text-slate-500 hover:text-dark-3 p-1 -mt-1 -mr-1"
        @click="handleAction"
      >
        <slot name="actionIcon" />
      </button>
    </div>
    <input
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readOnly"
      class="caret-white w-full outline-none text-base placeholder-dark-3 bg-transparent"
      @input="handleInput"
    />
  </div>
</template>
