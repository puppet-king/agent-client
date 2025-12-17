<script setup lang="ts">
import { useRouter, useRoute } from "vue-router"
import { X, Pencil } from "lucide-vue-next"
import { useConfStore } from "@/stores/userConf"
import { onMounted, ref, computed } from "vue"
import type { TunnelConfig } from "@/typings/config.ts"
// import UISwitch from "@/components/UISwitch.vue"
// import { storeToRefs } from "pinia"
import NavBar from "@/components/NavBar.vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import UIDisclosure from "@/components/Disclosure.vue"

defineOptions({
  name: "ConfigDetail",
})

const router = useRouter()
const route = useRoute()
const conf = useConfStore()
// const { enabledName } = storeToRefs(conf)

const name = computed(() => String(route.query.id || ""))
const tunnel = ref<TunnelConfig | null>(null)

onMounted(async () => {
  console.log("onMounted")
  console.log("key", name)

  if (name.value) {
    tunnel.value = await conf.loadTunnel(name.value)

    console.log("tunnel", tunnel.value)
  }
})

const localAddr = computed(() => {
  if (tunnel.value?.local_port === 0) {
    return tunnel.value?.local_addr
  }

  return tunnel.value?.local_addr + ":" + tunnel.value?.local_port
})

const remoteAddr = computed(() => {
  return tunnel.value?.remote_addr + ":" + tunnel.value?.remote_port
})

const formatArray = (arr: string[]) => {
  if (arr && arr.length > 0) {
    return arr.join("、")
  }

  return "-"
}

const handleDelete = () => {
  if (confirm("Are you sure you want to delete this tunnel?")) {
    conf.deleteTunnel(name.value)
    router.push("/")
  }
}

// const onConnect = async () => {
//   if (enabledName.value === name.value) {
//     return
//   }
//
//   console.log("onConnect")
//   enabledName.value = name.value
// }
</script>

<template>
  <div
    v-if="!tunnel"
    class="flex flex-col items-center justify-center h-screen"
  >
    <p class="text-slate-500 mb-4">Tunnel not found</p>
    <button class="text-primary" @click="router.push('/')">Go Home</button>
  </div>

  <template v-else>
    <NavBar title="配置详情" :show-back="true">
      <template #right>
        <ButtonWrapper @click="router.push(`/edit/${name}`)">
          <Pencil :size="24" class="text-slate-700" />
        </ButtonWrapper>

        <ButtonWrapper @click="handleDelete">
          <X :size="24" class="text-slate-700" />
        </ButtonWrapper>
      </template>
    </NavBar>

    <main class="flex-1 flex flex-col gap-4 p-3 overflow-y-auto pb-10">
      <div
        class="bg-dark-2 rounded-lg p-4 border border-dark-3 shadow-sm relative"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-base font-medium mb-2">基础配置</h2>
            <div class="text-sm">名称</div>
            <div class="text-base">{{ "aaaa" }}</div>
          </div>
          <!--          <UISwitch-->
          <!--            :checked="key === enabledKey"-->
          <!--            size="small"-->
          <!--            @update:checked="onConnect(key)"-->
          <!--          />-->
        </div>

        <div class="space-y-3">
          <div>
            <div class="text-sm text-slate-300">本地地址</div>
            <div class="mt-0.5 text-base break-all font-mono leading-tight">
              {{ localAddr }}
            </div>
          </div>
          <div>
            <div class="text-sm text-slate-300">远程地址</div>
            <div class="mt-0.5 text-base break-all font-mono leading-tight">
              {{ remoteAddr }}
            </div>
          </div>
          <div>
            <div class="text-sm text-slate-300">密码</div>
            <div class="mt-0.5 text-base break-all font-mono leading-tight">
              {{ formatArray(tunnel.password ?? []) }}
            </div>
          </div>
        </div>
      </div>

      <!--   SSL 模块   -->
      <UIDisclosure>
        <template #title>
          <div class="text-base font-medium tracking-wider">SSL 设置</div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div>
              <div class="text-sm text-slate-300">状态</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.ssl?.enabled ? "启用" : "关闭" }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">sni</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.ssl?.sni ?? "-" }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">verify</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.ssl?.verify ?? "-" }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">verify_hostname</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.ssl?.verify_hostname ?? "-" }}
              </div>
            </div>
          </div>
        </template>
      </UIDisclosure>

      <!--   mux 模块   -->
      <UIDisclosure>
        <template #title>
          <div class="text-base font-medium tracking-wider">mux 设置</div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div>
              <div class="text-sm text-slate-300">状态</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.mux?.enabled ? "启用" : "关闭" }}
              </div>
            </div>
          </div>
        </template>
      </UIDisclosure>

      <!--  router 模块   -->
      <UIDisclosure>
        <template #title>
          <div class="text-base font-medium tracking-wider">router 设置</div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div>
              <div class="text-sm text-slate-300">状态</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.router?.enabled ? "启用" : "关闭" }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">bypass</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ formatArray(tunnel.router?.bypass ?? []) }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">block</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ formatArray(tunnel.router?.block ?? []) }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">proxy</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ formatArray(tunnel.router?.proxy ?? []) }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">default_policy</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.router?.default_policy ?? "-" }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">geoip</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.router?.geoip ?? "-" }}
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-300">geosite</div>
              <div class="mt-0.5 text-base break-all font-mono leading-tight">
                {{ tunnel.router?.geosite ?? "-" }}
              </div>
            </div>
          </div>
        </template>
      </UIDisclosure>
    </main>
  </template>
</template>
