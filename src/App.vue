<script setup lang="ts">
import ToastContainer from "@/components/ToastContainer.vue"
import DebugButton from "@/components/DebugButton.vue"
import { config } from "@/config/config"
import { checkForUpdates } from "@/utils/updater.ts"
import { onMounted } from "vue"
import { useSystemStore } from "@/stores/system.ts"

const systemStore = useSystemStore()
onMounted(async () => {
  console.log("APP onMounted")

  if (systemStore.autoUpdate) {
    await checkForUpdates()
  }
})
</script>

<template>
  <div class="container">
    <router-view></router-view>
    <ToastContainer />

    <!-- 调试开关 -->
    <DebugButton v-if="config.DEBUG"></DebugButton>
  </div>
</template>

<style>
.container {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
}
</style>
