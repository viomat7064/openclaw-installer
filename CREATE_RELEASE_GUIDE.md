# 创建 GitHub Release 指南

由于网络问题，无法通过 CLI 自动创建 release。请按以下步骤手动创建：

## 步骤 1: 访问 GitHub Releases 页面

打开浏览器访问:
https://github.com/viomat7064/openclaw-installer/releases/new

## 步骤 2: 填写 Release 信息

### Tag
选择已存在的 tag: `v2.0.0`

### Target
选择分支: `v2-dev`

### Release Title
```
OpenClaw Installer v2.0.0 - Cross-Platform Offline Installer
```

### Description
复制 `RELEASE_NOTES_V2.md` 的内容，或使用以下简化版本:

```markdown
## 🎉 重大更新

OpenClaw Installer V2 正式发布！全新的跨平台离线安装器，支持 Windows 和 macOS。

## ✨ 新增功能

- ✅ **跨平台支持**: Windows 10/11 + macOS 12+ (Intel + Apple Silicon)
- ✅ **离线安装**: 内置资源包，无需联网
- ✅ **高级模型管理**: 5 大提供商切换，3 种参数预设
- ✅ **智能故障诊断**: 一键健康检查和自动修复
- ✅ **用户体验改进**: 语言选择移至欢迎页

## 📦 下载

### 从 GitHub Actions 下载构建产物:

**Windows (Build #22475283735)**
- [MSI 安装包 (4MB)](https://github.com/viomat7064/openclaw-installer/actions/runs/22475283735)
- [NSIS 安装包 (3MB)](https://github.com/viomat7064/openclaw-installer/actions/runs/22475283735)

**macOS (Build #22474759631)**
- [DMG 磁盘镜像 (5MB)](https://github.com/viomat7064/openclaw-installer/actions/runs/22474759631)
- [APP 应用包 (5MB)](https://github.com/viomat7064/openclaw-installer/actions/runs/22474759631)

> **macOS 注意**: 首次打开未签名应用需要右键选择"打开"

## 🔧 系统要求

**Windows**: Windows 10+, 5GB 磁盘, 4GB 内存
**macOS**: macOS 12+, Intel/Apple Silicon, 5GB 磁盘, 4GB 内存

## 📝 完整更新日志

查看 [RELEASE_NOTES_V2.md](https://github.com/viomat7064/openclaw-installer/blob/v2-dev/RELEASE_NOTES_V2.md)

---

**完整更新日志**: https://github.com/viomat7064/openclaw-installer/compare/v1.0.0...v2.0.0
```

## 步骤 3: 发布

点击 "Publish release" 按钮。

## 可选: 上传构建产物

如果希望直接在 Release 页面提供下载，可以从 GitHub Actions 下载产物后上传:

### Windows 产物
```bash
gh run download 22475283735 -R viomat7064/openclaw-installer
```

### macOS 产物
```bash
gh run download 22474759631 -R viomat7064/openclaw-installer
```

然后在 Release 编辑页面上传这些文件。

---

## 自动化脚本 (网络恢复后使用)

```bash
cd /media/viomat/Data/CLAUDE/openclaw-installer/openclaw-installer

# 创建 release
gh release create v2.0.0 \
  --title "OpenClaw Installer v2.0.0 - Cross-Platform Offline Installer" \
  --notes-file RELEASE_NOTES_V2.md \
  --target v2-dev

# 下载并上传产物 (可选)
cd /tmp
mkdir openclaw-v2-release
cd openclaw-v2-release

# 下载 Windows 产物
gh run download 22475283735 -R viomat7064/openclaw-installer

# 下载 macOS 产物
gh run download 22474759631 -R viomat7064/openclaw-installer

# 上传到 release
gh release upload v2.0.0 \
  openclaw-installer-windows-msi/*.msi \
  openclaw-installer-windows-nsis/*.exe \
  macos-dmg/*.dmg \
  macos-app/*.app \
  -R viomat7064/openclaw-installer
```
