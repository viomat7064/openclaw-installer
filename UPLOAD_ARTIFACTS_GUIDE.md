# Release 产物上传指南

## 当前状态

✅ Release v2.0.0 已创建: https://github.com/viomat7064/openclaw-installer/releases/tag/v2.0.0

⏳ 构建产物需要手动上传到 Release

## 方法 1: 从 GitHub Actions 直接下载（推荐给用户）

用户可以直接从 GitHub Actions 下载构建产物：

**Windows (Build #22475283735)**
https://github.com/viomat7064/openclaw-installer/actions/runs/22475283735

**macOS (Build #22474759631)**
https://github.com/viomat7064/openclaw-installer/actions/runs/22474759631

## 方法 2: 上传产物到 Release（可选）

如果希望在 Release 页面直接提供下载，可以执行以下步骤：

### 步骤 1: 下载构建产物

```bash
cd /tmp
mkdir openclaw-v2-release
cd openclaw-v2-release

# 下载 Windows 产物
gh run download 22475283735 -R viomat7064/openclaw-installer

# 下载 macOS 产物
gh run download 22474759631 -R viomat7064/openclaw-installer
```

### 步骤 2: 重命名文件（可选）

```bash
# Windows
cd openclaw-installer-windows-msi
mv *.msi OpenClaw-Installer_2.0.0_x64.msi
cd ..

cd openclaw-installer-windows-nsis
mv *.exe OpenClaw-Installer_2.0.0_x64-setup.exe
cd ..

# macOS
cd macos-dmg
mv *.dmg OpenClaw-Installer_2.0.0_universal.dmg
cd ..

cd macos-app
tar -czf OpenClaw-Installer.app.tar.gz *.app
cd ..
```

### 步骤 3: 上传到 Release

```bash
cd /tmp/openclaw-v2-release

gh release upload v2.0.0 \
  openclaw-installer-windows-msi/OpenClaw-Installer_2.0.0_x64.msi \
  openclaw-installer-windows-nsis/OpenClaw-Installer_2.0.0_x64-setup.exe \
  macos-dmg/OpenClaw-Installer_2.0.0_universal.dmg \
  macos-app/OpenClaw-Installer.app.tar.gz \
  -R viomat7064/openclaw-installer
```

## 方法 3: 更新 Release Notes（推荐）

由于产物已在 GitHub Actions 可用，可以更新 Release Notes 指向 Actions 页面：

```bash
cd /media/viomat/Data/CLAUDE/openclaw-installer/openclaw-installer

# 编辑 RELEASE_NOTES_V2.md，将下载链接改为 Actions 链接
# 然后更新 release
gh release edit v2.0.0 --notes-file RELEASE_NOTES_V2.md
```

## 当前 Release Notes 中的下载链接

Release Notes 中的下载链接指向：
- `https://github.com/viomat7064/openclaw-installer/releases/download/v2.0.0/...`

这些链接在产物上传后才会生效。

## 建议

**推荐方案**: 保持当前状态，用户从 GitHub Actions 下载

优点：
- 无需额外上传步骤
- Actions 产物保留 90 天
- 用户可以看到完整的构建日志

缺点：
- 需要登录 GitHub 才能下载
- 链接不如 Release 页面直观

**可选方案**: 上传产物到 Release

优点：
- Release 页面直接下载
- 无需登录
- 永久保存

缺点：
- 需要手动下载和上传
- 占用 Release 存储空间

## 验证

检查 Release 是否创建成功：
```bash
gh release view v2.0.0 -R viomat7064/openclaw-installer
```

检查 Release 产物：
```bash
gh release view v2.0.0 --json assets -R viomat7064/openclaw-installer
```
