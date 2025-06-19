// Pagemaker CMS 共享类型定义
// 根据编码规范，前后端共享的数据结构必须在此定义

// 基础类型
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用户相关类型
export interface User extends BaseEntity {
  username: string;
  email: string;
  isActive: boolean;
}

// 页面模板相关类型
export interface PageTemplate extends BaseEntity {
  title: string;
  description?: string;
  content: Record<string, any>; // JSON 结构存储页面内容
  isPublished: boolean;
  owner: string; // User ID
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 导出所有类型
export * from './types/common';

// 注意：随着项目发展，应该将类型分类到不同的文件中
// 例如：./types/user.ts, ./types/page.ts 等 