'use client'

import { useState, useEffect, useRef } from 'react'
import { Type } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PageModule } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

interface TitleModuleProps {
  module: PageModule & {
    text?: string
    level?: number
    alignment?: 'left' | 'center' | 'right' | 'justify'
    color?: string
    fontFamily?: string
    fontWeight?: 'normal' | 'bold'
  }
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

export function TitleModule({
  module,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onStartEdit,
  onEndEdit
}: TitleModuleProps) {
  const { tEditor } = useTranslation()
  const [localText, setLocalText] = useState(module.text || '标题文本')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 同步外部更新
  useEffect(() => {
    if (module.text !== undefined) {
      setLocalText(module.text)
    }
  }, [module.text])

  // 自动调整textarea高度
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  // 处理编辑模式
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
      adjustTextareaHeight()
    }
  }, [isEditing])

  // 文本变化时调整高度
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight()
    }
  }, [localText, isEditing])

  // 处理文本更新
  const handleTextChange = (value: string) => {
    setLocalText(value)
    onUpdate?.({ text: value })
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onEndEdit?.()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setLocalText(module.text || '标题文本')
      onEndEdit?.()
    }
  }

  // 处理失焦
  const handleBlur = () => {
    onEndEdit?.()
  }

  // 获取标题样式
  const getTitleStyles = () => {
    const level = module.level || 1
    const alignment = module.alignment || 'left'
    const color = module.color || '#000000'
    const fontFamily = module.fontFamily || 'inherit'
    const fontWeight = module.fontWeight || 'bold'

    const sizeClasses = {
      1: 'text-3xl',
      2: 'text-2xl',
      3: 'text-xl',
      4: 'text-lg',
      5: 'text-base',
      6: 'text-sm'
    }

    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    }

    return {
      className: cn(
        'font-bold transition-all duration-200',
        sizeClasses[level as keyof typeof sizeClasses] || sizeClasses[1],
        alignmentClasses[alignment],
        fontWeight === 'bold' ? 'font-bold' : 'font-normal'
      ),
      style: {
        color,
        fontFamily: fontFamily !== 'inherit' ? fontFamily : undefined
      }
    }
  }

  const titleStyles = getTitleStyles()

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
      <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Type className="h-4 w-4 text-blue-600" />
        <Badge variant="secondary" className="text-xs">
          {tEditor('标题模块 (H{level})', { level: module.level || 1 })}
        </Badge>
        {isSelected && !isEditing && (
          <Badge variant="outline" className="text-xs text-blue-600">
            {tEditor('点击编辑')}
          </Badge>
        )}
      </div>

      {/* 标题内容 */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={localText}
          onChange={e => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn('w-full bg-transparent border-none outline-none resize-none', titleStyles.className)}
          style={{
            ...titleStyles.style,
            minHeight: '1.5em',
            lineHeight: '1.5',
            height: 'auto'
          }}
          placeholder={tEditor('输入标题文本...')}
        />
      ) : (
        <div
          className={cn(titleStyles.className, 'cursor-text whitespace-pre-wrap')}
          style={titleStyles.style}
          onClick={onStartEdit}
        >
          {localText || tEditor('标题文本')}
        </div>
      )}
    </div>
  )
}
