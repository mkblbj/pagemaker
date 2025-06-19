# 前端架构 (Frontend Architecture)

## 10.2 状态管理架构 (State Management Architecture)

* **技术选型推荐 (Library Recommendation):**
    * 我推荐使用 **Zustand** 作为我们的前端状态管理库。
    * **理由**: Zustand 是一个非常现代化、轻量级且对开发者友好的库。它没有像传统Redux那样繁琐的模板代码，使用起来非常直观，性能出色，并且与TypeScript的集成非常完美。

* **Store结构 (Store Structure):**
    * 我们将在 `src/stores/` 目录下，根据功能域创建多个独立的Store。
    * **`usePageStore.ts`**: 管理当前正在编辑的页面的核心数据。
    * **`useEditorStore.ts`**: 管理编辑器本身的UI状态。
    * **`useAuthStore.ts`**: 管理用户认证状态。

* **Store代码模板 (Store Template):**

```tsx
// file: src/stores/usePageStore.ts

import { create } from 'zustand';
import { PageTemplate } from 'packages/shared-types'; // 假设从共享包导入

// 1. 定义State和Actions的接口
interface PageState {
  currentPage: PageTemplate | null;
  setPage: (page: PageTemplate) => void;
  updateModuleName: (moduleId: string, newName: string) => void;
  // ... 其他更新页面内容的操作
}

// 2. 使用create函数创建Store
export const usePageStore = create<PageState>((set) => ({
  currentPage: null,
  
  setPage: (page) => set({ currentPage: page }),

  updateModuleName: (moduleId, newName) => 
    set((state) => {
      if (!state.currentPage) return {};
      
      const updatedContent = state.currentPage.content.map(module => 
        module.id === moduleId ? { ...module, name: newName } : module
      );

      return { 
        currentPage: { ...state.currentPage, content: updatedContent } 
      };
    }),
}));
```

## 10.3 API集成架构 (API Integration Architecture)

* **技术选型推荐 (Library Recommendation):**
    1.  **HTTP客户端 (HTTP Client)**: **Axios**。
    2.  **数据获取与缓存 (Data Fetching & Caching)**: **SWR**。

* **集成策略 (Integration Strategy):**
    让 **SWR** 作为"指挥官"，负责在组件层面发起数据请求；让 **Axios** 作为"士兵"，负责在底层执行实际的HTTP通信。

* **代码模板与实现 (Code Templates & Implementation):**

1.  **创建集中的Axios实例 (于 `src/lib/apiClient.ts`)**:
    
```ts
// file: src/lib/apiClient.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：在每个请求发送前，从Zustand store中获取token并添加到header
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default apiClient;
```

2.  **创建服务层 (于 `src/services/`)**:

```typescript
// file: src/services/pageService.ts
import apiClient from '@/lib/apiClient';
import { PageTemplate } from 'packages/shared-types';

export const getPageById = async (id: string): Promise<PageTemplate> => {
  const response = await apiClient.get(`/pages/${id}/`);
  return response.data;
};
```

3.  **在组件中使用SWR进行数据获取**:

```tsx
// file: src/components/feature/PageEditor.tsx
import useSWR from 'swr';
import { getPageById } from '@/services/pageService';

interface PageEditorProps {
  pageId: string;
}

export const PageEditor: React.FC<PageEditorProps> = ({ pageId }) => {
  // SWR将自动处理加载、错误和缓存状态
  const { data: page, error, isLoading } = useSWR(
    `/pages/${pageId}`, // SWR使用这个key来缓存数据
    () => getPageById(pageId)
  );

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败！</div>;

  return <h1>{page?.name}</h1>;
};
```

## 10.4 路由架构 (Routing Architecture)

* **受保护的路由 (Protected Routes):**
    * **策略**: 我们将使用Next.js App Router的 **路由组 (Route Groups)** 来保护需要认证的页面。所有需要登录才能访问的页面将被放置在一个名为 `(protected)` 的文件夹中。
    * **实现**: 在 `app/(protected)/layout.tsx` 文件中创建一个布局组件，检查用户登录状态，如果未登录则重定向到 `/login` 页面。
    * **示例代码 (`app/(protected)/layout.tsx`):**

```tsx
// file: app/(protected)/layout.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div>加载中或重定向...</div>; // 或者一个加载动画
  }

  return <>{children}</>;
}
```

## 10.5 样式指南 (Styling Guidelines)

* **优先使用Utility-First**: 主要通过 **Tailwind CSS** 的功能类直接在JSX中编写样式。
* **组件特定样式**: 对于少数复杂的样式，我们将使用 **CSS Modules** (`.module.css` 文件)。
* **全局样式**: 仅将最基础的全局样式定义在 `src/app/globals.css` 文件中。

## 10.6 前端测试要求 (Frontend Testing Requirements)

* **测试框架**: **Vitest** + **React Testing Library**。
* **文件位置**: 测试文件 (`.test.tsx`) 将与被测试的组件文件并置存放。
* **测试范围**: 单元测试和集成测试。
* **Mocking**: 测试中所有外部依赖（API、Store）**必须**被模拟 (Mock)。 