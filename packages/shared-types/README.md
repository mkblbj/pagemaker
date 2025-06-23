# @pagemaker/shared-types

Pagemaker CMS 前后端共享的 TypeScript 类型定义包。

## 安装

```bash
# 在 workspace 项目中使用
pnpm add @pagemaker/shared-types@workspace:*

# 或者在独立项目中使用
pnpm add @pagemaker/shared-types
```

## 使用方法

### 基础类型导入

```typescript
import type {
  User,
  PageTemplate,
  PageModule,
  ShopConfiguration,
  ApiResponse,
  PaginatedResponse,
} from '@pagemaker/shared-types';

import {
  UserRole,
  PageModuleType,
  API_ENDPOINTS,
} from '@pagemaker/shared-types';
```

### 用户相关类型

```typescript
// 用户数据类型
const user: User = {
  id: '123',
  username: 'testuser',
  email: 'test@example.com',
  fullName: 'Test User',
  role: UserRole.EDITOR, // 'editor' | 'admin'
  isActive: true,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

// 创建用户请求
const createUserRequest: CreateUserRequest = {
  username: 'newuser',
  email: 'new@example.com',
  fullName: 'New User',
  role: UserRole.EDITOR,
  password: 'securepassword',
};
```

### 页面相关类型

```typescript
// 页面模块
const pageModule: PageModule = {
  id: 'module-1',
  type: PageModuleType.TITLE,
  title: 'Welcome',
  content: 'Welcome to our page',
  // 支持其他动态属性
};

// 页面模板
const pageTemplate: PageTemplate = {
  id: 'template-1',
  name: 'Home Page Template',
  content: [pageModule],
  targetArea: 'main-site',
  ownerId: user.id,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};
```

### API 响应类型

```typescript
// 标准 API 响应
const apiResponse: ApiResponse<User> = {
  success: true,
  data: user,
  message: 'User fetched successfully',
};

// 错误响应
const errorResponse: ErrorResponse = {
  success: false,
  message: 'Validation failed',
  errors: {
    username: ['Username is required'],
    email: ['Invalid email format'],
  },
};

// 分页响应
const paginatedResponse: PaginatedResponse<User> = {
  success: true,
  data: [user],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
  message: 'Users fetched successfully',
};
```

### API 端点常量

```typescript
// 使用预定义的 API 端点
const loginUrl = API_ENDPOINTS.AUTH.LOGIN; // '/api/v1/auth/login'
const usersUrl = API_ENDPOINTS.USERS.LIST; // '/api/v1/users'
const pagesUrl = API_ENDPOINTS.PAGES.LIST; // '/api/v1/pages'

// 动态端点
const userDetailUrl = API_ENDPOINTS.USERS.DETAIL.replace(':id', '123');
// '/api/v1/users/123'
```

## 枚举值

### UserRole

- `UserRole.EDITOR` = `'editor'`
- `UserRole.ADMIN` = `'admin'`

### PageModuleType

- `PageModuleType.TITLE` = `'title'`
- `PageModuleType.TEXT` = `'text'`
- `PageModuleType.IMAGE` = `'image'`
- `PageModuleType.SEPARATOR` = `'separator'`
- `PageModuleType.KEY_VALUE` = `'keyValue'`
- `PageModuleType.MULTI_COLUMN` = `'multiColumn'`

## 最佳实践

### 1. 类型导入约定

```typescript
// ✅ 推荐：使用 type 导入类型，值导入枚举和常量
import type { User, ApiResponse } from '@pagemaker/shared-types';
import { UserRole, API_ENDPOINTS } from '@pagemaker/shared-types';

// ❌ 避免：混合导入
import { User, UserRole } from '@pagemaker/shared-types';
```

### 2. 日期字段处理

```typescript
// ✅ 推荐：使用 ISO 8601 字符串格式
const user: User = {
  // ...其他字段
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ❌ 避免：使用 Date 对象（不利于序列化）
const user = {
  createdAt: new Date(), // 这会导致序列化问题
};
```

### 3. API 响应处理

```typescript
// ✅ 推荐：使用类型守卫
function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

// 使用
const response: ApiResponse<User> = await fetchUser();
if (isSuccessResponse(response)) {
  // TypeScript 现在知道 response.data 存在
  console.log(response.data.username);
}
```

### 4. 错误处理

```typescript
// ✅ 推荐：统一的错误处理
function handleApiError(response: ErrorResponse): void {
  console.error('API Error:', response.message);
  
  if (response.errors) {
    Object.entries(response.errors).forEach(([field, messages]) => {
      console.error(`${field}: ${messages.join(', ')}`);
    });
  }
}
```

### 5. 分页数据处理

```typescript
// ✅ 推荐：分页响应处理
function handlePaginatedData<T>(response: PaginatedResponse<T>) {
  const { data, pagination } = response;
  
  console.log(`Showing ${data.length} of ${pagination.total} items`);
  console.log(`Page ${pagination.page} of ${pagination.totalPages}`);
  
  return {
    items: data,
    hasMore: pagination.hasNext,
    currentPage: pagination.page,
  };
}
```

## 后端集成

这个类型包与后端的 Pydantic 模型保持同步。后端使用以下验证机制：

1. **Pydantic 模型**：运行时类型验证
2. **JSON Schema 验证**：API 响应格式验证
3. **双向类型检查**：确保前后端数据结构一致

## 开发指南

### 构建

```bash
pnpm build
```

### 测试

```bash
# 类型检查
pnpm test:types

# 集成测试
pnpm test

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 发布

```bash
pnpm prepublishOnly  # 自动构建
pnpm publish
```

## 版本兼容性

- **TypeScript**: ~5.x
- **Next.js**: 15.3+
- **Django**: ~5.1
- **Django REST Framework**: ~3.15

## 贡献指南

1. 所有类型修改必须同时更新前端和后端
2. 添加新类型时必须包含测试用例
3. 遵循现有的命名约定：
   - 前端：camelCase/PascalCase
   - 后端：snake_case/PascalCase
4. 所有公共类型必须有 JSDoc 注释

## 变更日志

### v0.1.0

- 初始版本
- 基础用户、页面、店铺配置类型
- API 响应和分页类型
- 前后端类型验证机制 