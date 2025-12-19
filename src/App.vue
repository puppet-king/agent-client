<script setup lang="ts">
import ToastContainer from "@/components/ToastContainer.vue"
import DebugButton from "@/components/DebugButton.vue"
import { config } from "@/config/config"

const statusBarHeight = parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue(
    "--safe-area-inset-top",
  ) || "0",
)
</script>

<template>
  <div class="container" :style="{ paddingTop: statusBarHeight }">
    <router-view></router-view>
    <ToastContainer />

    <!-- 调试开关 -->
    <DebugButton v-if="config.DEBUG"></DebugButton>
  </div>
</template>

<style>
.container {
  /* 自动适配安卓/iOS 状态栏高度 */
  padding-top: env(safe-area-inset-top, 0px);
  /* 如果有底部导航栏避让需求 */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
