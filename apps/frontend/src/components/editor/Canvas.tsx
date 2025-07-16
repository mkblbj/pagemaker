'use client'

import { useState } from 'react'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { ModuleRenderer } from './ModuleRenderer'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { getModuleMetadata } from '@/lib/moduleRegistry'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/contexts/I18nContext'

import { MoveUp, MoveDown, Copy, Trash2, Plus, FileX, GripVertical } from 'lucide-react'
import { DroppableCanvas } from './dnd/DroppableCanvas'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 可排序的模块容器组件
function SortableModuleContainer({
  module,
  index,
  isSelected,
  onSelect,
  onDelete,
  onCopy,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isDeleting = false,
  t
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
    data: {
      type: 'REORDER',
      index
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDeleting ? 'opacity 0.3s ease-out, transform 0.3s ease-out' : transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`module-${module.id}`}
      className={`
        group relative border-2 rounded-lg p-4 transition-all
        ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200'}
        ${isDragging ? 'opacity-60' : ''}
        ${isDeleting ? 'opacity-0 scale-95' : ''}
      `}
      onClick={() => onSelect(module.id)}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* 模块内容 */}
      <div className="ml-6">
        <ModuleRenderer module={module} />
      </div>

      {/* 操作按钮 */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onMoveUp()
            }}
            disabled={isFirst}
            className="h-6 w-6 p-0"
            aria-label={t('editor.上移模块')}
          >
            <MoveUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onMoveDown()
            }}
            disabled={isLast}
            className="h-6 w-6 p-0"
            aria-label={t('editor.下移模块')}
          >
            <MoveDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onCopy()
            }}
            className="h-6 w-6 p-0"
            aria-label={t('editor.复制模块')}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onDelete()
            }}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            aria-label={t('editor.删除模块')}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function Canvas() {
  const { currentPage, selectedModuleId, setSelectedModule, deleteModule, reorderModules, addModule } = usePageStore()
  const { markUnsaved, hasUnsavedChanges } = useEditorStore()
  const { tEditor } = useTranslation()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<any>(null)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)

  const modules = currentPage?.content || []

  // 处理模块选择
  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId)
  }

  // 处理模块删除（打开确认对话框）
  const handleModuleDelete = (moduleId: string) => {
    const targetModule = modules.find(m => m.id === moduleId)
    if (targetModule) {
      setModuleToDelete(targetModule)
      setDeleteDialogOpen(true)
    }
  }

  // 确认删除模块
  const confirmDeleteModule = () => {
    if (moduleToDelete) {
      setDeletingModuleId(moduleToDelete.id)
      // 延迟删除以显示动画
      setTimeout(() => {
        deleteModule(moduleToDelete.id)
        markUnsaved()
        setModuleToDelete(null)
        setDeletingModuleId(null)
      }, 300) // 与动画时间一致
    }
  }

  // 处理模块复制
  const handleModuleCopy = (moduleId: string) => {
    const sourceModule = modules.find(m => m.id === moduleId)
    if (sourceModule) {
      const newModule = {
        ...sourceModule,
        id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      addModule(newModule)
      markUnsaved()
    }
  }

  // 处理模块上移
  const handleModuleMoveUp = (moduleId: string) => {
    const index = modules.findIndex(m => m.id === moduleId)
    if (index > 0) {
      reorderModules(index, index - 1)
      markUnsaved()
    }
  }

  // 处理模块下移
  const handleModuleMoveDown = (moduleId: string) => {
    const index = modules.findIndex(m => m.id === moduleId)
    if (index < modules.length - 1) {
      reorderModules(index, index + 1)
      markUnsaved()
    }
  }

  return (
    <DroppableCanvas className="h-full overflow-y-auto p-4 relative">
      {modules.length === 0 ? (
        // 空状态
        <div className="h-full flex items-center justify-center text-center">
          <div className="max-w-md mx-auto">
            <FileX className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">{tEditor('画布为空')}</h3>
            <p className="text-gray-500 mb-6">
              {tEditor('从左侧模块列表中拖拽模块到此处，或点击下方按钮开始创建页面内容。')}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm">{tEditor('从左侧拖拽模块到此处')}</span>
            </div>
          </div>
        </div>
      ) : (
        // 模块列表
        <div className="space-y-4">
          {modules.map((module, index) => (
            <SortableModuleContainer
              key={module.id}
              module={module}
              index={index}
              isSelected={selectedModuleId === module.id}
              onSelect={handleModuleSelect}
              onDelete={() => handleModuleDelete(module.id)}
              onCopy={() => handleModuleCopy(module.id)}
              onMoveUp={() => handleModuleMoveUp(module.id)}
              onMoveDown={() => handleModuleMoveDown(module.id)}
              isFirst={index === 0}
              isLast={index === modules.length - 1}
              isDeleting={deletingModuleId === module.id}
              t={tEditor}
            />
          ))}
        </div>
      )}

      {/* 页面信息 */}
      <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {tEditor('页面模块数量')}: {modules.length} | {tEditor('页面ID')}: {currentPage?.id} | {tEditor('最后更新')}
            : {currentPage?.updated_at ? new Date(currentPage.updated_at).toLocaleString() : tEditor('未知')}
          </p>
          {hasUnsavedChanges && <p className="text-xs text-orange-600 mt-1">{tEditor('有未保存的更改')}</p>}
        </div>
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteModule}
        moduleName={moduleToDelete?.text || moduleToDelete?.title || moduleToDelete?.alt}
        moduleType={getModuleMetadata(moduleToDelete?.type, tEditor)?.name || moduleToDelete?.type}
      />
    </DroppableCanvas>
  )
}
