/**
 * 字符数统计工具函数
 */

/**
 * 计算乐天规定的字符数（半角0.5，全角1）
 * @param text 要计算的文本
 * @returns 乐天规定的字符数
 */
export function calculateRakutenCharCount(text: string): number {
  let count = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // 全角字符（Unicode > 0xFF）算1个字符，半角算0.5个字符
    if (code > 0xFF) {
      count += 1
    } else {
      count += 0.5
    }
  }
  return count
}

/**
 * 计算HTML内容的字符统计信息
 * @param html HTML内容
 * @returns 包含标准字符数、乐天字符数和字节数的对象
 */
export function calculateHtmlCharStats(html: string) {
  return {
    standardCount: html.length,
    rakutenCount: calculateRakutenCharCount(html),
    bytes: new Blob([html]).size
  }
}

/**
 * 格式化字符数显示
 * @param count 字符数
 * @param useK 是否使用k单位（当数字大于1000时）
 * @returns 格式化后的字符串
 */
export function formatCharCount(count: number, useK: boolean = false): string {
  if (useK && count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toLocaleString()
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  return `${(bytes / 1024).toFixed(2)} KB`
}

