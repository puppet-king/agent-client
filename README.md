# Puppet Trojan Client

一个基于 Tauri 和 Vue 3 构建的跨平台 SingBox Windows 客户端应用，支持 Windows 桌面。

## 功能特性

- Windows 平台支持 
- 基于 Tauri 框架构建，性能优秀
- 使用 Vue 3 和 TypeScript 开发
- 现代化 UI 界面

## 技术栈

- **前端**: Vue 3, TypeScript, Tailwind CSS
- **后端**: Rust (Tauri)
- **构建工具**: Vite
- **状态管理**: Pinia
- **UI 组件**: Headless UI

## 安装与运行

### 开发环境要求

- Node.js >= 18
- Rust (用于 Tauri)

### 安装步骤

1. 克隆项目
   ```bash
   git clone https://github.com/puppet-king/agent-client.git
   cd puppet-trojan-client
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 运行 Tauri 应用
   ```bash
   npm run tauri:dev
   ```

### 构建应用
- 构建 Tauri 桌面应用
  ```bash
  npm run tauri:build
  ```


## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](./LICENSE) 文件。

MIT 许可证 (MIT)

Copyright (c) 2026 puppet-king

特此免费授予任何获得本软件副本和相关文档文件（"软件"）的人，以无限制的方式处理本软件，包括但不限于使用、复制、修改、合并、发布、分发、再许可和/或销售软件副本的权利，以及向软件用户提供本软件的权利，但须遵守以下条件：

上述版权声明和本许可声明应包含在本软件的所有副本或重要部分中。

本软件按"现状"提供，不提供任何形式的保证，包括但不限于适销性、特定用途适用性和非侵权性的保证。在任何情况下，作者或版权持有人均不对因本软件或本软件的使用或其他交易而引起的任何索赔、损害或其他责任承担责任，无论是在合同诉讼、侵权行为或其他方面。

## 贡献

欢迎提交 Pull Request 来改进项目。

## 支持

如需支持，请提交 GitHub Issues。
