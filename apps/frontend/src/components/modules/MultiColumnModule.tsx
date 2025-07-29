'use client'

import { useState, useEffect, useRef } from 'react'
import { Columns, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PageModule, MultiColumnModuleConfig } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'
import { ImageModule } from './ImageModule'

interface MultiColumnModuleProps {
  module: PageModule & MultiColumnModuleConfig
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

// 布局类型配置
const LAYOUT_CONFIGS = {
  imageLeft: { name: '图左文右', icon: 'ImageIcon', flexDirection: 'row' },
  textLeft: { name: '文左图右', icon: 'FileText', flexDirection: 'row' },
  imageTop: { name: '图上文下', icon: 'ImageIcon', flexDirection: 'column' },
  textTop: { name: '文上图下', icon: 'FileText', flexDirection: 'column' }
} as const

export function MultiColumnModule({
  module,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onStartEdit,
  onEndEdit: _onEndEdit
}: MultiColumnModuleProps) {
  const { tEditor } = useTranslation()

  // 文本编辑状态
  const [isTextEditing, setIsTextEditing] = useState(false)
  const [localTextContent, setLocalTextContent] = useState('')
  const textEditorRef = useRef<HTMLDivElement>(null)

  // 获取模块配置，提供默认值
  const layout = module.layout || 'imageLeft'
  const imageConfig = module.imageConfig || {
    src: '',
    alt: tEditor('图片描述'),
    alignment: 'center',
    width: '100%' // 移动端默认全宽
  }
  // 默认配置
  const textConfig = module.textConfig || {
    content: '', // 空字符串，让组件显示placeholder
    alignment: 'left',
    font: 'inherit',
    fontSize: '4', // 默认size为4
    color: '#000000',
    backgroundColor: 'transparent'
  }

  // 获取布局配置
  const layoutConfig = LAYOUT_CONFIGS[layout]
  const isHorizontal = layout === 'imageLeft' || layout === 'textLeft'

  // 初始化本地文本内容
  useEffect(() => {
    setLocalTextContent(textConfig.content || '')
  }, [textConfig.content])

  // 处理文本编辑模式
  useEffect(() => {
    if (isTextEditing && textEditorRef.current) {
      // 如果内容是默认提示文本，清空编辑器
      const isPlaceholderText = localTextContent === tEditor('输入文本内容') || !localTextContent
      textEditorRef.current.innerHTML = isPlaceholderText ? '' : localTextContent
      textEditorRef.current.focus()

      // 将光标置于末尾
      try {
        const range = document.createRange()
        const selection = window.getSelection()
        if (selection && selection.removeAllRanges && selection.addRange) {
          range.selectNodeContents(textEditorRef.current)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      } catch {
        console.debug('Selection API not available')
      }
    }
  }, [isTextEditing, localTextContent, tEditor])

  // 处理图片配置更新
  const handleImageUpdate = (updates: Partial<typeof imageConfig>) => {
    onUpdate?.({
      imageConfig: { ...imageConfig, ...updates }
    })
  }

  // 处理文本配置更新
  const handleTextUpdate = (updates: Partial<typeof textConfig>) => {
    onUpdate?.({
      textConfig: { ...textConfig, ...updates }
    })
  }

  // 处理文本内容更新
  const handleTextContentChange = () => {
    if (textEditorRef.current) {
      let content = textEditorRef.current.innerHTML

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

      setLocalTextContent(content)
      handleTextUpdate({ content })
    }
  }

  // 处理文本编辑键盘事件
  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsTextEditing(false)
    }
  }

