/**
 * 文本编辑器（P3：contenteditable + 工具条）
 * 
 * 核心原则：
 * - 单击激活编辑
 * - 失焦自动保存
 * - 仅输出白名单标签：<b>/<font>/<a>
 * - 回车插入 <br>
 * - 不生成 div/span/style
 */

import { sanitizeHtml } from './htmlSanitizer'

export interface TextEditorOptions {
  onSave?: (html: string) => void
  onCancel?: () => void
}

/**
 * 启用文本编辑（单击激活）
 */
export function enableTextEditing(
  element: HTMLElement,
  options: TextEditorOptions = {}
): () => void {
  let isEditing = false
  let originalHtml = ''
  let toolbar: HTMLElement | null = null

  // 单击激活编辑
  const handleClick = (e: MouseEvent) => {
    // 如果已经在编辑，不重复激活
    if (isEditing) return

    // 忽略 overlay 和工具条的点击
    const target = e.target as HTMLElement
    if (target.closest('.pm-module-overlay') || target.closest('.pm-text-toolbar')) {
      return
    }

    activateEditing()
  }

  // 激活编辑模式
  const activateEditing = () => {
    isEditing = true
    originalHtml = element.innerHTML

    // 设置 contenteditable
    element.setAttribute('contenteditable', 'true')
    element.classList.add('pm-editing')
    element.focus()

    // 显示工具条
    toolbar = createToolbar(element, {
      onBold: () => applyBold(),
      onColor: (color) => applyColor(color),
      onFontSize: (size) => applyFontSize(size),
      onLink: () => applyLink(),
      onSave: () => saveAndDeactivate(),
      onCancel: () => cancelAndDeactivate()
    })

    // 绑定键盘事件
    element.addEventListener('keydown', handleKeyDown)
    element.addEventListener('blur', handleBlur)
  }

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent) => {
    // 回车插入 <br>
    if (e.key === 'Enter') {
      e.preventDefault()
      insertBr()
    }

    // Ctrl+B 加粗
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault()
      applyBold()
    }

    // Esc 取消
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelAndDeactivate()
    }

    // Ctrl+S 保存
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      saveAndDeactivate()
    }
  }

  // 失焦保存
  const handleBlur = (e: FocusEvent) => {
    // 如果焦点移到工具条，不保存
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest('.pm-text-toolbar')) {
      return
    }

    // 延迟保存，给工具条按钮点击时间
    setTimeout(() => {
      if (isEditing && document.activeElement !== element) {
        saveAndDeactivate()
      }
    }, 200)
  }

  // 保存并退出编辑
  const saveAndDeactivate = () => {
    if (!isEditing) return

    // 保护全角空格 - 在获取 innerHTML 之前替换文本节点中的全角空格
    const FULLWIDTH_SPACE = '\u3000'
    const FULLWIDTH_SPACE_PLACEHOLDER = '___FULLWIDTH_SPACE___'
    
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text)
    }
    
    textNodes.forEach(textNode => {
      if (textNode.textContent && textNode.textContent.includes(FULLWIDTH_SPACE)) {
        textNode.textContent = textNode.textContent.replace(/\u3000/g, FULLWIDTH_SPACE_PLACEHOLDER)
      }
    })

    // 获取编辑后的 HTML
    let html = element.innerHTML
    
    // 恢复全角空格
    html = html.replace(new RegExp(FULLWIDTH_SPACE_PLACEHOLDER, 'g'), FULLWIDTH_SPACE)

    // 净化 HTML（移除非白名单标签/属性）
    html = sanitizeHtml(html)

    // 清理浏览器自动生成的标签
    html = cleanupEditorHtml(html)

    // 更新内容
    element.innerHTML = html

    // 退出编辑模式
    deactivate()

    // 触发保存回调
    if (options.onSave) {
      options.onSave(html)
    }
  }

  // 取消并退出编辑
  const cancelAndDeactivate = () => {
    if (!isEditing) return

    // 恢复原始内容
    element.innerHTML = originalHtml

    // 退出编辑模式
    deactivate()

    // 触发取消回调
    if (options.onCancel) {
      options.onCancel()
    }
  }

  // 退出编辑模式
  const deactivate = () => {
    isEditing = false

    element.removeAttribute('contenteditable')
    element.classList.remove('pm-editing')

    element.removeEventListener('keydown', handleKeyDown)
    element.removeEventListener('blur', handleBlur)

    // 移除工具条
    if (toolbar) {
      toolbar.remove()
      toolbar = null
    }
  }

  // 插入 <br>
  const insertBr = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    range.deleteContents()

    const br = document.createElement('br')
    range.insertNode(br)

    // 移动光标到 br 后
    range.setStartAfter(br)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  // 应用加粗
  const applyBold = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    // 检查是否已经在 <b> 标签内
    const parentB = findParentTag(range.commonAncestorContainer, 'b')
    if (parentB) {
      // 移除加粗
      unwrapTag(parentB)
    } else {
      // 添加加粗
      wrapSelection(range, 'b')
    }
  }

  // 应用颜色
  const applyColor = (color: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    // 查找或创建 <font> 标签
    const parentFont = findParentTag(range.commonAncestorContainer, 'font')
    if (parentFont) {
      parentFont.setAttribute('color', color)
    } else {
      const font = document.createElement('font')
      font.setAttribute('color', color)
      wrapSelectionWithElement(range, font)
    }
  }

  // 应用字号
  const applyFontSize = (size: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    const parentFont = findParentTag(range.commonAncestorContainer, 'font')
    if (parentFont) {
      parentFont.setAttribute('size', size)
    } else {
      const font = document.createElement('font')
      font.setAttribute('size', size)
      wrapSelectionWithElement(range, font)
    }
  }

  // 应用链接
  const applyLink = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    // 简单提示输入链接
    const href = prompt('请输入链接地址:')
    if (!href) return

    const a = document.createElement('a')
    a.setAttribute('href', href)
    a.setAttribute('target', '_top')
    wrapSelectionWithElement(range, a)
  }

  // 包裹选区
  const wrapSelection = (range: Range, tagName: string) => {
    const element = document.createElement(tagName)
    wrapSelectionWithElement(range, element)
  }

  const wrapSelectionWithElement = (range: Range, element: HTMLElement) => {
    try {
      range.surroundContents(element)
    } catch (e) {
      // 如果无法直接包裹，使用提取+插入的方式
      const contents = range.extractContents()
      element.appendChild(contents)
      range.insertNode(element)
    }
  }

  // 查找父级标签
  const findParentTag = (node: Node, tagName: string): HTMLElement | null => {
    let current: Node | null = node
    while (current && current !== element) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const el = current as HTMLElement
        if (el.tagName.toLowerCase() === tagName) {
          return el
        }
      }
      current = current.parentNode
    }
    return null
  }

  // 解包标签
  const unwrapTag = (tag: HTMLElement) => {
    const parent = tag.parentNode
    if (!parent) return

    while (tag.firstChild) {
      parent.insertBefore(tag.firstChild, tag)
    }
    parent.removeChild(tag)
  }

  // 绑定事件
  element.addEventListener('click', handleClick)

  // 返回清理函数
  return () => {
    element.removeEventListener('click', handleClick)
    if (isEditing) {
      deactivate()
    }
  }
}

