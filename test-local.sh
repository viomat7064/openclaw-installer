#!/bin/bash

# OpenClaw Installer - 快速测试脚本
# 用于在本地验证所有功能

set -e

PROJECT_DIR="/media/viomat/Data/CLAUDE/openclaw-installer/openclaw-installer"
cd "$PROJECT_DIR"

echo "=========================================="
echo "OpenClaw Installer - 快速测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_step() {
    echo -e "${YELLOW}[测试]${NC} $1"
}

test_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED++))
}

# 1. 检查分支状态
test_step "检查 Git 分支状态"
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "v2-dev" ]; then
    test_pass "分支正确"
else
    test_fail "分支不正确，应该在 main 或 v2-dev"
fi

# 2. 检查未提交的修改
test_step "检查未提交的修改"
if [ -z "$(git status --porcelain)" ]; then
    test_pass "工作区干净"
else
    test_fail "有未提交的修改"
    git status --short
fi

# 3. 检查 Rust 编译
test_step "检查 Rust 编译"
cd src-tauri
if cargo check 2>&1 | grep -q "Finished"; then
    test_pass "Rust 编译通过"
else
    test_fail "Rust 编译失败"
fi

# 4. 运行 Rust 测试
test_step "运行 Rust 单元测试"
TEST_OUTPUT=$(cargo test 2>&1)
if echo "$TEST_OUTPUT" | grep -q "test result: ok"; then
    TEST_COUNT=$(echo "$TEST_OUTPUT" | grep "test result: ok" | head -1 | awk '{print $4}')
    test_pass "Rust 测试通过 ($TEST_COUNT 个测试)"
else
    test_fail "Rust 测试失败"
    echo "$TEST_OUTPUT" | tail -20
fi

# 5. 检查 Clippy
test_step "运行 Clippy 代码检查"
if cargo clippy -- -D warnings 2>&1 | grep -q "Finished"; then
    test_pass "Clippy 检查通过"
else
    test_fail "Clippy 发现问题"
fi

cd ..

# 6. 检查 Node.js 依赖
test_step "检查 Node.js 依赖"
if [ -d "node_modules" ]; then
    test_pass "Node.js 依赖已安装"
else
    test_fail "Node.js 依赖未安装，运行: npm install"
fi

# 7. 检查 TypeScript 类型
test_step "检查 TypeScript 类型"
if npm run type-check 2>&1 | grep -q "error"; then
    test_fail "TypeScript 类型错误"
else
    test_pass "TypeScript 类型检查通过"
fi

# 8. 检查关键文件
test_step "检查关键文件"
REQUIRED_FILES=(
    "src-tauri/src/commands/models.rs"
    "src-tauri/src/commands/troubleshoot.rs"
    "src-tauri/src/commands/resources.rs"
    "src/components/ModelManagement.tsx"
    "src/components/Troubleshooting.tsx"
    "src/hooks/useModelManagement.ts"
    "src/hooks/useTroubleshooting.ts"
    "TESTING.md"
    "TEST_REPORT_ROUND3.md"
    "DEVELOPMENT_SUMMARY.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_pass "文件存在: $file"
    else
        test_fail "文件缺失: $file"
    fi
done

# 9. 检查 V2 资源目录
if [ "$CURRENT_BRANCH" = "v2-dev" ]; then
    test_step "检查 V2 资源目录"
    if [ -d "src-tauri/resources" ]; then
        test_pass "资源目录存在"
        if [ -f "src-tauri/resources/mirrors.json" ]; then
            test_pass "镜像配置存在"
        else
            test_fail "镜像配置缺失"
        fi
    else
        test_fail "资源目录缺失"
    fi
fi

# 10. 检查测试报告
test_step "检查测试报告"
if [ -f "TEST_REPORT_ROUND3.md" ]; then
    if grep -q "🟢 GREEN" TEST_REPORT_ROUND3.md; then
        test_pass "Round 3 测试通过"
    else
        test_fail "Round 3 测试未通过"
    fi
else
    test_fail "测试报告缺失"
fi

# 总结
echo ""
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！可以进行手动测试${NC}"
    echo ""
    echo "下一步:"
    echo "1. 运行开发模式: npm run tauri dev"
    echo "2. 测试所有功能"
    echo "3. 构建生产版本: npm run tauri build"
    echo "4. 测试通过后推送到 GitHub"
    exit 0
else
    echo -e "${RED}✗ 有 $FAILED 个测试失败，请修复后再测试${NC}"
    exit 1
fi
