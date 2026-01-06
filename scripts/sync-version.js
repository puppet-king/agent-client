/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

// 1. 获取 package.json 中的最新版本号
// npm version 执行时，该文件版本已经先被更新了
const newVersion = process.env.npm_package_version
console.log('newVersion', newVersion)

/**
 * 标准版本更新 (SemVer)
 * npm version patch  1.0.0 → 1.0.1  Bug 修复
 * npm version minor  1.0.0 → 1.1.0  新增向下兼容的功能
 * npm version major  1.0.0 → 2.0.0  不兼容的重大变更
 *
 * 预发布版本 (Pre-release)
 * npm version prepatch 1.0.0 → 1.0.1-0
 * npm version preminor 1.0.0 → 1.1.0-0
 * npm version premajor 1.0.0 → 2.0.0-0
 * npm version prerelease 1.0.1-0 → 1.0.1-1
 * 自定义标识符：
 * npm version prerelease --preid=alpha → 1.0.1-alpha.0
 *
 * npm version from-git
 * 手动在 Git 里打了 Tag 但忘记改 package.json 时，运行此命令会让 package.json 的版本号强制跟随最新的 Git Tag。
 *
 * 直接指定版本号
 * npm version 2.1.5-beta.3
 */

if (!newVersion) {
  console.error('无法获取版本号，请通过 npm version 运行此脚本')
  process.exit(1)
}

// 2. 定义 app.ts 的路径
const targetPath = path.join(process.cwd(), 'src', 'configs', 'constant.ts')

if (fs.existsSync(targetPath )) {
  const content = fs.readFileSync(targetPath , 'utf8')

  // 3. 使用正则替换 VERSION 的值
  // 匹配 export const VERSION = '...' 或 "..."
  const updatedContent = content.replace(
    /(export\s+const\s+VERSION\s*=\s*['"])(.*?)(['"])/,
    `$1${newVersion}$3`
  )

  fs.writeFileSync(targetPath , updatedContent, 'utf8')
  console.log(`✅ 已同步更新版本号为: ${newVersion}`)
} else {
  console.error('❌ 未找到 src/configs/constant.ts 文件')
  process.exit(1)
}