/**
 * 创建浮动工具条
 */
function createToolbar(
  element: HTMLElement,
  handlers: {
    onBold: () => void
    onColor: (color: string) => void
    onFontSize: (size: string) => void
    onLink: () => void
    onSave: () => void
    onCancel: () => void
  }
): HTMLElement {
  const toolbar = document.createElement('div')
  toolbar.className = 'pm-text-toolbar'

  // 加粗按钮
  const boldBtn = createButton('B', '加粗 (Ctrl+B)', () => handlers.onBold())
  boldBtn.style.fontWeight = 'bold'
  toolbar.appendChild(boldBtn)

  // 颜色选择器
  const colorPicker = document.createElement('input')
  colorPicker.type = 'color'
  colorPicker.title = '文字颜色'
  colorPicker.className = 'pm-toolbar-color'
  colorPicker.addEventListener('change', (e) => {
    handlers.onColor((e.target as HTMLInputElement).value)
  })
  toolbar.appendChild(colorPicker)

  // 字号选择
  const sizeSelect = document.createElement('select')
  sizeSelect.className = 'pm-toolbar-size'
  sizeSelect.title = '字号'
  const sizes = ['1', '2', '3', '4', '5', '6', '7']
  sizes.forEach(size => {
    const option = document.createElement('option')
    option.value = size
    option.textContent = size
    if (size === '3') option.selected = true
    sizeSelect.appendChild(option)
  })
  sizeSelect.addEventListener('change', (e) => {
    handlers.onFontSize((e.target as HTMLSelectElement).value)
  })
  toolbar.appendChild(sizeSelect)

  // 链接按钮
  const linkBtn = createButton('🔗', '插入链接', () => handlers.onLink())
  toolbar.appendChild(linkBtn)

  // 分隔符
  const separator = document.createElement('div')
  separator.className = 'pm-toolbar-separator'
  toolbar.appendChild(separator)

  // 保存按钮
  const saveBtn = createButton('✓', '保存 (Ctrl+S)', () => handlers.onSave())
  saveBtn.className += ' pm-toolbar-save'
  toolbar.appendChild(saveBtn)

  // 取消按钮
  const cancelBtn = createButton('✗', '取消 (Esc)', () => handlers.onCancel())
  cancelBtn.className += ' pm-toolbar-cancel'
  toolbar.appendChild(cancelBtn)

  // 定位工具条
  positionToolbar(toolbar, element)

  document.body.appendChild(toolbar)

  return toolbar
}

/**
 * 创建工具条按钮
 */
function createButton(text: string, title: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = 'pm-toolbar-btn'
  btn.textContent = text
  btn.title = title
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault() // 防止失焦
  })
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  })
  return btn
}

/**
 * 定位工具条
 */
function positionToolbar(toolbar: HTMLElement, element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  toolbar.style.position = 'fixed'
  toolbar.style.top = `${rect.top - 40}px`
  toolbar.style.left = `${rect.left}px`
  toolbar.style.zIndex = '1000'
}

/**
 * 清理编辑器生成的 HTML
 */
function cleanupEditorHtml(html: string): string {
  // 移除浏览器自动生成的 div
  html = html.replace(/<div>/gi, '')
  html = html.replace(/<\/div>/gi, '<br>')

  // 移除空的 span
  html = html.replace(/<span[^>]*><\/span>/gi, '')

  // 移除 style 属性（净化已处理，这里是双保险）
  html = html.replace(/\s+style="[^"]*"/gi, '')

  return html
}

