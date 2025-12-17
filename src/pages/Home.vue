<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { Plus, MoreVertical, FileText, PenTool } from "lucide-vue-next"
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
    await conf.initConfig()
    await listenTrojanLog((msg) => {
      const log = parseTrojanGoLog(msg)
      if (log) {
        if (log.level === "FATAL") {
          const message = log.message ?? ""
          if (log.message) {
            // 如果是端口占用错误，可以再用正则提取端口
            const portConflictRegex =
              /listen (tcp|udp) 127\.0\.0\.1:(\d+): bind/i
            const conflictMatch = message.match(portConflictRegex)
            if (conflictMatch && conflictMatch[1] && conflictMatch[2]) {
              toast.error(` ${conflictMatch[2]}  端口被占用`)
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

const handleTunnelClick = (key: string) => {
  router.push(`/detail/${key}`)
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
      await conf.addTunnel(name, content, true)
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

const onConnect = async (name: string) => {
  if (enabledName.value === name) {
    return
  }

  console.log("onConnect")
  enabledName.value = name
  if (name) {
    // 代表开启
    try {
      await runTrojan(name)
    } catch (err) {
      console.error(err)
    }
  } else {
    try {
      await stopTrojan()
    } catch (err) {
      console.error(err)
    }
  }
}
</script>

<template>
  <!-- App Bar -->
  <NavBar title="Puppet Tunnel">
    <template #right>
      <ButtonWrapper @click="router.push('/settings')">
        <MoreVertical :size="24" class="text-slate-600" />
      </ButtonWrapper>
    </template>
  </NavBar>

  <!-- Content -->
  <main class="flex-1 overflow-y-auto flex flex-col pt-2">
    <div v-if="index.length > 0" class="py-2">
      <div
        v-for="item in index"
        :key="item.name"
        class="bg-dark-2 px-4 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
        @click="handleTunnelClick(item.name)"
      >
        <span class="text-xl font-normal">{{ item.name }}</span>
        <div @click.stop>
          <UISwitch
            :checked="item.name === enabledName"
            @update:checked="
              onConnect(item.name === enabledName ? '' : item.name)
            "
          />
        </div>
      </div>

      <div
        v-if="index.length === 0"
        class="flex flex-col items-center justify-center h-64"
      >
        <p>没有数据 ~</p>
      </div>
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
      <span class="text-lg font-medium">导入配置或压缩包</span>
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
