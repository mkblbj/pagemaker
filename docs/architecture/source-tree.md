# 源代码目录结构 (Source Tree)

## 项目整体结构 (Project Structure Overview)

```plaintext
pagemaker/
├── apps/                           # 应用程序目录
│   ├── frontend/                   # Next.js 前端应用
│   │   ├── components.json         # shadcn/ui 组件配置
│   │   ├── eslint.config.mjs       # ESLint 配置
│   │   ├── next.config.ts          # Next.js 配置
│   │   ├── package.json            # 前端依赖管理
│   │   ├── postcss.config.mjs      # PostCSS 配置
│   │   ├── tsconfig.json           # TypeScript 配置
│   │   ├── public/                 # 静态资源
│   │   │   ├── file.svg
│   │   │   ├── globe.svg
│   │   │   ├── next.svg
│   │   │   ├── vercel.svg
│   │   │   └── window.svg
│   │   └── src/                    # 源代码目录
│   │       ├── app/                # Next.js App Router
│   │       │   ├── (protected)/    # 受保护的路由组
│   │       │   │   ├── dashboard/  # 仪表板页面
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── editor/     # 编辑器页面
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── layout.tsx  # 受保护路由布局
│   │       │   │   └── pages/      # 页面管理
│   │       │   │       └── page.tsx
│   │       │   ├── favicon.ico
│   │       │   ├── globals.css     # 全局样式
│   │       │   ├── layout.tsx      # 根布局
│   │       │   ├── login/          # 登录页面
│   │       │   │   └── page.tsx
│   │       │   └── page.tsx        # 首页
│   │       ├── components/         # React 组件
│   │       │   ├── __tests__/      # 组件测试
│   │       │   ├── feature/        # 功能组件
│   │       │   │   ├── PageEditor.tsx
│   │       │   │   ├── ModuleList.tsx
│   │       │   │   └── PropertiesPanel.tsx
│   │       │   ├── layout/         # 布局组件
│   │       │   │   ├── MainHeader.tsx
│   │       │   │   └── Sidebar.tsx
│   │       │   ├── test-component.tsx
│   │       │   └── ui/             # 基础 UI 组件 (shadcn/ui)
│   │       │       ├── button.tsx
│   │       │       ├── card.tsx
│   │       │       ├── input.tsx
│   │       │       ├── label.tsx
│   │       │       ├── select.tsx
│   │       │       └── textarea.tsx
│   │       ├── lib/                # 工具函数和配置
│   │       │   ├── apiClient.ts    # Axios 客户端配置
│   │       │   ├── types-test.ts
│   │       │   └── utils.ts        # 通用工具函数
│   │       ├── services/           # API 服务层
│   │       │   ├── pageService.ts  # 页面相关 API
│   │       │   ├── authService.ts  # 认证相关 API
│   │       │   └── mediaService.ts # 媒体相关 API
│   │       ├── stores/             # 状态管理 (Zustand)
│   │       │   ├── usePageStore.ts # 页面状态管理
│   │       │   ├── useEditorStore.ts # 编辑器状态管理
│   │       │   └── useAuthStore.ts # 认证状态管理
│   │       └── test/               # 测试相关文件
│   │
│   └── backend/                    # Django 后端应用
│       ├── htmlcov/                # 测试覆盖率报告
│       ├── logs/                   # 日志文件
│       ├── manage.py               # Django 管理脚本
│       ├── media_files/            # 用户上传的媒体文件
│       ├── pyproject.toml          # Python 项目配置
│       ├── pyrightconfig.json      # Pyright 类型检查配置
│       ├── pytest.ini             # Pytest 配置
│       ├── requirements.txt        # Python 依赖
│       ├── test_jwt.py            # JWT 测试文件
│       ├── TEST_SUMMARY.md        # 测试总结
│       ├── venv/                  # Python 虚拟环境
│       ├── pagemaker/             # Django 项目主目录
│       │   ├── __init__.py
│       │   ├── asgi.py            # ASGI 配置
│       │   ├── schemas.py         # API 模式定义
│       │   ├── settings.py        # Django 设置
│       │   ├── test_settings.py   # 测试环境设置
│       │   ├── urls.py            # 主 URL 配置
│       │   ├── validators.py      # 自定义验证器
│       │   └── wsgi.py            # WSGI 配置
│       ├── api/                   # API 路由和通用视图
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── migrations/
│       │   │   └── __init__.py
│       │   ├── models.py
│       │   ├── tests.py
│       │   ├── urls.py
│       │   └── views.py
│       ├── users/                 # 用户管理应用
│       │   ├── __init__.py
│       │   ├── admin.py           # Django Admin 配置
│       │   ├── apps.py            # 应用配置
│       │   ├── migrations/        # 数据库迁移文件
│       │   │   └── __init__.py
│       │   ├── models.py          # User 数据模型
│       │   ├── serializers.py     # DRF 序列化器
│       │   ├── repositories.py    # 数据访问层
│       │   ├── permissions.py     # 权限控制
│       │   ├── tests.py           # 单元测试
│       │   ├── urls.py            # URL 路由
│       │   └── views.py           # API 视图
│       ├── pages/                 # 页面管理应用
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── migrations/
│       │   │   └── __init__.py
│       │   ├── models.py          # PageTemplate 数据模型
│       │   ├── serializers.py     # 页面序列化器
│       │   ├── repositories.py    # PageTemplateRepository
│       │   ├── permissions.py     # IsOwnerOrAdmin 权限类
│       │   ├── tests.py
│       │   ├── urls.py
│       │   └── views.py           # 页面 CRUD API 视图
│       ├── media/                 # 媒体文件管理应用
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── migrations/
│       │   │   └── __init__.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── repositories.py
│       │   ├── permissions.py
│       │   ├── tests.py
│       │   ├── urls.py
│       │   └── views.py           # R-Cabinet 集成 API
│       └── tests/                 # 项目级测试
│           ├── __init__.py
│           ├── test_apps_structure.py
│           ├── test_jwt_auth.py
│           ├── test_settings.py
│           └── test_type_validation.py
│
├── packages/                      # 共享包目录
│   └── shared-types/              # 前后端共享类型定义
│       ├── eslint.config.mjs      # ESLint 配置
│       ├── package.json           # 包配置
│       ├── tsconfig.json          # TypeScript 配置
│       ├── src/                   # 源代码
│       │   ├── index.ts           # 主导出文件
│       │   └── types/             # 类型定义
│       │       ├── api.ts         # API 接口类型
│       │       ├── common.ts      # 通用类型
│       │       ├── page.ts        # 页面相关类型
│       │       └── user.ts        # 用户相关类型
│       └── tests/                 # 类型测试
│           └── integration.test.js
│
├── docs/                          # 项目文档
│   ├── agile-readme.md
│   ├── architect-requirements.md
│   ├── front-end-spec.md          # 前端 UI/UX 规格
│   ├── fullstack-architecture.md  # 全栈架构文档
│   ├── Pagemaker-Project-Brief.md
│   ├── prd.md                     # 产品需求文档
│   ├── requirements.md
│   ├── architecture/              # 架构文档目录
│   │   ├── architect-checklist-validation-report.md
│   │   ├── backend-architecture.md
│   │   ├── coding-standards.md
│   │   ├── components.md
│   │   ├── core-workflows.md
│   │   ├── data-models.md
│   │   ├── deployment-architecture.md
│   │   ├── development-workflow.md
│   │   ├── error-handling-strategy.md
│   │   ├── external-integrations.md
│   │   ├── frontend-architecture.md
│   │   ├── high-level-architecture.md
│   │   ├── index.md
│   │   ├── introduction.md
│   │   ├── rest-api-spec.md
│   │   ├── security-and-performance.md
│   │   ├── source-tree.md         # 本文档
│   │   ├── tech-stack.md
│   │   ├── testing-strategy.md
│   │   └── unified-project-structure.md
│   ├── prd/                       # PRD 分片文档
│   │   ├── change-log.md
│   │   ├── epic-overview.md
│   │   ├── functional-requirements-mvp.md
│   │   ├── goal-objective-and-context.md
│   │   ├── index.md
│   │   ├── key-reference-documents.md
│   │   ├── non-functional-requirements-mvp.md
│   │   ├── out-of-scope-ideas-post-mvp.md
│   │   ├── technical-assumptions.md
│   │   └── user-interaction-and-design-goals.md
│   ├── prompt/                    # AI 提示词文档
│   │   ├── dashboard-prompt.md
│   │   └── main-prompt.md
│   └── stories/                   # 用户故事文档
│       ├── 0.1.story.md
│       ├── 0.2.story.md
│       ├── 0.3.story.md
│       ├── 0.4.story.md
│       └── 0.5.story.md
│
├── tests/                         # 项目级测试
│   └── project-structure/
│       └── structure.test.js
│
├── package.json                   # Monorepo 根配置
├── pnpm-lock.yaml                # pnpm 锁定文件
├── pnpm-workspace.yaml           # pnpm 工作空间配置
└── README.md                     # 项目说明文档
```

