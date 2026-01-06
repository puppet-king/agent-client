import { check } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"

export async function checkForUpdates() {
  try {
    const update = await check({
      // 设置超时时间（毫秒 30s）
      timeout: 30000,
    })

    if (update) {
      console.log(`发现更新版本：${update.version}`)
      let downloaded = 0
      let contentLength = 0
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength as number
            console.log(`开始下载 ${event.data.contentLength} bytes`)
            break
          case "Progress":
            downloaded += event.data.chunkLength
            console.log(`已下载 ${downloaded} / ${contentLength}`)
            break
          case "Finished":
            console.log("下载完成")
            break
        }
      })

      console.log("更新安装完毕，准备重启")
      await relaunch()
    } else {
      console.log("当前已是最新版本。")
    }
  } catch (error) {
    console.error("检查更新失败:", error)
  }
}
