// 页面相关类型定义

// 页面模块类型枚举
export enum PageModuleType {
  TITLE = 'title',
  TEXT = 'text',
  IMAGE = 'image',
  SEPARATOR = 'separator',
  KEY_VALUE = 'keyValue',
  MULTI_COLUMN = 'multiColumn',
  CUSTOM = 'custom',
}

// 分隔模块配置接口
export interface SeparatorModuleConfig {
  separatorType: 'line' | 'space';
  // 线条配置
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  lineColor?: string;
  lineThickness?: number;
  // 空白配置
  spaceHeight?: 'small' | 'medium' | 'large' | 'extra-large';
}

// 键值对模块配置接口
export interface KeyValueModuleConfig {
  rows: Array<{
    key: string;
    value: string;
  }>;
  labelBackgroundColor?: string;
  textColor?: string;
}

// 多列图文模块配置接口
export interface MultiColumnModuleConfig {
  layout: 'imageLeft' | 'textLeft' | 'imageTop' | 'textTop'; // 四种预设布局
  imageConfig: {
    src: string; // R-Cabinet图片URL
    alt: string; // Alt文本
    alignment: 'left' | 'center' | 'right'; // 对齐方式
    link?: {
      type: 'url' | 'email' | 'phone' | 'anchor';
      value: string;
    }; // 超链接配置
    width: string; // 百分比或预设值
  };
  textConfig: {
    content: string; // 支持HTML格式化
    alignment: 'left' | 'center' | 'right' | 'justify'; // 文本对齐
    font: string; // 字体
    fontSize: string; // 字体大小
    color: string; // 文本颜色
    backgroundColor?: string; // 背景色
  };
  columnRatio?: string; // MVP阶段使用固定预设值
}

// 模块元数据接口
export interface ModuleMetadata {
  type: PageModuleType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'basic' | 'advanced' | 'layout';
  color: string; // Tailwind color class
  defaultConfig: Partial<PageModule>;
  isEnabled: boolean;
  sortOrder: number;
}

// 页面模块接口
export interface PageModule {
  id: string; // 模块实例的唯一ID
  type: PageModuleType; // 模块类型
  [key: string]: unknown; // 其他配置属性
}

// 页面模板接口（完整版本，用于详情API）
export interface PageTemplate {
  id: string;
  name: string;
  content: PageModule[];
  target_area: string; // 后端使用snake_case
  owner_id: string; // 后端使用snake_case
  created_at: string; // ISO 8601 Date String，后端使用snake_case
  updated_at: string; // ISO 8601 Date String，后端使用snake_case
  module_count: number; // 页面中模块的数量
}

// 页面模板列表项接口（轻量级版本，用于列表API）
export interface PageTemplateListItem {
  id: string;
  name: string;
  target_area: string;
  owner_id: string;
  owner_username: string; // 列表中包含用户名
  created_at: string;
  updated_at: string;
  module_count: number;
}

// 店铺配置接口
export interface ShopConfiguration {
  id: string;
  shop_name: string;
  target_area: string;
  api_service_secret: string;
  api_license_key: string;
  api_license_expiry_date?: string | null; // ISO 8601 Date String
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
  target_area: string; // 使用snake_case匹配后端
}

// 页面模板更新请求类型
export interface UpdatePageTemplateRequest {
  name?: string;
  content?: PageModule[];
  target_area?: string; // 使用snake_case匹配后端
}


// 分页信息类型
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// 页面列表API响应类型
export interface PageListResponse {
  pages: PageTemplateListItem[];
  pagination: PaginationInfo;
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