## 关键目录说明 (Key Directory Descriptions)

### 前端结构 (Frontend Structure)

* **`src/app/`**: Next.js 15.3 App Router 目录结构
  * **`(protected)/`**: 路由组，包含需要认证的页面
  * **`login/`**: 公开的登录页面
* **`src/components/`**: 分层组件组织
  * **`ui/`**: shadcn/ui 基础组件
  * **`feature/`**: 业务功能组件
  * **`layout/`**: 布局组件
* **`src/stores/`**: Zustand 状态管理
* **`src/services/`**: API 调用封装层

### 后端结构 (Backend Structure)

* **Django Apps 按功能域划分**:
  * **`users/`**: 用户认证和管理
  * **`pages/`**: 页面/模板 CRUD 操作
  * **`media/`**: R-Cabinet 媒体集成
  * **`api/`**: 通用 API 路由和工具
* **每个 App 遵循标准 Django 结构**:
  * **`models.py`**: 数据模型定义
  * **`serializers.py`**: DRF 序列化器
  * **`repositories.py`**: 仓库模式数据访问层
  * **`permissions.py`**: 自定义权限类
  * **`views.py`**: API 视图实现
  * **`urls.py`**: URL 路由配置

### 共享类型 (Shared Types)

* **`packages/shared-types/`**: 前后端共享的 TypeScript 类型定义
  * **`types/api.ts`**: API 请求/响应接口
  * **`types/page.ts`**: PageTemplate 和 PageModule 类型
  * **`types/user.ts`**: User 相关类型
  * **`types/common.ts`**: 通用类型定义

