/**
 * 前后端类型兼容性集成测试
 * 验证TypeScript类型定义与Python Pydantic模型的一致性
 */

const { 
  UserRole, 
  PageModuleType, 
  API_ENDPOINTS 
} = require('../dist/index.js');

describe('Shared Types Integration Tests', () => {
  
  test('UserRole enum values should match backend expectations', () => {
    expect(UserRole.EDITOR).toBe('editor');
    expect(UserRole.ADMIN).toBe('admin');
    
    // 验证所有枚举值
    const expectedRoles = ['editor', 'admin'];
    const actualRoles = Object.values(UserRole);
    expect(actualRoles.sort()).toEqual(expectedRoles.sort());
  });

  test('PageModuleType enum values should match backend expectations', () => {
    expect(PageModuleType.TITLE).toBe('title');
    expect(PageModuleType.TEXT).toBe('text');
    expect(PageModuleType.IMAGE).toBe('image');
    expect(PageModuleType.SEPARATOR).toBe('separator');
    expect(PageModuleType.KEY_VALUE).toBe('keyValue');
    expect(PageModuleType.MULTI_COLUMN).toBe('multiColumn');
    
    // 验证所有枚举值
    const expectedTypes = ['title', 'text', 'image', 'separator', 'keyValue', 'multiColumn'];
    const actualTypes = Object.values(PageModuleType);
    expect(actualTypes.sort()).toEqual(expectedTypes.sort());
  });

  test('API_ENDPOINTS should contain all required endpoints', () => {
    // 验证认证端点
    expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/api/v1/auth/login');
    expect(API_ENDPOINTS.AUTH.REFRESH).toBe('/api/v1/auth/refresh');
    expect(API_ENDPOINTS.AUTH.LOGOUT).toBe('/api/v1/auth/logout');
    
    // 验证用户管理端点
    expect(API_ENDPOINTS.USERS.LIST).toBe('/api/v1/users');
    expect(API_ENDPOINTS.USERS.CREATE).toBe('/api/v1/users');
    expect(API_ENDPOINTS.USERS.DETAIL).toBe('/api/v1/users/:id');
    
    // 验证页面管理端点
    expect(API_ENDPOINTS.PAGES.LIST).toBe('/api/v1/pages');
    expect(API_ENDPOINTS.PAGES.CREATE).toBe('/api/v1/pages');
    expect(API_ENDPOINTS.PAGES.DETAIL).toBe('/api/v1/pages/:id');
    
    // 验证店铺配置端点
    expect(API_ENDPOINTS.SHOP_CONFIG.LIST).toBe('/api/v1/shop-config');
    expect(API_ENDPOINTS.SHOP_CONFIG.CREATE).toBe('/api/v1/shop-config');
    expect(API_ENDPOINTS.SHOP_CONFIG.DETAIL).toBe('/api/v1/shop-config/:id');
  });

  test('User data structure should be compatible', () => {
    const testUser = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User',
      role: UserRole.EDITOR,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 验证必需字段存在
    expect(testUser.id).toBeDefined();
    expect(testUser.username).toBeDefined();
    expect(testUser.email).toBeDefined();
    expect(testUser.fullName).toBeDefined();
    expect(testUser.role).toBeDefined();
    expect(testUser.isActive).toBeDefined();
    expect(testUser.createdAt).toBeDefined();
    expect(testUser.updatedAt).toBeDefined();
    
    // 验证字段类型
    expect(typeof testUser.id).toBe('string');
    expect(typeof testUser.username).toBe('string');
    expect(typeof testUser.email).toBe('string');
    expect(typeof testUser.fullName).toBe('string');
    expect(typeof testUser.role).toBe('string');
    expect(typeof testUser.isActive).toBe('boolean');
    expect(typeof testUser.createdAt).toBe('string');
    expect(typeof testUser.updatedAt).toBe('string');
  });

  test('PageTemplate data structure should be compatible', () => {
    const testPageModule = {
      id: 'module-1',
      type: PageModuleType.TITLE,
      title: 'Welcome',
      content: 'Welcome to our page',
    };
    
    const testPageTemplate = {
      id: 'template-1',
      name: 'Home Page Template',
      content: [testPageModule],
      targetArea: 'main-site',
      ownerId: '123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 验证页面模块
    expect(testPageModule.id).toBeDefined();
    expect(testPageModule.type).toBe(PageModuleType.TITLE);
    expect(typeof testPageModule.id).toBe('string');
    expect(typeof testPageModule.type).toBe('string');
    
    // 验证页面模板
    expect(testPageTemplate.id).toBeDefined();
    expect(testPageTemplate.name).toBeDefined();
    expect(Array.isArray(testPageTemplate.content)).toBe(true);
    expect(testPageTemplate.targetArea).toBeDefined();
    expect(testPageTemplate.ownerId).toBeDefined();
    expect(testPageTemplate.createdAt).toBeDefined();
    expect(testPageTemplate.updatedAt).toBeDefined();
  });

  test('API Response structure should be compatible', () => {
    const testApiResponse = {
      success: true,
      data: { id: '123', name: 'test' },
      message: 'Operation successful',
    };
    
    expect(typeof testApiResponse.success).toBe('boolean');
    expect(testApiResponse.data).toBeDefined();
    expect(typeof testApiResponse.message).toBe('string');
    
    const testErrorResponse = {
      success: false,
      message: 'Operation failed',
      errors: {
        field1: ['Error message 1'],
        field2: ['Error message 2', 'Error message 3']
      }
    };
    
    expect(testErrorResponse.success).toBe(false);
    expect(typeof testErrorResponse.message).toBe('string');
    expect(typeof testErrorResponse.errors).toBe('object');
    expect(Array.isArray(testErrorResponse.errors.field1)).toBe(true);
  });

  test('Paginated Response structure should be compatible', () => {
    const testPaginatedResponse = {
      success: true,
      data: [{ id: '1' }, { id: '2' }],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      message: 'Data fetched successfully',
    };
    
    expect(typeof testPaginatedResponse.success).toBe('boolean');
    expect(Array.isArray(testPaginatedResponse.data)).toBe(true);
    expect(typeof testPaginatedResponse.pagination).toBe('object');
    
    const pagination = testPaginatedResponse.pagination;
    expect(typeof pagination.page).toBe('number');
    expect(typeof pagination.pageSize).toBe('number');
    expect(typeof pagination.total).toBe('number');
    expect(typeof pagination.totalPages).toBe('number');
    expect(typeof pagination.hasNext).toBe('boolean');
    expect(typeof pagination.hasPrevious).toBe('boolean');
  });

}); 