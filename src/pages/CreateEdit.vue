<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Save, RefreshCw } from "lucide-vue-next"
import InputGroup from "@/components/InputGroup.vue"
import NavBar from "@/components/NavBar.vue"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
const router = useRouter()
const route = useRoute()
// const { addTunnel, updateTunnel, getTunnel } = useTunnels()

const id = route.params.id as string | undefined

const formData = ref({
  name: "",
  interface: {
    privateKey: "",
    publicKey: "",
    addresses: "",
    listenPort: "",
    dns: "",
    mtu: "",
  },
  peer: {
    publicKey: "",
    presharedKey: "",
    endpoint: "",
    allowedIps: "",
    persistentKeepalive: "",
  },
})

onMounted(() => {
  if (id) {
    // const existing = getTunnel(id)
    // if (existing) {
    //   // Deep copy to avoid mutating store directly before save
    //   formData.value = JSON.parse(
    //     JSON.stringify({
    //       name: existing.name,
    //       interface: existing.interface,
    //       peer: existing.peer,
    //     }),
    //   )
    // }
  }
})

const handleSave = () => {
  if (!formData.value.name) return alert("Name is required")

  // if (id) {
  //   updateTunnel(id, formData.value)
  // } else {
  //   addTunnel({
  //     id: Date.now().toString(),
  //     isEnabled: false,
  //     ...formData.value,
  //   })
  // }
  router.push("/")
}

const generateKeys = () => {
  const mockPriv = "c" + Math.random().toString(36).substring(2, 15) + "priv"
  const mockPub = "d" + Math.random().toString(36).substring(2, 15) + "pub"
  formData.value.interface.privateKey = mockPriv
  formData.value.interface.publicKey = mockPub
}
</script>

<template>
  <NavBar
    :title="id ? '编辑 WireGuard 隧道' : '创建 WireGuard 隧道'"
    :show-back="true"
  >
    <template #right>
      <ButtonWrapper @click="handleSave">
        <Save :size="24" class="text-slate-600" />
      </ButtonWrapper>
    </template>
  </NavBar>

  <main class="flex-1 p-4 overflow-y-auto space-y-6 pb-20">
    <!-- Interface Section -->
    <section>
      <h2 class="text-slate-800 text-lg mb-3 font-medium">本地 (Interface)</h2>
      <div class="space-y-3">
        <InputGroup v-model="formData.name" label="名称" />

        <InputGroup
          v-model="formData.interface.privateKey"
          label="私钥"
          @action="generateKeys"
        >
          <template #actionIcon>
            <RefreshCw :size="16" />
          </template>
        </InputGroup>

        <InputGroup
          v-model="formData.interface.publicKey"
          label="公钥"
          placeholder="(生成)"
          :read-only="true"
        />

        <div class="grid grid-cols-2 gap-3">
          <InputGroup
            v-model="formData.interface.addresses"
            label="局域网 IP 地址"
          />
          <InputGroup
            v-model="formData.interface.listenPort"
            label="监听端口"
            placeholder="(随机)"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <InputGroup v-model="formData.interface.dns" label="DNS 服务器" />
          <InputGroup
            v-model="formData.interface.mtu"
            label="MTU"
            placeholder="(自动)"
          />
        </div>
        <button class="text-blue-600 text-sm mt-1 mx-1">应用过滤</button>
      </div>
    </section>

    <!-- Peer Section -->
    <section>
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-slate-800 text-lg font-medium">远程 (Peer)</h2>
      </div>

      <div class="space-y-3">
        <InputGroup v-model="formData.peer.publicKey" label="公钥" />

        <InputGroup
          v-model="formData.peer.presharedKey"
          label="预共享密钥"
          placeholder="(可选)"
        />

        <InputGroup v-model="formData.peer.endpoint" label="端点 (Endpoint)" />

        <InputGroup
          v-model="formData.peer.allowedIps"
          label="允许 IP (AllowedIPs)"
        />

        <InputGroup
          v-model="formData.peer.persistentKeepalive"
          label="连接保活间隔"
          placeholder="(可选，不建议设置)"
        >
          <template #actionIcon>
            <span class="text-xs">秒</span>
          </template>
        </InputGroup>
      </div>
    </section>
  </main>
</template>
