'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import ImageSelectorDialog, { type ImageSelectorResult } from '@/components/feature/ImageSelectorDialog'
import { useTranslation } from '@/contexts/I18nContext'
import { usePageStore } from '@/stores/usePageStore'
import { sanitizeHtml } from '@/lib/htmlSanitizer'

interface EditableCustomHTMLRendererProps {
  html: string
  isEditing?: boolean
  onUpdate?: (html: string) => void
}

export function EditableCustomHTMLRenderer({ html, isEditing = false, onUpdate }: EditableCustomHTMLRendererProps) {
  const { tEditor } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const editingElementRef = useRef<HTMLElement | null>(null)
  const originalHtmlRef = useRef<string>(html)
  
  // 工具条状态管理
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  const [formatState, setFormatState] = useState({
    isBold: false,
    color: '',
    size: '',
    linkHref: ''
  })
  const [showColorPicker, setShowColorPicker] = useState(false)
  const savedSelectionRef = useRef<Range | null>(null)
  // 最近一次使用的颜色（用于快速一键应用）
  const lastUsedColorRef = useRef<string | null>(null)
  const interactingWithToolbarRef = useRef(false)
  
  // 常用颜色列表
  const commonColors = [
    '#000000', '#16A085', '#2F9688', '#2980B9', '#A233C6', '#5A6268',
    '#FFB800', '#009688', '#5FB878', '#1E9FFF', '#A233C6', '#2F4056',
    '#E74C3C', '#D35400', '#C0392B', '#EEEEEE', '#90A4AE', '#C8C8C8',
    '#FFFFFF', '#8D6E63', '#A1887F', '#BDBDBD', '#78909C', '#9E9E9E'
  ]

  // 清理HTML - 移除编辑器添加的class和浏览器自动添加的标签
  const cleanHTML = useCallback((html: string): string => {
    if (!html) return ''
    
    let cleanedHTML = html
    
    // 移除编辑器相关的class
    cleanedHTML = cleanedHTML.replace(/\s+class="editable-text"/gi, '')
    cleanedHTML = cleanedHTML.replace(/\s+class="editable-image"/gi, '')
    cleanedHTML = cleanedHTML.replace(/\s+class="editing-text"/gi, '')
    cleanedHTML = cleanedHTML.replace(/\s+class='editable-text'/gi, '')
    cleanedHTML = cleanedHTML.replace(/\s+class='editable-image'/gi, '')
    cleanedHTML = cleanedHTML.replace(/\s+class='editing-text'/gi, '')
    
    // 从包含多个class的属性中移除编辑器class
    cleanedHTML = cleanedHTML.replace(/class="([^"]*)"/gi, (match, classes) => {
      const classList = classes.split(/\s+/).filter((cls: string) => 
        cls && !['editable-text', 'editable-image', 'editing-text'].includes(cls)
      )
      return classList.length > 0 ? `class="${classList.join(' ')}"` : ''
    })
    
    cleanedHTML = cleanedHTML.replace(/class='([^']*)'/gi, (match, classes) => {
      const classList = classes.split(/\s+/).filter((cls: string) => 
        cls && !['editable-text', 'editable-image', 'editing-text'].includes(cls)
      )
      return classList.length > 0 ? `class='${classList.join(' ')}'` : ''
    })
    
    // 移除 contenteditable 属性
    cleanedHTML = cleanedHTML.replace(/\s+contenteditable="[^"]*"/gi, '')
    cleanedHTML = cleanedHTML.replace(/\s+contenteditable='[^']*'/gi, '')
    cleanedHTML = cleanedHTML.replace(/\s+contenteditable=\w+/gi, '')
    
    // 移除浏览器自动添加的 <tbody> 标签
    cleanedHTML = cleanedHTML.replace(/<tbody>/gi, '')
    cleanedHTML = cleanedHTML.replace(/<\/tbody>/gi, '')
    
    // 注意：不再进行空格规范化，以避免改变原始 HTML 结构
    // 之前的 /\s+>/g 和 /\s{2,}/g 替换会导致即使没有编辑也会触发变化
    
    return cleanedHTML
  }, [])

  // 坐标转换：iframe 内选区坐标 → 页面坐标
  const updateToolbarPosition = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    const selection = iframeDoc.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const rangeRect = range.getBoundingClientRect()
    const iframeRect = iframe.getBoundingClientRect()

    // 计算工具条位置（选区上方 50px）
    const x = iframeRect.left + rangeRect.left + (rangeRect.width / 2) - 100 // 工具条宽度约 200px，居中
    const y = iframeRect.top + rangeRect.top - 50 + window.scrollY

    setToolbarPosition({ x, y })
  }, [])

  // 在失焦前保存选区（供外部工具条交互时恢复）
  const preserveSelection = useCallback(() => {
    const iframe = iframeRef.current
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document
    if (!iframeDoc) return
    const selection = iframeDoc.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const rangeText = range.toString()
      if (!range.collapsed && rangeText.length > 0) {
        // 只有当选区有效且有文本时才保存
        savedSelectionRef.current = range.cloneRange()
        console.log('[preserveSelection] 选区已保存:', rangeText, '| 保存时栈:', new Error().stack?.split('\n')[2])
      } else {
        // 选区已折叠或为空，不覆盖之前保存的选区（但要确保之前的选区也是有效的）
        const savedText = savedSelectionRef.current?.toString() || ''
        if (savedText.length === 0) {
          // 之前保存的选区也是空的，说明出了问题
          console.log('[preserveSelection] ⚠️ 选区无效且之前保存的选区也是空的！')
        } else {
          console.log('[preserveSelection] 选区无效（折叠或为空），保持之前的选区:', savedText)
        }
      }
    } else {
      console.log('[preserveSelection] 没有选区')
    }
  }, [])

  // 恢复选区并确保 iframe 获得焦点
  const restoreSelection = useCallback(() => {
    const iframe = iframeRef.current
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document
    if (!iframe || !iframeDoc) return false
    if (!savedSelectionRef.current) return false
    // 先聚焦 iframe 再恢复选区
    try {
      iframe.contentWindow?.focus()
      iframeDoc.body.focus()
      const selection = iframeDoc.getSelection()
      if (!selection) return false
      selection.removeAllRanges()
      selection.addRange(savedSelectionRef.current)
      return true
    } catch {
      return false
    }
  }, [])

  // 格式状态识别：检测选区是否在 b/font/a 标签内
  const detectFormatState = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    const selection = iframeDoc.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    let node = range.commonAncestorContainer

    // 如果是文本节点，取其父元素
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement!
    }

    const element = node as HTMLElement

    // 向上查找最近的格式标签
    const parentB = element.closest('b')
    const parentFont = element.closest('font')
    const parentA = element.closest('a')

    setFormatState({
      isBold: !!parentB,
      color: parentFont?.getAttribute('color') || '',
      size: parentFont?.getAttribute('size') || '',
      linkHref: parentA?.getAttribute('href') || ''
    })
  }, [])

  // 同步 HTML 修改回父组件
  const syncHTMLChanges = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe || !onUpdate) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    // 保护全角空格 - 在获取 innerHTML 之前替换文本节点中的全角空格
    const FULLWIDTH_SPACE = '\u3000'
    const FULLWIDTH_SPACE_PLACEHOLDER = '___FULLWIDTH_SPACE___'
    
    const textNodes: Text[] = []
    const walker = iframeDoc.createTreeWalker(iframeDoc.body, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text)
    }
    
    textNodes.forEach(textNode => {
      if (textNode.textContent && textNode.textContent.includes(FULLWIDTH_SPACE)) {
        textNode.textContent = textNode.textContent.replace(/\u3000/g, FULLWIDTH_SPACE_PLACEHOLDER)
      }
    })

    const updatedHTML = iframeDoc.body.innerHTML
    
    // 恢复全角空格
    let htmlWithFullwidthSpaces = updatedHTML.replace(new RegExp(FULLWIDTH_SPACE_PLACEHOLDER, 'g'), FULLWIDTH_SPACE)
    
    // 净化 HTML（移除非白名单标签/属性）
    htmlWithFullwidthSpaces = sanitizeHtml(htmlWithFullwidthSpaces)
    
    // 清理编辑器添加的 class 和浏览器自动添加的标签
    const cleanedHTML = cleanHTML(htmlWithFullwidthSpaces)
    
    // 恢复文本节点中的全角空格（因为 textContent 修改会影响 DOM）
    textNodes.forEach(textNode => {
      if (textNode.textContent && textNode.textContent.includes(FULLWIDTH_SPACE_PLACEHOLDER)) {
        textNode.textContent = textNode.textContent.replace(new RegExp(FULLWIDTH_SPACE_PLACEHOLDER, 'g'), FULLWIDTH_SPACE)
      }
    })
    
    // 比较清理后的 HTML 和原始 HTML，只有真正发生变化时才调用 onUpdate
    // 同时也清理原始 HTML 以确保公平比较
    const cleanedOriginalHTML = cleanHTML(sanitizeHtml(originalHtmlRef.current))
    
    if (cleanedHTML !== cleanedOriginalHTML) {
      onUpdate(cleanedHTML)
      // 更新原始 HTML 引用
      originalHtmlRef.current = cleanedHTML
    }
  }, [onUpdate, cleanHTML])

  // 格式化命令：加粗
  const applyBold = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    const selection = iframeDoc.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) return

    try {
      // 检查是否已经在 <b> 标签内
      let node = range.commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement!
      }
      const parentB = (node as HTMLElement).closest('b')

      if (parentB && parentB.textContent === selectedText) {
        // 取消加粗：unwrap <b>
        const textNode = iframeDoc.createTextNode(parentB.textContent || '')
        parentB.parentNode?.replaceChild(textNode, parentB)
      } else {
        // 添加加粗：wrap <b>
        const b = iframeDoc.createElement('b')
        range.surroundContents(b)
      }

      syncHTMLChanges()
      detectFormatState()
    } catch (error) {
      alert('请选择同一段落内的文字')
    }
  }, [syncHTMLChanges, detectFormatState])

  // 格式化命令：颜色（切换颜色选择器显示）
  const toggleColorPicker = useCallback(() => {
    console.log('[toggleColorPicker] 切换颜色面板')
    const willOpen = !showColorPicker
    console.log('[toggleColorPicker] willOpen:', willOpen)

    if (!willOpen) {
      // 关闭面板时清理
      console.log('[toggleColorPicker] 关闭面板')
      interactingWithToolbarRef.current = false
      savedSelectionRef.current = null
    }
    // 注意：打开面板时的 interactingWithToolbarRef 和 preserveSelection 已经在 onMouseDown 中处理了

    setShowColorPicker(willOpen)
  }, [showColorPicker])

  // 应用选中的颜色
  const applyColor = useCallback((color: string) => {
    console.log('[applyColor] 开始应用颜色:', color)
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    // 关键：先让 iframe 的 body 重新获得焦点
    const bodyElement = iframeDoc.body
    if (bodyElement) {
      bodyElement.focus()
      console.log('[applyColor] iframe body 已获得焦点')
    }

    let selection = iframeDoc.getSelection()
    let range: Range | null = null

    console.log('[applyColor] 当前选区状态:', {
      hasSelection: !!selection,
      rangeCount: selection?.rangeCount,
      collapsed: selection?.rangeCount ? selection.getRangeAt(0).collapsed : 'N/A',
      hasSavedSelection: !!savedSelectionRef.current,
      savedText: savedSelectionRef.current?.toString()
    })

    // 正常使用当前选区
    if (selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
      range = selection.getRangeAt(0)
      console.log('[applyColor] 使用当前选区:', range.toString())
    } else if (savedSelectionRef.current) {
      // 若选区丢失（比如点击了色板导致失焦），尝试恢复已保存的选区
      console.log('[applyColor] 尝试恢复保存的选区:', savedSelectionRef.current.toString())
      if (!selection) selection = iframeDoc.getSelection()
      if (selection) {
        try {
          selection.removeAllRanges()
          selection.addRange(savedSelectionRef.current)
          range = selection.getRangeAt(0)
          console.log('[applyColor] 选区恢复成功:', range.toString())
        } catch (e) {
          // 回退：直接使用保存的 range（极端情况下 selection API 失败）
          console.log('[applyColor] 选区恢复失败，使用保存的 range:', e)
          range = savedSelectionRef.current
        }
      } else {
        range = savedSelectionRef.current
      }
    }

    if (!range) {
      console.log('[applyColor] 没有可用的选区，退出')
      return
    }

    const selectedText = range.toString()
    if (!selectedText) {
      console.log('[applyColor] 选区文本为空，退出')
      return
    }
    
    console.log('[applyColor] 准备应用颜色到文本:', selectedText)

    try {
      // 检查是否已经在 <font color> 内
      let node = range.commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement!
      }
      const parentFont = (node as HTMLElement).closest('font[color]')

      if (parentFont && parentFont.textContent === selectedText) {
        // 更新颜色
        parentFont.setAttribute('color', color.toUpperCase())
      } else {
        // 添加颜色：wrap <font color>
        const font = iframeDoc.createElement('font')
        font.setAttribute('color', color.toUpperCase())
        range.surroundContents(font)
      }

      syncHTMLChanges()
      detectFormatState()
      setShowColorPicker(false)
      setShowToolbar(false)
      interactingWithToolbarRef.current = false
      // 记录最后使用的颜色
      lastUsedColorRef.current = color
      // 成功后清理保存的选区
      savedSelectionRef.current = null
    } catch (error) {
      alert('请选择同一段落内的文字')
    }
  }, [syncHTMLChanges, detectFormatState])

  // 清除颜色（仅移除 font[color]，保留 size）
  const clearColor = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    // 关键：先让 iframe 的 body 重新获得焦点
    const bodyElement = iframeDoc.body
    if (bodyElement) {
      bodyElement.focus()
    }

    let selection = iframeDoc.getSelection()
    let range: Range | null = null

    if (selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
      range = selection.getRangeAt(0)
    } else if (savedSelectionRef.current) {
      if (!selection) selection = iframeDoc.getSelection()
      if (selection) {
        try {
          selection.removeAllRanges()
          selection.addRange(savedSelectionRef.current)
          range = selection.getRangeAt(0)
        } catch {
          range = savedSelectionRef.current
        }
      } else {
        range = savedSelectionRef.current
      }
    }

    if (!range) return

    try {
      let node = range.commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement!
      }
      const parentFont = (node as HTMLElement).closest('font[color]')

      if (parentFont) {
        const hasSize = parentFont.hasAttribute('size')
        if (hasSize) {
          // 保留 size，仅移除 color
          parentFont.removeAttribute('color')
        } else {
          // 没有 size，直接 unwrap
          const textNode = iframeDoc.createTextNode(parentFont.textContent || '')
          parentFont.parentNode?.replaceChild(textNode, parentFont)
        }
      }

      syncHTMLChanges()
      detectFormatState()
      setShowColorPicker(false)
      setShowToolbar(false)
      interactingWithToolbarRef.current = false
      savedSelectionRef.current = null
    } catch (error) {
      alert('请选择同一段落内的文字')
    }
  }, [syncHTMLChanges, detectFormatState])

  // 格式化命令：字号
  const applySize = useCallback(() => {
    const size = prompt('请输入字号（1-7）：', formatState.size || '3')
    if (!size || !/^[1-7]$/.test(size)) return

    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    const selection = iframeDoc.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) return

    try {
      // 检查是否已经在 <font size> 内
      let node = range.commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement!
      }
      const parentFont = (node as HTMLElement).closest('font[size]')

      if (parentFont && parentFont.textContent === selectedText) {
        // 更新字号
        parentFont.setAttribute('size', size)
      } else {
        // 添加字号：wrap <font size>
        const font = iframeDoc.createElement('font')
        font.setAttribute('size', size)
        range.surroundContents(font)
      }

      syncHTMLChanges()
      detectFormatState()
    } catch (error) {
      alert('请选择同一段落内的文字')
    }
  }, [formatState.size, syncHTMLChanges, detectFormatState])

  // 格式化命令：链接
  const applyLink = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    const selection = iframeDoc.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) return

    try {
      // 检查是否已经在 <a> 标签内
      let node = range.commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement!
      }
      const parentA = (node as HTMLElement).closest('a')

      if (parentA && parentA.textContent === selectedText) {
        // 编辑或取消链接
        const action = confirm('当前已是链接。点击"确定"编辑链接，点击"取消"移除链接')
        if (action) {
          const url = prompt('请输入链接地址：', parentA.getAttribute('href') || 'https://')
          if (url) {
            parentA.setAttribute('href', url)
            parentA.setAttribute('target', '_blank')
          }
        } else {
          // 移除链接：unwrap <a>
          const textNode = iframeDoc.createTextNode(parentA.textContent || '')
          parentA.parentNode?.replaceChild(textNode, parentA)
        }
      } else {
        // 添加链接：wrap <a>
        const url = prompt('请输入链接地址：', 'https://')
        if (url) {
          const a = iframeDoc.createElement('a')
          a.setAttribute('href', url)
          a.setAttribute('target', '_blank')
          range.surroundContents(a)
        }
      }

      syncHTMLChanges()
      detectFormatState()
    } catch (error) {
      alert('请选择同一段落内的文字')
    }
  }, [syncHTMLChanges, detectFormatState])

  // 处理图片选择
  const handleImageSelect = useCallback(
    (result: ImageSelectorResult) => {
      if (selectedImageIndex === null) return

      const iframe = iframeRef.current
      if (!iframe) return

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) return

      // 重新查找图片元素（使用索引）
      const images = iframeDoc.querySelectorAll('img')
      const targetImage = images[selectedImageIndex] as HTMLImageElement
      
      if (!targetImage) return

      // 仅更新图片 src，不修改 width/height/alt（符合 P4 规范）
      targetImage.src = result.url

      // 同步修改
      syncHTMLChanges()

      setShowImageSelector(false)
      setSelectedImageIndex(null)
    },
    [selectedImageIndex, syncHTMLChanges]
  )

  // 初始化 iframe 并注入编辑脚本
  useEffect(() => {
    // 当 html prop 变化时，更新原始 HTML 引用
    originalHtmlRef.current = html
    
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    // 保护全角空格 - 使用 &#12288; (HTML实体) 代替 \u3000
    // 这样即使经过浏览器 DOM 解析，也能保留全角空格
    const FULLWIDTH_SPACE = '\u3000'
    const FULLWIDTH_SPACE_ENTITY = '&#12288;'
    const protectedHtml = html.replace(/\u3000/g, FULLWIDTH_SPACE_ENTITY)

    // 写入HTML内容（紧凑格式，避免额外空白）
    iframeDoc.open()
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;font-family:inherit;cursor:text;}body:hover{outline:1px dashed #3b82f6;outline-offset:2px;}body.editing-text{outline:2px solid #3b82f6 !important;outline-offset:2px;background:#eff6ff !important;}.editable-image{cursor:pointer !important;transition:opacity 0.2s,outline 0.2s;}.editable-image:hover{opacity:0.85;outline:2px solid #3b82f6;outline-offset:2px;}</style></head><body>${protectedHtml}</body></html>`
    iframeDoc.write(htmlContent)
    iframeDoc.close()

    // 自动调整iframe高度（按实际内容大小，不设最小值）
    const resizeIframe = () => {
      const body = iframeDoc.body
      const html = iframeDoc.documentElement
      const height = Math.max(
        body.scrollHeight, 
        body.offsetHeight, 
        html.clientHeight, 
        html.scrollHeight, 
        html.offsetHeight,
        1 // 最小1px，避免完全消失
      )
      setIframeHeight(height)
    }

    // 等待内容加载完成
    setTimeout(resizeIframe, 100)

    // 监听窗口大小变化
    const observer = new ResizeObserver(resizeIframe)
    observer.observe(iframeDoc.body)

    // 注入编辑功能（整个 body 可编辑）
    const bodyElement = iframeDoc.body
    
    // 单击模块进入编辑模式
    bodyElement.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      
      // 跳过图片点击（图片有自己的选择器）
      if (target.tagName === 'IMG') return
      
      // 如果已经在编辑中，不重复处理
      if (bodyElement.contentEditable === 'true') return
      
      // 阻止事件冒泡，避免触发外部点击
      e.stopPropagation()

      // 整个 body 设置为可编辑
      bodyElement.contentEditable = 'true'
      bodyElement.focus()
      bodyElement.classList.add('editing-text')
      editingElementRef.current = bodyElement

      // 失焦保存
      const handleBlur = () => {
        // 若正在与外部工具条交互，则不要退出编辑，立即恢复焦点
        if (interactingWithToolbarRef.current) {
          setTimeout(() => {
            bodyElement.contentEditable = 'true'
            bodyElement.focus()
          }, 0)
          return
        }

        bodyElement.contentEditable = 'false'
        bodyElement.classList.remove('editing-text')
        editingElementRef.current = null

        // 同步修改
        syncHTMLChanges()

        bodyElement.removeEventListener('blur', handleBlur)
      }

      bodyElement.addEventListener('blur', handleBlur)
    })

    // 为所有图片添加点击事件
    const images = iframeDoc.querySelectorAll('img')
    images.forEach((img, index) => {
      const image = img as HTMLImageElement
      image.classList.add('editable-image')

      image.addEventListener('click', (e: Event) => {
        e.preventDefault()
        e.stopPropagation()

        // 检查图片是否在 <a> 标签内
        const parentLink = image.closest('a')
        
        if (parentLink) {
          // 带链接的图片：提供选项
          const action = confirm('这是一个带链接的图片。\n\n点击"确定"编辑链接\n点击"取消"更换图片')
          
          if (action) {
            // 编辑链接
            const currentHref = parentLink.getAttribute('href') || ''
            const newHref = prompt('请输入链接地址（留空则移除链接）：', currentHref)
            
            if (newHref !== null) {
              if (newHref.trim()) {
                // 更新链接
                parentLink.setAttribute('href', newHref.trim())
                parentLink.setAttribute('target', '_top')
              } else {
                // 移除链接，保留图片
                const imgClone = image.cloneNode(true)
                parentLink.parentNode?.replaceChild(imgClone, parentLink)
              }
              syncHTMLChanges()
            }
          } else {
            // 更换图片
            setSelectedImageIndex(index)
            setShowImageSelector(true)
          }
        } else {
          // 普通图片：直接更换
          setSelectedImageIndex(index)
          setShowImageSelector(true)
        }
      })
    })

    // 监听选区变化，显示/隐藏工具条
    const handleSelectionChange = () => {
      const selection = iframeDoc.getSelection()
      if (!selection || selection.rangeCount === 0) {
        console.log('[selectionchange] 没有选区')
        if (interactingWithToolbarRef.current) return
        setShowToolbar(false)
        setShowColorPicker(false)
        return
      }

      const selectedText = selection.toString().trim()
      console.log('[selectionchange] 选区文本:', selectedText, '长度:', selectedText.length, '是否可编辑:', bodyElement.contentEditable)
      if (selectedText.length > 0 && bodyElement.contentEditable === 'true') {
        // 每次选区变化时关闭颜色面板，避免自动再次弹出（但与工具条交互时保留）
        if (!interactingWithToolbarRef.current) {
          setShowColorPicker(false)
        }
        setShowToolbar(true)
        updateToolbarPosition()
        detectFormatState()
      } else {
        console.log('[selectionchange] 选区无效或不可编辑，隐藏工具栏')
        if (interactingWithToolbarRef.current) return
        setShowToolbar(false)
        setShowColorPicker(false)
      }
    }

    iframeDoc.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      observer.disconnect()
      iframeDoc.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [html, isEditing, syncHTMLChanges, updateToolbarPosition, detectFormatState])

  return (
    <>
      <iframe
        ref={iframeRef}
        className="custom-html-iframe w-full border-0"
        style={{ height: `${iframeHeight}px` }}
        title="Custom HTML Content"
      />

      {/* 浮动工具条 */}
      {showToolbar && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-1.5 flex gap-1 items-center"
          style={{ 
            left: `${toolbarPosition.x}px`, 
            top: `${toolbarPosition.y}px`,
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => { e.preventDefault(); interactingWithToolbarRef.current = true; preserveSelection(); }} // 防止失焦并标记交互
        >
          {/* 加粗按钮 */}
          <button
            className={`px-3 py-1.5 rounded font-bold transition-all ${
              formatState.isBold 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={applyBold}
            title="加粗 (B)"
          >
            B
          </button>

          {/* 颜色按钮 */}
          <div className="relative">
            <button
              className={`px-3 py-1.5 rounded font-semibold transition-all ${
                formatState.color 
                  ? 'bg-blue-100 hover:bg-blue-200' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onMouseDown={(e) => { 
                e.preventDefault()
                e.stopPropagation()
                // 立即锁定交互标记，防止任何事件关闭工具栏
                interactingWithToolbarRef.current = true
                // 立即保存当前选区
                preserveSelection()
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // 切换颜色面板显示
                toggleColorPicker()
              }}
              title={`颜色 ${formatState.color ? `(${formatState.color})` : ''}`}
              style={formatState.color ? { color: formatState.color } : {}}
            >
              A
            </button>
            
            {/* 颜色选择器 */}
            {showColorPicker && (
              <div 
                className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-2xl border border-gray-200 p-3"
                style={{ width: '220px' }}
                onMouseDown={(e) => { 
                  e.preventDefault()
                  // 阻止失焦，保持 iframe 焦点
                }}
              >
                {/* 常用颜色 */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-2">常用颜色</div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {commonColors.map((color, index) => (
                      <button
                        key={index}
                        className="w-7 h-7 rounded border-2 transition-all hover:scale-110"
                        style={{ 
                          backgroundColor: color,
                          borderColor: formatState.color === color ? '#3b82f6' : '#e5e7eb'
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* 原生色盘 */}
                <div className="mb-2">
                  <div className="text-xs text-gray-600 mb-2">自定义颜色</div>
                  <input
                    type="color"
                    className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                    defaultValue={formatState.color || '#000000'}
                    onMouseDown={(e) => e.preventDefault()}
                    onChange={(e) => applyColor(e.target.value)}
                  />
                </div>

                {/* 清除颜色 */}
                {formatState.color && (
                  <button
                    className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => clearColor()}
                  >
                    清除颜色
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 字号按钮 */}
          <button
            className={`px-3 py-1.5 rounded transition-all ${
              formatState.size 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={applySize}
            title={`字号 ${formatState.size ? `(${formatState.size})` : ''}`}
          >
            T{formatState.size && <span className="text-xs ml-0.5">{formatState.size}</span>}
          </button>

          {/* 链接按钮 */}
          <button
            className={`px-3 py-1.5 rounded transition-all ${
              formatState.linkHref 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={applyLink}
            title={`链接 ${formatState.linkHref ? `(${formatState.linkHref})` : ''}`}
          >
            🔗
          </button>
        </div>
      )}

      {/* 图片选择对话框 */}
      <ImageSelectorDialog 
        open={showImageSelector} 
        onOpenChange={setShowImageSelector} 
        onSelect={handleImageSelect}
        pageId={usePageStore.getState().currentPage?.id}
      />
    </>
  )
}
