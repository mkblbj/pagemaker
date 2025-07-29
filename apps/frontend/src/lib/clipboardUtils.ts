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
 * 强制显示复制对话框的方法
 */
function showCopyDialogInternal(text: string): void {
  // 创建模态对话框
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  const dialog = document.createElement('div')
  dialog.style.cssText = `
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
  `

  const title = document.createElement('h3')
  title.textContent = '复制内容'
  title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: bold;'

  const instruction = document.createElement('p')
  instruction.textContent = '请选择下面的文本并按 Ctrl+C (或 Cmd+C) 复制：'
  instruction.style.cssText = 'margin: 0 0 12px 0; color: #666;'

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = `
    width: 100%;
    height: 120px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
    resize: vertical;
  `

  const buttonContainer = document.createElement('div')
  buttonContainer.style.cssText = 'margin-top: 16px; text-align: right;'

  const closeButton = document.createElement('button')
  closeButton.textContent = '关闭'
  closeButton.style.cssText = `
    padding: 8px 16px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
  `

  closeButton.onclick = () => {
    document.body.removeChild(overlay)
  }

  // 点击遮罩层也可以关闭
  overlay.onclick = e => {
    if (e.target === overlay) {
      document.body.removeChild(overlay)
    }
  }

  buttonContainer.appendChild(closeButton)
  dialog.appendChild(title)
  dialog.appendChild(instruction)
  dialog.appendChild(textarea)
  dialog.appendChild(buttonContainer)
  overlay.appendChild(dialog)
  document.body.appendChild(overlay)

  // 自动选中文本
  setTimeout(() => {
    textarea.focus()
    textarea.select()
  }, 100)
}

/**
 * 使用传统方法复制文本（降级方案）
 */
async function copyWithLegacyMethod(text: string): Promise<ClipboardResult> {
  try {
    // 尝试方法1: 使用textarea
    let successful = false
    let textArea: HTMLTextAreaElement | null = null

    try {
      // 创建临时文本区域
      textArea = document.createElement('textarea')
      textArea.value = text

      // 设置样式使其不可见但可选择 - 使用更简单的方法
      textArea.style.position = 'fixed'
      textArea.style.top = '0'
      textArea.style.left = '0'
      textArea.style.width = '1px'
      textArea.style.height = '1px'
      textArea.style.opacity = '0'
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.padding = '0'
      textArea.style.margin = '0'

      // 添加到DOM
      document.body.appendChild(textArea)

      // 聚焦并选择文本 - 添加延迟确保DOM操作完成
      textArea.focus()

      // 等待DOM操作完成
      await new Promise(resolve => setTimeout(resolve, 10))

      textArea.select()

      // 强制设置选择范围
      if (textArea.setSelectionRange) {
        textArea.setSelectionRange(0, text.length)
      }

      // 再次等待确保选择完成
      await new Promise(resolve => setTimeout(resolve, 10))

      // 检查是否成功选中
      const selectedText = textArea.value.substring(textArea.selectionStart || 0, textArea.selectionEnd || text.length)
      console.log('[Clipboard] 选中文本长度:', selectedText.length, '原文本长度:', text.length)

      // 执行复制命令
      successful = document.execCommand('copy')
      console.log('[Clipboard] execCommand结果:', successful)

      // 验证复制是否真的成功 - 尝试立即执行另一个复制操作
      if (successful) {
        // 创建一个测试文本来验证复制是否真的工作
        const testArea = document.createElement('textarea')
        testArea.value = 'test-verification'
        testArea.style.position = 'fixed'
        testArea.style.left = '0'
        testArea.style.top = '0'
        testArea.style.opacity = '0'
        document.body.appendChild(testArea)
        testArea.select()
        const testResult = document.execCommand('copy')
        document.body.removeChild(testArea)

        if (testResult) {
          console.log('[Clipboard] 验证测试：复制功能正常工作')
          // 重新复制原始内容
          const finalArea = document.createElement('textarea')
          finalArea.value = text
          finalArea.style.position = 'fixed'
          finalArea.style.left = '0'
          finalArea.style.top = '0'
          finalArea.style.opacity = '0'
          document.body.appendChild(finalArea)
          finalArea.focus()
          finalArea.select()
          const finalResult = document.execCommand('copy')
          document.body.removeChild(finalArea)
          successful = finalResult
          console.log('[Clipboard] 最终复制结果:', finalResult)
        }
      }

      // 在一些浏览器中，execCommand可能返回true但实际没有复制成功
      // 我们在非安全上下文下无法验证，所以相信execCommand的结果
    } finally {
      // 确保清理DOM元素
      if (textArea && textArea.parentNode) {
        document.body.removeChild(textArea)
      }
    }

    // 如果textarea方法失败，尝试方法2: 使用input
    if (!successful) {
      console.log('[Clipboard] textarea方法失败，尝试input方法')
      let input: HTMLInputElement | null = null

      try {
        input = document.createElement('input')
        input.type = 'text'
        input.value = text
        input.style.position = 'fixed'
        input.style.top = '-1000px'
        input.style.left = '-1000px'
        input.style.opacity = '0'

        document.body.appendChild(input)
        input.focus()
        input.select()

        successful = document.execCommand('copy')
        console.log('[Clipboard] input方法结果:', successful)
      } finally {
        if (input && input.parentNode) {
          document.body.removeChild(input)
        }
      }
    }

    // 如果还是失败，显示手动复制对话框
    if (!successful) {
      console.log('[Clipboard] 所有自动方法失败，显示手动复制对话框')
      showCopyDialogInternal(text)
      return {
        success: false,
        message: '自动复制失败，已显示手动复制对话框'
      }
    }

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
    console.error('[Clipboard] 传统方法异常:', error)
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

  const clipboardSupported = isClipboardSupported()
  const secureContext = isSecureContext()

  console.log('[Clipboard Debug] 环境检查:', {
    clipboardSupported,
    secureContext,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    textLength: text.length,
    documentHasFocus: document.hasFocus(),
    activeElement: document.activeElement?.tagName
  })

  // 优先使用现代 Clipboard API
  if (clipboardSupported && secureContext) {
    console.log('[Clipboard] 使用现代API')
    return await copyWithClipboardAPI(text)
  }

  // 降级到传统方法
  console.log('[Clipboard] 使用传统方法')
  const result = await copyWithLegacyMethod(text)
  console.log('[Clipboard] 传统方法结果:', result.success)
  return result
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
  } catch {
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
  console.log('[copyTextWithFeedback] 开始复制，文本长度:', text.length)
  console.log('[copyTextWithFeedback] 文本预览:', text.substring(0, 100) + '...')

  const result = await copyToClipboard(text)
  console.log('[copyTextWithFeedback] copyToClipboard结果:', result)

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

/**
 * 最简单直接的复制方法 - 用于调试和备选
 */
export function copyWithSimpleMethod(text: string): boolean {
  try {
    console.log('[Clipboard] 尝试最简单的复制方法')

    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.width = '1px'
    textArea.style.height = '1px'
    textArea.style.opacity = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.padding = '0'
    textArea.style.margin = '0'

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    // 强制触发选择
    if (textArea.setSelectionRange) {
      textArea.setSelectionRange(0, text.length)
    }

    const result = document.execCommand('copy')
    document.body.removeChild(textArea)

    console.log('[Clipboard] 简单方法结果:', result)
    return result
  } catch (error) {
    console.error('[Clipboard] 简单方法失败:', error)
    return false
  }
}

/**
 * 强制显示复制对话框的方法
 */
export function showCopyDialog(text: string): void {
  showCopyDialogInternal(text)
}
