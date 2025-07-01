// API相关类型定义

// 基础API响应接口
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// 错误响应类型
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

// 成功响应类型
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

// 分页响应类型模板
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  message?: string;
}

// JWT认证相关类型
export interface JwtTokenRequest {
  username: string;
  password: string;
}

export interface JwtTokenResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

// 页面管理API类型
export interface PageListRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  targetArea?: string;
  ownerId?: string;
}

export interface PageDetailRequest {
  id: string;
}

export interface PageCreateRequest {
  name: string;
  content: Record<string, unknown>[];
  targetArea: string;
}

export interface PageUpdateRequest {
  id: string;
  name?: string;
  content?: Record<string, unknown>[];
  targetArea?: string;
}

export interface PageDeleteRequest {
  id: string;
}

// 店铺配置API类型
export interface ShopConfigListRequest {
  page?: number;
  pageSize?: number;
  targetArea?: string;
}

export interface ShopConfigCreateRequest {
  shopName: string;
  targetArea: string;
  apiLicenseExpiryDate?: string | null;
}

export interface ShopConfigUpdateRequest {
  id: string;
  shopName?: string;
  targetArea?: string;
  apiLicenseExpiryDate?: string | null;
}

// API路径常量
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
  },
  // 用户管理
  USERS: {
    LIST: '/api/v1/users',
    DETAIL: '/api/v1/users/:id',
    CREATE: '/api/v1/users',
    UPDATE: '/api/v1/users/:id',
    DELETE: '/api/v1/users/:id',
  },
  // 页面管理
  PAGES: {
    LIST: '/api/v1/pages',
    DETAIL: '/api/v1/pages/:id',
    CREATE: '/api/v1/pages',
    UPDATE: '/api/v1/pages/:id',
    DELETE: '/api/v1/pages/:id',
  },
  // 店铺配置
  SHOP_CONFIG: {
    LIST: '/api/v1/shop-configurations',
    DETAIL: '/api/v1/shop-configurations/:id',
    CREATE: '/api/v1/shop-configurations',
    UPDATE: '/api/v1/shop-configurations/:id',
    DELETE: '/api/v1/shop-configurations/:id',
  },
} as const;
