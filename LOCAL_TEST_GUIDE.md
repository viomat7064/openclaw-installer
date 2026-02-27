# 本地测试指南

## 📋 测试前准备

### 1. 确认环境
```bash
# 当前位置
cd /media/viomat/Data/CLAUDE/openclaw-installer/openclaw-installer

# 查看当前分支
git branch --show-current
# 应该显示: v2-dev 或 main

# 查看最新提交
git log --oneline -3
```

### 2. 查看项目状态
```bash
# 查看所有文档
ls -la *.md

# 应该看到:
# - README.md (项目说明)
# - TESTING.md (测试协议)
# - TEST_REPORT_ROUND1.md (Round 1 报告)
# - TEST_REPORT_ROUND3.md (Round 3 报告)
# - V2_ARCHITECTURE.md (V2 架构)
# - DEVELOPMENT_SUMMARY.md (开发总结)
```

## 🚀 快速测试

### 方法 1: 使用自动化脚本 (推荐)
```bash
./test-local.sh
```

这个脚本会自动检查:
- ✅ Git 分支状态
- ✅ 工作区是否干净
- ✅ Rust 编译
- ✅ Rust 单元测试 (10 个)
- ✅ Clippy 代码检查
- ✅ Node.js 依赖
- ✅ TypeScript 类型检查
- ✅ 关键文件完整性
- ✅ V2 资源目录 (v2-dev 分支)
- ✅ 测试报告

### 方法 2: 手动测试

#### Step 1: Rust 测试
```bash
cd src-tauri
cargo test

# 预期输出:
# running 10 tests
# test commands::models::tests::test_model_parameters_default ... ok
# test commands::models::tests::test_validate_model_parameters_valid ... ok
# test commands::models::tests::test_validate_model_parameters_invalid_temperature ... ok
# test commands::models::tests::test_get_available_providers ... ok
# test commands::models::tests::test_get_model_presets ... ok
# test commands::troubleshoot::tests::test_run_diagnostics ... ok
# test commands::troubleshoot::tests::test_check_port_conflict_free_port ... ok
# test commands::troubleshoot::tests::test_check_nodejs ... ok
# test commands::troubleshoot::tests::test_fix_port_conflict_invalid ... ok
# test commands::troubleshoot::tests::test_fix_config_file ... ok
#
# test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

#### Step 2: 代码质量检查
```bash
# Rust Clippy
cargo clippy -- -D warnings

# 预期: Finished, 无警告

# Rust 格式检查
cargo fmt --check

# 预期: 无输出 (格式正确)
```

#### Step 3: 前端检查
```bash
cd ..

# TypeScript 类型检查
npm run type-check

# 预期: 无错误
```

## 🖥️ 功能测试

### 启动开发模式
```bash
npm run tauri dev
```

### 测试清单

#### 1. 环境检测 (Welcome 页面)
- [ ] 页面正常加载
- [ ] 显示系统信息 (OS, Node.js, Docker 等)
- [ ] 检测结果显示 ✅/⚠️/❌ 图标
- [ ] "下一步" 按钮状态正确

#### 2. 模式选择 (ModeSelect 页面)
- [ ] 显示两种安装模式
- [ ] npm 模式卡片可点击
- [ ] Docker 模式卡片可点击
- [ ] 选择后可进入下一步

#### 3. 模型配置 (ModelConfig 页面)
- [ ] 显示 12+ 模型提供商
- [ ] 可以选择提供商
- [ ] 可以输入 API Key
- [ ] "测试连接" 按钮工作
- [ ] 可以进入下一步

#### 4. 模型管理 (新功能)
打开 Dashboard 或 Settings 页面，找到模型管理:
- [ ] 显示提供商下拉列表
- [ ] 显示模型下拉列表
- [ ] 显示 3 个参数预设 (Creative, Balanced, Precise)
- [ ] Temperature 滑块可调节 (0.0 - 2.0)
- [ ] Max Tokens 滑块可调节 (256 - 8192)
- [ ] Top P 滑块可调节 (0.0 - 1.0)
- [ ] Frequency Penalty 滑块可调节 (-2.0 - 2.0)
- [ ] Presence Penalty 滑块可调节 (-2.0 - 2.0)
- [ ] Stream 复选框可切换
- [ ] "Save Parameters" 按钮可点击

#### 5. 故障诊断 (新功能)
打开 Dashboard 或 Settings 页面，找到故障诊断:
- [ ] 显示健康状态 (绿色/红色)
- [ ] 自动运行诊断
- [ ] 显示问题列表 (如果有)
- [ ] 问题按严重程度分类 (Critical/Warning/Info)
- [ ] "Fix" 按钮显示 (如果可修复)
- [ ] "Re-run Diagnostics" 按钮工作

#### 6. 语言切换
- [ ] 可以切换中文/英文
- [ ] 所有文本正确翻译
- [ ] 切换后立即生效

#### 7. 深色模式
- [ ] 可以切换深色/浅色模式
- [ ] 主题切换流畅
- [ ] 所有组件适配深色模式

## 🏗️ 构建测试 (可选)

### 构建生产版本
```bash
npm run tauri build
```

### 检查产物
```bash
# Windows 安装包
ls -lh src-tauri/target/release/bundle/nsis/
ls -lh src-tauri/target/release/bundle/msi/

