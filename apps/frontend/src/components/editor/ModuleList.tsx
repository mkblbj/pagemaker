'use client'

import { useState } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { usePageStore } from '@/stores/usePageStore'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { PageModuleType } from '@pagemaker/shared-types'
import { getAvailableModules, createModuleInstance } from '@/lib/moduleRegistry'
import { DraggableModuleItem } from './dnd/DraggableModuleItem'

export function ModuleList() {
  const [searchTerm, setSearchTerm] = useState('')
  const { addModule } = usePageStore()

  // 获取所有可用模块
  const availableModules = getAvailableModules()

  // 过滤模块
  const filteredModules = availableModules.filter(
    module =>
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 处理模块点击添加
  const handleAddModule = (moduleType: PageModuleType) => {
    try {
      const newModule = createModuleInstance(moduleType)
      addModule(newModule)
    } catch (error) {
      console.error('创建模块实例失败:', error)
    }
  }

  return (
    <div className="h-full flex flex-col" data-testid="module-list">
      {/* 搜索框 */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索模块..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 模块列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredModules.map(module => (
          <DraggableModuleItem
            key={module.type}
            module={module}
            onAddModule={handleAddModule}
          />
        ))}
      </div>

      {/* 空状态 */}
      {filteredModules.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div className="text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">没有找到匹配的模块</p>
            <p className="text-xs mt-1">尝试使用不同的关键词搜索</p>
          </div>
        </div>
      )}

      {/* 使用提示 */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">💡 拖拽模块到画布中，或点击右侧 + 按钮快速添加</p>
      </div>
    </div>
  )
}
