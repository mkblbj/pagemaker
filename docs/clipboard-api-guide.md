# 剪贴板API使用指南

## 📋 概述

本文档详细说明了Pagemaker CMS中剪贴板功能的实现原理、使用方法和常见问题解决方案。

## 🔍 剪贴板API的历史演进

### 发展阶段

1. **早期（~2000-2015）** - 没有标准的剪贴板API
2. **中期（2015-2018）** - 使用 `document.execCommand('copy')` 
3. **现代（2018-至今）** - 使用 `navigator.clipboard` API

## 🔧 两种实现方法

### 1. 传统方法：document.execCommand('copy')

```javascript
// 传统方法 - 复杂但兼容性好
function copyWithLegacyMethod(text) {
  // 1. 创建一个隐藏的文本框
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.top = '-9999px'  // 放到屏幕外
  
  // 2. 添加到页面
  document.body.appendChild(textArea)
  
  // 3. 选中文本
  textArea.select()
  
  // 4. 执行复制命令
  const successful = document.execCommand('copy')
  
  // 5. 清理
  document.body.removeChild(textArea)
  
  return successful
}
```

**特点：**
- ✅ 兼容性好，支持所有现代浏览器
- ✅ 不需要安全上下文
- ❌ 代码复杂，需要DOM操作
- ❌ 同步操作，可能阻塞UI

### 2. 现代方法：navigator.clipboard

```javascript
// 现代方法 - 简单但有限制
async function copyWithModernAPI(text) {
  await navigator.clipboard.writeText(text)  // 就这一行！
}
```

**特点：**
- ✅ 代码简洁
- ✅ 支持异步操作
- ✅ 支持更多格式（图片、HTML等）
- ✅ 更好的错误处理
- ❌ 需要安全上下文（HTTPS或localhost）
- ❌ 浏览器兼容性有限制

## 🛡️ 安全限制

### 安全上下文要求

现代剪贴板API只能在以下环境中使用：

```javascript
// ✅ 支持的环境
https://example.com      // HTTPS网站
http://localhost:3000    // localhost
http://127.0.0.1:3000   // 本地回环地址

// ❌ 不支持的环境
http://example.com       // HTTP网站
http://192.168.1.26:3000 // 内网IP地址
```

### 浏览器兼容性

| 浏览器 | 最低版本 | 支持状态 |
|--------|----------|----------|
| Chrome | 66+ | ✅ 完全支持 |
| Firefox | 63+ | ✅ 完全支持 |
| Safari | 13.1+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| IE 11 | - | ❌ 不支持 |

## 🔄 降级策略

Pagemaker CMS使用智能降级策略：

```javascript
export async function copyToClipboard(text) {
  // 1. 检查是否支持现代API
  if (navigator.clipboard && isSecureContext()) {
    try {
      await navigator.clipboard.writeText(text)
      return { success: true, message: '内容已复制到剪贴板' }
    } catch (error) {
      console.log('现代API失败，降级到传统方法')
    }
  }
  
  // 2. 降级到传统方法
  return copyWithLegacyMethod(text)
}
```

## 🌐 环境适配表

| 访问环境 | 现代API | 传统方法 | 实际使用 |
|----------|---------|----------|----------|
| `https://mysite.com` | ✅ | ✅ | 现代API |
| `http://localhost:3000` | ✅ | ✅ | 现代API |
| `http://192.168.1.26:3000` | ❌ | ✅ | 传统方法 |
| 老版本浏览器 | ❌ | ✅ | 传统方法 |

## 🔧 使用示例

### 基础复制

```javascript
import { copyToClipboard } from '@/lib/clipboardUtils'

// 复制文本
const result = await copyToClipboard('要复制的文本')
if (result.success) {
  console.log('复制成功')
} else {
  console.error('复制失败:', result.message)
}
```

### 带用户反馈的复制

```javascript
import { copyTextWithFeedback } from '@/lib/clipboardUtils'

// 复制文本并显示用户反馈
const result = await copyTextWithFeedback('要复制的文本')
// 会自动显示成功/失败的提示消息
```

### HTML内容复制

```javascript
import { copyHTMLToClipboard } from '@/lib/clipboardUtils'

const html = '<div>HTML内容</div>'
const plainText = 'HTML内容'

const result = await copyHTMLToClipboard(html, plainText)
```

## 🐛 常见问题

### 1. 提示复制成功但剪贴板没有内容

**原因：** 浏览器阻止了剪贴板API调用

**解决方案：**
- 确保在安全上下文中（HTTPS或localhost）
- 检查浏览器权限设置
- 确保是用户手势触发的操作

### 2. 内网IP地址无法使用现代API

**原因：** `http://192.168.1.26:3000` 不被认为是安全上下文

**解决方案：**
- 使用Chrome开发者标志
- SSH端口转发
- 配置HTTPS开发环境

### 3. 权限被拒绝

**原因：** 用户拒绝了剪贴板权限或浏览器策略限制

**解决方案：**
- 确保在用户手势（点击、键盘）后调用
- 检查浏览器权限设置
- 提供手动复制的备选方案

## 📊 调试信息

Pagemaker CMS在开发环境中提供详细的调试信息：

```javascript
// 控制台输出示例
[Clipboard Debug] 开始复制操作
[Clipboard Debug] 环境检查: {
  clipboardSupported: true,
  secureContext: false,
  protocol: 'http:',
  hostname: '192.168.1.26'
}
[Clipboard Debug] 降级到传统方法
[Clipboard Debug] 传统方法结果: true
```

## 🔍 能力检测

```javascript
import { getClipboardCapabilities } from '@/lib/clipboardUtils'

const capabilities = getClipboardCapabilities()
console.log({
  hasClipboardAPI: capabilities.hasClipboardAPI,
  isSecureContext: capabilities.isSecureContext,
  canCopyHTML: capabilities.canCopyHTML,
  canCopyText: capabilities.canCopyText
})
```

## ⚠️ 注意事项

1. **用户手势要求**：某些浏览器要求剪贴板操作必须在用户手势（点击、按键）的上下文中执行

2. **权限模型**：现代API基于权限模型，用户可能会拒绝权限请求

3. **异步操作**：现代API是异步的，需要正确处理Promise和错误

4. **内容限制**：某些浏览器对复制内容的大小有限制

5. **跨域限制**：iframe中的剪贴板操作可能受到额外限制

## 🛠️ 开发建议

1. **总是提供降级方案**：不要假设现代API总是可用
2. **用户友好的错误处理**：提供清晰的错误消息和备选方案
3. **测试多种环境**：在不同浏览器和网络环境中测试
4. **遵循用户体验原则**：确保复制操作有明确的用户反馈 