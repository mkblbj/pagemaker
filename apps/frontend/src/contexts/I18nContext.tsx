'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createTranslator, 
  getBrowserLanguage, 
  isSupportedLanguage,
  type SupportedLanguage, 
  type I18nMessages,
  type I18nContext as I18nContextType 
} from '@pagemaker/shared-i18n';

// 创建Context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Context Provider Props
interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
}

// 本地存储键名
const LANGUAGE_STORAGE_KEY = 'pagemaker-language';

/**
 * 多语言Context Provider
 */
export function I18nProvider({ 
  children, 
  defaultLanguage 
}: I18nProviderProps) {
  // 初始化语言：优先级 localStorage > 浏览器语言 > 默认语言
  const getInitialLanguage = (): SupportedLanguage => {
    // 检查本地存储
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && isSupportedLanguage(stored)) {
        return stored;
      }
    }
    
    // 检查浏览器语言
    const browserLang = getBrowserLanguage();
    if (browserLang) {
      return browserLang;
    }
    
    // 使用默认语言
    return defaultLanguage || 'zh-CN';
  };

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(getInitialLanguage);
  const [translator, setTranslator] = useState(() => createTranslator(currentLanguage));

  // 切换语言函数
  const setLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    const newTranslator = createTranslator(language);
    setTranslator(() => newTranslator);
    
    // 保存到本地存储
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  };

  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    // 确保translator是函数
    if (typeof translator !== 'function') {
      console.error('Translator is not a function:', translator);
      return key; // 返回原始key作为fallback
    }
    return translator(key, params);
  };

  // 获取当前语言的消息对象（虽然在这个实现中不直接使用，但保持接口一致性）
  const messages = {} as I18nMessages; // 实际的消息通过translator函数获取

  // Context值
  const contextValue: I18nContextType = {
    currentLanguage,
    messages,
    setLanguage,
    t
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * 使用多语言Context的Hook
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * 便捷的翻译Hook
 */
export function useTranslation() {
  const { t, currentLanguage, setLanguage } = useI18n();
  
  return {
    t,
    currentLanguage,
    setLanguage,
    // 便捷的错误消息翻译
    tError: (errorCode: string, params?: Record<string, string | number>) => 
      t(`errors.${errorCode}`, params),
    // 便捷的通用消息翻译
    tCommon: (key: string, params?: Record<string, string | number>) => 
      t(`common.${key}`, params),
    // 便捷的编辑器消息翻译
    tEditor: (key: string, params?: Record<string, string | number>) => 
      t(`editor.${key}`, params)
  };
} 