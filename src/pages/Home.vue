<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { Plus, MoreVertical, FileText, PenTool, Inbox } from "lucide-vue-next"
import UISwitch from "@/components/UISwitch.vue"
import NavBar from "@/components/NavBar.vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import BottomSheet from "@/components/BottomSheet.vue"
import { readFile } from "@/utils/fileReader"
import { replaceRouterConfig, validateTunnelConfig } from "@/utils/validate"
import { toast } from "@/composables/useToast"
import { useConfStore } from "@/stores/userConf"
import { storeToRefs } from "pinia"
import { basename } from "@tauri-apps/api/path"
// import { appDataDir } from "@tauri-apps/api/path"
import {
  runTrojan,
  stopTrojan,
  listenTrojanLog,
  parseTrojanGoLog,
} from "@/utils/rustUtils"
import type { TunnelConfig } from "@/typings/config.ts"

defineOptions({
  name: "PuppetHome",
})

const router = useRouter()
const conf = useConfStore()
const { index, enabledName } = storeToRefs(conf)
const isMenuOpen = ref(false)
console.log("index", index.value)

onMounted(async () => {
  try {
    // const appDataDirPath = await appDataDir()
    // console.log("appDataDirPath", appDataDirPath)
    await listenTrojanLog((msg) => {
      const log = parseTrojanGoLog(msg)
      if (log) {
        // console.log(log)

        if (log.level === "FATAL") {
          const message = log.message ?? ""
          if (log.message) {
            // 如果是端口占用错误，可以再用正则提取端口
            const portConflictRegex =
              /listen (tcp|udp) 127\.0\.0\.1:(\d+): bind/i
            const conflictMatch = message.match(portConflictRegex)
            if (conflictMatch && conflictMatch[1] && conflictMatch[2]) {
              toast.error(` ${conflictMatch[2]}  端口被占用`)
              enabledName.value = ""
              console.error(
                `[trojan-go] ${conflictMatch[1].toUpperCase()} port ${conflictMatch[2]} conflict`,
              )
            } else {
              toast.error(message)
            }
          }
        }
      }
    })
  } catch (err) {
    console.error(err)
  }
})

const handleTunnelClick = (name: string) => {
  console.debug("jumPath", `/detail/${name}`)
  router.push(`/detail/${name}`)
}

const handleCreateManual = () => {
  isMenuOpen.value = false
  router.push("/create")
}

const uploadConf = async () => {
  try {
    const data = await readFile({
      multiple: false,
      json: true,
      filters: [{ name: "Config Files", extensions: ["json"] }],
      returnPath: true,
    })

    const name = await basename(data.path, ".json")
    const { valid, errors } = validateTunnelConfig(data.content)
    if (valid) {
      const content = await replaceRouterConfig(data.content as TunnelConfig)
      const result = await conf.addTunnel(name, content, true)
      if (!result.success) {
        toast.error(result.message ?? "添加失败", 3000)
        return
      }

      toast.success("添加成功")
      isMenuOpen.value = false
    } else {
      console.info("validateTunnelConfig", errors)
      toast.error(errors[0], 3000)
    }
  } catch (e) {
    console.error(e)
  }
}

const isProcessing = ref(false)

const onConnect = async (name: string) => {
  if (isProcessing.value) return

  // 这里的 enabledName 如果是 UI 状态，建议等后端返回成功后再更新
  if (enabledName.value === name && name !== "") return

  isProcessing.value = true
  console.log("开始切换状态:", name)

  try {
    if (name) {
      await runTrojan(name)
      enabledName.value = name
    } else {
      await stopTrojan()
      enabledName.value = ""
    }
  } catch (err) {
    console.error("Trojan 操作失败:", err)
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <!-- App Bar -->
  <NavBar title="我的">
    <template #right>
      <ButtonWrapper @click="router.push('/settings')">
        <MoreVertical :size="24" class="text-slate-600" />
      </ButtonWrapper>
    </template>
  </NavBar>

  <!-- Content -->
  <main class="flex-1 overflow-y-auto no-scrollbar p-4">
    <div v-if="index.length > 0" class="space-y-3">
      <div
        v-for="item in index"
        :key="item.name"
        class="group relative bg-dark-2 p-5 flex items-center justify-between rounded-2xl border border-white/5 hover:border-primary/30 hover:bg-dark-3 transition-all duration-300 cursor-pointer shadow-sm active:scale-[0.98]"
        @click="handleTunnelClick(item.name)"
      >
        <!-- 运行状态指示器 (仅选中时显示) -->
        <div
          v-if="item.name === enabledName"
          class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
        ></div>

        <div class="flex flex-col gap-1 pl-2">
          <span
            class="text-base font-semibold tracking-tight text-slate-100 group-hover:text-primary transition-colors"
          >
            {{ item.name }}
          </span>
          <!-- 辅助信息：显示配置预览，增加专业感 -->
          <span
            class="text-[10px] text-slate-500 font-mono uppercase tracking-wider"
          >
            Trojan-Go • Client Mode
          </span>
        </div>

        <div class="flex items-center gap-4" @click.stop>
          <!-- 状态小字提示 -->
          <span
            v-if="item.name === enabledName"
            class="text-[10px] text-primary font-bold animate-pulse"
            >RUNNING</span
          >

          <UISwitch
            :checked="item.name === enabledName"
            size="medium"
            @update:checked="
              onConnect(item.name === enabledName ? '' : item.name)
            "
          />
        </div>
      </div>
    </div>

    <!-- 空状态优化 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <!-- 图标装饰：使用大圆角矩形容器 -->
      <div
        class="w-20 h-20 bg-dark-2 rounded-[24px] flex items-center justify-center mb-6 border border-white/5 shadow-inner"
      >
        <Inbox :size="40" class="text-slate-600" />
      </div>

      <!-- 文案部分 -->
      <div class="space-y-2 mb-8">
        <h3 class="text-slate-200 font-bold text-lg tracking-tight">
          暂无配置文件
        </h3>
        <p class="text-slate-500 text-sm max-w-[200px] mx-auto leading-relaxed">
          还没有任何节点信息，快去创建一个属于你的配置吧。
        </p>
      </div>

      <!-- 动作按钮：跳转到创建页 -->
      <button
        class="group flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-primary/20"
        @click="router.push('/create')"
      >
        <Plus
          :size="20"
          class="group-hover:rotate-90 transition-transform duration-300"
        />
        <span class="font-bold text-sm tracking-wide">立即创建配置</span>
      </button>
    </div>
  </main>

  <!-- FAB -->
  <div class="absolute bottom-6 right-6 z-20">
    <button
      class="bg-primary p-4 rounded-xl shadow-lg transition-all active:scale-95"
      @click="isMenuOpen = true"
    >
      <Plus :size="28" />
    </button>
  </div>

  <!-- Bottom Sheet Backdrop -->
  <BottomSheet v-model="isMenuOpen">
    <button
      class="bg-dark-2 w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-800"
      @click="uploadConf"
    >
      <FileText :size="24" class="text-slate-500" />
      <span class="text-lg font-medium">导入配置</span>
    </button>

    <button
      class="bg-dark-2 w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-800"
      @click="handleCreateManual"
    >
      <PenTool :size="24" class="text-slate-500" />
      <span class="text-lg font-medium">手动创建</span>
    </button>
  </BottomSheet>
</template>
