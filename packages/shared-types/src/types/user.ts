// 用户相关类型定义

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'editor' | 'admin';
  isActive: boolean;
  createdAt: string; // ISO 8601 Date String
  updatedAt: string; // ISO 8601 Date String
}

// 用户角色枚举
export enum UserRole {
  EDITOR = 'editor',
  ADMIN = 'admin',
}

// 用户创建请求类型
export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
}

// 用户更新请求类型
export interface UpdateUserRequest {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

// 用户登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 用户登录响应类型
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
