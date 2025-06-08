# Pagemaker 前端架构文档

**版本:** 2.1
**日期:** 2025年6月8日
**作者:** Jane (设计架构师)

## 1. 引言 (Introduction)

本文档详细定义了Pagemaker项目的前端技术架构。它基于已确认的PRD v1.2和主系统架构文档v2.1，旨在为前端开发提供清晰、一致、高质量的蓝图和规范。

**架构更新重点:** 本版本专注于前端特定的实现细节，包括v0.dev工具链集成、组件架构设计、性能优化策略和前端开发工作流。系统级架构设计请参考 `architecture.md`。

* **主架构文档链接:** `architecture.md` (v2.1)
* **产品需求文档(PRD)链接:** `requirements-PRD.md` (v1.2)
* **Epic 0依赖:** 本架构完全支持项目基础设施设置的所有前端需求

## 2. 前端技术理念与模式 (Frontend Philosophy & Patterns)

* **框架与核心库:** 严格遵循主架构文档的规定，使用 **Next.js 15.3**, **shadcn/ui 2.6**, **Tailwind CSS 4.1** 和 **ahooks**。
* **v0.dev工具链集成:** 采用混合开发策略，使用v0.dev快速生成UI组件原型，然后通过标准化流程改造为生产级代码。
* **组件架构:** 采用混合策略：在 `src/components/ui` 目录中放置全局通用的UI基础组件。特定功能的组件与其业务逻辑代码共同存放在 `src/features/[feature-name]/components/` 下，以实现高内聚。
* **数据流:** 优先使用Next.js的**服务器组件 (Server Components)** 来直接获取和展示静态或不常变化的数据。对于客户端的复杂交互和数据获取，将使用客户端组件，并通过 **ahooks** 中的`useRequest`或类似的自定义Hooks来调用后端API。
* **样式方案:** 明确使用 **Tailwind CSS**，遵循utility-first的原则。
* **状态管理:** 采用 **Zustand** 作为全局状态管理库，以其简洁性和灵活性来管理跨组件的共享状态。
* **性能优先:** 实现懒加载、代码分割、虚拟化等性能优化策略，确保编辑器在处理大量模块时保持流畅。

## 3. 前端目录结构 (Frontend Directory Structure)

```plaintext
frontend/
├── .github/                    # GitHub Actions工作流 (前端特定)
│   └── workflows/
│       └── frontend-ci.yml
├── public/                     # 静态资源目录
│   ├── locales/                # i18n 国际化语言文件
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── editor.json
│   │   │   └── modules.json
│   │   ├── ja/
│   │   │   ├── common.json
│   │   │   ├── editor.json
│   │   │   └── modules.json
│   │   └── zh/
│   │       ├── common.json
│   │       ├── editor.json
│   │       └── modules.json
│   └── icons/                  # 项目图标和SVG资源
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
    │   ├── api/                # Next.js API路由 (如果需要)
    │   ├── layout.tsx          # 应用的根布局
    │   ├── loading.tsx         # 全局加载组件
    │   ├── error.tsx           # 全局错误边界
    │   ├── not-found.tsx       # 404页面
    │   └── globals.css         # 全局样式
    ├── components/             # 全局可复用的UI组件
    │   ├── ui/                 # 基础UI组件 (来自shadcn/ui或自定义)
    │   ├── layout/             # 布局相关组件
    │   └── common/             # 通用业务组件
    ├── features/               # 按功能划分的业务逻辑和非全局组件
    │   ├── auth/               # 用户认证功能
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   └── services/
    │   ├── editor/             # 编辑器核心功能
    │   │   ├── components/
    │   │   │   ├── Canvas/     # 编辑画布
    │   │   │   ├── ModulePanel/ # 模块选择面板
    │   │   │   ├── PropertyPanel/ # 属性配置面板
    │   │   │   └── Toolbar/    # 编辑器工具栏
    │   │   ├── hooks/
    │   │   ├── services/
    │   │   └── types/
    │   ├── modules/            # 内容模块实现
    │   │   ├── basic/          # 基础模块
    │   │   │   ├── TitleModule/
    │   │   │   ├── TextModule/
    │   │   │   ├── ImageModule/
    │   │   │   └── SeparatorModule/
    │   │   ├── advanced/       # 高级模块
    │   │   │   ├── MultiColumnModule/
    │   │   │   └── VideoModule/
    │   │   └── shared/         # 模块共享组件
    │   ├── pages/              # 页面管理功能
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   └── services/
    │   └── media/              # 媒体管理功能
    │       ├── components/
    │       ├── hooks/
    │       └── services/
    ├── hooks/                  # 全局可复用的自定义Hooks
    ├── lib/                    # 通用工具函数、常量等
    │   ├── utils.ts            # 通用工具函数
    │   ├── constants.ts        # 应用常量
    │   ├── validations.ts      # 表单验证规则
    │   ├── performance.ts      # 性能优化工具
    │   ├── datetime.ts         # 时区处理工具
    │   └── v0-integration.ts   # v0.dev集成工具
    ├── services/               # API服务层，封装对后端API的调用
    │   ├── api-client.ts       # Axios配置和拦截器
    │   ├── auth.service.ts     # 认证服务
    │   ├── pages.service.ts    # 页面管理服务
    │   └── media.service.ts    # 媒体服务
    ├── store/                  # Zustand状态管理
    │   ├── editor.store.ts     # 编辑器相关的store
    │   ├── session.store.ts    # 用户会话相关的store
    │   └── ui.store.ts         # UI状态管理
    ├── types/                  # 前端特定类型定义
    │   ├── api.types.ts        # API相关类型
    │   ├── editor.types.ts     # 编辑器类型
    │   └── ui.types.ts         # UI组件类型
    └── __tests__/              # 全局测试配置和工具
        ├── setup.ts            # 测试环境设置
        ├── mocks/              # 测试模拟数据
        └── utils/              # 测试工具函数
```

