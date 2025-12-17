<script setup lang="ts">
import ToastContainer from "@/components/ToastContainer.vue"
import DebugButton from "@/components/DebugButton.vue"
import { config } from "@/config/config"
</script>

<template>
  <div class="container">
    <router-view></router-view>
    <ToastContainer />

    <!-- 调试开关 -->
    <DebugButton v-if="config.DEBUG"></DebugButton>
  </div>
</template>
