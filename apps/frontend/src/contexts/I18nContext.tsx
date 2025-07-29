'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  createTranslator,
  getBrowserLanguage,
  isSupportedLanguage,
  type SupportedLanguage,
  type I18nMessages,
  type I18nContext as I18nContextType
} from '@pagemaker/shared-i18n'

// 创建Context
const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Context Provider Props
interface I18nProviderProps {
  children: ReactNode
  defaultLanguage?: SupportedLanguage
}

// 本地存储键名
const LANGUAGE_STORAGE_KEY = 'pagemaker-language'

/**
 * 多语言Context Provider
 */
export function I18nProvider({ children, defaultLanguage = 'zh-CN' }: I18nProviderProps) {
  // 服务端和客户端都使用相同的默认语言，避免水合不一致
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(defaultLanguage)
  const [translator, setTranslator] = useState(() => createTranslator(defaultLanguage))
  const [isClient, setIsClient] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // 客户端初始化语言设置
  useEffect(() => {
    setIsClient(true)

    // 优先级：localStorage > 浏览器语言 > 默认语言
    let initialLanguage = defaultLanguage

    // 检查本地存储
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && isSupportedLanguage(stored)) {
      initialLanguage = stored
    } else {
      // 检查浏览器语言
      const browserLang = getBrowserLanguage()
      if (browserLang) {
        initialLanguage = browserLang
      }
    }

    // 只有当语言不同时才更新，避免不必要的重渲染
    if (initialLanguage !== currentLanguage) {
      setCurrentLanguage(initialLanguage)
      setTranslator(() => createTranslator(initialLanguage))
    }

    // 标记初始化完成
    setIsInitialized(true)
  }, [defaultLanguage, currentLanguage])

  // 切换语言函数
  const setLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language)
    const newTranslator = createTranslator(language)
    setTranslator(() => newTranslator)

    // 保存到本地存储
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    }
  }

  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    // 确保translator是函数
    if (typeof translator !== 'function') {
      console.error('Translator is not a function:', translator)
      return key // 返回原始key作为fallback
    }
    return translator(key, params)
  }

  // 获取当前语言的消息对象（虽然在这个实现中不直接使用，但保持接口一致性）
  const messages = {} as I18nMessages // 实际的消息通过translator函数获取

  // Context值
  const contextValue: I18nContextType = {
    currentLanguage,
    messages,
    setLanguage,
    t
  }

  return (
    <I18nContext.Provider value={contextValue}>
      <div
        suppressHydrationWarning={!isClient}
        style={{
          opacity: isInitialized ? 1 : 0,
          transition: 'opacity 0.1s ease-in-out'
        }}
      >
        {children}
      </div>
    </I18nContext.Provider>
  )
}

/**
 * 使用多语言Context的Hook
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

/**
 * 便捷的翻译Hook
 */
export function useTranslation() {
  const { t, currentLanguage, setLanguage } = useI18n()

  // 使用useCallback确保函数引用稳定
  const tError = useCallback(
    (errorCode: string, params?: Record<string, string | number>) => t(`errors.${errorCode}`, params),
    [t]
  )

  const tCommon = useCallback(
    (key: string, params?: Record<string, string | number>) => t(`common.${key}`, params),
    [t]
  )

  const tEditor = useCallback(
    (key: string, params?: Record<string, string | number>) => t(`editor.${key}`, params),
    [t]
  )

  const tAuth = useCallback((key: string, params?: Record<string, string | number>) => t(`auth.${key}`, params), [t])

  const tPreview = useCallback(
    (key: string, params?: Record<string, string | number>) => t(`preview.${key}`, params),
    [t]
  )

  const tPages = useCallback((key: string, params?: Record<string, string | number>) => t(`pages.${key}`, params), [t])

  return {
    t,
    currentLanguage,
    setLanguage,
    tError,
    tCommon,
    tEditor,
    tAuth,
    tPreview,
    tPages
  }
}
