<template>
  <div
    ref="panel"
    :style="{ top: y + 'px', left: x + 'px' }"
    class="fixed z-50 cursor-grab"
    @mousedown="onMouseDown"
  >
    <Menu>
      <MenuButton>
        <div
          class="p-4 rounded-full bg-white w-16 h-16 flex items-center justify-center shadow-lg"
        >
          <MessageCircleQuestionMark :size="52" class="text-primary" />
        </div>
      </MenuButton>
      <MenuItems class="bg-dark-2 pl-2 mt-2 rounded shadow-lg min-w-[150px]">
        <MenuItem v-slot="{ active }">
          <div
            :class="{ 'bg-blue-500 text-white': active }"
            class="p-2 rounded cursor-pointer"
            @click="returnHome"
          >
            返回主页
          </div>
        </MenuItem>
        <MenuItem v-slot="{ active }">
          <div
            :class="{ 'bg-blue-500 text-white': active }"
            class="p-2 rounded cursor-pointer"
            @click="refresh"
          >
            刷新
          </div>
        </MenuItem>
      </MenuItems>
    </Menu>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue"
import { MessageCircleQuestionMark } from "lucide-vue-next"
import { useRouter } from "vue-router"

const router = useRouter()
const returnHome = () => router.push("/")
const refresh = () => router.go(0)

// --- 拖动逻辑 ---
const panel = ref(null)
const x = ref(300)
const y = ref(500)

let isDragging = false
let offsetX = 0
let offsetY = 0

const onMouseDown = (e) => {
  if (!panel.value.contains(e.target)) return
  isDragging = true
  offsetX = e.clientX - x.value
  offsetY = e.clientY - y.value
  document.addEventListener("mousemove", onMouseMove)
  document.addEventListener("mouseup", onMouseUp)
}

const onMouseMove = (e) => {
  if (!isDragging) return
  x.value = e.clientX - offsetX
  y.value = e.clientY - offsetY
}

const onMouseUp = () => {
  isDragging = false
  document.removeEventListener("mousemove", onMouseMove)
  document.removeEventListener("mouseup", onMouseUp)
}
</script>

<style scoped>
/* 鼠标拖动时显示抓手 */
.cursor-grab {
  cursor: grab;
}
.cursor-grab:active {
  cursor: grabbing;
}
</style>
