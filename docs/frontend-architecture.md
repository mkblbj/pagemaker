# Pagemaker 前端架构文档

**版本:** 1.0
**日期:** 2025年6月8日
**作者:** Jane (设计架构师)

## 1. 引言 (Introduction)

本文档详细定义了Pagemaker项目的前端技术架构。它基于已确认的PRD和主系统架构文档，旨在为前端开发提供清晰、一致、高质量的蓝图和规范。

* **主架构文档链接:** `architecture.md`
* **产品需求文档(PRD)链接:** `requirements-PRD.md`

## 2. 整体前端理念与模式 (Overall Frontend Philosophy & Patterns)

* **框架与核心库:** 严格遵循主架构文档的规定，使用 **Next.js 15.3**, **shadcn/ui 2.6**, **Tailwind CSS 4.1** 和 **ahooks**。
* **组件架构:** 采用混合策略：在 `src/components/ui` 目录中放置全局通用的UI基础组件。特定功能的组件与其业务逻辑代码共同存放在 `src/features/[feature-name]/components/` 下，以实现高内聚。
* **数据流:** 优先使用Next.js的**服务器组件 (Server Components)** 来直接获取和展示静态或不常变化的数据。对于客户端的复杂交互和数据获取，将使用客户端组件，并通过 **ahooks** 中的`useRequest`或类似的自定义Hooks来调用后端API。
* **样式方案:** 明确使用 **Tailwind CSS**，遵循utility-first的原则。
* **状态管理:** 采用 **Zustand** 作为全局状态管理库，以其简洁性和灵活性来管理跨组件的共享状态。

## 3. 详细的前端目录结构 (Detailed Frontend Directory Structure)

```plaintext
frontend/
├── public/                     # 静态资源目录
│   └── locales/                # i18n 国际化语言文件
│       ├── en/
│       │   └── common.json
│       ├── ja/
│       │   └── common.json
│       └── zh/
│           └── common.json
└── src/
    ├── app/                    # Next.js App Router: 包含所有页面、布局和路由
    │   ├── (cms)/              # CMS功能路由组
    │   │   ├── dashboard/      # 页面/模板管理视图
    │   │   │   └── page.tsx
    │   │   └── editor/         # 页面编辑器视图
    │   │       └── [pageId]/   # 动态路由，用于新建或编辑页面
    │   │           └── page.tsx
    │   └── (auth)/             # 认证相关页面路由组
    │   │   └── login/
    │   │       └── page.tsx
    │   ├── layout.tsx          # 应用的根布局
    │   └── globals.css         # 全局样式
    ├── components/             # 全局可复用的UI组件
    │   └── ui/                 # 基础UI组件 (来自shadcn/ui或自定义)
    ├── features/               # 按功能划分的业务逻辑和非全局组件
    │   ├── editor/             # 编辑器核心功能
    │   │   ├── components/     # 编辑器专属组件
    │   │   └── hooks/          # 编辑器相关hooks
    │   └── page-management/  # 页面管理功能
    ├── hooks/                  # 全局可复用的自定义Hooks
    ├── lib/                    # 通用工具函数、常量等
    ├── services/               # API服务层，封装对后端API的调用
    └── store/                  # Zustand状态管理
        ├── editorStore.ts      # 编辑器相关的store
        └── sessionStore.ts     # 用户会话相关的store
```

## 4. 组件分解与实现细节 (Component Breakdown & Implementation Details)

### 4.1 组件命名与组织
* **命名规范:** 所有React组件文件和组件本身都使用 **大驼峰命名法 (PascalCase)** (例如, `UserProfileCard.tsx`)。
* **组织规范:** 严格遵守已确定的目录结构。全局组件在`src/components/`，功能性组件在`src/features/`下。

### 4.2 组件规范模板
所有新组件的开发都必须遵循以下规范模板，以确保清晰、完整和一致。

#### 组件: `{组件名}`
* **用途:** {简要描述组件的作用和在UI中的角色}
* **源文件路径:** `{组件在项目结构中的确切路径}`
* **视觉参考:** {指向设计稿中对应组件的具体链接}
* **属性 (Props):** (表格形式，列出属性名、类型、是否必须、默认值、描述)
* **内部状态 (Internal State):** (若有，表格形式，列出状态变量、类型、初始值、描述)
* **关键UI元素/结构:** (使用伪代码或JSX描述组件的DOM结构)
* **触发的动作 (Actions Triggered):** (描述组件会触发哪些API调用或Zustand的action)
* **样式说明 (Styling Notes):** (描述使用的主要Tailwind CSS类)
* **无障碍访问性说明 (Accessibility Notes):** (列出需要满足的ARIA属性、键盘导航行为等)

## 5. 国际化(i18n)策略 (Internationalization (i18n) Strategy)

### 5.1 核心目标与语言
* **目标:** 实现一个高效、可维护、可扩展的多语言方案，支持中、日、英三种语言。开发者只需维护中文版本，其他语言版本通过自动化流程生成。
* **支持语言:** `zh` (源语言), `ja` (自动翻译), `en` (自动翻译)。

### 5.2 技术选型
* **核心框架:** `next-i18next` (版本要求: 15.4+)。
* **自动化翻译服务:** 在CI/CD流程中集成一个翻译API（如 Google Cloud Translation, DeepL 等）。

### 5.3 工作流与文件结构
* **单一事实来源:** 所有文本的键和内容都在中文的语言文件中定义。
* **命名空间 (Namespaces):** 根据功能领域划分JSON文件，存放于`public/locales/{lng}/`目录下（例如 `common.json`, `editor.json`）。
* **自动化流程:** 在CI/CD构建阶段，脚本将自动读取`zh`目录下的文件，调用翻译API生成并更新`ja`和`en`目录下的对应文件。