  // 处理文本编辑失焦
  const handleTextBlur = () => {
    handleTextContentChange()
    setIsTextEditing(false)

    // 额外检查：如果处理后的内容仍然只是空白或无意义的HTML，强制设为空
    if (textEditorRef.current) {
      const rawContent = textEditorRef.current.innerHTML
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
        setLocalTextContent('')
        handleTextUpdate({ content: '' })
      }
    }
  }

  // 开始文本编辑
  const startTextEdit = () => {
    setIsTextEditing(true)
  }

  // 获取文本样式
  const getTextStyles = () => {
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

    const styles: React.CSSProperties = {
      fontFamily: textConfig.font,
      fontSize: getFontSizeInPx(textConfig.fontSize),
      color: textConfig.color,
      backgroundColor: textConfig.backgroundColor,
      textAlign: textConfig.alignment as any
    }
    return styles
  }

  // 渲染图片区域 - 使用ImageModule组件
  const renderImageArea = () => {
    // 创建兼容的图片模块数据
    const imageModuleData = {
      id: `${module.id}-image`,
      type: 'image',
      src: imageConfig.src || '',
      alt: imageConfig.alt || '',
      alignment: imageConfig.alignment || 'center',
      link: imageConfig.link,
      size: {
        type: 'percentage',
        value: imageConfig.width?.replace('%', '') || '100'
      }
    }

    return (
      <div className={cn(isHorizontal ? 'flex-1' : 'w-full')}>
        <ImageModule
          module={imageModuleData as any}
          isSelected={false}
          isEditing={isEditing} // 传递编辑状态，让ImageModule显示删除按钮
          onUpdate={updates => {
            // 将ImageModule的更新转换为imageConfig格式
            const newImageConfig = { ...imageConfig }
            if (typeof updates.src === 'string') newImageConfig.src = updates.src
            if (typeof updates.alt === 'string') newImageConfig.alt = updates.alt
            if (typeof updates.alignment === 'string') newImageConfig.alignment = updates.alignment as any
            if (updates.size && typeof updates.size === 'object' && 'type' in updates.size && 'value' in updates.size) {
              const size = updates.size as any
              newImageConfig.width = size.type === 'percentage' ? `${size.value}%` : size.value
            }
            if (updates.link && typeof updates.link === 'object' && 'type' in updates.link && 'value' in updates.link) {
              newImageConfig.link = updates.link as any
            } else if (updates.link === null) {
              newImageConfig.link = undefined
            }

            handleImageUpdate(newImageConfig)
          }}
          onStartEdit={() => {}}
          onEndEdit={() => {}}
        />
      </div>
    )
  }

  // 渲染文本区域
  const renderTextArea = () => {
    // 检查文本是否为空（包括只有HTML标签的情况）
    const cleanContent = textConfig.content
      ?.replace(/\n/g, '') // 移除换行符进行空内容检查
      ?.replace(/<br\s*\/?>/gi, '')
      ?.replace(/<p><\/p>/gi, '')
      ?.replace(/<div><\/div>/gi, '')
      ?.replace(/&nbsp;/gi, ' ')
      ?.trim()

    const isEmpty = !cleanContent || cleanContent === ''

    if (isEmpty && !isTextEditing) {
      return (
        <div
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors',
            isHorizontal ? 'flex-1' : 'w-full'
          )}
          onClick={startTextEdit}
        >
          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{tEditor('点击添加文本')}</p>
        </div>
      )
    }

    return (
      <div className={cn('p-4 rounded', isHorizontal ? 'flex-1' : 'w-full')} style={getTextStyles()}>
        {isTextEditing ? (
          <div
            ref={textEditorRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleTextContentChange}
            onKeyDown={handleTextKeyDown}
            onBlur={handleTextBlur}
            className="w-full bg-blue-50 border-2 border-blue-300 rounded-md p-2 outline-none min-h-[2em] whitespace-pre-wrap prose prose-sm max-w-none focus:border-blue-500 focus:bg-blue-100 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
            role="textbox"
            aria-label={tEditor('文本内容编辑器')}
            data-placeholder={tEditor('输入文本内容')}
            tabIndex={0}
          />
        ) : (
          <div
            onClick={startTextEdit}
            className="cursor-text prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: textConfig.content.replace(/\n/g, '<br>') }}
          />
        )}
      </div>
    )
  }

  // 渲染内容区域 - 修复布局逻辑
  const renderContent = () => {
    const imageArea = renderImageArea()
    const textArea = renderTextArea()

    // 根据布局类型决定排列顺序
    let content
    switch (layout) {
      case 'imageLeft':
        content = [imageArea, textArea]
        break
      case 'textLeft':
        content = [textArea, imageArea]
        break
      case 'imageTop':
        content = [imageArea, textArea]
        break
      case 'textTop':
        content = [textArea, imageArea]
        break
      default:
        content = [imageArea, textArea]
    }

    return (
      <div className={cn('flex gap-4', isHorizontal ? 'flex-row items-center' : 'flex-col')}>
        {content[0]}
        {content[1]}
      </div>
    )
  }

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
      <div className="flex items-center justify-between mb-4 opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <Columns className="h-4 w-4 text-red-600" />
          <Badge variant="secondary" className="text-xs">
            {tEditor('多列图文')} - {layoutConfig.name}
          </Badge>
        </div>
      </div>

      {/* 多列内容 */}
      <div className="w-full">{renderContent()}</div>

      {/* 编辑提示 */}
      {!isEditing && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-lg border-2 border-blue-300 border-dashed">
          <div className="text-sm text-blue-600 font-medium">{tEditor('点击图片或文本区域直接编辑')}</div>
        </div>
      )}
    </div>
  )
}
