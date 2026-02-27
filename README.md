<div align="center">

# OpenClaw Installer

一键安装 [OpenClaw](https://github.com/openclaw/openclaw) AI 代理的跨平台桌面安装程序。

[![Build Windows](https://github.com/viomat7064/openclaw-installer/actions/workflows/build-windows.yml/badge.svg)](https://github.com/viomat7064/openclaw-installer/actions/workflows/build-windows.yml)
[![Build macOS](https://github.com/viomat7064/openclaw-installer/actions/workflows/build-macos.yml/badge.svg)](https://github.com/viomat7064/openclaw-installer/actions/workflows/build-macos.yml)

[English](#english) | [中文](#中文)

</div>

---

<a name="中文"></a>

## 版本选择

本项目提供两个版本，请根据需求选择：

| 版本 | 分支 | 平台 | 安装包大小 | 网络要求 | 适用场景 |
|------|------|------|-----------|---------|---------|
| **V1 (在线版)** | `main` | Windows | ~10MB | 需要联网 | 网络稳定，希望快速下载 |
| **V2 (离线版)** | `v2-dev` | Windows + macOS | ~200MB | 可离线安装 | 无法访问 GitHub/npm，或网络不稳定 |

### V1 vs V2 功能对比

| 功能 | V1 | V2 |
|------|----|----|
| 7 步安装向导 | ✅ | ✅ |
| 双安装模式 (npm/Docker) | ✅ | ✅ |
| 自动依赖管理 | ✅ | ✅ (内置安装包) |
| 12+ AI 模型提供商 | ✅ | ✅ |
| 5 大消息平台 | ✅ | ✅ |
| 中英双语 | ✅ (自动检测) | ✅ (欢迎页选择) |
| 深色模式 | ✅ | ✅ |
| Windows 支持 | ✅ | ✅ |
| macOS 支持 | ❌ | ✅ (Intel + Apple Silicon) |
| 离线安装 | ❌ | ✅ |
| 模型切换 + 参数调优 | ❌ | ✅ |
| 自动故障诊断 | ❌ | ✅ |

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
| 构建 | GitHub Actions → Windows (NSIS/MSI) + macOS (DMG/APP) |

## 安装

### 下载安装包

前往 [Releases](https://github.com/viomat7064/openclaw-installer/releases) 页面下载最新版本：

**Windows:**
- **NSIS 安装包** (`.exe`) — 推荐，支持自定义安装路径
- **MSI 安装包** (`.msi`) — 适合企业批量部署

**macOS:**
- **DMG 磁盘镜像** (`.dmg`) — 推荐，拖拽安装
- **APP 应用包** (`.app`) — 直接运行

> **注意**: macOS 首次打开未签名应用需要右键选择"打开"

### 系统要求

**Windows:**
- Windows 10 或更高版本
- 5GB 以上可用磁盘空间
- 4GB 以上系统内存
- 网络连接 (V1 必需，V2 可选)

**macOS (V2 only):**
- macOS 12 (Monterey) 或更高版本
- 支持 Intel 和 Apple Silicon
- 5GB 以上可用磁盘空间
- 4GB 以上系统内存

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
│       ├── doctor.rs       # 系统诊断
│       ├── models.rs       # 模型管理 (V2)
│       ├── troubleshoot.rs # 故障诊断 (V2)
│       └── resources.rs    # 离线资源 (V2)
└── .github/workflows/      # CI/CD
```

## 许可证

MIT

---

<a name="english"></a>

# English

## Overview

Cross-platform desktop installer for [OpenClaw](https://github.com/openclaw/openclaw) AI agent with one-click installation.

## Version Selection

| Version | Branch | Platform | Size | Network | Use Case |
|---------|--------|----------|------|---------|----------|
| **V1 (Online)** | `main` | Windows | ~10MB | Required | Stable network, quick download |
| **V2 (Offline)** | `v2-dev` | Windows + macOS | ~200MB | Optional | No GitHub/npm access, or unstable network |

## Features

- **7-Step Wizard** — Environment detection → Mode selection → Dependencies → Model config → Platform config → Installation → Complete
- **Dual Installation Modes** — npm global (recommended for beginners) or Docker container (for experienced users)
- **Auto Dependency Management** — Auto-detect and install Node.js / Docker Desktop
- **12+ AI Model Providers** — Alibaba, DeepSeek, Zhipu, Baidu, Moonshot, Ollama, Anthropic, OpenAI, Google Gemini, OpenRouter, AWS Bedrock, Custom
- **5 Messaging Platforms** — WhatsApp, Telegram, Discord, Slack, WeChat
- **API Connection Test** — One-click validation of API keys
- **Post-Install Dashboard** — Gateway control, settings, system diagnostics
- **Bilingual** — Auto-detect system language, manual switch supported
- **Dark Mode** — Auto-follow system theme
- **China Mirror** — Auto-detect network, use npmmirror for acceleration

## V2 Exclusive Features

- **Cross-Platform** — Windows + macOS (Intel + Apple Silicon)
- **Offline Installation** — Bundled resources, no internet required
- **Model Management** — Switch providers, adjust parameters (temperature, tokens, etc.)
- **Auto Troubleshooting** — One-click diagnostics and fixes
- **Language Selection** — Choose language on welcome screen

## Download

Visit [Releases](https://github.com/viomat7064/openclaw-installer/releases) to download:

**Windows:**
- NSIS Installer (`.exe`) — Recommended
- MSI Installer (`.msi`) — For enterprise deployment

**macOS:**
- DMG Disk Image (`.dmg`) — Recommended
- APP Bundle (`.app`) — Direct run

> **Note**: macOS unsigned apps require right-click → "Open" on first launch

## System Requirements

**Windows:**
- Windows 10 or higher
- 5GB+ free disk space
- 4GB+ RAM
- Internet connection (V1 required, V2 optional)

**macOS (V2 only):**
- macOS 12 (Monterey) or higher
- Intel and Apple Silicon supported
- 5GB+ free disk space
- 4GB+ RAM

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Tauri 2](https://v2.tauri.app/) (Rust) |
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Routing | React Router v7 |
| i18n | i18next |
| Icons | Lucide React |
| Build | GitHub Actions → Windows (NSIS/MSI) + macOS (DMG/APP) |

## Development

Developed on Linux, cross-compiled for Windows/macOS via GitHub Actions CI.

### Prerequisites

```bash
# System dependencies (Ubuntu/Debian)
sudo apt-get install libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev

# Rust
rustup default stable

# Node.js >= 22
node --version
```

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (frontend hot-reload + Rust backend)
npm run tauri dev

# Check Rust compilation only
cd src-tauri && cargo check

# Build frontend only
npm run build
```

## License

MIT

