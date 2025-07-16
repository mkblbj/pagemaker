'use client'

import { useState, useCallback, useMemo } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { usePageStore } from '@/stores/usePageStore'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { PageModuleType } from '@pagemaker/shared-types'
import { getAvailableModules, createModuleInstance } from '@/lib/moduleRegistry'
import { DraggableModuleItem } from './dnd/DraggableModuleItem'
import { useTranslation } from '@/contexts/I18nContext'

export function ModuleList() {
  const { selectedModuleId, addModule } = usePageStore()
  const { markUnsaved } = useEditorStore()
  const { tEditor, tCommon, currentLanguage } = useTranslation()

  const [searchTerm, setSearchTerm] = useState('')

  const handleAddModule = useCallback(
    (moduleType: PageModuleType) => {
      const newModule = createModuleInstance(moduleType, currentLanguage)
      addModule(newModule)
    },
    [addModule, currentLanguage]
  )

  const filteredModules = useMemo(() => {
    return getAvailableModules(currentLanguage).filter(
      module =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, currentLanguage])

  return (
    <div className="h-full flex flex-col overflow-x-hidden" data-testid="module-list">
      {/* 搜索框 */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tEditor('搜索模块...')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 模块列表 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
        {filteredModules.map(module => (
          <DraggableModuleItem key={module.type} module={module} onAddModule={handleAddModule} />
        ))}
      </div>

      {/* 空状态 */}
      {filteredModules.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div className="text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{tCommon('没有找到匹配的页面')}</p>
            <p className="text-xs mt-1">{tCommon('尝试使用不同的关键词搜索')}</p>
          </div>
        </div>
      )}

      {/* 使用提示 */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">💡 {tEditor('从左侧拖拽模块到此处')}</p>
      </div>
    </div>
  )
}
