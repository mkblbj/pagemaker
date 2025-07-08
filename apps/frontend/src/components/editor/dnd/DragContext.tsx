'use client'

import { createContext, useContext, ReactNode, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  CollisionDetection,
  rectIntersection
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { createModuleInstance } from '@/lib/moduleRegistry'
import { PageModuleType } from '@pagemaker/shared-types'

// 优化的碰撞检测算法
const customCollisionDetection: CollisionDetection = (args) => {
  // 首先尝试矩形相交检测
  const rectIntersectionCollisions = rectIntersection(args)
  
  if (rectIntersectionCollisions.length > 0) {
    return rectIntersectionCollisions
  }
  
  // 如果没有相交，使用最近中心点检测
  return closestCenter(args)
}

interface DragContextValue {
  activeId: string | null
  isDragging: boolean
}

const DragContextProvider = createContext<DragContextValue>({
  activeId: null,
  isDragging: false
})

export const useDragContext = () => useContext(DragContextProvider)

interface DragProviderProps {
  children: ReactNode
}

export function DragProvider({ children }: DragProviderProps) {
  const { addModule, reorderModules, currentPage } = usePageStore()
  const { setDragging, markUnsaved } = useEditorStore()

  // 配置传感器，优化触摸和键盘支持
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 减少拖拽阻力
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 减少触摸延迟
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    
    if (active.data.current?.type === 'MODULE_TYPE') {
      setDragging(true, active.data.current.moduleType)
    } else {
      setDragging(true)
    }
  }, [setDragging])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // 可以在这里添加拖拽过程中的逻辑
    // 目前保持空白以减少性能开销
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    setDragging(false)

    if (!over) return

    try {
      // 处理从模块列表拖拽到画布的情况
      if (active.data.current?.type === 'MODULE_TYPE' && over.data.current?.type === 'CANVAS') {
        const moduleType = active.data.current.moduleType as PageModuleType
        const newModule = createModuleInstance(moduleType)
        
        addModule(newModule)
        markUnsaved()
        return
      }

      // 处理画布内模块重新排序
      if (active.data.current?.type === 'REORDER' && over.data.current?.type === 'REORDER') {
        const activeIndex = active.data.current.index
        const overIndex = over.data.current.index

        if (activeIndex !== overIndex) {
          reorderModules(activeIndex, overIndex)
          markUnsaved()
        }
        return
      }

      // 处理拖拽到画布空白区域
      if (active.data.current?.type === 'MODULE_TYPE' && (over.id === 'canvas-drop-zone' || over.id === 'canvas')) {
        const moduleType = active.data.current.moduleType as PageModuleType
        const newModule = createModuleInstance(moduleType)
        addModule(newModule)
        markUnsaved()
      }
    } catch (error) {
      console.error('拖拽操作失败:', error)
      // 可以在这里添加错误处理逻辑
    }
  }, [addModule, reorderModules, setDragging, markUnsaved])

  const modules = currentPage?.content || []
  const moduleIds = modules.map(module => module.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[]}
    >
      <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
        <DragContextProvider.Provider
          value={{
            activeId: null, // 可以根据需要实现
            isDragging: false, // 可以根据需要实现
          }}
        >
          {children}
        </DragContextProvider.Provider>
      </SortableContext>
      
      <DragOverlay>
        {/* 可以在这里添加拖拽预览组件 */}
        <div className="bg-primary/10 border-2 border-primary border-dashed rounded-lg p-4">
          <div className="text-sm text-primary font-medium">拖拽中...</div>
        </div>
      </DragOverlay>
    </DndContext>
  )
} 