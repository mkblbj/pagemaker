import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  copyToClipboard,
  copyHTMLToClipboard,
  isClipboardSupported,
  isSecureContext,
  getClipboardCapabilities
} from './clipboardUtils'

// Mock DOM API
const mockWriteText = vi.fn()
const mockWrite = vi.fn()

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
    write: mockWrite
  },
  configurable: true
})

// Mock document.execCommand
const mockExecCommand = vi.fn()
Object.defineProperty(document, 'execCommand', {
  value: mockExecCommand,
  configurable: true
})

// Mock ClipboardItem
global.ClipboardItem = vi.fn().mockImplementation((data) => ({ data })) as any

describe('clipboardUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 重置location.protocol为https以模拟安全上下文
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        hostname: 'localhost'
      },
      configurable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isClipboardSupported', () => {
    it('应该在支持Clipboard API时返回true', () => {
      expect(isClipboardSupported()).toBe(true)
    })

    it('应该在不支持Clipboard API时返回false', () => {
      const originalClipboard = navigator.clipboard
      // @ts-ignore
      delete navigator.clipboard
      
      expect(isClipboardSupported()).toBe(false)
      
      // 恢复
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true
      })
    })
  })

  describe('isSecureContext', () => {
    it('应该在HTTPS环境下返回true', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          hostname: 'example.com'
        },
        configurable: true
      })

      expect(isSecureContext()).toBe(true)
    })

    it('应该在localhost环境下返回true', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          hostname: 'localhost'
        },
        configurable: true
      })

      expect(isSecureContext()).toBe(true)
    })

    it('应该在HTTP环境下返回false', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          hostname: 'example.com'
        },
        configurable: true
      })

      expect(isSecureContext()).toBe(false)
    })
  })

  describe('copyToClipboard', () => {
    it('应该使用现代Clipboard API成功复制文本', async () => {
      mockWriteText.mockResolvedValue(undefined)

      const result = await copyToClipboard('测试文本')

      expect(mockWriteText).toHaveBeenCalledWith('测试文本')
      expect(result.success).toBe(true)
      expect(result.message).toBe('内容已复制到剪贴板')
    })

    it('应该在Clipboard API失败时返回错误', async () => {
      const error = new Error('Permission denied')
      mockWriteText.mockRejectedValue(error)

      const result = await copyToClipboard('测试文本')

      expect(result.success).toBe(false)
      expect(result.message).toBe('复制失败，请手动复制')
      expect(result.error).toBe(error)
    })

    it('应该在非安全上下文中使用降级方案', async () => {
      // 模拟非安全上下文
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          hostname: 'example.com'
        },
        configurable: true
      })

      mockExecCommand.mockReturnValue(true)

      // Mock DOM操作
      const mockTextArea = {
        value: '',
        style: {},
        select: vi.fn(),
        setSelectionRange: vi.fn(),
        setAttribute: vi.fn()
      }
      
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      const mockCreateElement = vi.fn().mockReturnValue(mockTextArea)

      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        configurable: true
      })
      
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        configurable: true
      })
      
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        configurable: true
      })

      const result = await copyToClipboard('测试文本')

      expect(mockCreateElement).toHaveBeenCalledWith('textarea')
      expect(mockTextArea.value).toBe('测试文本')
      expect(mockAppendChild).toHaveBeenCalledWith(mockTextArea)
      expect(mockExecCommand).toHaveBeenCalledWith('copy')
      expect(mockRemoveChild).toHaveBeenCalledWith(mockTextArea)
      expect(result.success).toBe(true)
    })

    it('应该验证输入参数', async () => {
      const result1 = await copyToClipboard('')
      expect(result1.success).toBe(false)
      expect(result1.message).toBe('文本内容为空')

      // @ts-ignore - 测试类型错误
      const result2 = await copyToClipboard(null)
      expect(result2.success).toBe(false)
      expect(result2.message).toBe('无效的文本内容')
    })
  })

  describe('copyHTMLToClipboard', () => {
    it('应该成功复制HTML内容', async () => {
      mockWrite.mockResolvedValue(undefined)

      const html = '<div>测试HTML</div>'
      const result = await copyHTMLToClipboard(html)

      expect(mockWrite).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.message).toBe('HTML内容已复制到剪贴板')
    })

    it('应该在不支持HTML复制时降级到文本复制', async () => {
      // 模拟ClipboardItem不存在
      // @ts-ignore
      delete global.ClipboardItem
      mockWriteText.mockResolvedValue(undefined)

      const html = '<div>测试HTML</div>'
      const result = await copyHTMLToClipboard(html, '测试HTML')

      expect(mockWriteText).toHaveBeenCalledWith('测试HTML')
      expect(result.success).toBe(true)
    })

    it('应该验证HTML输入', async () => {
      const result = await copyHTMLToClipboard('')
      expect(result.success).toBe(false)
      expect(result.message).toBe('HTML内容为空')
    })
  })

  describe('getClipboardCapabilities', () => {
    it('应该返回正确的能力信息', () => {
      // Mock ClipboardItem with supports method
      global.ClipboardItem = vi.fn().mockImplementation((data) => ({ data })) as any
      global.ClipboardItem.supports = vi.fn().mockReturnValue(true)
      
      const capabilities = getClipboardCapabilities()

      expect(capabilities.hasClipboardAPI).toBe(true)
      expect(capabilities.isSecureContext).toBe(true)
      expect(capabilities.canCopyHTML).toBe(true)
      expect(capabilities.canCopyText).toBe(true)
    })

    it('应该在不支持的环境中返回正确的能力信息', () => {
      // 模拟不支持的环境
      const originalClipboard = navigator.clipboard
      // @ts-ignore
      delete navigator.clipboard
      // @ts-ignore
      delete global.ClipboardItem

      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          hostname: 'example.com'
        },
        configurable: true
      })

      const capabilities = getClipboardCapabilities()

      expect(capabilities.hasClipboardAPI).toBe(false)
      expect(capabilities.isSecureContext).toBe(false)
      expect(capabilities.canCopyHTML).toBe(false)
      expect(capabilities.canCopyText).toBe(true) // 仍然可以通过document.execCommand

      // 恢复
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true
      })
    })
  })
}) 