# macOS 移植计划

## 目标

将 OpenClaw Installer 移植到 macOS，保持与 Windows 版本功能对等，面向完全没有编程能力的小白用户。

## 系统要求

- macOS 12 (Monterey) 或更高版本
- 支持 Intel 和 Apple Silicon (M1/M2/M3)
- 5GB 以上可用磁盘空间
- 4GB 以上系统内存

## 关键差异: Windows vs macOS

### 1. 包管理器
| 功能 | Windows | macOS |
|------|---------|-------|
| 包管理器 | Chocolatey (可选) | Homebrew (推荐) |
| Node.js 安装 | .msi 安装包 | .pkg 安装包 或 brew |
| Docker 安装 | Docker Desktop .exe | Docker Desktop .dmg |

### 2. 路径和环境
| 项目 | Windows | macOS |
|------|---------|-------|
| 用户目录 | `C:\Users\username` | `/Users/username` |
| 配置目录 | `%USERPROFILE%\.openclaw` | `~/.openclaw` |
| 临时目录 | `%TEMP%` | `/tmp` |
| 路径分隔符 | `\` | `/` |
| 环境变量 | `%VAR%` | `$VAR` |

### 3. 系统命令
| 功能 | Windows | macOS |
|------|---------|-------|
| 查找进程 | `netstat` / PowerShell | `lsof` |
| 杀死进程 | `taskkill` | `kill` |
| 检查端口 | `Get-NetTCPConnection` | `lsof -i :port` |
| 服务管理 | Windows Service | `launchd` (plist) |

### 4. 安装包格式
| 格式 | Windows | macOS |
|------|---------|-------|
| 安装包 | .exe (NSIS), .msi | .dmg, .pkg, .app |
| 便携版 | .zip | .app bundle |
| 分发方式 | GitHub Release | GitHub Release + Homebrew Cask |

## 需要修改的模块

### 1. detect.rs - 环境检测 ✅ 部分兼容
**当前状态**: 使用 `cfg(target_os)` 条件编译
**需要修改**:
- ✅ OS 检测 (已支持)
- ⚠️ Node.js 检测 (需验证路径)
- ⚠️ Docker 检测 (需验证 Docker Desktop for Mac)
- ⚠️ 磁盘空间检测 (需验证 macOS API)
- ⚠️ 内存检测 (需验证 macOS API)

**修改建议**:
```rust
#[cfg(target_os = "macos")]
fn detect_docker() -> bool {
    // Check if Docker.app exists
    std::path::Path::new("/Applications/Docker.app").exists()
}
```

### 2. install.rs - 安装逻辑 ⚠️ 需要修改
**当前状态**: 使用 npm 全局安装
**需要修改**:
- ⚠️ Node.js 安装路径 (macOS 使用 `/usr/local/bin/node`)
- ⚠️ npm 全局路径 (macOS 使用 `/usr/local/lib/node_modules`)
- ⚠️ 权限处理 (macOS 可能需要 sudo)

**修改建议**:
```rust
#[cfg(target_os = "macos")]
fn get_npm_global_path() -> PathBuf {
    PathBuf::from("/usr/local/lib/node_modules")
}
```

### 3. troubleshoot.rs - 故障诊断 ✅ 已支持
**当前状态**: 已使用 `cfg(not(target_os = "windows"))` 支持 Unix
**需要验证**:
- ✅ 端口冲突检测 (lsof)
- ✅ 进程杀死 (kill)
- ⚠️ 配置文件路径

**无需修改**: 已经支持 macOS

### 4. service.rs - 服务管理 ❌ 需要重写
**当前状态**: 仅支持 Windows
**需要修改**:
- ❌ 使用 `launchd` 替代 Windows Service
- ❌ 创建 `.plist` 文件
- ❌ 使用 `launchctl` 命令管理服务

**修改建议**:
```rust
#[cfg(target_os = "macos")]
async fn gateway_start() -> Result<String, String> {
    // Create plist file
    let plist_path = format!("{}/Library/LaunchAgents/com.openclaw.gateway.plist",
                             std::env::var("HOME").unwrap());

    // Load with launchctl
    Command::new("launchctl")
        .args(["load", &plist_path])
        .output()
        .map_err(|e| format!("Failed to start service: {}", e))?;

    Ok("Gateway started".to_string())
}
```

### 5. download.rs - 下载功能 ⚠️ 需要修改
**当前状态**: 下载 Windows 安装包
**需要修改**:
- ⚠️ Node.js 下载 URL (需要 .pkg 格式)
- ⚠️ Docker Desktop 下载 URL (需要 .dmg 格式)
- ⚠️ 区分 Intel 和 Apple Silicon

**修改建议**:
```rust
#[cfg(target_os = "macos")]
fn get_nodejs_download_url() -> String {
    let arch = std::env::consts::ARCH;
    match arch {
        "x86_64" => "https://nodejs.org/dist/v22.12.0/node-v22.12.0.pkg",
        "aarch64" => "https://nodejs.org/dist/v22.12.0/node-v22.12.0-arm64.pkg",
        _ => panic!("Unsupported architecture"),
    }
}
```

### 6. resources.rs - 资源管理 ⚠️ 需要修改
**当前状态**: 使用 tar 命令解压
**需要修改**:
- ⚠️ macOS 默认有 tar，但需要验证
- ⚠️ 资源路径可能不同

**修改建议**: 基本无需修改，tar 在 macOS 上可用

### 7. config.rs - 配置管理 ⚠️ 需要修改
**当前状态**: 使用 `%USERPROFILE%` 或 `$HOME`
**需要修改**:
- ⚠️ 配置目录路径 (macOS 推荐使用 `~/Library/Application Support/OpenClaw`)
- ⚠️ API Key 存储 (macOS 可以使用 Keychain)

**修改建议**:
```rust
#[cfg(target_os = "macos")]
fn get_config_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap();
    PathBuf::from(home)
        .join("Library")
        .join("Application Support")
        .join("OpenClaw")
}
```

## 前端修改

### 1. 平台检测
添加 macOS 平台检测:
```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
```

### 2. UI 文案调整
- Windows: "安装到 C:\Program Files"
- macOS: "安装到 /Applications"

### 3. 快捷键
- Windows: Ctrl+C, Ctrl+V
- macOS: Cmd+C, Cmd+V

### 4. 图标和样式
- 使用 macOS 风格的图标
- 遵循 macOS Human Interface Guidelines

## Tauri 配置修改

### tauri.conf.json
```json
{
  "bundle": {
    "active": true,
    "targets": ["dmg", "app"],
    "macOS": {
      "minimumSystemVersion": "12.0",
      "frameworks": [],
      "entitlements": "entitlements.plist",
      "signingIdentity": null
    }
  }
}
```

### entitlements.plist
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

## CI/CD 配置

### GitHub Actions - macOS 构建
```yaml
name: Build macOS