# 预期:
# - OpenClaw-Installer_0.1.0_x64-setup.exe (NSIS)
# - OpenClaw-Installer_0.1.0_x64_en-US.msi (MSI)
```

## ✅ 测试通过标准

### 必须通过
- ✅ 所有 Rust 测试通过 (10/10)
- ✅ Clippy 无警告
- ✅ TypeScript 无类型错误
- ✅ 开发模式可以启动
- ✅ 核心功能可以使用

### 建议通过
- ✅ 模型管理 UI 正常
- ✅ 故障诊断功能正常
- ✅ 语言切换正常
- ✅ 深色模式正常

## 🐛 常见问题

### 问题 1: Rust 编译失败
```bash
# 清理缓存
cd src-tauri
cargo clean
cargo build
```

### 问题 2: Node.js 依赖问题
```bash
# 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 3: Tauri 开发模式启动失败
```bash
# 检查端口占用
lsof -i :1420

# 如果被占用，杀死进程
kill -9 <PID>
```

### 问题 4: 测试失败
```bash
# 查看详细错误
cd src-tauri
cargo test -- --nocapture

# 单独运行某个测试
cargo test test_model_parameters_default -- --nocapture
```

## 📤 测试通过后

### 1. 确认所有修改已提交
```bash
git status

# 应该显示: nothing to commit, working tree clean
```

### 2. 查看提交历史
```bash
git log --oneline -5

# v2-dev 分支应该有:
# 2de4236 docs: add development summary and local test script
# 4bc45f3 test: add comprehensive test suite with red-green-light validation
# 1677608 merge: bring advanced features from v1 to v2
# 6f71a4d feat: implement offline bundle system with resource management
# 35ecb38 docs: add v2 architecture and resource bundling structure
```

### 3. 推送到 GitHub (如果测试通过)
```bash
# 推送 v2-dev 分支
git push origin v2-dev

# 推送 main 分支 (如果在 main)
git push origin main

# 推送标签
git push origin v1.0.0
```

### 4. 创建 GitHub Release (可选)
1. 访问 https://github.com/viomat7064/openclaw-installer/releases
2. 点击 "Draft a new release"
3. 选择标签: v1.0.0 (main) 或 v2.0.0-beta (v2-dev)
4. 填写 Release notes
5. 上传构建产物 (如果有)
6. 发布

## 📝 测试报告模板

测试完成后，可以创建一个简单的报告:

```markdown
# 本地测试报告

## 测试环境
- OS: Linux 6.17.0-14-generic
- 分支: v2-dev
- 提交: 2de4236

## 测试结果
- [x] 自动化测试通过 (10/10)
- [x] 开发模式启动成功
- [x] 模型管理功能正常
- [x] 故障诊断功能正常
- [x] 语言切换正常
- [x] 深色模式正常

## 发现的问题
无

## 结论
✅ 测试通过，可以推送到 GitHub
```

---

**祝测试顺利！** 🎉

如有问题，请查看:
- DEVELOPMENT_SUMMARY.md (开发总结)
- TEST_REPORT_ROUND3.md (测试报告)
- TESTING.md (测试协议)
