import fs from "fs"
import path from "path"

// 1. 获取版本号
const newVersion = process.env.npm_package_version
console.log("Detected new version:", newVersion)

if (!newVersion) {
  console.error("无法获取版本号")
  process.exit(1)
}

// 2. 路径处理（由于脚本在 scripts 目录，process.cwd() 通常是项目根目录）
const tauriConfigPath = path.join(
  process.cwd(),
  "src-tauri",
  "tauri.conf.json5",
)

if (fs.existsSync(tauriConfigPath)) {
  const content = fs.readFileSync(tauriConfigPath, "utf8")

  // 3. 正则替换
  const updatedContent = content.replace(
    /("version"\s*:\s*")([^"]+)(")/,
    `$1${newVersion}$3`,
  )

  fs.writeFileSync(tauriConfigPath, updatedContent, "utf8")
  console.log(`✅ 已同步更新 tauri.conf.json5 版本号为: ${newVersion}`)
} else {
  console.error("❌ 未找到 src-tauri/tauri.conf.json5 文件")
  process.exit(1)
}
