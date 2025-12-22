<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useConfStore } from "@/stores/userConf"
import { validateTunnelConfig } from "@/utils/validate" // 之前封装的 Zod 校验
import { Save, Globe, Monitor, Lock, Eye, EyeOff } from "lucide-vue-next"
import NavBar from "@/components/NavBar.vue"
import UISwitch from "@/components/UISwitch.vue"
import type { TunnelConfig } from "@/typings/config"
import ButtonWrapper from "@/components/ButtonWrapper.vue"
import { toast } from "@/composables/useToast.ts"

// 路由与 Store 状态
const router = useRouter()
const route = useRoute()
const confStore = useConfStore()

// 响应式状态
const isEdit = computed(() => !!route.params.name)
const configName = ref("") // 对应文件名
const showPassword = ref(false) // 控制是否显示明文

// 初始化一个符合 TunnelConfig 结构的空表单
const form = reactive<TunnelConfig>({
  run_type: "client",
  local_addr: "127.0.0.1",
  local_port: 4099,
  remote_addr: "",
  remote_port: 443,
  password: [""],
  ssl: {
    enabled: true,
    sni: "",
    verify: true,
    verify_hostname: true,
  },
  mux: { enabled: true },
  router: {
    enabled: true,
    default_policy: "proxy",
    geoip: "./geoip-only-cn-private.dat",
    geosite: "./geosite.dat",
    bypass: ["geoip:cn", "geoip:private", "geosite:cn", "geosite:private"],
    block: ["geosite:category-ads"],
    proxy: ["geosite:geolocation-!cn"],
  },
})

// 3. 初始化加载数据
onMounted(async () => {
  if (isEdit.value) {
    const nameParam = String(route.params.name || "")
    configName.value = nameParam

    // 从 Store/后端 加载现有配置
    const data = await confStore.loadTunnel(nameParam)
    if (data) {
      // 深度合并，确保默认值不被缺失的字段抹除
      form.run_type = data.run_type ?? form.run_type
      form.local_addr = data.local_addr ?? form.local_addr
      form.local_port = data.local_port ?? form.local_port
      form.remote_addr = data.remote_addr ?? form.remote_addr
      form.remote_port = data.remote_port ?? form.remote_port
      form.password = data.password ?? form.password

      // 合并嵌套对象
      if (data.ssl) {
        form.ssl = { ...form.ssl, ...data.ssl }
      }
      if (data.mux) {
        form.mux = { ...form.mux, ...data.mux }
      }
      if (data.router) {
        form.router = { ...form.router, ...data.router }
      }
    } else {
      console.error("未找到配置数据")
      await router.push("/")
    }
  }
})

