import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ErrorType,
  ErrorSeverity,
  getErrorTypeFromStatus,
  isRetryableError,
  isActionableError,
  createAppError,
  ErrorHandler,
  errorHandler,
  handleError,
  getUserFriendlyMessage,
  getErrorActions
} from './errorHandler'

// Mock shared-i18n
vi.mock('@pagemaker/shared-i18n', () => ({
  createTranslator: vi.fn(() => (key: string) => key),
  getErrorMessage: vi.fn((code: string) => `用户友好的错误消息: ${code}`),
  type: {
    SupportedLanguage: 'zh-CN'
  }
}))

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getErrorTypeFromStatus', () => {
    it('应该正确分类4xx错误', () => {
      expect(getErrorTypeFromStatus(401)).toBe(ErrorType.AUTHENTICATION)
      expect(getErrorTypeFromStatus(403)).toBe(ErrorType.AUTHORIZATION)
      expect(getErrorTypeFromStatus(404)).toBe(ErrorType.NOT_FOUND)
      expect(getErrorTypeFromStatus(408)).toBe(ErrorType.TIMEOUT)
      expect(getErrorTypeFromStatus(409)).toBe(ErrorType.CONFLICT)
      expect(getErrorTypeFromStatus(422)).toBe(ErrorType.VALIDATION)
      expect(getErrorTypeFromStatus(400)).toBe(ErrorType.CLIENT)
    })

    it('应该正确分类5xx错误', () => {
      expect(getErrorTypeFromStatus(500)).toBe(ErrorType.SERVER)
      expect(getErrorTypeFromStatus(503)).toBe(ErrorType.SERVER)
    })

    it('应该正确分类未知状态码', () => {
      expect(getErrorTypeFromStatus(200)).toBe(ErrorType.UNKNOWN)
      expect(getErrorTypeFromStatus(300)).toBe(ErrorType.UNKNOWN)
    })
  })

  describe('isRetryableError', () => {
    it('应该正确识别可重试错误', () => {
      const retryableError = {
        type: ErrorType.NETWORK,
        code: 'NETWORK_ERROR',
        retryable: false
      } as any

      expect(isRetryableError(retryableError)).toBe(true)
    })

    it('应该正确识别不可重试错误', () => {
      const nonRetryableError = {
        type: ErrorType.VALIDATION,
        code: 'VALIDATION_REQUIRED_FIELD',
        retryable: false
      } as any

      expect(isRetryableError(nonRetryableError)).toBe(false)
    })

    it('应该尊重retryable标志', () => {
      const error = {
        type: ErrorType.VALIDATION,
        code: 'VALIDATION_REQUIRED_FIELD',
        retryable: true
      } as any

      expect(isRetryableError(error)).toBe(true)
    })
  })

  describe('isActionableError', () => {
    it('应该正确识别可操作错误', () => {
      const actionableError = {
        type: ErrorType.VALIDATION,
        code: 'VALIDATION_REQUIRED_FIELD',
        actionable: false
      } as any

      expect(isActionableError(actionableError)).toBe(true)
    })

    it('应该正确识别不可操作错误', () => {
      const nonActionableError = {
        type: ErrorType.NETWORK,
        code: 'NETWORK_ERROR',
        actionable: false
      } as any

      expect(isActionableError(nonActionableError)).toBe(false)
    })

    it('应该尊重actionable标志', () => {
      const error = {
        type: ErrorType.NETWORK,
        code: 'NETWORK_ERROR',
        actionable: true
      } as any

      expect(isActionableError(error)).toBe(true)
    })
  })

  describe('createAppError', () => {
    it('应该从Axios错误创建AppError', () => {
      const axiosError = {
        response: {
          status: 401,
          data: { detail: 'Token expired' }
        },
        message: 'Request failed with status code 401'
      }

      const appError = createAppError(axiosError, { userId: '123' })

      expect(appError.type).toBe(ErrorType.AUTHENTICATION)
      expect(appError.code).toBe('AUTH_TOKEN_EXPIRED')
      expect(appError.severity).toBe(ErrorSeverity.HIGH)
      expect(appError.message).toBe('Request failed with status code 401')
      expect(appError.userMessage).toBe('用户友好的错误消息: AUTH_TOKEN_EXPIRED')
      expect(appError.context).toEqual({ userId: '123' })
      expect(appError.details).toEqual({ detail: 'Token expired' })
      expect(appError.retryable).toBe(false)
      expect(appError.actionable).toBe(true)
    })

    it('应该从网络错误创建AppError', () => {
      const networkError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      }

      const appError = createAppError(networkError)

      expect(appError.type).toBe(ErrorType.TIMEOUT)
      expect(appError.code).toBe('NETWORK_TIMEOUT')
      expect(appError.severity).toBe(ErrorSeverity.MEDIUM)
      expect(appError.retryable).toBe(true)
      expect(appError.actionable).toBe(false)
    })

    it('应该从通用错误创建AppError', () => {
      const genericError = new Error('Something went wrong')

      const appError = createAppError(genericError)

      expect(appError.type).toBe(ErrorType.UNKNOWN)
      expect(appError.code).toBe('GENERIC_ERROR')
      expect(appError.severity).toBe(ErrorSeverity.MEDIUM)
      expect(appError.message).toBe('Something went wrong')
    })

    it('应该处理不同语言', () => {
      const error = new Error('Test error')

      const appError = createAppError(error, undefined, 'en-US')

      expect(appError.language).toBe('en-US')
    })
  })

  describe('ErrorHandler', () => {
    let handler: ErrorHandler

    beforeEach(() => {
      handler = ErrorHandler.getInstance()
    })

    it('应该是单例模式', () => {
      const handler1 = ErrorHandler.getInstance()
      const handler2 = ErrorHandler.getInstance()
      expect(handler1).toBe(handler2)
    })

    it('应该添加和移除错误监听器', () => {
      const listener = vi.fn()
      handler.addErrorListener(listener)

      const error = new Error('test error')
      handler.handleError(error)

      expect(listener).toHaveBeenCalled()

      handler.removeErrorListener(listener)
      handler.handleError(error)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('应该正确处理错误', () => {
      const listener = vi.fn()
      handler.addErrorListener(listener)

      const originalError = new Error('test error')
      const context = { action: 'save' }

      const appError = handler.handleError(originalError, context)

      expect(appError.type).toBe(ErrorType.UNKNOWN)
      expect(appError.context).toEqual(context)
      expect(appError.originalError).toBe(originalError)
      expect(listener).toHaveBeenCalledWith(appError)
    })

    it('应该处理监听器执行错误', () => {
      const faultyListener = vi.fn(() => {
        throw new Error('listener error')
      })
      const goodListener = vi.fn()

      handler.addErrorListener(faultyListener)
      handler.addErrorListener(goodListener)

      const error = new Error('test error')
      handler.handleError(error)

      expect(faultyListener).toHaveBeenCalled()
      expect(goodListener).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith('错误监听器执行失败:', expect.any(Error))
    })
  })

  describe('handleError', () => {
    it('应该调用全局错误处理器', () => {
      const error = new Error('test error')
      const context = { test: true }

      const appError = handleError(error, context)

      expect(appError.originalError).toBe(error)
      expect(appError.context).toEqual(context)
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('应该返回AppError的用户消息', () => {
      const appError = {
        type: ErrorType.VALIDATION,
        userMessage: '请填写必填字段',
        code: 'VALIDATION_REQUIRED_FIELD'
      }

      const message = getUserFriendlyMessage(appError)
      expect(message).toBe('请填写必填字段')
    })

    it('应该从普通错误创建用户友好消息', () => {
      const error = new Error('test error')

      const message = getUserFriendlyMessage(error)
      expect(message).toBe('用户友好的错误消息: GENERIC_ERROR')
    })
  })

  describe('getErrorActions', () => {
    it('应该为可重试错误提供重试操作', () => {
      const error = {
        type: ErrorType.NETWORK,
        code: 'NETWORK_ERROR',
        retryable: true,
        actionable: false
      } as any

      const actions = getErrorActions(error)

      expect(actions).toHaveLength(1)
      expect(actions[0].label).toBe('重试')
    })

    it('应该为认证错误提供重新登录操作', () => {
      const error = {
        type: ErrorType.AUTHENTICATION,
        code: 'AUTH_TOKEN_EXPIRED',
        retryable: false,
        actionable: true
      } as any

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      })

      const actions = getErrorActions(error)

      expect(actions).toHaveLength(1)
      expect(actions[0].label).toBe('重新登录')

      // 测试操作执行
      actions[0].action()
      expect(window.location.href).toBe('/login')
    })

    it('应该为冲突错误提供刷新页面操作', () => {
      const error = {
        type: ErrorType.CONFLICT,
        code: 'CONFLICT_VERSION',
        retryable: false,
        actionable: true
      } as any

      // Mock window.location.reload
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      const actions = getErrorActions(error)

      expect(actions).toHaveLength(1)
      expect(actions[0].label).toBe('刷新页面')

      // 测试操作执行
      actions[0].action()
      expect(mockReload).toHaveBeenCalled()
    })

    it('应该为可重试的认证错误提供多个操作', () => {
      const error = {
        type: ErrorType.AUTHENTICATION,
        code: 'AUTH_TOKEN_EXPIRED',
        retryable: true,
        actionable: true
      } as any

      const actions = getErrorActions(error)

      expect(actions).toHaveLength(2)
      expect(actions.map(a => a.label)).toContain('重试')
      expect(actions.map(a => a.label)).toContain('重新登录')
    })
  })
})
