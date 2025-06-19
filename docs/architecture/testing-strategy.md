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

## 16.3 测试范围与示例 (Test Scope & Examples)

* **单元测试 (Unit Tests)**: 测试最小的功能单元，所有外部依赖都必须被模拟（Mock）。
* **集成测试 (Integration Tests)**: 测试多个单元协同工作的场景。
* **端到端测试 (E2E Tests)**: 使用 **Playwright** 模拟真实用户，执行一个完整的核心用户旅程。 