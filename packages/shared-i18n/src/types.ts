/**
 * 多语言支持类型定义
 * 支持中文、日文、英文三种语言
 */

// 支持的语言类型
export type SupportedLanguage = 'zh-CN' | 'ja-JP' | 'en-US';

// 语言显示名称映射
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'zh-CN': '中文',
  'ja-JP': '日本語',
  'en-US': 'English'
};

// 错误消息接口
export interface ErrorMessages {
  // 网络错误
  NETWORK_ERROR: string;
  NETWORK_TIMEOUT: string;
  NETWORK_OFFLINE: string;
  
  // 认证错误
  AUTH_TOKEN_EXPIRED: string;
  AUTH_INVALID_CREDENTIALS: string;
  AUTH_UNAUTHORIZED: string;
  
  // 验证错误
  VALIDATION_REQUIRED_FIELD: string;
  VALIDATION_INVALID_FORMAT: string;
  VALIDATION_FILE_TOO_LARGE: string;
  
  // 服务器错误
  SERVER_INTERNAL_ERROR: string;
  SERVER_MAINTENANCE: string;
  SERVER_OVERLOAD: string;
  
  // 数据冲突
  CONFLICT_VERSION: string;
  CONFLICT_DUPLICATE: string;
  
  // 编辑器特定错误
  EDITOR_SAVE_FAILED: string;
  EDITOR_LOAD_FAILED: string;
  EDITOR_MODULE_INVALID: string;
  
  // 通用错误
  GENERIC_ERROR: string;
  NOT_FOUND: string;
}

// 通用界面消息接口
export interface CommonMessages {
  // 基础操作
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  create: string;
  update: string;
  
  // 状态提示
  loading: string;
  saving: string;
  saved: string;
  failed: string;
  success: string;
  
  // 通用词汇
  yes: string;
  no: string;
  back: string;
  next: string;
  previous: string;
  finish: string;
}

// 编辑器界面消息接口
export interface EditorMessages {
  // 编辑器标题
  title: string;
  
  // 区域名称
  moduleList: string;
  canvas: string;
  properties: string;
  
  // 操作按钮
  saveChanges: string;
  exportHtml: string;
  preview: string;
  
  // 模块操作
  addModule: string;
  deleteModule: string;
  duplicateModule: string;
  moveUp: string;
  moveDown: string;
  
  // 属性编辑
  moduleProperties: string;
  noModuleSelected: string;
  selectModuleHint: string;
  
  // 目标区域
  targetArea: string;
  selectTargetArea: string;
}

// 完整的多语言消息接口
export interface I18nMessages {
  errors: ErrorMessages;
  common: CommonMessages;
  editor: EditorMessages;
}

// 多语言配置接口
export interface I18nConfig {
  defaultLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  messages: Record<SupportedLanguage, I18nMessages>;
}

// 多语言上下文接口
export interface I18nContext {
  currentLanguage: SupportedLanguage;
  messages: I18nMessages;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
} 