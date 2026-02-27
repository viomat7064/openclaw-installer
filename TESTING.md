# Red-Green-Light Testing Protocol

## 测试目标
通过三轮测试确保代码质量：
1. **第一轮**: 预期为绿灯，如果通过则深度检查代码找出问题
2. **第二轮**: 修复问题后预期为红灯，验证测试有效性
3. **第三轮**: 最终修复后预期为绿灯，确认代码质量

## 测试分类

### 1. Rust 后端测试

#### 1.1 单元测试
```bash
cd src-tauri
cargo test --lib
```

测试覆盖:
- [ ] detect.rs - 环境检测逻辑
- [ ] download.rs - 下载功能
- [ ] install.rs - 安装逻辑
- [ ] config.rs - 配置管理
- [ ] service.rs - 服务管理
- [ ] models.rs - 模型管理
- [ ] troubleshoot.rs - 故障诊断
- [ ] resources.rs - 资源管理 (V2)

#### 1.2 集成测试
```bash
cd src-tauri
cargo test --test '*'
```

测试场景:
- [ ] 完整安装流程 (npm 模式)
- [ ] 完整安装流程 (Docker 模式)
- [ ] 离线安装流程 (V2)
- [ ] 配置读写
- [ ] API 连接测试

### 2. 前端测试

#### 2.1 组件测试
```bash
npm test
```

测试组件:
- [ ] Welcome 页面
- [ ] ModeSelect 页面
- [ ] ModelConfig 页面
- [ ] PlatformConfig 页面
- [ ] Dashboard 页面
- [ ] Settings 页面
- [ ] ModelManagement 组件
- [ ] Troubleshooting 组件

#### 2.2 Hook 测试
- [ ] useInstallation
- [ ] useDownload
- [ ] useModelManagement
- [ ] useTroubleshooting
- [ ] useResources (V2)

### 3. E2E 测试

#### 3.1 关键用户流程
- [ ] 新用户首次安装 (npm 模式)
- [ ] 新用户首次安装 (Docker 模式)
- [ ] 离线安装 (V2)
- [ ] 模型切换和参数调优
- [ ] 故障诊断和自动修复
- [ ] 语言切换

#### 3.2 错误处理
- [ ] 网络断开时的行为
- [ ] 依赖缺失时的提示
- [ ] 端口冲突时的自动修复
- [ ] 配置文件损坏时的恢复

### 4. 构建测试

#### 4.1 开发构建
```bash
npm run tauri dev
```

验证:
- [ ] 前端热重载正常
- [ ] Rust 后端编译无警告
- [ ] 所有 Tauri 命令可调用

#### 4.2 生产构建
```bash
npm run tauri build
```

验证:
- [ ] Windows NSIS 安装包生成
- [ ] Windows MSI 安装包生成
- [ ] 安装包大小合理 (V1 < 20MB, V2 < 300MB)
- [ ] 安装包可正常安装和卸载

### 5. 代码质量检查

#### 5.1 Rust 代码
```bash
cd src-tauri
cargo clippy -- -D warnings
cargo fmt --check
```

检查项:
- [ ] 无 clippy 警告
- [ ] 代码格式符合规范
- [ ] 无 unwrap() 滥用
- [ ] 错误处理完善

#### 5.2 TypeScript 代码
```bash
npm run lint
npm run type-check
```

检查项:
- [ ] 无 ESLint 错误
- [ ] 无 TypeScript 类型错误
- [ ] 无未使用的导入
- [ ] 代码格式一致

### 6. 安全检查

```bash
cd src-tauri
cargo audit
npm audit
```

检查项:
- [ ] 无已知安全漏洞
- [ ] 依赖版本最新
- [ ] 无敏感信息泄露

## 测试执行计划

### Round 1: 初始测试 (预期绿灯)
1. 运行所有自动化测试
2. 记录测试结果
3. 如果全部通过，进行深度代码审查找出潜在问题

### Round 2: 问题修复后测试 (预期红灯)
1. 修复 Round 1 发现的问题
2. 重新运行测试
3. 验证测试能够捕获问题

### Round 3: 最终测试 (预期绿灯)
1. 修复所有问题
2. 运行完整测试套件
3. 确认所有测试通过

## 测试报告模板

```markdown
# 测试报告 - Round X

## 测试时间
YYYY-MM-DD HH:MM

## 测试环境
- OS: Linux / Windows / macOS
- Rust: 版本
- Node.js: 版本
- 分支: main / v2-dev

## 测试结果

### Rust 单元测试
- 通过: X/Y
- 失败: Z
- 覆盖率: XX%

### 前端测试
- 通过: X/Y
- 失败: Z

### E2E 测试
- 通过: X/Y
- 失败: Z

### 代码质量
- Clippy: PASS/FAIL
- ESLint: PASS/FAIL
- 类型检查: PASS/FAIL

### 构建测试
- 开发构建: PASS/FAIL
- 生产构建: PASS/FAIL

## 发现的问题
1. [问题描述]
   - 严重程度: Critical/High/Medium/Low
   - 位置: 文件:行号
   - 修复建议: [建议]

## 总体评估
🔴 RED / 🟢 GREEN

## 下一步行动
- [ ] 修复问题 X
- [ ] 添加测试 Y
- [ ] 优化代码 Z
```

## 成功标准

### 绿灯标准
- ✅ 所有单元测试通过
- ✅ 所有集成测试通过
- ✅ 所有 E2E 测试通过
- ✅ 代码质量检查通过
- ✅ 构建成功无警告
- ✅ 无安全漏洞

### 红灯标准
- ❌ 任何测试失败
- ❌ 代码质量检查失败
- ❌ 构建失败或有警告
- ❌ 发现安全漏洞