## 4. v0.dev工具链集成架构 (v0.dev Toolchain Integration Architecture)

### 4.1 组件生成工作流

#### 生成策略
1. **原型阶段:** 使用v0.dev快速生成核心UI组件原型
2. **质量验证:** 对生成的代码进行质量评估和兼容性测试
3. **标准化改造:** 将生成的组件改造为符合项目标准的可维护代码
4. **集成测试:** 确保组件与shadcn/ui和项目架构的兼容性

#### v0.dev集成工具实现
```typescript
// src/lib/v0-integration.ts
export class V0ComponentProcessor {
  /**
   * 标准化v0.dev生成的组件代码
   */
  static standardizeComponent(generatedCode: string): string {
    // 1. 添加TypeScript类型注解
    // 2. 统一导入路径（使用项目别名）
    // 3. 添加错误边界
    // 4. 确保无障碍访问性
    // 5. 添加测试ID属性
    return this.processCode(generatedCode);
  }
  
  /**
   * 验证组件质量
   */
  static validateComponent(component: React.ComponentType): ValidationResult {
    return {
      accessibility: this.checkA11y(component),
      performance: this.checkPerformance(component),
      compatibility: this.checkCompatibility(component)
    };
  }
}
```

#### 质量检查清单
- [ ] TypeScript类型安全
- [ ] 响应式设计兼容性
- [ ] 无障碍访问性标准
- [ ] 性能优化（懒加载、代码分割）
- [ ] 测试覆盖率 ≥ 80%
- [ ] shadcn/ui组件库兼容性
- [ ] 项目代码规范符合性

### 4.2 备用UI开发策略

如果v0.dev工具链不能满足需求，将采用以下备用策略：
1. **手动组件开发:** 基于shadcn/ui组件库手动构建UI
2. **设计系统:** 建立统一的设计令牌和组件规范
3. **组件库扩展:** 在shadcn/ui基础上构建项目特定的组件库

## 5. 组件架构与实现规范 (Component Architecture & Implementation Standards)

### 5.1 组件命名与组织
* **命名规范:** 所有React组件文件和组件本身都使用 **大驼峰命名法 (PascalCase)** (例如, `UserProfileCard.tsx`)。
* **组织规范:** 严格遵守已确定的目录结构。全局组件在`src/components/`，功能性组件在`src/features/`下。
* **v0.dev生成组件:** 生成的组件需要经过标准化处理后才能集成到项目中。

### 5.2 组件规范模板
所有新组件的开发都必须遵循以下规范模板，以确保清晰、完整和一致。

#### 组件: `{组件名}`
* **用途:** {简要描述组件的作用和在UI中的角色}
* **源文件路径:** `{组件在项目结构中的确切路径}`
* **生成方式:** {手动开发 | v0.dev生成 | shadcn/ui扩展}
* **视觉参考:** {指向设计稿中对应组件的具体链接}
* **属性 (Props):** (表格形式，列出属性名、类型、是否必须、默认值、描述)
* **内部状态 (Internal State):** (若有，表格形式，列出状态变量、类型、初始值、描述)
* **关键UI元素/结构:** (使用伪代码或JSX描述组件的DOM结构)
* **触发的动作 (Actions Triggered):** (描述组件会触发哪些API调用或Zustand的action)
* **样式说明 (Styling Notes):** (描述使用的主要Tailwind CSS类)
* **性能考量 (Performance Notes):** (懒加载、虚拟化、缓存策略等)
* **无障碍访问性说明 (Accessibility Notes):** (列出需要满足的ARIA属性、键盘导航行为等)

