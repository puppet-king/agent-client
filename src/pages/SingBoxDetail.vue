<script setup lang="ts">
import { useRouter, useRoute } from "vue-router"
import { Trash2, Pencil, FileCode } from "lucide-vue-next"
import { useConfStore } from "@/stores/userConf"
import { onMounted, ref, computed } from "vue"
import NavBar from "@/components/NavBar.vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import UIDialog from "@/components/UIDialog.vue"
import { toast } from "@/composables/useToast"
import type { SingBoxConfig } from "@/typings/singBoxConfig.ts"
import ConfigRawView from "@/components/ConfigRawView.vue"
import ConfigInfoCard from "@/components/ConfigInfoCard.vue"
import ConfigInfoCardByRemote from "@/components/ConfigInfoCardByRemote.vue" // 如果使用组件

defineOptions({
  name: "SingBoxDetail",
})

const router = useRouter()
const route = useRoute()
const conf = useConfStore()
const isDialogOpen = ref(false)

const indexConf = computed(() => {
  return conf.index.find((item) => item.name === name.value)
})

const name = ref("")
const tunnel = ref<SingBoxConfig | null>(null)
const isRawMode = ref(false) // 控制是否显示原始 JSON

onMounted(async () => {
  console.debug("onMounted")
  console.debug("route.params", route.params)
  name.value = String(route.params.name || "")

  if (name.value) {
    tunnel.value = await conf.loadTunnel(name.value)
    // indexConf.value = conf.getIndexInfoByName(name.value)
    console.log("tunnel", tunnel.value)
  }
})

const confirmDelete = async () => {
  const data = await conf.deleteTunnel(name.value)
  if (!data.success) {
    toast.error(data.message ?? "删除失败", 3000)
    return
  }

  isDialogOpen.value = false
  void router.push("/")
}

const handleDelete = () => {
  isDialogOpen.value = true
}

const toggleRawMode = () => {
  isRawMode.value = !isRawMode.value
}
</script>

<template>
  <!-- 加载中状态 -->
  <div
    v-if="!tunnel"
    class="flex flex-col items-center justify-center h-[80vh] animate-pulse"
  >
    <p class="text-slate-500 mb-4 text-lg">数据丢失...</p>
    <button
      class="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-all"
      @click="router.push('/')"
    >
      返回首页
    </button>
  </div>

  <template v-else>
    <!-- 顶部导航栏 -->
    <NavBar title="配置详情" :show-back="true">
      <template #right>
        <div class="flex gap-1">
          <ButtonWrapper
            class="hover:bg-dark-3 rounded-full p-2"
            :class="{ 'bg-primary/20': isRawMode }"
            @click="toggleRawMode"
          >
            <FileCode
              :size="20"
              :class="isRawMode ? 'text-primary' : 'text-slate-400'"
            />
          </ButtonWrapper>

          <template v-if="indexConf?.type === 'local'">
            <ButtonWrapper
              class="hover:bg-dark-3 rounded-full p-2"
              @click="router.push(`/edit/${name}`)"
            >
              <Pencil
                :size="20"
                class="text-slate-400 hover:text-primary transition-colors"
              />
            </ButtonWrapper>
          </template>
          <ButtonWrapper
            class="hover:bg-red-500/10 rounded-full p-2"
            @click="handleDelete"
          >
            <Trash2
              :size="20"
              class="text-slate-400 hover:text-red-500 transition-colors"
            />
          </ButtonWrapper>
        </div>
      </template>
    </NavBar>

    <main class="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-12">
      <!-- 原始 JSON 视图 -->
      <template v-if="isRawMode">
        <ConfigRawView :data="tunnel" />
      </template>

      <!-- 原始 JSON 视图 -->
      <template v-else-if="indexConf?.type === 'local'">
        <ConfigInfoCard :name="name" :tunnel="tunnel"></ConfigInfoCard>
      </template>
      <template v-else-if="indexConf?.type === 'remote'">
        <ConfigInfoCardByRemote
          :name="name"
          :url="indexConf.url"
          :last-timestamp="indexConf.lastTimestamp"
        ></ConfigInfoCardByRemote>
      </template>
    </main>
  </template>

  <UIDialog :show="isDialogOpen" title="确认操作" @close="isDialogOpen = false">
    <p class="text-sm text-slate-400">
      你确定要删除这个配置文件吗？此操作无法撤销。
    </p>

    <template #footer>
      <button
        class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white cursor-pointer"
        @click="isDialogOpen = false"
      >
        取消
      </button>
      <button
        class="inline-flex items-center justify-center px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer leading-none"
        @click="confirmDelete"
      >
        确定删除
      </button>
    </template>
  </UIDialog>
</template>
