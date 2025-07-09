'use client'

import { PageModule, PageModuleType } from '@pagemaker/shared-types'

import { Badge } from '@/components/ui/badge'
import { Type, FileText, Image, Minus, Layout, Columns, AlertTriangle } from 'lucide-react'

interface ModuleRendererProps {
  module: PageModule
}

export function ModuleRenderer({ module }: ModuleRendererProps) {
  // 根据模块类型渲染不同的预览
  const renderModuleContent = () => {
    switch (module.type) {
      case PageModuleType.TITLE:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-blue-600" />
              <Badge variant="secondary">标题模块</Badge>
            </div>
            <div
              className={`font-bold text-gray-800 ${
                (module as any).level === 1
                  ? 'text-2xl'
                  : (module as any).level === 2
                    ? 'text-xl'
                    : (module as any).level === 3
                      ? 'text-lg'
                      : 'text-base'
              }`}
            >
              {(module as any).text || '标题文本'}
            </div>
            <div className="text-xs text-muted-foreground">级别: H{(module as any).level || 1}</div>
          </div>
        )

      case PageModuleType.TEXT:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <Badge variant="secondary">文本模块</Badge>
            </div>
            <div className="text-gray-700 leading-relaxed">{(module as any).text || '文本内容'}</div>
          </div>
        )

      case PageModuleType.IMAGE:
        const imageModule = module as { src?: string; alt?: string }
        return (
          <div className="text-center">
            <img
              src={imageModule.src || ''}
              alt={imageModule.alt || '图片'}
              className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
            />
            {imageModule.alt && <p className="text-sm text-gray-600 mt-2">{imageModule.alt}</p>}
          </div>
        )

      case PageModuleType.SEPARATOR:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-gray-600" />
              <Badge variant="secondary">分隔线模块</Badge>
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
              <Badge variant="secondary">键值对模块</Badge>
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
              <Badge variant="secondary">多列布局模块</Badge>
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
                  列 {index + 1}
                  <br />
                  <span className="text-xs">拖拽内容到此处</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">{(module as any).columns || 2} 列布局</div>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <Badge variant="destructive">未知模块类型</Badge>
            </div>
            <div className="text-sm text-gray-500 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-medium">模块类型: {module.type}</p>
              <p className="text-xs mt-1">该模块类型暂不支持预览</p>
            </div>
          </div>
        )
    }
  }

  return <div className="w-full">{renderModuleContent()}</div>
}