### 5.4 Post-MVP规划
* 考虑引入专业的翻译管理平台（TMS）以支持更复杂的人工审校和翻译工作流程。

## 6. API交互层 (API Interaction Layer)

### 6.1 HTTP 客户端设置
我们将创建一个全局配置的 **Axios实例**，作为所有API请求的统一出口，存放于 `src/services/apiClient.ts`。配置将包括：
* **Base URL:** 从环境变量读取后端的API根地址。
* **请求拦截器 (Request Interceptor):** 自动从Zustand `sessionStore`中读取JWT并添加到`Authorization`头。
* **响应拦截器 (Response Interceptor):** 统一处理全局API错误（如401未授权则自动登出）。

### 6.2 服务定义结构
我们将按照功能领域在`src/services/`目录下组织API调用，例如：
* `authService.ts`: 封装认证相关API。
* `pageService.ts`: 封装页面/模板CRUD相关API。
* `mediaService.ts`: 封装媒体上传相关API。

### 6.3 前端错误处理策略
* **使用“翻译键”:** API返回的结构化业务错误（如 `{"error": {"code": "..."}}`）将使用其`code`作为翻译键，由前端i18n系统展示本地化的错误信息。
* **内联UI反馈:** 表单等操作的字段级错误应直接显示在对应输入框旁。

## 7. 路由策略 (Routing Strategy)

### 7.1 路由库
我们将使用 **Next.js的App Router** 作为路由解决方案。

### 7.2 路由定义

| 路径 (Path Pattern) | 页面组件路径 (Component/Page Path) | 访问权限 (Protection) | 备注 (Notes) |
| :--- | :--- | :--- | :--- |
| `/login` | `src/app/(auth)/login/page.tsx` | `Public` (访客) | 如果用户已登录，访问此页面应自动重定向到`/dashboard`。 |
| `/dashboard` | `src/app/(cms)/dashboard/page.tsx` | `Authenticated` (需认证) | 页面/模板管理视图。是用户登录后的主页面。 |
| `/editor/new` | `src/app/(cms)/editor/[pageId]/page.tsx` | `Authenticated` (需认证) | 创建新页面的编辑器视图。 |
| `/editor/{pageId}` | `src/app/(cms)/editor/[pageId]/page.tsx` | `Authenticated` (需认证) | 编辑ID为`{pageId}`的已有页面。 |

### 7.3 路由守卫/访问控制
* 将使用 **Next.js中间件 (Middleware)** (`middleware.ts`) 来保护需要认证的路由。
* 中间件会检查用户的认证状态，如果未认证，则将用户重定向到`/login`页面。

## 8. 构建、打包与部署 (Build, Bundling, and Deployment)

### 8.1 构建流程与脚本
* **核心脚本:** 使用`package.json`中定义的`next dev`, `next build`, `next start`, `next lint`等标准脚本。
* **环境变量管理:** 通过根目录下的`.env`系列文件进行管理，这些文件不提交到GitHub。

### 8.2 关键打包优化
* **代码分割:** Next.js的App Router会自动按路由进行代码分割。对于大型非首屏库将使用动态`import()`进行懒加载。
* **Tree Shaking & 压缩:** 在生产构建时自动启用。

### 8.3 部署
* **开发环境:** 前端将持续部署到 **Vercel**。
* **生产环境:** 最终构建的前端产物将被部署到 **本地内网服务器** 上运行。

## 9. 前端测试策略 (Frontend Testing Strategy)

### 9.1 组件测试
* **范围:** 对独立的UI组件进行隔离测试。
* **工具:** **Vitest** 配合 **React Testing Library**。
* **关注点:** 组件渲染、交互行为、基础可访问性。
* **文件位置:** 测试文件必须放置在与组件源文件同级的 **`__tests__`** 子目录中，并且文件名必须使用 **`.test.tsx`** 的后缀。例如，`src/components/ui/Button.tsx` 的测试文件为 `src/components/ui/__tests__/Button.test.tsx`。

### 9.2 UI集成/流程测试
* **范围:** 测试由多个组件组合而成的小型用户流程。
* **工具:** Vitest, React Testing Library, 并配合模拟的store和API（使用`msw`）。
* **关注点:** 组件协作、与全局状态和模拟API的集成。

### 9.3 端到端（E2E）UI测试
* **工具:** **Playwright**。
* **范围 (MVP):** 覆盖2-3个核心用户旅程，如成功登录、创建并导出页面、复制和删除页面。

## 10. 无障碍访问性 (AX) 实现细节

### 10.1 MVP阶段基础准则
* **使用语义化HTML:** 优先使用具有明确语义的HTML5标签。
* **提供图像替代文本:** 所有由CMS添加的图片都必须有有意义的`alt`描述。
* **保证基本的键盘导航:** 所有可交互的元素必须能通过键盘访问和操作。
* **关注焦点状态:** 所有可交互的元素在获得键盘焦点时，必须有清晰可见的视觉样式。

## 11. 性能考量 (Performance Considerations)

### 11.1 核心性能优化策略
* **图片优化:** 强制使用Next.js的`<Image>`组件进行渲染。
* **减少不必要的重渲染:** 使用`React.memo`和细粒度的Zustand选择器。
* **代码分割与懒加载:** 对大型非首屏库使用动态`import()`。
* **防抖与节流:** 对频繁触发的事件使用防抖（debounce）技术。

## 12. 变更日志 (Change Log)

| 版本 | 日期 | 变更描述 | 作者 |
| --- | --- | --- | --- |
| 1.0 | {TBD} | 初始前端架构文档创建 | Jane |