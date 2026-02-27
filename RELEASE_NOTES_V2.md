# OpenClaw Installer v2.0.0

## 🎉 重大更新

OpenClaw Installer V2 正式发布！全新的跨平台离线安装器，支持 Windows 和 macOS。

## ✨ 新增功能

### 跨平台支持
- ✅ **Windows 10/11** 支持
- ✅ **macOS 12+** 支持 (Intel + Apple Silicon)
- ✅ 智能架构检测和适配

### 离线安装
- ✅ 内置资源包，无需联网即可安装
- ✅ 自动镜像源切换 (国内/国际)
- ✅ 支持完全离线环境部署

### 高级模型管理
- ✅ 5 大 AI 提供商快速切换
- ✅ 3 种参数预设 (创意/平衡/精确)
- ✅ 实时参数调优 (temperature, tokens, top_p, penalties)
- ✅ 使用统计和历史记录

### 智能故障诊断
- ✅ 一键健康检查
- ✅ 自动问题检测 (端口冲突、依赖缺失、配置错误)
- ✅ 一键修复功能
- ✅ 详细诊断报告

### 用户体验改进
- ✅ 语言选择移至欢迎页
- ✅ 更友好的错误提示
- ✅ 完整的中英双语支持
- ✅ 深色模式优化

## 📦 下载

### 从 GitHub Actions 下载构建产物

**Windows (Build #22475283735)**
- [MSI 安装包 (4MB)](https://github.com/viomat7064/openclaw-installer/actions/runs/22475283735) - 企业批量部署
- [NSIS 安装包 (3MB)](https://github.com/viomat7064/openclaw-installer/actions/runs/22475283735) - 推荐，支持自定义路径

**macOS (Build #22474759631)**
- [DMG 磁盘镜像 (5MB)](https://github.com/viomat7064/openclaw-installer/actions/runs/22474759631) - 推荐，拖拽安装
- [APP 应用包 (5MB)](https://github.com/viomat7064/openclaw-installer/actions/runs/22474759631) - 直接运行

> **下载说明**: 点击链接进入 Actions 页面，在 "Artifacts" 部分下载对应的安装包
>
> **macOS 注意**: 首次打开未签名应用需要右键选择"打开"

## 🔧 系统要求

### Windows
- Windows 10 或更高版本
- 5GB 以上可用磁盘空间
- 4GB 以上系统内存

### macOS
- macOS 12 (Monterey) 或更高版本
- 支持 Intel 和 Apple Silicon
- 5GB 以上可用磁盘空间
- 4GB 以上系统内存

## 📝 完整更新日志

### 核心功能
- 添加 macOS 平台支持 (Intel + Apple Silicon)
- 实现离线安装架构
- 添加资源管理系统
- 实现跨平台端口冲突检测和修复

### 模型管理
- 添加模型提供商切换功能
- 实现参数预设系统 (创意/平衡/精确)
- 添加实时参数调优
- 实现参数验证和使用统计

### 故障诊断
- 实现自动健康检查
- 添加端口冲突检测和修复
- 实现 Node.js 版本检查
- 添加 OpenClaw 安装状态检测
- 实现配置文件验证

### 用户界面
- 语言选择移至欢迎页
- 优化环境检测界面
- 改进错误提示信息
- 完善中英双语翻译

### 技术改进
- 使用条件编译实现跨平台
- 实现架构感知下载
- 添加 macOS 标准配置目录支持
- 优化 CI/CD 构建流程

### 测试和质量
- 添加 10 个单元测试
- 实现红绿灯测试方法论
- 通过 Clippy 严格检查
- 测试覆盖率 25%

## 🐛 已知问题

### macOS
- 应用未签名，首次打开需要右键选择"打开"
- 未实现 launchd 自动启动
- Gateway 需要手动启动

### 通用
- 测试覆盖率较低 (25%)
- 缺少前端测试和 E2E 测试

## 🔄 从 V1 升级

V2 与 V1 完全独立，可以并存安装。建议：

1. 备份 V1 配置文件 (`~/.openclaw/openclaw.json`)
2. 安装 V2
3. 在 V2 中重新配置模型和平台

## 📚 文档

- [README](https://github.com/viomat7064/openclaw-installer/blob/v2-dev/README.md)
- [macOS 移植计划](https://github.com/viomat7064/openclaw-installer/blob/v2-dev/MACOS_PORT_PLAN.md)
- [macOS 移植总结](https://github.com/viomat7064/openclaw-installer/blob/v2-dev/MACOS_PORT_SUMMARY.md)
- [项目完成报告](https://github.com/viomat7064/openclaw-installer/blob/v2-dev/PROJECT_COMPLETION_REPORT.md)

## 🙏 致谢

感谢所有测试用户的反馈和建议！

---

**完整更新日志**: https://github.com/viomat7064/openclaw-installer/compare/v1.0.0...v2.0.0
