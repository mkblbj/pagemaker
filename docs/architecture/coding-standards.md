# 编码规范 (Coding Standards)

## 17.1 核心规范 (Core Standards)

* **语言与版本**: 严格遵守"技术栈"部分定义的版本。
* **代码格式化**: **强制使用** Prettier (前端) 和 Black (后端)。
* **代码检查 (Linting)**: 使用 ESLint (前端) 和 Flake8 (后端)。
* **命名约定 (Naming Conventions)**: 前端`camelCase`/`PascalCase`，后端`snake_case`/`PascalCase`。

## 17.2 关键编码规则 (Critical Coding Rules)

1.  **必须使用仓库模式**: 后端视图严禁直接调用Django ORM。
2.  **必须使用共享类型**: 前后端共享的数据结构必须在`packages/shared-types`中定义。
3.  **必须使用服务层**: 前端组件严禁直接调用`axios`或`fetch`。
4.  **严禁直接访问环境变量**: 应通过集中的配置模块导出。
5.  **严禁硬编码**: 所有常量值必须在专门的常量文件中定义。 