'use client'

import { PageModule, PageModuleType } from '@pagemaker/shared-types'

import { Badge } from '@/components/ui/badge'
import { Type, FileText, Image, Minus, Layout, Columns, AlertTriangle } from 'lucide-react'
import { TitleModule } from '@/components/modules/TitleModule'
import { TextModule } from '@/components/modules/TextModule'
import { ImageModule } from '@/components/modules/ImageModule'
import { SeparatorModule } from '@/components/modules/SeparatorModule'
import { KeyValueModule } from '@/components/modules/KeyValueModule'
import { MultiColumnModule } from '@/components/modules/MultiColumnModule'
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
