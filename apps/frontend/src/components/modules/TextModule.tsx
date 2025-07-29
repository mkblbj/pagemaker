'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Bold, Underline, Link } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PageModule } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

interface TextModuleProps {
  module: PageModule & {
    content?: string
    alignment?: 'left' | 'center' | 'right' | 'justify'
    fontSize?: string
    fontFamily?: string
    textColor?: string
    backgroundColor?: string
  }
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

interface FormatState {
  bold: boolean
  underline: boolean
  link: string
}

export function TextModule({
  module,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onStartEdit,
  onEndEdit
}: TextModuleProps) {
  const { tEditor } = useTranslation()
  const [localContent, setLocalContent] = useState(module.content || '')

  const [formatState, setFormatState] = useState<FormatState>({
    bold: false,
    underline: false,
    link: ''
  })
  const editorRef = useRef<HTMLDivElement>(null)

  // 同步外部更新
  useEffect(() => {
    if (module.content !== undefined) {
      setLocalContent(module.content)
    }
  }, [module.content])

  // 处理编辑模式
  useEffect(() => {
    if (isEditing && editorRef.current) {
      const currentEditor = editorRef.current

      // 如果内容是默认提示文本或为空，清空编辑器
      const isPlaceholderText = localContent === tEditor('输入文本内容') || !localContent
      const contentToSet = isPlaceholderText ? '' : localContent

      // 设置初始内容（只在刚进入编辑模式时）
      if (currentEditor.innerHTML !== contentToSet) {
        currentEditor.innerHTML = contentToSet
      }
      currentEditor.focus()

      // 将光标置于末尾
      try {
        const range = document.createRange()
        const selection = window.getSelection()
        if (selection && selection.removeAllRanges && selection.addRange) {
          range.selectNodeContents(currentEditor)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      } catch {
        // 在测试环境中可能会失败，这是正常的
        console.debug('Selection API not available in test environment')
      }

      // 监听选择变化以更新格式化状态
      const updateFormatState = () => {
        try {
          setFormatState({
            bold: document.queryCommandState('bold'),
            underline: document.queryCommandState('underline'),
            link: ''
          })
        } catch {
          // 在测试环境中可能会失败
          console.debug('queryCommandState not available in test environment')
        }
      }

      const handleSelectionChange = () => {
        // 延迟一下以确保状态正确更新
        setTimeout(updateFormatState, 10)
      }

      // 只在浏览器环境中添加事件监听器
      if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('selectionchange', handleSelectionChange)
        currentEditor.addEventListener('keyup', handleSelectionChange)
        currentEditor.addEventListener('mouseup', handleSelectionChange)

        return () => {
          document.removeEventListener('selectionchange', handleSelectionChange)
          currentEditor.removeEventListener('keyup', handleSelectionChange)
          currentEditor.removeEventListener('mouseup', handleSelectionChange)
        }
      }
    }
  }, [isEditing, localContent, tEditor])

  // 处理内容更新
  const handleContentChange = () => {
    if (editorRef.current) {
      let content = editorRef.current.innerHTML

      // 将br标签转换为换行符，以便正确保存和显示
      content = content
        .replace(/<br\s*\/?>/gi, '\n') // 将br标签转换为换行符
        .replace(/<p><\/p>/gi, '') // 移除空的p标签
        .replace(/<div><\/div>/gi, '') // 移除空的div标签
        .replace(/&nbsp;/gi, ' ') // 替换非断空格
        .replace(/<p>\s*<\/p>/gi, '') // 移除只包含空白的p标签
        .replace(/<div>\s*<\/div>/gi, '') // 移除只包含空白的div标签
        .replace(/<p>/gi, '') // 移除p开始标签
        .replace(/<\/p>/gi, '\n') // 将p结束标签转换为换行符
        .replace(/<div>/gi, '') // 移除div开始标签
        .replace(/<\/div>/gi, '\n') // 将div结束标签转换为换行符
        .replace(/\n+/g, '\n') // 合并多个连续换行符为单个
        .trim()

      // 如果内容为空或只包含空白字符，设置为空字符串
      if (!content || content === '' || /^[\s\u00A0]*$/.test(content)) {
        content = ''
      }

      setLocalContent(content)
      onUpdate?.({ content })
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onEndEdit?.()
    }
  }

  // 处理失焦
  const handleBlur = () => {
    handleContentChange()

    // 额外检查：如果处理后的内容仍然只是空白或无意义的HTML，强制设为空
    if (editorRef.current) {
      const rawContent = editorRef.current.innerHTML
      const cleanedContent = rawContent
        .replace(/<br\s*\/?>/gi, '\n') // 将br标签转换为换行符
        .replace(/<p><\/p>/gi, '')
        .replace(/<div><\/div>/gi, '')
        .replace(/<p>\s*<\/p>/gi, '')
        .replace(/<div>\s*<\/div>/gi, '')
        .replace(/<p>/gi, '') // 移除p开始标签
        .replace(/<\/p>/gi, '\n') // 将p结束标签转换为换行符
        .replace(/<div>/gi, '') // 移除div开始标签
        .replace(/<\/div>/gi, '\n') // 将div结束标签转换为换行符
        .replace(/\n+/g, '\n') // 合并多个连续换行符为单个
        .replace(/&nbsp;/gi, ' ')
        .trim()

      if (!cleanedContent || /^[\s\u00A0]*$/.test(cleanedContent)) {
        setLocalContent('')
        onUpdate?.({ content: '' })
      }
    }

    onEndEdit?.()
  }

  // 获取选中文本
  const getSelectedText = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      return selection.toString()
    }
    return ''
  }

  // 格式化文本
  const formatText = (command: string, value?: string) => {
    if (!editorRef.current) return

    try {
      // 确保编辑器有焦点
      editorRef.current.focus()

      // 执行格式化命令
      const success = document.execCommand(command, false, value)

      if (success) {
        // 触发内容更新
        handleContentChange()

        // 更新格式状态
        setFormatState(prev => ({
          ...prev,
          bold: document.queryCommandState('bold'),
          underline: document.queryCommandState('underline')
        }))
      }
    } catch (error) {
      // 在测试环境中可能会失败
      console.debug('execCommand not available in test environment', error)
    }
  }

  // 添加或移除超链接
  const toggleLink = () => {
    if (!editorRef.current) return

    // 确保编辑器有焦点
    editorRef.current.focus()

    const selectedText = getSelectedText()
    if (!selectedText) {
      alert(tEditor('请先选择要添加链接的文本'))
      return
    }

    // 检查当前选择是否已经是链接
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      const parentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as Element)

      // 查找是否在链接元素内
      const linkElement = parentElement?.closest('a')

      if (linkElement) {
        // 如果已经是链接，询问是否要移除
        const shouldRemove = confirm(tEditor('当前文本已有链接，是否要移除链接？'))
        if (shouldRemove) {
          // 移除链接，保留文本
          const textContent = linkElement.textContent
          const textNode = document.createTextNode(textContent || '')
          linkElement.parentNode?.replaceChild(textNode, linkElement)
          handleContentChange()
        }
        return
      }
    }

    // 添加新链接
    const url = prompt(tEditor('请输入链接地址:'), 'https://')
    if (url && url.trim()) {
      formatText('createLink', url.trim())
    }
  }

  // 获取文本样式
  const getTextStyles = () => {
    const alignment = module.alignment || 'left'
    const fontSize = module.fontSize || '4' // 默认size为4
    const fontFamily = module.fontFamily || 'inherit'
    const textColor = module.textColor || '#000000'
    const backgroundColor = module.backgroundColor || 'transparent'

    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    }

    // HTML font size标准映射 - 更大的字体
    const getFontSizeInPx = (size: string) => {
      const sizeMap: Record<string, string> = {
        '1': '12px',
        '2': '16px',
        '3': '20px', // 默认大小
        '4': '28px', // 常用大小 - 更大
        '5': '36px', // 大标题
        '6': '48px', // 特大标题
        '7': '64px' // 超大标题
      }
      return sizeMap[size] || '20px'
    }

    return {
      className: cn('transition-all duration-200 leading-relaxed', alignmentClasses[alignment]),
      style: {
        fontSize: getFontSizeInPx(fontSize),
        fontFamily: fontFamily !== 'inherit' ? fontFamily : undefined,
        color: textColor,
        backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
        padding: backgroundColor !== 'transparent' ? '8px' : undefined,
        borderRadius: backgroundColor !== 'transparent' ? '4px' : undefined
      }
    }
  }

  const textStyles = getTextStyles()

  return (
    <div
      className={cn(
        'group relative border-2 border-transparent rounded-lg p-4 transition-all duration-200',
        isSelected && 'border-blue-500 bg-blue-50/50',
        'hover:border-blue-300 hover:bg-blue-50/30'
      )}
      onClick={onStartEdit}
    >
      {/* 模块标识 */}
      <div className="flex items-center gap-2 mb-2 opacity-100 transition-opacity">
        <FileText className="h-4 w-4 text-green-600" />
        <Badge variant="secondary" className="text-xs">
          {tEditor('文本模块')}
        </Badge>
      </div>

      {/* 格式化工具栏 */}
      {isEditing && (
        <div className="flex items-center gap-1 mb-3 p-2 bg-white border border-gray-200 rounded shadow-sm">
          <Button
            size="sm"
            variant={formatState.bold ? 'default' : 'ghost'}
            onMouseDown={e => {
              e.preventDefault() // 防止失去焦点
              formatText('bold')
            }}
            className="h-8 w-8 p-0"
            aria-label={tEditor('加粗')}
            title={tEditor('加粗')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={formatState.underline ? 'default' : 'ghost'}
            onMouseDown={e => {
              e.preventDefault() // 防止失去焦点
              formatText('underline')
            }}
            className="h-8 w-8 p-0"
            aria-label={tEditor('下划线')}
            title={tEditor('下划线')}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onMouseDown={e => {
              e.preventDefault() // 防止失去焦点
              toggleLink()
            }}
            className="h-8 w-8 p-0"
            aria-label={tEditor('添加链接')}
            title={tEditor('添加链接')}
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 文本内容 */}
      {isEditing ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            'w-full bg-transparent border-none outline-none min-h-[2em] whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400',
            textStyles.className
          )}
          style={textStyles.style}
          role="textbox"
          aria-label={tEditor('文本内容编辑器')}
          data-placeholder={tEditor('输入文本内容')}
          tabIndex={0}
        />
      ) : localContent ? (
        <div
          className={cn(textStyles.className, 'cursor-text whitespace-pre-wrap min-h-[1.5em]')}
          style={textStyles.style}
          onClick={onStartEdit}
          dangerouslySetInnerHTML={{ __html: localContent.replace(/\n/g, '<br>') }}
        />
      ) : (
        <div
          className={cn(textStyles.className, 'cursor-text whitespace-pre-wrap min-h-[1.5em]')}
          style={textStyles.style}
          onClick={onStartEdit}
        >
          <div className="text-gray-400">{tEditor('点击输入文本内容')}</div>
        </div>
      )}
    </div>
  )
}
