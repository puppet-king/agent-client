import { createRouter, createWebHashHistory } from "vue-router"
import Home from "./pages/Home.vue"
import Detail from "./pages/Detail.vue"
import CreateEdit from "./pages/CreateEdit.vue"
import Settings from "./pages/Settings.vue"
import LogViewer from "./pages/LogViewer.vue"
import { useConfStore } from "@/stores/userConf"

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/detail/:name", component: Detail },
    { path: "/create", component: CreateEdit },
    { path: "/edit/:name", component: CreateEdit },
    { path: "/settings", component: Settings },
    { path: "/logs", component: LogViewer },
  ],
})

router.beforeEach(async (_to, _from, next) => {
  // 此时调用 useConfStore 是安全的，因为导航触发时 pinia 已经注入应用
  const conf = useConfStore()

  // 1. 检查初始化状态
  if (!conf.isInitialized) {
    try {
      // 这里的 await 会阻塞页面跳转，直到数据从 Rust 侧读取完毕
      await conf.initConfig()
    } catch (error) {
      console.error("配置文件初始化失败:", error)
    }
  }

  next()
})
