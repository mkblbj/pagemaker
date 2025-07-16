/**
 * 剪贴板操作结果
 */
export interface ClipboardResult {
  success: boolean
  message: string
  error?: Error
}

/**
 * 检查浏览器是否支持现代 Clipboard API
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && 'clipboard' in navigator && typeof navigator.clipboard.writeText === 'function'
  )
}

/**
 * 检查是否在安全上下文中（HTTPS 或 localhost）
 */
export function isSecureContext(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  )
}

/**
 * 使用现代 Clipboard API 复制文本
 */
async function copyWithClipboardAPI(text: string): Promise<ClipboardResult> {
  try {
    await navigator.clipboard.writeText(text)
    return {
      success: true,
      message: '内容已复制到剪贴板'
    }
  } catch (error) {
    return {
      success: false,
      message: '复制失败，请手动复制',
      error: error instanceof Error ? error : new Error('Unknown clipboard error')
    }
  }
}

/**
 * 使用传统方法复制文本（降级方案）
 */
function copyWithLegacyMethod(text: string): ClipboardResult {
  try {
    // 创建临时文本区域
    const textArea = document.createElement('textarea')
    textArea.value = text

    // 设置样式使其不可见
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.setAttribute('readonly', '')

    // 添加到DOM
    document.body.appendChild(textArea)

    // 选择文本
    textArea.select()
    textArea.setSelectionRange(0, text.length)

    // 执行复制命令
    const successful = document.execCommand('copy')

    // 清理
    document.body.removeChild(textArea)

    if (successful) {
      return {
        success: true,
        message: '内容已复制到剪贴板'
      }
    } else {
      return {
        success: false,
        message: '复制失败，请手动复制'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '复制失败，请手动复制',
      error: error instanceof Error ? error : new Error('Unknown legacy copy error')
    }
  }
}

/**
 * 复制文本到剪贴板（主要函数）
 * 自动选择最佳的复制方法
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  // 验证输入
  if (typeof text !== 'string') {
    return {
      success: false,
      message: '无效的文本内容'
    }
  }

  if (text.length === 0) {
    return {
      success: false,
      message: '文本内容为空'
    }
  }

  // 检查浏览器环境
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      success: false,
      message: '不支持的环境'
    }
  }

  // 优先使用现代 Clipboard API
  if (isClipboardSupported() && isSecureContext()) {
    return await copyWithClipboardAPI(text)
  }

  // 降级到传统方法
  return copyWithLegacyMethod(text)
}

/**
 * 复制HTML内容到剪贴板
 * 包含纯文本和HTML格式
 */
export async function copyHTMLToClipboard(html: string, plainText?: string): Promise<ClipboardResult> {
  // 验证输入
  if (typeof html !== 'string' || html.length === 0) {
    return {
      success: false,
      message: 'HTML内容为空'
    }
  }

  // 如果不支持现代API或不在安全上下文中，降级到纯文本复制
  if (!isClipboardSupported() || !isSecureContext()) {
    return await copyToClipboard(plainText || html)
  }

  try {
    // 使用现代 Clipboard API 复制HTML
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText || html], { type: 'text/plain' })
    })

    await navigator.clipboard.write([clipboardItem])

    return {
      success: true,
      message: 'HTML内容已复制到剪贴板'
    }
  } catch (error) {
    // 如果HTML复制失败，降级到纯文本
    return await copyToClipboard(plainText || html)
  }
}

/**
 * 显示复制结果的用户反馈
 */
export function showCopyFeedback(result: ClipboardResult, duration = 3000): void {
  // 创建反馈元素
  const feedback = document.createElement('div')
  feedback.textContent = result.message

  // 设置样式
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    pointer-events: none;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    ${
      result.success
        ? 'background-color: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);'
        : 'background-color: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);'
    }
  `

  // 添加到页面
  document.body.appendChild(feedback)

  // 显示动画
  requestAnimationFrame(() => {
    feedback.style.transform = 'translateX(0)'
  })

  // 自动移除
  setTimeout(() => {
    feedback.style.transform = 'translateX(100%)'
    setTimeout(() => {
      if (feedback.parentNode) {
        document.body.removeChild(feedback)
      }
    }, 300)
  }, duration)
}

/**
 * 便捷函数：复制文本并显示反馈
 */
export async function copyTextWithFeedback(text: string, duration?: number): Promise<ClipboardResult> {
  const result = await copyToClipboard(text)
  showCopyFeedback(result, duration)
  return result
}

/**
 * 便捷函数：复制HTML并显示反馈
 */
export async function copyHTMLWithFeedback(
  html: string,
  plainText?: string,
  duration?: number
): Promise<ClipboardResult> {
  const result = await copyHTMLToClipboard(html, plainText)
  showCopyFeedback(result, duration)
  return result
}

/**
 * 获取剪贴板能力信息
 */
export function getClipboardCapabilities(): {
  hasClipboardAPI: boolean
  isSecureContext: boolean
  canCopyHTML: boolean
  canCopyText: boolean
} {
  const hasClipboardAPI = isClipboardSupported()
  const isSecure = isSecureContext()

  return {
    hasClipboardAPI,
    isSecureContext: isSecure,
    canCopyHTML: hasClipboardAPI && isSecure && typeof ClipboardItem !== 'undefined',
    canCopyText: hasClipboardAPI || typeof document !== 'undefined'
  }
}
