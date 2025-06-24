# 测试策略 (Testing Strategy)

## 16.1 测试金字塔 (Testing Pyramid)

```text
        / \
       / E2E \      <-- (少量) 端到端测试 (Playwright)
      /_______\
     /         \
    / Integration \   <-- (适量) 集成测试 (Pytest, Vitest)
   /_____________\
  /               \
 /  Unit Tests     \  <-- (大量) 单元测试 (Pytest, Vitest)
/_________________\
```

## 16.2 测试组织 (Test Organization)

* **前端 (`apps/frontend`):**
    * 测试文件 (`.test.tsx`) 将与被测试的组件或函数文件**并置存放**。例如，`Button.tsx` 的测试文件是 `Button.test.tsx`。
    * 测试框架为 **Vitest**。

* **后端 (`apps/backend`):**
    * 每个Django App内部都会有一个`tests/`目录，用于存放该App的所有测试代码。
    * 测试框架为 **Pytest**。
    * 使用MySQL数据库进行测试（不创建新数据库，避免权限问题）。
    * 测试配置文件：`pagemaker/test_settings.py`。

## 16.3 测试范围与示例 (Test Scope & Examples)

* **单元测试 (Unit Tests)**: 测试最小的功能单元，所有外部依赖都必须被模拟（Mock）。
* **集成测试 (Integration Tests)**: 测试多个单元协同工作的场景。
* **端到端测试 (E2E Tests)**: 使用 **Playwright** 模拟真实用户，执行一个完整的核心用户旅程。

## 16.4 测试运行方式 (Test Execution)

### 前端测试
```bash
# 运行前端测试
cd apps/frontend
pnpm test

# 运行测试并生成覆盖率
pnpm test -- --coverage
```

### 后端测试
```bash
# 推荐方式：使用Makefile
cd apps/backend
make test                 # 运行所有测试
make test-coverage        # 运行测试并生成覆盖率

# 直接使用pytest
DJANGO_SETTINGS_MODULE=pagemaker.test_settings python -m pytest
```

### 共享类型测试
```bash
# 运行共享类型测试
cd packages/shared-types
pnpm test
```

### 全项目测试
```bash
# 从项目根目录运行所有测试
pnpm test
```

## 16.5 测试数据库配置 (Test Database Configuration)

### 后端测试数据库
- **数据库类型**: MySQL（与开发环境相同）
- **数据库名称**: 使用现有开发数据库
- **权限要求**: 用户需要对现有数据库的读写权限
- **配置文件**: `apps/backend/pagemaker/test_settings.py`
- **特殊设置**: `CREATE_DB = False` 避免创建新数据库

### 配置原因
- 避免数据库权限问题（无需创建新数据库的权限）
- 保持与生产环境的一致性
- 简化测试环境配置 