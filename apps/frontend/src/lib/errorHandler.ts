/**
 * 统一错误处理系统
 * 提供错误分类、多语言支持、用户友好的错误消息
 */

import { getErrorMessage, type SupportedLanguage } from '@pagemaker/shared-i18n'

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
  CONFLICT = 'CONFLICT',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  code: string
  message: string
  userMessage: string
  details?: any
  timestamp: number
  context?: Record<string, any>
  originalError?: any
  retryable: boolean
  actionable: boolean
  language?: SupportedLanguage
}

// 错误严重程度映射表 (语言无关)
const ERROR_SEVERITY_MAP: Record<string, ErrorSeverity> = {
  // 网络错误
  NETWORK_ERROR: ErrorSeverity.MEDIUM,
  NETWORK_TIMEOUT: ErrorSeverity.MEDIUM,
  NETWORK_OFFLINE: ErrorSeverity.HIGH,

  // 认证错误
  AUTH_TOKEN_EXPIRED: ErrorSeverity.HIGH,
  AUTH_INVALID_CREDENTIALS: ErrorSeverity.MEDIUM,
  AUTH_UNAUTHORIZED: ErrorSeverity.HIGH,

  // 验证错误
  VALIDATION_REQUIRED_FIELD: ErrorSeverity.LOW,
  VALIDATION_INVALID_FORMAT: ErrorSeverity.LOW,
  VALIDATION_FILE_TOO_LARGE: ErrorSeverity.MEDIUM,

  // 服务器错误
  SERVER_INTERNAL_ERROR: ErrorSeverity.HIGH,
  SERVER_MAINTENANCE: ErrorSeverity.HIGH,
  SERVER_OVERLOAD: ErrorSeverity.MEDIUM,

  // 数据冲突
  CONFLICT_VERSION: ErrorSeverity.MEDIUM,
  CONFLICT_DUPLICATE: ErrorSeverity.MEDIUM,

  // 页面编辑器特定错误
  EDITOR_SAVE_FAILED: ErrorSeverity.HIGH,
  EDITOR_LOAD_FAILED: ErrorSeverity.HIGH,
  EDITOR_MODULE_INVALID: ErrorSeverity.MEDIUM,

  // 通用错误
  GENERIC_ERROR: ErrorSeverity.MEDIUM,
  NOT_FOUND: ErrorSeverity.MEDIUM
}

/**
 * 根据 HTTP 状态码分类错误类型
 */
export function getErrorTypeFromStatus(status: number): ErrorType {
  if (status >= 400 && status < 500) {
    switch (status) {
      case 401:
        return ErrorType.AUTHENTICATION
      case 403:
        return ErrorType.AUTHORIZATION
      case 404:
        return ErrorType.NOT_FOUND
      case 408:
        return ErrorType.TIMEOUT
      case 409:
        return ErrorType.CONFLICT
      case 422:
        return ErrorType.VALIDATION
      default:
        return ErrorType.CLIENT
    }
  } else if (status >= 500) {
    return ErrorType.SERVER
  }
  return ErrorType.UNKNOWN
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: AppError): boolean {
  const retryableTypes = [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER]

  const retryableCodes = ['NETWORK_ERROR', 'NETWORK_TIMEOUT', 'SERVER_INTERNAL_ERROR', 'SERVER_OVERLOAD']

  return error.retryable || retryableTypes.includes(error.type) || retryableCodes.includes(error.code)
}

/**
 * 判断错误是否可操作（用户可以采取行动解决）
 */
export function isActionableError(error: AppError): boolean {
  const actionableTypes = [ErrorType.VALIDATION, ErrorType.AUTHENTICATION, ErrorType.CONFLICT]

  const actionableCodes = [
    'AUTH_INVALID_CREDENTIALS',
    'VALIDATION_REQUIRED_FIELD',
    'VALIDATION_INVALID_FORMAT',
    'CONFLICT_VERSION'
  ]

  return error.actionable || actionableTypes.includes(error.type) || actionableCodes.includes(error.code)
}

/**
 * 从原始错误创建标准化的 AppError
 */
