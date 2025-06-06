# Pagemaker 架构文档

**版本:** 1.0
**日期:** 2025年6月6日
**作者:** Fred (架构师)

## 1. 技术概要 (Technical Summary)

Pagemaker项目将采用前后端分离的架构模式，在一个Monorepo代码库中进行管理。前端将使用由v0.dev工具链驱动的Next.js技术栈（基于React），后端将采用Python的Django框架。系统通过一套RESTful API进行前后端通信，并使用MySQL 8.4+作为主数据库。项目将采用混合部署模式：开发环境部署于云端（Vercel + 云服务器）以方便调试，生产环境统一部署于内网服务器以保障数据安全。

## 2. 高层级概览 (High-Level Overview)

* **架构风格:** 前后端分离，通过RESTful API进行有状态的（基于令牌的）通信。
* **代码库结构:** Monorepo，内含独立的 `frontend`、`backend` 和共享的 `packages/types` 目录。
* **后端 (Backend):** Django应用，作为无头CMS，负责提供所有业务逻辑、数据持久化（通过MySQL）、用户认证以及API服务。
* **前端 (Frontend):** Next.js应用，作为Pagemaker CMS的操作界面，负责所有用户界面的渲染和交互，并通过API与后端通信。

## 3. 架构/设计模式 (Architectural / Design Patterns)

* **前后端分离 (Frontend-Backend Separation):** 确保UI逻辑和业务逻辑的独立演进。
* **Monorepo:** 简化个人开发者的项目管理和依赖管理，便于前后端类型共享。
* **RESTful API:** 作为前后端之间清晰、无状态的通信契约。
* **功能性App划分 (Feature-based App Structure for Django):** 将后端按职责（`users`, `pages`, `api`, `media`）划分为内聚的应用，提高可维护性。

## 4. 组件视图与应用划分 (Component View & App Division)

后端的Django项目将由以下几个核心应用组成：
* **`users` App:** 负责用户模型、认证（登录/注册）、授权和令牌管理。
* **`pages` App:** 负责`PageTemplate`数据模型、模块化内容（JSON）的CRUD操作和版本控制逻辑。
* **`media` App:** 负责代理与乐天R-Cabinet的交互，主要是图片的上传。
* **`api` App:** 作为API的统一路由层，负责URL结构定义和版本控制（`/api/v1/...`）。

## 5. 项目结构 (Project Structure)

```plaintext
pagemaker-monorepo/
├── .ai/                    # AI辅助开发的相关文档 (PRD等)
├── backend/                # Django后端项目
│   ├── api/
│   ├── users/
│   ├── pages/
│   ├── media/
│   ├── pagemaker/
│   └── manage.py
├── docs/                   # 项目文档
├── frontend/               # Next.js前端项目
│   ├── ... (Next.js项目标准结构)
│   └── package.json
└── packages/               # 共享代码包
    └── types/              # 共享的TypeScript类型定义
        └── index.ts
```
      *packages/types/: 这是一个共享的TypeScript包，用于定义前后端通用的数据结构（例如，API的请求和响应体、页面模块的JSON结构），确保数据格式的一致性。

## 6. API参考 (API Reference - 初步定义)

API将以`/api/v1/`为前缀。认证将通过HTTP Header中的Bearer Token（JWT）进行。

### 认证API (`/api/v1/auth/`)
* `POST /login`: 用户登录，成功后返回JWT。
* `GET /me`: 获取当前用户信息。

### 页面/模板API (`/api/v1/pages/`)
* `GET /`: 获取所有页面/模板的列表。
* `POST /`: 创建一个新的页面/模板。
* `GET /{id}/`: 获取ID为`{id}`的页面/模板的详细内容。
* `PUT /{id}/`: 更新/保存ID为`{id}`的页面/模板。
* `DELETE /{id}/`: 删除ID为`{id}`的页面/模板。
* `POST /{id}/copy/`: 复制ID为`{id}`的页面/模板。

### 媒体API (`/api/v1/media/`)
* `POST /images/upload/`: 上传图片到R-Cabinet，成功后返回图片URL。

## 7. 数据模型 (Data Models)

### `users.User` 模型
* `username`: CharField (unique)
* `password`: CharField (stores hash)
* `email`: EmailField (optional, unique)
* `is_active`: BooleanField (default: True)
* `date_joined`: DateTimeField (auto_now_add)

### `pages.PageTemplate` 模型
* `name`: CharField
* `description`: TextField (optional)
* `rakuten_target_area`: CharField
* `content`: JSONField (核心字段，存储模块化内容的JSON数组)
* `owner`: ForeignKey to `users.User`
* `created_at`: DateTimeField (auto_now_add)
* `updated_at`: DateTimeField (auto_now)

## 8. 技术选型表 (Definitive Tech Stack Selections)

| 类别 | 技术 | 版本/细节 | 描述/用途 |
| :--- | :--- | :--- | :--- |
| **语言** | Python | 3.11+ | 后端开发语言 |
| | TypeScript | 5.x+ | 前端开发语言 |
| **框架** | Django | 5.x+ | 后端API框架 |
| | Next.js | 15.3 | 前端React框架 |
| | Tailwind CSS | 4.1 | 前端CSS框架 |
| | shadcn/ui | 2.6 | 前端UI组件库 |
| **数据库** | MySQL | 8.4+ | 主数据存储 |
| **运行时** | Python | (由Django决定) | |
| | Node.js | 22.2+ | 前端开发和构建环境 |
| **Hooks库** | ahooks | latest | 前端React Hooks库 |
| **UI生成工具**| v0.dev | N/A | 用于辅助生成前端UI组件 |
| **测试框架**| PyTest, Jest/Vitest | TBD | 后端和前端的单元/集成测试 |
| **CI/CD** | GitHub Actions | TBD | 持续集成与部署 |
| **云平台** | (根据部署环境区分) | N/A | |

## 9. 部署与DevOps (Infrastructure and Deployment)

* **版本管理:** 代码将托管在**GitHub**上进行版本管理。
* **开发环境:**
    * **前端:** 推荐部署在**Vercel**，以利用其与Next.js的良好集成和便捷的预览功能。
    * **后端:** 推荐部署在一台**云服务器**上（如AWS EC2, GCP, DigitalOcean等）。
    * **CI/CD:** 推荐使用**GitHub Actions**。当代码推送到`develop`或`main`分支时，自动运行测试、构建Docker镜像并部署到开发环境。
* **生产环境:**
    * **部署位置:** 前端和后端应用都将部署在**本地内网服务器**上，以最大化保障数据安全。
    * **部署方式:** 推荐使用**Docker**进行容器化部署，以简化环境管理和应用交付。

## 10. 编码与安全规范 (Coding & Security Standards)

* **后端 (Python/Django):**
    * 代码格式化: 强制使用 `black`。
    * 代码质量检查: 使用 `flake8`。
    * 安全: 充分利用Django内置的安全特性（如CSRF防护、XSS防护、SQL注入防护）。API权限将使用Django REST Framework的权限类进行控制。
* **前端 (TypeScript/Next.js):**
    * 代码格式化与质量检查: 强制使用 `ESLint` 和 `Prettier`。
* **安全通信:**
    * **开发环境:** Django后端需配置CORS（使用`django-cors-headers`），允许来自Vercel前端域名的跨域请求。
    * **生产环境:** 推荐为内网服务器生成并使用**自签名SSL/TLS证书**，以在内网中实现HTTPS加密通信，保障认证令牌等敏感信息的传输安全。
* **Secrets管理:** 所有敏感信息（如数据库密码、乐天API密钥、JWT密钥）必须通过环境变量注入，绝不能硬编码在代码中。