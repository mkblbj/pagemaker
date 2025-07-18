'use client'

import { PageModule, PageModuleType } from '@pagemaker/shared-types'

import { Badge } from '@/components/ui/badge'
import { Type, FileText, Image, Minus, Layout, Columns, AlertTriangle } from 'lucide-react'
import { TitleModule } from '@/components/modules/TitleModule'
import { useTranslation } from '@/contexts/I18nContext'

interface ModuleRendererProps {
  module: PageModule
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

export function ModuleRenderer({
  module,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onEndEdit
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <Badge variant="secondary">{tEditor('文本模块')}</Badge>
            </div>
            <div className="text-gray-700 leading-relaxed">{(module as any).text || '文本内容'}</div>
          </div>
        )

      case PageModuleType.IMAGE:
        const imageModule = module as { src?: string; alt?: string }
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-purple-600" />
              <Badge variant="secondary">{tEditor('图片模块')}</Badge>
            </div>
            {imageModule.src ? (
              <div className="text-center">
                <img
                  src={imageModule.src}
                  alt={imageModule.alt || '图片'}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                />
                {imageModule.alt && <p className="text-sm text-gray-600 mt-2">{imageModule.alt}</p>}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{tEditor('点击上传图片')}</p>
                {imageModule.alt && <p className="text-xs text-gray-400 mt-1">{imageModule.alt}</p>}
              </div>
            )}
          </div>
        )

      case PageModuleType.SEPARATOR:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-gray-600" />
              <Badge variant="secondary">{tEditor('分隔线模块')}</Badge>
            </div>
            <div className="py-4">
              <hr className="border-t-2 border-gray-300" />
            </div>
          </div>
        )

      case PageModuleType.KEY_VALUE:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-orange-600" />
              <Badge variant="secondary">{tEditor('键值对模块')}</Badge>
            </div>
            <div className="space-y-2">
              {((module as any).pairs && (module as any).pairs.length > 0
                ? (module as any).pairs
                : [{ key: '键', value: '值' }]
              ).map((pair: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                  <span className="font-medium text-sm min-w-0 flex-1">{pair.key || '键'}:</span>
                  <span className="text-sm text-gray-700 min-w-0 flex-2">{pair.value || '值'}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case PageModuleType.MULTI_COLUMN:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Columns className="h-4 w-4 text-red-600" />
              <Badge variant="secondary">{tEditor('多列布局模块')}</Badge>
            </div>
            <div
              className={`grid gap-4 ${
                (module as any).columns === 2
                  ? 'grid-cols-2'
                  : (module as any).columns === 3
                    ? 'grid-cols-3'
                    : (module as any).columns === 4
                      ? 'grid-cols-4'
                      : 'grid-cols-2'
              }`}
            >
              {Array.from({ length: (module as any).columns || 2 }).map((_, index) => (
                <div
                  key={index}
                  className="border border-dashed border-gray-300 rounded p-4 text-center text-sm text-gray-500"
                >
                  {tEditor('列 {index + 1}', { index: index + 1 })}
                  <br />
                  <span className="text-xs">{tEditor('拖拽内容到此处')}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {tEditor('{columns} 列布局', { columns: (module as any).columns || 2 })}
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <Badge variant="destructive">{tEditor('未知模块类型')}</Badge>
            </div>
            <div className="text-sm text-gray-500 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-medium">{tEditor('模块类型: {type}', { type: module.type })}</p>
              <p className="text-xs mt-1">{tEditor('该模块类型暂不支持预览')}</p>
            </div>
          </div>
        )
    }
  }

  return <div className="w-full">{renderModuleContent()}</div>
}
