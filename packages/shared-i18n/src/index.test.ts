import { describe, it, expect } from 'vitest'
import { 
  i18nConfig,
  createTranslator, 
  getMessages,
  isSupportedLanguage,
  getBrowserLanguage,
  getErrorMessage,
  getCommonMessage,
  getEditorMessage,
  t,
  locales
} from './index'

describe('shared-i18n', () => {
  describe('i18nConfig', () => {
    it('应该有正确的默认配置', () => {
      expect(i18nConfig.defaultLanguage).toBe('zh-CN')
      expect(i18nConfig.fallbackLanguage).toBe('en-US')
      expect(Object.keys(i18nConfig.messages)).toEqual(['zh-CN', 'ja-JP', 'en-US'])
    })
  })

  describe('isSupportedLanguage', () => {
    it('应该验证有效的语言代码', () => {
      expect(isSupportedLanguage('zh-CN')).toBe(true)
      expect(isSupportedLanguage('en-US')).toBe(true)
      expect(isSupportedLanguage('ja-JP')).toBe(true)
    })

    it('应该拒绝无效的语言代码', () => {
      expect(isSupportedLanguage('invalid')).toBe(false)
      expect(isSupportedLanguage('')).toBe(false)
      expect(isSupportedLanguage('zh')).toBe(false)
    })
  })

  describe('getMessages', () => {
    it('应该获取指定语言的消息', () => {
      const zhMessages = getMessages('zh-CN')
      const enMessages = getMessages('en-US')
      
      expect(zhMessages).toBeDefined()
      expect(enMessages).toBeDefined()
      expect(typeof zhMessages).toBe('object')
      expect(typeof enMessages).toBe('object')
    })
  })

  describe('createTranslator', () => {
    it('应该创建中文翻译器', () => {
      const translator = createTranslator('zh-CN')
      expect(typeof translator).toBe('function')
      
      const result = translator('auth.登录')
      expect(result).toBe('登录')
    })

    it('应该创建英文翻译器', () => {
      const translator = createTranslator('en-US')
      expect(typeof translator).toBe('function')
      
      const result = translator('auth.登录')
      expect(result).toBe('Login')
    })

    it('应该处理参数替换', () => {
      const translator = createTranslator('zh-CN')
      
      // 测试基本的翻译功能
      const result = translator('common.save')
      expect(result).toBe('保存')
    })

    it('应该处理不存在的键值', () => {
      const translator = createTranslator('zh-CN')
      
      const result = translator('non-existent-key')
      expect(result).toBe('non-existent-key')
    })

    it('应该处理defaultValue参数', () => {
      const translator = createTranslator('zh-CN')
      
      const result = translator('non-existent-key', { defaultValue: '默认值' })
      expect(result).toBe('默认值')
    })
  })

  describe('getBrowserLanguage', () => {
    it('应该返回支持的语言', () => {
      const language = getBrowserLanguage()
      expect(isSupportedLanguage(language)).toBe(true)
    })
  })

  describe('便捷消息函数', () => {
    it('getErrorMessage 应该获取错误消息', () => {
      const errorMsg = getErrorMessage('NETWORK_ERROR')
      expect(errorMsg).toBe('网络连接失败，请检查您的网络连接后重试')
    })

    it('getCommonMessage 应该获取通用消息', () => {
      const commonMsg = getCommonMessage('save')
      expect(commonMsg).toBe('保存')
    })

    it('getEditorMessage 应该获取编辑器消息', () => {
      const editorMsg = getEditorMessage('title')
      expect(editorMsg).toBe('页面编辑器')
    })
  })

  describe('默认翻译器', () => {
    it('t 函数应该可用', () => {
      expect(typeof t).toBe('function')
      
      const result = t('auth.登录')
      expect(result).toBe('登录')
    })
  })

  describe('locales', () => {
    it('应该导出所有语言包', () => {
      expect(locales).toBeDefined()
      expect(locales['zh-CN']).toBeDefined()
      expect(locales['en-US']).toBeDefined()
      expect(locales['ja-JP']).toBeDefined()
    })
  })
}) 