on:
  push:
    branches: [v2-macos]

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 22

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run tauri build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: macos-installer
          path: src-tauri/target/release/bundle/dmg/*.dmg
```

## 测试计划

### 1. 单元测试
- ✅ 复用现有测试
- ⚠️ 添加 macOS 特定测试

### 2. 集成测试
- ⚠️ 在 macOS 环境测试完整安装流程
- ⚠️ 测试 Intel 和 Apple Silicon

### 3. 用户测试
- ⚠️ 找 macOS 用户进行 beta 测试
- ⚠️ 收集反馈和 bug 报告

## 实施步骤

### Phase 1: 核心功能移植 (1-2 天)
1. ✅ 创建 v2-macos 分支
2. ⏳ 修改 detect.rs (环境检测)
3. ⏳ 修改 install.rs (安装逻辑)
4. ⏳ 修改 service.rs (服务管理)
5. ⏳ 修改 download.rs (下载功能)
6. ⏳ 修改 config.rs (配置管理)

### Phase 2: UI 和 UX 优化 (1 天)
1. ⏳ 添加 macOS 平台检测
2. ⏳ 调整 UI 文案
3. ⏳ 适配 macOS 快捷键
4. ⏳ 使用 macOS 风格图标

### Phase 3: 测试和调试 (1-2 天)
1. ⏳ 单元测试
2. ⏳ 集成测试
3. ⏳ 在 macOS 虚拟机测试
4. ⏳ 修复 bug

### Phase 4: CI/CD 和发布 (1 天)
1. ⏳ 配置 GitHub Actions
2. ⏳ 生成 .dmg 安装包
3. ⏳ 代码签名 (可选)
4. ⏳ 发布到 GitHub Release

## 预期挑战

### 1. 开发环境限制
**问题**: 当前开发环境是 Linux，无法直接测试 macOS
**解决方案**:
- 使用条件编译 `#[cfg(target_os = "macos")]`
- 在 GitHub Actions 上测试
- 使用 macOS 虚拟机 (如果可用)

### 2. 代码签名
**问题**: macOS 应用需要签名才能正常运行
**解决方案**:
- 开发阶段: 提供未签名版本，用户需要右键打开
- 正式发布: 申请 Apple Developer 账号 ($99/年)

### 3. Gatekeeper
**问题**: macOS Gatekeeper 会阻止未签名应用
**解决方案**:
- 文档中说明如何绕过 Gatekeeper
- 或者进行代码签名和公证

### 4. 权限问题
**问题**: macOS 对文件系统访问有严格限制
**解决方案**:
- 使用 Tauri 的权限系统
- 在 entitlements.plist 中声明权限

## 成功标准

### 必须达成
- ✅ 在 macOS 上可以启动应用
- ✅ 环境检测功能正常
- ✅ 可以安装 Node.js
- ✅ 可以安装 OpenClaw
- ✅ 模型管理功能正常
- ✅ 故障诊断功能正常

### 建议达成
- ✅ 服务管理功能正常 (launchd)
- ✅ 支持 Intel 和 Apple Silicon
- ✅ 生成 .dmg 安装包
- ✅ 通过 GitHub Actions 自动构建

### 可选
- ⏳ 代码签名和公证
- ⏳ 发布到 Homebrew Cask
- ⏳ 支持自动更新

## 时间估算

- Phase 1: 1-2 天
- Phase 2: 1 天
- Phase 3: 1-2 天
- Phase 4: 1 天
- **总计**: 4-6 天

## 参考资源

- [Tauri macOS Guide](https://tauri.app/v1/guides/building/macos)
- [macOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/macos)
- [launchd Tutorial](https://www.launchd.info/)
- [Homebrew Cask](https://github.com/Homebrew/homebrew-cask)
