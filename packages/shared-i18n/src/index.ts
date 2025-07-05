/**
 * @pagemaker/shared-i18n
 * Pagemaker CMS 多语言支持包
 * 
 * 提供统一的多语言消息管理，支持中文、日文、英文三种语言
 */

// 导出类型定义
export * from './types';

// 导入语言包
import zhCN from './locales/zh-CN.json';
import jaJP from './locales/ja-JP.json';
import enUS from './locales/en-US.json';

import type { 
  SupportedLanguage, 
  I18nMessages, 
  I18nConfig,
  I18nContext 
} from './types';

// 创建多语言配置
export const i18nConfig: I18nConfig = {
  defaultLanguage: 'zh-CN',
  fallbackLanguage: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'ja-JP': jaJP,
    'en-US': enUS
  }
};

// 简单的翻译函数
export function createTranslator(language: SupportedLanguage): (key: string, params?: Record<string, string | number> | { defaultValue?: string }) => string {
  const messages = i18nConfig.messages[language] || i18nConfig.messages[i18nConfig.fallbackLanguage];
  
  return function t(key: string, params?: Record<string, string | number> | { defaultValue?: string }): string {
    // 类型检查：确保 key 是字符串
    if (typeof key !== 'string') {
      console.warn(`Translation key must be a string, received: ${typeof key}`, key);
      return String(key);
    }
    
    // 检查是否有 defaultValue 参数
    const defaultValue = params && 'defaultValue' in params ? (params as { defaultValue?: string }).defaultValue : undefined;
    const interpolationParams = params && 'defaultValue' in params ? {} : params as Record<string, string | number>;
    
    // 支持嵌套键值访问 (如 'errors.NETWORK_ERROR')
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 如果找不到键值，使用 defaultValue 或返回键名本身作为降级处理
        if (defaultValue) {
          return defaultValue;
        }
        console.warn(`Translation key not found: ${key} for language: ${language}`);
        return key;
      }
    }
    
    if (typeof value !== 'string') {
      // 如果翻译值不是字符串，使用 defaultValue 或返回键名
      if (defaultValue) {
        return defaultValue;
      }
      console.warn(`Translation value is not a string: ${key} for language: ${language}`);
      return key;
    }
    
    // 简单的参数替换 (如 "Hello {name}" -> "Hello World")
    if (interpolationParams && Object.keys(interpolationParams).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return interpolationParams[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };
}

// 获取指定语言的消息对象
export function getMessages(language: SupportedLanguage): I18nMessages {
  return i18nConfig.messages[language] || i18nConfig.messages[i18nConfig.fallbackLanguage];
}

// 检查语言是否支持
export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return ['zh-CN', 'ja-JP', 'en-US'].includes(language);
}

// 从浏览器语言获取支持的语言
export function getBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') {
    return i18nConfig.defaultLanguage;
  }
  
  const browserLang = navigator.language || navigator.languages?.[0];
  
  // 精确匹配
  if (isSupportedLanguage(browserLang)) {
    return browserLang;
  }
  
  // 语言代码匹配 (如 'zh' -> 'zh-CN')
  const langCode = browserLang.split('-')[0];
  switch (langCode) {
    case 'zh':
      return 'zh-CN';
    case 'ja':
      return 'ja-JP';
    case 'en':
      return 'en-US';
    default:
      return i18nConfig.defaultLanguage;
  }
}

// 便捷的错误消息获取函数
export function getErrorMessage(errorCode: string, language: SupportedLanguage = 'zh-CN'): string {
  const t = createTranslator(language);
  return t(`errors.${errorCode}`);
}

// 便捷的通用消息获取函数
export function getCommonMessage(messageKey: string, language: SupportedLanguage = 'zh-CN'): string {
  const t = createTranslator(language);
  return t(`common.${messageKey}`);
}

// 便捷的编辑器消息获取函数
export function getEditorMessage(messageKey: string, language: SupportedLanguage = 'zh-CN'): string {
  const t = createTranslator(language);
  return t(`editor.${messageKey}`);
}

// 导出默认翻译器 (中文)
export const t = createTranslator('zh-CN');

// 导出语言包 (用于调试或特殊用途)
export const locales = {
  'zh-CN': zhCN,
  'ja-JP': jaJP,
  'en-US': enUS
}; 