### 5.3 核心编辑器组件架构

#### 编辑器画布组件 (Canvas)
```typescript
// src/features/editor/components/Canvas/Canvas.tsx
interface CanvasProps {
  modules: ModuleInstance[];
  selectedModuleId?: string;
  onModuleSelect: (id: string) => void;
  onModuleDrop: (moduleType: string, position: number) => void;
  onModuleReorder: (fromIndex: number, toIndex: number) => void;
}

export const Canvas = React.memo<CanvasProps>(({ modules, ...props }) => {
  // 虚拟化渲染大量模块
  const virtualizedModules = useVirtualization(modules);
  
  return (
    <div className="canvas-container" data-testid="editor-canvas">
      {virtualizedModules.map(module => (
        <ModuleRenderer key={module.id} module={module} />
      ))}
    </div>
  );
});
```

#### 模块面板组件 (ModulePanel)
```typescript
// src/features/editor/components/ModulePanel/ModulePanel.tsx
interface ModulePanelProps {
  categories: ModuleCategory[];
  onModuleDragStart: (moduleType: string) => void;
}

export const ModulePanel = React.memo<ModulePanelProps>(({ categories }) => {
  // 懒加载模块预览
  const { data: modulePreview } = useModulePreview();
  
  return (
    <div className="module-panel" data-testid="module-panel">
      {categories.map(category => (
        <ModuleCategory key={category.id} category={category} />
      ))}
    </div>
  );
});
```

## 6. 前端国际化策略 (Frontend Internationalization Strategy)

### 6.1 核心目标与语言
* **目标:** 实现一个高效、可维护、可扩展的多语言方案，支持中、日、英三种语言。开发者只需维护中文版本，其他语言版本通过自动化流程生成。
* **支持语言:** `zh` (源语言), `ja` (自动翻译), `en` (自动翻译)。

### 6.2 技术选型
* **核心框架:** `next-i18next` (版本要求: 15.4+)。
* **自动化翻译服务:** 在CI/CD流程中集成一个翻译API（如 Google Cloud Translation, DeepL 等）。

### 6.3 工作流与文件结构
* **单一事实来源:** 所有文本的键和内容都在中文的语言文件中定义。
* **命名空间 (Namespaces):** 根据功能领域划分JSON文件，存放于`public/locales/{lng}/`目录下（例如 `common.json`, `editor.json`）。
* **自动化流程:** 在CI/CD构建阶段，脚本将自动读取`zh`目录下的文件，调用翻译API生成并更新`ja`和`en`目录下的对应文件。

### 6.4 前端国际化实现
```typescript
// src/lib/i18n.ts
import { useTranslation } from 'next-i18next';

export const useI18n = () => {
  const { t, i18n } = useTranslation();
  
  return {
    t,
    locale: i18n.language,
    changeLanguage: i18n.changeLanguage,
    isRTL: i18n.dir() === 'rtl'
  };
};

// 使用示例
export const EditorToolbar = () => {
  const { t } = useI18n();
  
  return (
    <div>
      <button>{t('editor:save')}</button>
      <button>{t('editor:export')}</button>
    </div>
  );
};
```

### 6.5 Post-MVP规划
* 考虑引入专业的翻译管理平台（TMS）以支持更复杂的人工审校和翻译工作流程。

## 7. API交互层 (API Interaction Layer)

### 7.1 HTTP 客户端设置
我们将创建一个全局配置的 **Axios实例**，作为所有API请求的统一出口，存放于 `src/services/api-client.ts`。配置将包括：
* **Base URL:** 从环境变量读取后端的API根地址。
* **请求拦截器 (Request Interceptor):** 自动从Zustand `sessionStore`中读取JWT并添加到`Authorization`头。
* **响应拦截器 (Response Interceptor):** 统一处理全局API错误（如401未授权则自动登出）。

