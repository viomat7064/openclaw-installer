<div align="center">

# OpenClaw Installer

一键安装 [OpenClaw](https://github.com/openclaw/openclaw) AI 代理的 Windows 桌面安装程序。

[![Build Windows](https://github.com/viomat7064/openclaw-installer/actions/workflows/build-windows.yml/badge.svg)](https://github.com/viomat7064/openclaw-installer/actions/workflows/build-windows.yml)

</div>

---

## 功能特性

- **7 步安装向导** — 环境检测 → 模式选择 → 依赖安装 → 模型配置 → 平台配置 → 安装 → 完成
- **双安装模式** — npm 全局安装（推荐新手）或 Docker 容器部署（推荐有经验用户）
- **自动依赖管理** — 自动检测并安装 Node.js / Docker Desktop
- **12+ AI 模型提供商** — 阿里云百炼、DeepSeek、智谱AI、百度千帆、月之暗面、Ollama、Anthropic、OpenAI、Google Gemini、OpenRouter、AWS Bedrock、自定义
- **5 大消息平台** — WhatsApp、Telegram、Discord、Slack、微信
- **API 连接测试** — 配置后一键验证 API Key 是否有效
- **安装后管理面板** — Gateway 启停控制、设置编辑、系统诊断
- **中英双语** — 自动检测系统语言，支持手动切换
- **深色模式** — 跟随系统主题自动切换
- **国内镜像** — 自动检测网络环境，使用 npmmirror 加速

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | [Tauri 2](https://v2.tauri.app/) (Rust) |
| 前端 | React 19 + TypeScript + Vite 7 |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 路由 | React Router v7 |
| 国际化 | i18next |
| 图标 | Lucide React |
| 构建 | GitHub Actions → Windows NSIS / MSI |

## 安装

### 下载安装包

前往 [Releases](https://github.com/viomat7064/openclaw-installer/releases) 页面下载最新版本：

- **NSIS 安装包** (`.exe`) — 推荐，支持自定义安装路径
- **MSI 安装包** (`.msi`) — 适合企业批量部署

### 系统要求

- Windows 10 或更高版本
- 5GB 以上可用磁盘空间
- 4GB 以上系统内存
- 网络连接

## 开发

开发环境为 Linux，通过 GitHub Actions CI 做 Windows 交叉构建。

### 前置条件

```bash
# 系统依赖 (Ubuntu/Debian)
sudo apt-get install libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev

# Rust
rustup default stable

# Node.js >= 22
node --version
```

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（前端热重载 + Rust 后端）
npm run tauri dev

# 仅检查 Rust 编译
cd src-tauri && cargo check

# 仅构建前端
npm run build
```

### 项目结构

```
├── src/                    # React 前端
│   ├── pages/              # 页面组件（7步向导 + 管理面板）
│   ├── components/         # 通用组件 + shadcn/ui
│   ├── context/            # WizardContext 全局状态
│   ├── hooks/              # 自定义 Hooks
│   └── i18n/               # 中英文翻译
├── src-tauri/              # Rust 后端
│   └── src/commands/       # Tauri 命令
│       ├── detect.rs       # 环境检测
│       ├── download.rs     # 依赖下载
│       ├── install.rs      # 安装逻辑
│       ├── config.rs       # 配置管理 + API 测试
│       ├── service.rs      # Gateway 服务管理
│       └── doctor.rs       # 系统诊断
└── .github/workflows/      # CI/CD
```

## 许可证

MIT
