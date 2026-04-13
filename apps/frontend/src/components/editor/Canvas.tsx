'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { ModuleRenderer } from './ModuleRenderer'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { getModuleMetadata } from '@/lib/moduleRegistry'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/contexts/I18nContext'
import { HtmlExportService } from '@/services/htmlExportService'
import { PageModuleType, PageModule } from '@pagemaker/shared-types'
import { HtmlModule } from '@/lib/htmlSplitter'
import { SplitPreviewDialog } from './SplitPreviewDialog'
import { sanitizeHtml } from '@/lib/htmlSanitizer'

import { MoveUp, MoveDown, Copy, Trash2, Plus, FileX, GripVertical, Code, Split } from 'lucide-react'
import { DroppableCanvas } from './dnd/DroppableCanvas'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 可排序的模块容器组件
function SortableModuleContainer({
  module,
  index,
  isSelected,
  isEditing,
  onSelect,
  onDelete,
  onCopy,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onStartEdit,
  onEndEdit,
  onViewCode,
  onSplit,
  onContentWidthChange,
  isFirst,
  isLast,
  isDeleting = false,
  tEditor
}: any) {
  const { isDragging: globalDragging } = useEditorStore()
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
        group relative transition-all
        ${isDragging ? 'border-2 border-solid border-blue-500 bg-blue-100/50 shadow-lg scale-105 z-10 rounded-lg p-2' : ''}
        ${isDeleting ? 'opacity-0 scale-95' : ''}
        ${globalDragging && !isDragging ? 'border-2 border-dashed border-blue-300 bg-blue-50/20 rounded-lg p-2' : ''}
      `}
      onClick={() => onSelect(module.id)}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 cursor-move opacity-100 transition-opacity z-10 bg-white rounded-md shadow-sm p-1"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* 模块内容 */}
      <div className="ml-8">
        <ModuleRenderer
          module={module}
          isSelected={isSelected}
          isEditing={isEditing}
          onContentWidthChange={onContentWidthChange}
          onUpdate={onUpdate}
          onStartEdit={onStartEdit}
          onEndEdit={onEndEdit}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onCopy={onCopy}
          onViewCode={onViewCode}
          onSplit={onSplit}
          onDelete={onDelete}
          isFirst={isFirst}
          isLast={isLast}
        />
      </div>

      {/* 操作按钮 - 对自定义HTML模块隐藏 */}
      {module.type !== 'custom' && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-md p-1 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation()
            onMoveUp()
          }}
          disabled={isFirst}
          className="h-6 w-6 p-0"
          aria-label={tEditor('上移模块')}
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
          aria-label={tEditor('下移模块')}
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
          aria-label={tEditor('复制模块')}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation()
            onViewCode()
          }}
          className="h-6 w-6 p-0"
          aria-label={tEditor('查看代码')}
        >
          <Code className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation()
            onDelete()
          }}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          aria-label={tEditor('删除模块')}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        </div>
      )}
    </div>
  )
}

interface CanvasProps {
  onPreferredWidthChange?: (width: number) => void
}

const PC_CANVAS_BASE_WIDTH = 440
const PC_CANVAS_HORIZONTAL_BUFFER = 80

export function Canvas({ onPreferredWidthChange }: CanvasProps) {
  const {
    currentPage,
    selectedModuleId,
    setSelectedModule,
    deleteModule,
    reorderModules,
    addModule,
    updateModule,
    markUnsaved,
    hasUnsavedChanges
  } = usePageStore()
  const { tEditor, currentLanguage } = useTranslation()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<any>(null)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [codeDialogOpen, setCodeDialogOpen] = useState(false)
  const [moduleCode, setModuleCode] = useState('')
  const [originalModuleCode, setOriginalModuleCode] = useState('')
  const [currentModuleForCode, setCurrentModuleForCode] = useState<any>(null)
  const [hasCodeChanges, setHasCodeChanges] = useState(false)
  const [splitPreviewOpen, setSplitPreviewOpen] = useState(false)

  const modules = currentPage?.content || []
  const [moduleContentWidths, setModuleContentWidths] = useState<Record<string, number>>({})

  useEffect(() => {
    setModuleContentWidths(prevWidths => {
      const activeModuleIds = new Set(modules.map(module => module.id))
      const nextWidths = Object.fromEntries(
        Object.entries(prevWidths).filter(([moduleId]) => activeModuleIds.has(moduleId))
      )

      return Object.keys(nextWidths).length === Object.keys(prevWidths).length ? prevWidths : nextWidths
    })
  }, [modules])

  useEffect(() => {
    if (!onPreferredWidthChange) return

    if (currentPage?.device_type !== 'pc') {
      onPreferredWidthChange(PC_CANVAS_BASE_WIDTH)
      return
    }

    const widestModuleWidth = Object.values(moduleContentWidths).reduce((maxWidth, width) => {
      return Math.max(maxWidth, width)
    }, 0)

    const preferredCanvasWidth = Math.max(
      PC_CANVAS_BASE_WIDTH,
      Math.ceil(widestModuleWidth + PC_CANVAS_HORIZONTAL_BUFFER)
    )

    onPreferredWidthChange(preferredCanvasWidth)
  }, [currentPage?.device_type, moduleContentWidths, onPreferredWidthChange])

  const handleModuleContentWidthChange = useCallback(
    (moduleId: string, width: number) => {
      if (currentPage?.device_type !== 'pc' || !Number.isFinite(width) || width <= 0) return

      const nextWidth = Math.ceil(width)
      setModuleContentWidths(prevWidths => {
        if (prevWidths[moduleId] === nextWidth) {
          return prevWidths
        }

        return {
          ...prevWidths,
          [moduleId]: nextWidth
        }
      })
    },
    [currentPage?.device_type]
  )

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

  // 处理模块复制 - 复制到当前模块的下面
  const handleModuleCopy = (moduleId: string) => {
    const sourceIndex = modules.findIndex(m => m.id === moduleId)
    const sourceModule = modules[sourceIndex]
    if (sourceModule && currentPage) {
      const newModule = {
        ...sourceModule,
        id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      // 在当前模块的下一个位置插入
      const newContent = [...modules]
      newContent.splice(sourceIndex + 1, 0, newModule)
      
      // 更新页面内容
      usePageStore.getState().updatePage({ 
        content: newContent,
        module_count: newContent.length
      })
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

  // 处理模块更新
  const handleModuleUpdate = (moduleId: string, updates: Partial<any>) => {
    updateModule(moduleId, updates)
    markUnsaved()
  }

  // 处理开始编辑
  const handleStartEdit = (moduleId: string) => {
    setEditingModuleId(moduleId)
    setSelectedModule(moduleId)
  }

  // 处理结束编辑
  const handleEndEdit = () => {
    setEditingModuleId(null)
  }

  // 处理查看模块代码
  const handleViewModuleCode = (module: any) => {
    try {
      // 根据设备类型决定是否使用移动端模式
      const isMobileMode = currentPage?.device_type === 'mobile'

      const html = HtmlExportService.generateModuleHTML(module, {
        includeStyles: false,
        minify: false,
        title: '',
        description: '',
        language: 'zh-CN',
        fullDocument: false,
        mobileMode: isMobileMode // 使用与设备类型一致的模式
      })
      setModuleCode(html)
      setOriginalModuleCode(html)
      setCurrentModuleForCode(module)
      setHasCodeChanges(false)
      setCodeDialogOpen(true)
    } catch (error) {
      console.error('生成模块HTML失败:', error)
      const errorMessage = '生成HTML时出错: ' + error.message
      setModuleCode(errorMessage)
      setOriginalModuleCode(errorMessage)
      setCurrentModuleForCode(module)
      setHasCodeChanges(false)
      setCodeDialogOpen(true)
    }
  }

  // 处理代码变化
  const handleCodeChange = (newCode: string) => {
    setModuleCode(newCode)
    setHasCodeChanges(newCode !== originalModuleCode)
  }

  // 重置代码
  const resetCode = () => {
    setModuleCode(originalModuleCode)
    setHasCodeChanges(false)
  }

  // 应用代码修改
  const applyCodeChanges = () => {
    if (!currentModuleForCode || !hasCodeChanges) return

    try {
      // P5 规范：保存时净化并回填
      const isMobileMode = currentPage?.device_type === 'mobile'
      const sanitizedCode = isMobileMode 
        ? sanitizeHtml(moduleCode.trim())  // 移动端模式：严格净化
        : moduleCode.trim()                // 非移动端：保持原样
      
      // 将编辑后的HTML作为自定义模块
      const customModule = {
        type: PageModuleType.CUSTOM,
        customHTML: sanitizedCode,
        originalType: currentModuleForCode.type, // 保存原始类型用于参考
        name: `${tEditor('自定义HTML模块')} (${tEditor('原{type}', { type: currentModuleForCode.type })})`
      }
      
      updateModule(currentModuleForCode.id, customModule)
      markUnsaved()
      
      // 如果进行了净化，更新显示的代码为净化后的版本
      if (isMobileMode && sanitizedCode !== moduleCode.trim()) {
        setModuleCode(sanitizedCode)
        setOriginalModuleCode(sanitizedCode)
      } else {
        setOriginalModuleCode(moduleCode)
      }
      setHasCodeChanges(false)
    } catch (error) {
      console.error('应用代码修改失败:', error)
    }
  }

  // 处理拆分模块（从模块标题栏触发）
  const handleSplitModule = (module: PageModule) => {
    setCurrentModuleForCode(module)
    const html = (module as any).customHTML || ''
    setModuleCode(html)
    setSplitPreviewOpen(true)
  }

  // 处理拆分确认
  const handleSplitConfirm = (htmlModules: HtmlModule[]) => {
    if (!currentModuleForCode || htmlModules.length === 0) return

    try {
      // 1. 获取当前模块的索引
      const currentIndex = modules.findIndex(m => m.id === currentModuleForCode.id)
      if (currentIndex === -1) return

      // 2. 创建新模块列表
      const newModules = htmlModules.map((htmlModule) => ({
        id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: PageModuleType.CUSTOM,
        customHTML: htmlModule.html,
        metadata: {
          isSplitModule: true,
          splitModuleKind: htmlModule.kind,
          splitModuleId: htmlModule.id
        },
        name: `${htmlModule.kind} 模块`
      }))

      // 3. 删除当前模块
      deleteModule(currentModuleForCode.id)

      // 4. 在相同位置插入拆分后的模块
      // 使用 setTimeout 确保状态更新完成后再进行移动操作
      setTimeout(() => {
        // 先添加所有模块到末尾
        newModules.forEach((newModule) => {
          addModule(newModule)
        })

        // 再使用 setTimeout 确保添加完成后再移动
        setTimeout(() => {
          // 获取当前模块总数
          const currentModules = currentPage?.content || []
          const totalCount = currentModules.length
          
          // 计算新添加模块的起始位置（从末尾往前数）
          const startPos = totalCount - newModules.length
          
          // 将新添加的模块移动到正确位置
          // 从后往前移动，保持顺序
          for (let i = newModules.length - 1; i >= 0; i--) {
            const fromIndex = startPos + i
            const toIndex = currentIndex + i
            
            // 将模块从 fromIndex 移动到 toIndex
            if (fromIndex > toIndex) {
              for (let j = fromIndex; j > toIndex; j--) {
                reorderModules(j, j - 1)
              }
            }
          }
          
          markUnsaved()
        }, 50)
      }, 50)

      setSplitPreviewOpen(false)
      setCurrentModuleForCode(null)
      setModuleCode('')
    } catch (error) {
      console.error('拆分模块失败:', error)
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
              isEditing={editingModuleId === module.id}
              onSelect={handleModuleSelect}
              onDelete={() => handleModuleDelete(module.id)}
              onCopy={() => handleModuleCopy(module.id)}
              onMoveUp={() => handleModuleMoveUp(module.id)}
              onMoveDown={() => handleModuleMoveDown(module.id)}
              onUpdate={(updates: any) => handleModuleUpdate(module.id, updates)}
              onStartEdit={() => handleStartEdit(module.id)}
              onEndEdit={handleEndEdit}
              onViewCode={() => handleViewModuleCode(module)}
              onSplit={() => handleSplitModule(module)}
              onContentWidthChange={(width: number) => handleModuleContentWidthChange(module.id, width)}
              isFirst={index === 0}
              isLast={index === modules.length - 1}
              isDeleting={deletingModuleId === module.id}
              tEditor={tEditor}
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
        moduleType={getModuleMetadata(moduleToDelete?.type, currentLanguage)?.name || moduleToDelete?.type}
      />

        {/* 模块源码编辑抽屉 (P5) */}
        <Sheet open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
          <SheetContent side="right" className="w-full sm:w-[600px] md:w-[800px] flex flex-col p-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {tEditor('模块源码')}
                {hasCodeChanges && (
                  <span className="text-orange-500 text-sm font-normal">
                    ({tEditor('代码已修改')})
                  </span>
                )}
              </SheetTitle>
              <SheetDescription>
                {tEditor('模块HTML代码')} - {getModuleMetadata(currentModuleForCode?.type, currentLanguage)?.name || currentModuleForCode?.type}
                {currentPage?.device_type === 'mobile' && (
                  <>
                    <br />
                    <span className="text-xs text-blue-600 font-medium">
                      🏷️ 移动端模式 - 保存时自动净化（Rakuten 合规）
                    </span>
                  </>
                )}
                <br />
                <span className="text-xs text-muted-foreground">
                  {tEditor('编辑HTML源码，保存时自动净化并回填')}
                </span>
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <Textarea
                value={moduleCode || ''}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full h-full min-h-[500px] font-mono text-xs resize-none border rounded-lg p-3 focus-visible:ring-2"
                placeholder={tEditor('HTML代码将在这里显示...')}
              />
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
              <div className="flex gap-2">
                {hasCodeChanges && (
                  <>
                    <Button
                      variant="outline"
                      onClick={resetCode}
                      size="sm"
                    >
                      {tEditor('重置代码')}
                    </Button>
                    <Button
                      onClick={applyCodeChanges}
                      disabled={!hasCodeChanges}
                      size="sm"
                    >
                      {tEditor('应用修改')}
                    </Button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(moduleCode)
                  }}
                  size="sm"
                >
                  {tEditor('复制代码')}
                </Button>
                <Button onClick={() => setCodeDialogOpen(false)} size="sm">
                  {tEditor('关闭')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

      {/* 拆分预览对话框 */}
      <SplitPreviewDialog
        open={splitPreviewOpen}
        html={moduleCode}
        onConfirm={handleSplitConfirm}
        onCancel={() => setSplitPreviewOpen(false)}
      />
    </DroppableCanvas>
  )
}