```typescript
// src/services/api-client.ts
import axios from 'axios';
import { useSessionStore } from '@/store/session.store';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器
apiClient.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useSessionStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 7.2 服务定义结构
我们将按照功能领域在`src/services/`目录下组织API调用，例如：
* `auth.service.ts`: 封装认证相关API。
* `pages.service.ts`: 封装页面/模板CRUD相关API。
* `media.service.ts`: 封装媒体上传相关API。

### 7.3 前端错误处理策略
* **使用"翻译键":** API返回的结构化业务错误（如 `{"error": {"code": "..."}}`）将使用其`code`作为翻译键，由前端i18n系统展示本地化的错误信息。
* **内联UI反馈:** 表单等操作的字段级错误应直接显示在对应输入框旁。

## 8. 路由策略 (Routing Strategy)

### 8.1 路由库
我们将使用 **Next.js的App Router** 作为路由解决方案。

### 8.2 路由定义

| 路径 (Path Pattern) | 页面组件路径 (Component/Page Path) | 访问权限 (Protection) | 备注 (Notes) |
| :--- | :--- | :--- | :--- |
| `/login` | `src/app/(auth)/login/page.tsx` | `Public` (访客) | 如果用户已登录，访问此页面应自动重定向到`/dashboard`。 |
| `/dashboard` | `src/app/(cms)/dashboard/page.tsx` | `Authenticated` (需认证) | 页面/模板管理视图。是用户登录后的主页面。 |
| `/editor/new` | `src/app/(cms)/editor/[pageId]/page.tsx` | `Authenticated` (需认证) | 创建新页面的编辑器视图。 |
| `/editor/{pageId}` | `src/app/(cms)/editor/[pageId]/page.tsx` | `Authenticated` (需认证) | 编辑ID为`{pageId}`的已有页面。 |

### 8.3 路由守卫/访问控制
* 将使用 **Next.js中间件 (Middleware)** (`middleware.ts`) 来保护需要认证的路由。
* 中间件会检查用户的认证状态，如果未认证，则将用户重定向到`/login`页面。

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/editor');

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## 9. 性能优化架构 (Performance Optimization Architecture)

### 9.1 核心性能优化策略
* **图片优化:** 强制使用Next.js的`<Image>`组件进行渲染。
* **减少不必要的重渲染:** 使用`React.memo`和细粒度的Zustand选择器。
* **代码分割与懒加载:** 对大型非首屏库使用动态`import()`。
* **防抖与节流:** 对频繁触发的事件使用防抖（debounce）技术。
* **虚拟化渲染:** 对大量模块列表使用虚拟滚动。
* **缓存策略:** 实现多层缓存机制。

### 9.2 性能优化工具实现
```typescript
// src/lib/performance.ts
export class PerformanceOptimizer {
  // 模块懒加载
  static async loadModule(moduleType: string) {
    const moduleMap = {
      'title': () => import('../features/modules/basic/TitleModule'),
      'text': () => import('../features/modules/basic/TextModule'),
      'image': () => import('../features/modules/basic/ImageModule'),
      'separator': () => import('../features/modules/basic/SeparatorModule'),
      'multi-column': () => import('../features/modules/advanced/MultiColumnModule'),
      'video': () => import('../features/modules/advanced/VideoModule'),
    };
    return moduleMap[moduleType]?.();
  }
  
  // 虚拟化列表
  static createVirtualizedList(items: any[], renderItem: Function) {
    // 实现虚拟滚动逻辑
    return useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 100,
    });
  }
  
  // 性能监控
  static trackPageLoad(pageName: string) {
    const startTime = performance.now();
    return () => {
      const loadTime = performance.now() - startTime;
      this.sendMetric('page_load_time', loadTime, { page: pageName });
    };
  }
}
```

### 9.3 缓存策略
```typescript
// src/lib/cache.ts
export class CacheManager {
  // 模块配置缓存
  static moduleConfigCache = new Map();
  
  // API响应缓存
  static apiCache = new Map();
  
