import { createRouter, createWebHashHistory } from "vue-router"
import Home from "./pages/Home.vue"
import Detail from "./pages/Detail.vue"
import CreateEdit from "./pages/CreateEdit.vue"
import Settings from "./pages/Settings.vue"
import LogViewer from "./pages/LogViewer.vue"

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/detail/:id", component: Detail },
    { path: "/create", component: CreateEdit },
    { path: "/edit/:id", component: CreateEdit },
    { path: "/settings", component: Settings },
    { path: "/logs", component: LogViewer },
  ],
})
