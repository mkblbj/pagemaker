// Pagemaker CMS 共享类型定义
// 根据编码规范，前后端共享的数据结构必须在此定义

// 导出所有类型模块
export * from './types/common';
export * from './types/user';
export * from './types/page';
export * from './types/api';

// 重新导出常用类型以保持向后兼容
export type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  LoginResponse,
} from './types/user';

export type {
  PageModule,
  PageTemplate,
  ShopConfiguration,
  CreatePageTemplateRequest,
  UpdatePageTemplateRequest,
  CreateShopConfigurationRequest,
  UpdateShopConfigurationRequest,
} from './types/page';

export type {
  ApiResponse,
  ErrorResponse,
  SuccessResponse,
  PaginatedResponse,
  JwtTokenRequest,
  JwtTokenResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from './types/api';

// 值导出（枚举和常量）
export {
  UserRole,
} from './types/user';

export {
  PageModuleType,
} from './types/page';

export {
  API_ENDPOINTS,
} from './types/api';

// 注意：随着项目发展，应该将类型分类到不同的文件中
// 例如：./types/user.ts, ./types/page.ts 等 