  // 图片预加载缓存
  static imageCache = new Map();
}
```

### 9.4 前端性能监控
```typescript
// src/lib/monitoring.ts
export class PerformanceMonitor {
  static trackPageLoad(pageName: string) {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      // 发送到监控服务
      this.sendMetric('page_load_time', loadTime, { page: pageName });
    };
  }
  
  static trackAPICall(endpoint: string, duration: number, status: number) {
    this.sendMetric('api_call_duration', duration, {
      endpoint,
      status: status.toString()
    });
  }
}
```

## 10. 前端CI/CD管道架构 (Frontend CI/CD Pipeline Architecture)

### 10.1 GitHub Actions工作流
```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI
on:
  push:
    paths: ['frontend/**', 'packages/**']
  pull_request:
    paths: ['frontend/**', 'packages/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.2'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run build:types
      - run: pnpm run lint:frontend
      - run: pnpm run test:frontend
      - run: pnpm run build:frontend
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

### 10.2 部署策略
* **开发环境:** 自动部署到Vercel，支持预览分支
* **生产环境:** 手动触发部署到内网服务器
* **性能监控:** 集成Lighthouse CI进行性能检查

### 10.3 前端Docker配置
```dockerfile
# docker/frontend.Dockerfile
FROM node:22.2-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 11. 前端测试策略 (Frontend Testing Strategy)

### 11.1 组件测试
* **范围:** 对独立的UI组件进行隔离测试。
* **工具:** **Vitest** 配合 **React Testing Library**。
* **关注点:** 组件渲染、交互行为、基础可访问性。
* **文件位置:** 测试文件必须放置在与组件源文件同级的 **`__tests__`** 子目录中，并且文件名必须使用 **`.test.tsx`** 的后缀。例如，`src/components/ui/Button.tsx` 的测试文件为 `src/components/ui/__tests__/Button.test.tsx`。

### 11.2 UI集成/流程测试
* **范围:** 测试由多个组件组合而成的小型用户流程。
* **工具:** Vitest, React Testing Library, 并配合模拟的store和API（使用`msw`）。
* **关注点:** 组件协作、与全局状态和模拟API的集成。

### 11.3 端到端（E2E）UI测试
* **工具:** **Playwright**。
* **范围 (MVP):** 覆盖2-3个核心用户旅程，如成功登录、创建并导出页面、复制和删除页面。

### 11.4 前端代码质量标准
* **格式化:** `Prettier` (行长度80字符)
* **代码检查:** `ESLint` + `@typescript-eslint`
* **类型检查:** `TypeScript` 严格模式
* **测试覆盖率:** ≥ 80%

## 12. 时区处理与工具函数 (Timezone Handling & Utilities)

### 12.1 前端时区处理
```typescript
// src/lib/datetime.ts
export class DateTimeUtils {
  /**
   * 将UTC时间转换为用户本地时间显示
   */
  static toLocalTime(utcTime: string): string {
    return new Date(utcTime).toLocaleString();
  }
  
  /**
   * 将本地时间转换为UTC时间发送到后端
   */
  static toUTC(localTime: Date): string {
    return localTime.toISOString();
  }
  
  /**
   * 格式化相对时间（如"2小时前"）
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '刚刚';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  }
}
```

## 13. 无障碍访问性实现 (Accessibility Implementation)

### 13.1 MVP阶段基础准则
* **使用语义化HTML:** 优先使用具有明确语义的HTML5标签。
* **提供图像替代文本:** 所有由CMS添加的图片都必须有有意义的`alt`描述。
* **保证基本的键盘导航:** 所有可交互的元素必须能通过键盘访问和操作。
* **关注焦点状态:** 所有可交互的元素在获得键盘焦点时，必须有清晰可见的视觉样式。

### 13.2 无障碍访问性工具
```typescript
// src/lib/accessibility.ts
export class A11yUtils {
  /**
   * 生成唯一的ARIA ID
   */
  static generateAriaId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 键盘导航处理
   */
  static handleKeyboardNavigation(
    event: KeyboardEvent,
    onEnter?: () => void,
    onEscape?: () => void
  ) {
    switch (event.key) {
      case 'Enter':
        onEnter?.();
        break;
      case 'Escape':
        onEscape?.();
        break;
    }
  }
}
```

## 14. 变更日志 (Change Log)

| 版本 | 日期 | 变更描述 | 作者 |
| --- | --- | --- | --- |
| 1.0 | 2025-6-7 | 初始前端架构文档创建 | Jane |
| 2.0 | 2025-6-8 | 基于Epic 0需求的重大前端架构更新：<br/>• 新增v0.dev工具链集成架构<br/>• 完善项目目录结构和组件架构<br/>• 添加性能优化架构设计<br/>• 集成CI/CD前端管道配置<br/>• 增强组件规范和开发工作流<br/>• 补充核心编辑器组件架构<br/>• 完善测试策略和部署流程 | Jane |
| 2.1 | 2025-6-8 | 前端架构文档精简和专业化：<br/>• 移除与主架构文档重复的系统级内容<br/>• 专注于前端特定的实现细节<br/>• 增强前端性能监控和时区处理<br/>• 完善无障碍访问性实现<br/>• 明确与主架构文档的职责边界 | Jane |