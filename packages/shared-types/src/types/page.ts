// 页面相关类型定义

// 页面模块类型枚举
export enum PageModuleType {
  TITLE = 'title',
  TEXT = 'text',
  IMAGE = 'image',
  SEPARATOR = 'separator',
  KEY_VALUE = 'keyValue',
  MULTI_COLUMN = 'multiColumn',
}

// 页面模块接口
export interface PageModule {
  id: string; // 模块实例的唯一ID
  type: PageModuleType; // 模块类型
  [key: string]: unknown; // 其他配置属性
}

// 页面模板接口
export interface PageTemplate {
  id: string;
  name: string;
  content: PageModule[];
  targetArea: string;
  ownerId: string;
  createdAt: string; // ISO 8601 Date String
  updatedAt: string; // ISO 8601 Date String
}

// 店铺配置接口
export interface ShopConfiguration {
  id: string;
  shop_name: string;
  target_area: string;
  api_service_secret: string;
  api_license_key: string;
  ftp_host: string;
  ftp_port: number;
  ftp_user: string;
  ftp_password: string;
  created_at: string; // ISO 8601 Date String
  updated_at: string; // ISO 8601 Date String
}

// 页面模板创建请求类型
export interface CreatePageTemplateRequest {
  name: string;
  content: PageModule[];
  targetArea: string;
}

// 页面模板更新请求类型
export interface UpdatePageTemplateRequest {
  name?: string;
  content?: PageModule[];
  targetArea?: string;
}

// 店铺配置创建请求类型
export interface CreateShopConfigurationRequest {
  shop_name: string;
  target_area: string;
  api_service_secret: string;
  api_license_key: string;
  ftp_host: string;
  ftp_port: number;
  ftp_user: string;
  ftp_password: string;
}

// 店铺配置更新请求类型
export interface UpdateShopConfigurationRequest {
  shop_name?: string;
  target_area?: string;
  api_service_secret?: string;
  api_license_key?: string;
  ftp_host?: string;
  ftp_port?: number;
  ftp_user?: string;
  ftp_password?: string;
}
