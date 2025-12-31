<script setup lang="ts">
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"
import { type SingBoxConfig } from "@/typings/singBoxConfig"

const {
  data,
  editable = false, // 直接在这里设置默认值
} = defineProps<{
  data: SingBoxConfig
  editable?: boolean // 注意：有默认值的属性通常设为可选（加 ?）
}>()
</script>

<template>
  <VueJsonPretty
    :data="data"
    :show-line-number="false"
    :deep="3"
    :show-icon="false"
    :editable="editable"
    :show-length="true"
    :show-double-quotes="true"
    :show-key-value-space="true"
    class=""
  />
</template>

<style scoped>
:deep(.vjs-tree-node:hover) {
  background-color: color-mix(
    in srgb,
    var(--color-primary),
    transparent 85%
  ) !important;
  border-radius: 4px; /* 让高亮块带一点圆角更美观 */
  transition: background-color 0.2s ease;
}

:deep(.vjs-key) {
  color: var(--color-primary-300) !important;
}

:deep(.vjs-column-line_number) {
  color: #4b5563 !important; /* slate-600 */
}
</style>
