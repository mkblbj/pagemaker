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
  const savedSelectionRef = useRef<{
    startContainer: Node
    startOffset: number
    endContainer: Node
    endOffset: number
  } | null>(null) // 保存选区信息
  
  // 常用颜色列表（根据用户提供的色板）
  const commonColors = [
    '#000000', // 黑色
    '#5FB878', '#2F9688', '#1E9FFF', '#A233C6', '#5A6268', '#FFB800', // 第一行
    '#009688', '#5FB878', '#1E9FFF', '#A233C6', '#2F4056', '#F7B824', // 第二行
    '#FF5722', '#FF5722', '#EEEEEE', '#90A4AE', '#C8C8C8', '#FFFFFF', // 第三行
    '#8D6E63', '#A1887F', '#BDBDBD', '#78909C', '#9E9E9E', '#000000'  // 第四行
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

    // 直接获取 innerHTML，不修改 DOM
    let updatedHTML = iframeDoc.body.innerHTML
    
    // 保护全角空格：将 innerHTML 中的全角空格（如果浏览器保留了）标记
    // 注意：innerHTML 可能已经将全角空格转换了，但我们仍然尝试保护
    const FULLWIDTH_SPACE = '\u3000'
    updatedHTML = updatedHTML.replace(/\u3000/g, '&#12288;') // 转为 HTML 实体
    
    // 净化 HTML（移除非白名单标签/属性）
    let htmlWithFullwidthSpaces = sanitizeHtml(updatedHTML)
    
    // 清理编辑器添加的 class 和浏览器自动添加的标签
    const cleanedHTML = cleanHTML(htmlWithFullwidthSpaces)
    
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

  // 格式化命令：颜色（打开颜色选择器）
  const toggleColorPicker = useCallback(() => {
    setShowColorPicker(prev => !prev)
  }, [])

  // 应用选中的颜色
  const applyColor = useCallback((color: string) => {
    console.log('[应用颜色] 开始，颜色:', color)
    const iframe = iframeRef.current
    if (!iframe) {
      console.log('[应用颜色] iframe 不存在')
      return
    }

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      console.log('[应用颜色] iframeDoc 不存在')
      return
    }

    // 直接使用当前选区
    const selection = iframeDoc.getSelection()
    if (!selection || selection.rangeCount === 0) {
      console.log('[应用颜色] 没有选区')
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    console.log('[应用颜色] 选中的文字:', selectedText)
    
    if (!selectedText) {
      console.log('[应用颜色] 选中文字为空')
      return
    }

    try {
      // 检查是否已经在 <font color> 内
      let node: Node | Element = range.commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) {
        node = (node as Text).parentElement!
      }
      const parentFont = (node as HTMLElement).closest('font[color]') as HTMLFontElement | null

      let newElement: HTMLElement | null = null
      
      if (parentFont && parentFont.textContent === selectedText) {
        // 更新颜色
        console.log('[应用颜色] 更新现有 font 标签颜色')
        parentFont.setAttribute('color', color.toUpperCase())
        newElement = parentFont as HTMLElement
      } else {
        // 添加颜色：wrap <font color>
        console.log('[应用颜色] 创建新的 font 标签')
        const font = iframeDoc.createElement('font')
        font.setAttribute('color', color.toUpperCase())
        range.surroundContents(font)
        newElement = font
      }

      console.log('[应用颜色] 新元素:', newElement?.outerHTML)

      // 重新选中新元素，保持工具条显示
      if (newElement) {
        const newRange = iframeDoc.createRange()
        newRange.selectNodeContents(newElement)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }

      console.log('[应用颜色] 调用 syncHTMLChanges')
      syncHTMLChanges()
      detectFormatState()
      setShowColorPicker(false)
      console.log('[应用颜色] 完成')
    } catch (error) {
      console.error('应用颜色失败:', error)
      alert('请选择同一段落内的文字')
      setShowColorPicker(false)
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
      console.log('[图片替换] 开始处理', { selectedImageIndex, url: result.url })
      
      if (selectedImageIndex === null) {
        console.warn('[图片替换] 未选中图片索引')
        return
      }

      const iframe = iframeRef.current
      if (!iframe) {
        console.error('[图片替换] iframe 引用不存在')
        return
      }

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        console.error('[图片替换] 无法访问 iframe 文档')
        return
      }

      // 重新查找图片元素（使用索引）
      const images = iframeDoc.querySelectorAll('img')
      console.log('[图片替换] 找到图片总数:', images.length)
      
      const targetImage = images[selectedImageIndex] as HTMLImageElement
      
      if (!targetImage) {
        console.error('[图片替换] 无法找到目标图片', { index: selectedImageIndex, total: images.length })
        return
      }

      console.log('[图片替换] 替换前:', { oldSrc: targetImage.src, newSrc: result.url })

      // 更新图片 src 和 alt
      targetImage.src = result.url
      targetImage.alt = result.filename

      console.log('[图片替换] 替换后:', { src: targetImage.src, alt: targetImage.alt })

      // 同步修改
      syncHTMLChanges()
      console.log('[图片替换] HTML 已同步')

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

        // 保存图片索引而不是引用
        setSelectedImageIndex(index)
        setShowImageSelector(true)
      })
    })

    // 监听选区变化，显示/隐藏工具条
    const handleSelectionChange = () => {
      const selection = iframeDoc.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setShowToolbar(false)
        return
      }

      const selectedText = selection.toString().trim()
      if (selectedText.length > 0 && bodyElement.contentEditable === 'true') {
        setShowToolbar(true)
        updateToolbarPosition()
        detectFormatState()
      } else {
        setShowToolbar(false)
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
          onMouseDown={(e) => e.preventDefault()} // 防止失焦
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
              onClick={toggleColorPicker}
              title={`颜色 ${formatState.color ? `(${formatState.color})` : ''}`}
              style={formatState.color ? { color: formatState.color } : {}}
            >
              A
            </button>
            
            {/* 颜色选择器 */}
            {showColorPicker && (
              <div 
                className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-2xl border border-gray-200 p-3"
                style={{ width: '200px' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="grid grid-cols-6 gap-1.5">
                  {commonColors.map((color, index) => (
                    <button
                      key={index}
                      className="w-7 h-7 rounded border-2 transition-all hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        borderColor: formatState.color === color ? '#3b82f6' : '#e5e7eb'
                      }}
                      onMouseDown={(e) => e.preventDefault()} // 防止失焦
                      onClick={() => applyColor(color)}
                      title={color}
                    />
                  ))}
                </div>
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
