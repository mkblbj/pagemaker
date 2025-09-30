'use client'

import { PageModule, PageModuleType } from '@pagemaker/shared-types'
import { useEffect, useRef, useState } from 'react'

import { TitleModule } from '@/components/modules/TitleModule'
import { TextModule } from '@/components/modules/TextModule'
import { ImageModule } from '@/components/modules/ImageModule'
import { SeparatorModule } from '@/components/modules/SeparatorModule'
import { KeyValueModule } from '@/components/modules/KeyValueModule'
import { MultiColumnModule } from '@/components/modules/MultiColumnModule'
import { useTranslation } from '@/contexts/I18nContext'
import { Button } from '@/components/ui/button'
import { MoveUp, MoveDown, Copy, Trash2, Code } from 'lucide-react'

// 自定义HTML渲染器组件
function CustomHTMLRenderer({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(200)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    // 写入HTML内容
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; font-family: inherit; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `)
    iframeDoc.close()

    // 自动调整iframe高度
    const resizeIframe = () => {
      const body = iframeDoc.body
      const html = iframeDoc.documentElement
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      )
      setIframeHeight(height)
    }

    // 等待内容加载完成
    setTimeout(resizeIframe, 100)

    // 监听窗口大小变化
    const observer = new ResizeObserver(resizeIframe)
    observer.observe(iframeDoc.body)

    return () => {
      observer.disconnect()
    }
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      className="custom-html-iframe"
      style={{ height: `${iframeHeight}px` }}
      title="Custom HTML Content"
    />
  )
}

interface ModuleRendererProps {
  module: PageModule
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
  // 新增：用于自定义HTML模块的按钮操作
  onMoveUp?: () => void
  onMoveDown?: () => void
  onCopy?: () => void
  onViewCode?: () => void
  onDelete?: () => void
  isFirst?: boolean
  isLast?: boolean
}

export function ModuleRenderer({
  module,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onEndEdit,
  onMoveUp,
  onMoveDown,
  onCopy,
  onViewCode,
  onDelete,
  isFirst,
  isLast
}: ModuleRendererProps) {
  const { tEditor } = useTranslation()

  // 根据模块类型渲染不同的预览
  const renderModuleContent = () => {
    switch (module.type) {
      case PageModuleType.TITLE:
        return (
          <TitleModule
            module={module}
            isSelected={isSelected}
            isEditing={isEditing}
            onUpdate={onUpdate}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
          />
        )

      case PageModuleType.TEXT:
        return (
          <TextModule
            module={module}
            isSelected={isSelected}
            isEditing={isEditing}
            onUpdate={onUpdate}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
          />
        )

      case PageModuleType.IMAGE:
        return (
          <ImageModule
            module={module as any}
            isSelected={isSelected}
            isEditing={isEditing}
            onUpdate={onUpdate}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
          />
        )

      case PageModuleType.SEPARATOR:
        return (
          <SeparatorModule
            module={module as any}
            isSelected={isSelected}
            isEditing={isEditing}
            onUpdate={onUpdate}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
          />
        )

      case PageModuleType.KEY_VALUE:
        return (
          <KeyValueModule
            module={module as any}
            isSelected={isSelected}
            isEditing={isEditing}
            onUpdate={onUpdate}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
          />
        )

      case PageModuleType.MULTI_COLUMN:
        return (
          <MultiColumnModule
            module={module as any}
            isSelected={isSelected}
            isEditing={isEditing}
            onUpdate={onUpdate}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
          />
        )

      case 'custom':
        const customHTML = (module as any).customHTML || ''
        
        // 如果没有内容，显示占位符 - 同样包含按钮栏
        if (!customHTML.trim()) {
          return (
            <div className="border rounded-lg overflow-hidden">
              {/* 模块标题栏 - 包含按钮 */}
              <div className={`flex justify-between items-center px-3 py-2 border-b bg-gray-50 ${
                isSelected ? 'bg-blue-50' : ''
              }`}>
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  🎨 {tEditor('自定义HTML模块')} 
                  {(module as any).originalType && ` (原${(module as any).originalType})`}
                </span>
                {/* 操作按钮 */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      onMoveUp?.()
                    }}
                    disabled={isFirst}
                    className="h-6 w-6 p-0"
                    title={tEditor('上移模块')}
                  >
                    <MoveUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      onMoveDown?.()
                    }}
                    disabled={isLast}
                    className="h-6 w-6 p-0"
                    title={tEditor('下移模块')}
                  >
                    <MoveDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      onCopy?.()
                    }}
                    className="h-6 w-6 p-0"
                    title={tEditor('复制模块')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      onViewCode?.()
                    }}
                    className="h-6 w-6 p-0"
                    title={tEditor('查看代码')}
                  >
                    <Code className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      onDelete?.()
                    }}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    title={tEditor('删除模块')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {/* 占位符内容区域 */}
              <div className="p-4">
                <div className="text-gray-400 text-sm italic text-center">
                  {tEditor('点击代码按钮添加HTML内容')}
                </div>
              </div>
            </div>
          )
        }
        
        // 有内容时，使用iframe完全隔离样式，包含自己的按钮
        return (
          <div className="border rounded-lg overflow-hidden">
            {/* 模块标题栏 - 包含按钮 */}
            <div className={`flex justify-between items-center px-3 py-2 border-b bg-gray-50 ${
              isSelected ? 'bg-blue-50' : ''
            }`}>
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                🎨 {tEditor('自定义HTML模块')} 
                {(module as any).originalType && ` (原${(module as any).originalType})`}
              </span>
              {/* 操作按钮 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    onMoveUp?.()
                  }}
                  disabled={isFirst}
                  className="h-6 w-6 p-0"
                  title={tEditor('上移模块')}
                >
                  <MoveUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    onMoveDown?.()
                  }}
                  disabled={isLast}
                  className="h-6 w-6 p-0"
                  title={tEditor('下移模块')}
                >
                  <MoveDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    onCopy?.()
                  }}
                  className="h-6 w-6 p-0"
                  title={tEditor('复制模块')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    onViewCode?.()
                  }}
                  className="h-6 w-6 p-0"
                  title={tEditor('查看代码')}
                >
                  <Code className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    onDelete?.()
                  }}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  title={tEditor('删除模块')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {/* HTML内容区域 */}
            <div className="relative">
              <CustomHTMLRenderer html={customHTML} />
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
            <p className="text-red-600 text-sm">
              {tEditor('未知模块类型')}: {module.type}
            </p>
          </div>
        )
    }
  }

  return <div className="w-full">{renderModuleContent()}</div>
}