export function createAppError(
  originalError: any,
  context?: Record<string, any>,
  language: SupportedLanguage = 'zh-CN'
): AppError {
  let errorCode = 'GENERIC_ERROR'
  let errorType = ErrorType.UNKNOWN

  // 分析原始错误
  if (originalError?.response) {
    // Axios 错误
    const status = originalError.response.status
    errorType = getErrorTypeFromStatus(status)

    // 根据状态码确定错误代码
    switch (status) {
      case 401:
        errorCode = 'AUTH_TOKEN_EXPIRED'
        break
      case 403:
        errorCode = 'AUTH_UNAUTHORIZED'
        break
      case 404:
        errorCode = 'NOT_FOUND'
        break
      case 408:
        errorCode = 'NETWORK_TIMEOUT'
        break
      case 409:
        errorCode = 'CONFLICT_VERSION'
        break
      case 422:
        errorCode = 'VALIDATION_INVALID_FORMAT'
        break
      case 500:
        errorCode = 'SERVER_INTERNAL_ERROR'
        break
      case 503:
        errorCode = 'SERVER_MAINTENANCE'
        break
    }
  } else if (originalError?.code) {
    // 网络错误
    if (originalError.code === 'ECONNABORTED' || originalError.code === 'TIMEOUT') {
      errorCode = 'NETWORK_TIMEOUT'
      errorType = ErrorType.TIMEOUT
    } else if (originalError.code === 'NETWORK_ERROR') {
      errorCode = 'NETWORK_ERROR'
      errorType = ErrorType.NETWORK
    }
  } else if (originalError?.message?.includes('timeout')) {
    errorCode = 'NETWORK_TIMEOUT'
    errorType = ErrorType.TIMEOUT
  } else if (originalError?.message?.includes('network')) {
    errorCode = 'NETWORK_ERROR'
    errorType = ErrorType.NETWORK
  }

  // 获取错误严重程度
  const severity = ERROR_SEVERITY_MAP[errorCode] || ErrorSeverity.MEDIUM

  // 使用多语言系统获取错误消息
  const userMessage = getErrorMessage(errorCode, language)

  // 技术消息保持英文（用于开发调试）
  const message = originalError?.message || errorCode

  return {
    type: errorType,
    severity,
    code: errorCode,
    message,
    userMessage,
    details: originalError?.response?.data,
    timestamp: Date.now(),
    context,
    originalError,
    language,
    retryable: isRetryableError({ type: errorType, code: errorCode } as AppError),
    actionable: isActionableError({ type: errorType, code: errorCode } as AppError)
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorListeners: ((error: AppError) => void)[] = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * 添加错误监听器
   */
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener)
  }

  /**
   * 移除错误监听器
   */
  removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  /**
   * 处理错误
   */
  handleError(originalError: any, context?: Record<string, any>, language?: SupportedLanguage): AppError {
    const appError = createAppError(originalError, context, language)

    // 记录错误
    this.logError(appError)

    // 通知监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(appError)
      } catch (error) {
        console.error('错误监听器执行失败:', error)
      }
    })

    return appError
  }

  /**
   * 记录错误
   */
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity)
    const logMessage = `[${error.type}] ${error.code}: ${error.message}`

    switch (logLevel) {
      case 'error':
        console.error(logMessage, error)
        break
      case 'warn':
        console.warn(logMessage, error)
        break
      case 'info':
        console.info(logMessage, error)
        break
      default:
        console.log(logMessage, error)
    }

    // 发送到错误监控服务（如 Sentry）
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      this.reportToMonitoring(error)
    }
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.LOW:
        return 'info'
      default:
        return 'log'
    }
  }

  /**
   * 上报到监控服务
   */
  private reportToMonitoring(error: AppError): void {
    // 这里可以集成 Sentry、LogRocket 等监控服务
    // 暂时只是控制台输出
    console.error('上报错误到监控服务:', {
      type: error.type,
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      context: error.context
    })
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance()

/**
 * 便捷的错误处理函数
 */
export function handleError(error: any, context?: Record<string, any>, language?: SupportedLanguage): AppError {
  return errorHandler.handleError(error, context, language)
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(error: any, language: SupportedLanguage = 'zh-CN'): string {
  // 检查是否已经是 AppError 类型
  if (error && typeof error === 'object' && 'userMessage' in error && 'type' in error) {
    return error.userMessage
  }

  const appError = createAppError(error, undefined, language)
  return appError.userMessage
}

/**
 * 获取错误的建议操作
 */
export function getErrorActions(error: AppError): Array<{ label: string; action: () => void }> {
  const actions: Array<{ label: string; action: () => void }> = []

  if (isRetryableError(error)) {
    actions.push({
      label: '重试',
      action: () => {
        // 重试逻辑由调用方实现
        console.log('执行重试操作')
      }
    })
  }

  if (error.type === ErrorType.AUTHENTICATION) {
    actions.push({
      label: '重新登录',
      action: () => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    })
  }

  if (error.type === ErrorType.CONFLICT) {
    actions.push({
      label: '刷新页面',
      action: () => {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      }
    })
  }

  return actions
}