// 保存操作
const handleSave = async () => {
  // 基础名称校验
  if (!configName.value.trim()) {
    toast.info("请输入配置名称")
    return
  }

  // Zod 格式校验
  const check = validateTunnelConfig(form)
  if (!check.valid) {
    toast.info(`配置格式错误:\n${check.errors[0]}`)
    return
  }

  try {
    const result = isEdit.value
      ? await confStore.updateTunnel(configName.value, { ...form })
      : await confStore.addTunnel(configName.value, { ...form })
    if (result.success) {
      if (isEdit.value) {
        router.back()
      } else {
        void router.push(`/`)
      }
    } else {
      toast.error(result.message || "保存失败")
    }
  } catch (e) {
    toast.error("系统错误")
    console.error("系统错误: " + e)
  }
}
</script>
<template>
  <NavBar :title="configName ? '编辑配置' : '创建配置'" :show-back="true">
    <template #right>
      <ButtonWrapper @click="handleSave">
        <Save :size="24" class="text-blue-600" />
      </ButtonWrapper>
    </template>
  </NavBar>

  <!-- 主体表单区域 -->
  <main class="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-24">
    <!-- 区块一：基础连接信息 -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 px-1 text-slate-400">
        <Globe :size="16" class="text-primary" />
        <span class="text-xs uppercase font-bold tracking-widest">
          基础连接
        </span>
      </div>

      <div
        class="bg-dark-2 rounded-2xl border border-dark-3 p-5 space-y-4 shadow-sm"
      >
        <!-- 配置名称 (仅创建时可改，或作为文件标识) -->
        <div class="space-y-1.5">
          <label class="text-xs text-slate-500 ml-1">配置文件名称 (唯一)</label>
          <input
            v-model="configName"
            type="text"
            placeholder="client"
            class="w-full bg-dark-3 border border-dark-3 focus:border-primary/50 rounded-xl px-4 py-3 text-sm transition-all outline-none"
            :class="isEdit ? 'disabled:cursor-not-allowed ' : ''"
            :disabled="isEdit"
          />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2 space-y-1.5">
            <label class="text-xs text-slate-500 ml-1">远程地址</label>
            <input
              v-model="form.remote_addr"
              type="text"
              placeholder="公网 IPv4 地址"
              class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-primary/50"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-500 ml-1">端口</label>
            <input
              v-model.number="form.remote_port"
              type="number"
              placeholder="443"
              class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-500 ml-1">连接密码</label>
          <div class="relative flex items-center">
            <input
              v-model="form.password[0]"
              :type="showPassword ? 'text' : 'password'"
              placeholder=""
              class="flex-1 bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-primary/50"
            />

            <button
              class="absolute right-3 p-1.5 rounded-lg cursor-pointe hover:bg-dark-2 text-slate-500 hover:text-slate-300 transition-colors"
              @click="showPassword = !showPassword"
            >
              <component :is="showPassword ? Eye : EyeOff" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 区块二：本地监听 -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 px-1 text-slate-400">
        <Monitor :size="16" class="text-primary" />
        <span class="text-xs uppercase font-bold tracking-widest"
          >本地监听</span
        >
      </div>
      <div class="bg-dark-2 rounded-2xl border border-dark-3 p-5 shadow-sm">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-500 ml-1">监听地址</label>
            <input
              v-model="form.local_addr"
              type="text"
              placeholder="127.0.0.1"
              class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-slate-500 ml-1">监听端口</label>
            <input
              v-model.number="form.local_port"
              type="number"
              placeholder="5001"
              class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 区块三：高级功能开关 -->
    <section class="grid grid-cols-1 gap-3">
      <!-- SSL 卡片 -->
      <div class="bg-dark-2 rounded-2xl border border-dark-3 p-5 shadow-sm">
        <div class="flex justify-between items-center mb-1">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-green-500/10 rounded-lg text-green-500">
              <Lock :size="18" />
            </div>
            <div>
              <div class="text-sm font-bold">SSL 加密</div>
              <div class="text-[10px] text-slate-500 uppercase">
                Secure Socket Layer
              </div>
            </div>
          </div>

          <UISwitch v-model:checked="form.ssl!.enabled" size="small" />
        </div>

        <Transition name="fade-slide">
          <div
            v-if="form.ssl!.enabled"
            class="space-y-4 pt-2 border-t border-white/5"
          >
            <div class="space-y-1.5">
              <label class="text-xs text-slate-500 ml-1">SNI 域名 (必填)</label>
              <input
                v-model="form.ssl!.sni"
                type="text"
                placeholder="server.domain.com"
                class="w-full bg-dark-3 border border-dark-3 rounded-xl px-4 py-3 text-sm font-mono outline-none"
              />
            </div>
            <div class="flex gap-4">
              <div
                class="flex-1 flex items-center justify-between bg-dark-3/50 p-3 rounded-xl border border-white/5"
              >
                <span class="text-xs text-slate-400">证书验证</span>
                <UISwitch
                  :checked="form.ssl?.verify ?? true"
                  size="small"
                  @update:checked="
                    (val) => {
                      if (form.ssl) {
                        form.ssl.verify = val
                      }
                    }
                  "
                />
              </div>
              <div
                class="flex-1 flex items-center justify-between bg-dark-3/50 p-3 rounded-xl border border-white/5"
              >
                <span class="text-xs text-slate-400">域名校验</span>
                <UISwitch
                  :checked="form.ssl?.verify_hostname ?? true"
                  size="small"
                  @update:checked="
                    (val) => {
                      if (form.ssl) {
                        form.ssl.verify_hostname = val
                      }
                    }
                  "
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Mux & Router 简化卡片 -->
      <div class="grid grid-cols-2 gap-3">
        <div
          class="bg-dark-2 rounded-2xl border border-dark-3 p-4 flex justify-between items-center"
        >
          <span class="text-sm font-medium">多路复用 Mux</span>
          <UISwitch v-model:checked="form.mux!.enabled" size="small" />
        </div>
        <div
          class="bg-dark-2 rounded-2xl border border-dark-3 p-4 flex justify-between items-center"
        >
          <span class="text-sm font-medium">急速模式</span>
          <UISwitch v-model:checked="form.router!.enabled" size="small" />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* 动画：当开启 SSL 时平滑滑出 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

/* 输入框聚焦效果 */
input:focus {
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

/* 针对端口等数字输入框隐藏箭头 */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