### 文档结构 (Documentation Structure)

* **`docs/prd/`**: 产品需求文档分片
* **`docs/architecture/`**: 技术架构文档
* **`docs/stories/`**: 用户故事文档
* **`docs/prompt/`**: AI 开发提示词

## 命名约定 (Naming Conventions)

### 前端 (Frontend)
* **组件**: `PascalCase` (例: `PageEditor.tsx`)
* **文件和目录**: `camelCase` (例: `pageService.ts`)
* **常量**: `UPPER_SNAKE_CASE`
* **变量和函数**: `camelCase`

### 后端 (Backend)
* **模型和类**: `PascalCase` (例: `PageTemplate`)
* **文件和目录**: `snake_case` (例: `page_service.py`)
* **变量和函数**: `snake_case`
* **常量**: `UPPER_SNAKE_CASE`

## 测试文件组织 (Test File Organization)

### 前端测试
* **单元测试**: 与组件并置，使用 `.test.tsx` 后缀
* **集成测试**: 放在 `src/test/` 目录
* **E2E 测试**: 使用 Playwright，单独的测试目录

### 后端测试
* **单元测试**: 每个 Django App 的 `tests.py` 文件
* **集成测试**: `tests/` 目录下的项目级测试
* **API 测试**: 使用 Django REST Framework 测试客户端

## 配置文件说明 (Configuration Files)

* **`package.json`**: Monorepo 根配置，定义工作空间和脚本
* **`pnpm-workspace.yaml`**: pnpm 工作空间配置
* **`tsconfig.json`**: TypeScript 编译配置
* **`eslint.config.mjs`**: ESLint 代码检查配置
* **`next.config.ts`**: Next.js 框架配置
* **`settings.py`**: Django 应用配置
* **`requirements.txt`**: Python 依赖管理 