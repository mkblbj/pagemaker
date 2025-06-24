// 类型使用测试文件 - 验证共享类型包的导入和使用

import type {
  User,
  PageTemplate,
  PageModule,
  ShopConfiguration,
  ApiResponse,
  PaginatedResponse,
  JwtTokenRequest,
  JwtTokenResponse,
} from "@pagemaker/shared-types";

import {
  UserRole,
  PageModuleType,
  API_ENDPOINTS,
} from "@pagemaker/shared-types";

// 测试用户类型
const testUser: User = {
  id: "123",
  username: "testuser",
  email: "test@example.com",
  fullName: "Test User",
  role: UserRole.EDITOR,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 测试页面模块类型
const testPageModule: PageModule = {
  id: "module-1",
  type: PageModuleType.TITLE,
  title: "Welcome",
  content: "Welcome to our page",
};

// 测试页面模板类型
const testPageTemplate: PageTemplate = {
  id: "template-1",
  name: "Home Page Template",
  content: [testPageModule],
  targetArea: "main-site",
  ownerId: testUser.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// 测试店铺配置类型
const testShopConfig: ShopConfiguration = {
  id: "shop-1",
  shopName: "Test Shop",
  targetArea: "main-site",
  apiLicenseExpiryDate: new Date().toISOString(),
};

// 测试API响应类型
const testApiResponse: ApiResponse<User> = {
  success: true,
  data: testUser,
  message: "User fetched successfully",
};

// 测试分页响应类型
const testPaginatedResponse: PaginatedResponse<User> = {
  success: true,
  data: [testUser],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
  message: "Users fetched successfully",
};

// 测试JWT请求类型
const testJwtRequest: JwtTokenRequest = {
  username: "testuser",
  password: "password123",
};

// 测试JWT响应类型
const testJwtResponse: JwtTokenResponse = {
  access: "access-token",
  refresh: "refresh-token",
  user: {
    id: testUser.id,
    username: testUser.username,
    email: testUser.email,
    fullName: testUser.fullName,
    role: testUser.role,
  },
};

// 测试API端点常量
const loginUrl = API_ENDPOINTS.AUTH.LOGIN;
const usersUrl = API_ENDPOINTS.USERS.LIST;
const pagesUrl = API_ENDPOINTS.PAGES.LIST;

// 导出测试对象以供其他文件使用
export {
  testUser,
  testPageModule,
  testPageTemplate,
  testShopConfig,
  testApiResponse,
  testPaginatedResponse,
  testJwtRequest,
  testJwtResponse,
  loginUrl,
  usersUrl,
  pagesUrl,
};

// 类型兼容性验证函数
export function validateTypes(): boolean {
  console.log("Testing shared types compatibility...");
  console.log("User:", testUser);
  console.log("Page Template:", testPageTemplate);
  console.log("Shop Config:", testShopConfig);
  console.log("API Response:", testApiResponse);
  console.log("Paginated Response:", testPaginatedResponse);
  console.log("JWT Request:", testJwtRequest);
  console.log("JWT Response:", testJwtResponse);
  console.log("API Endpoints:", { loginUrl, usersUrl, pagesUrl });

  return true;
}
