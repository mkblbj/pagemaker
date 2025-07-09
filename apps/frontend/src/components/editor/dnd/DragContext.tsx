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
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { createModuleInstance, getModuleMetadata } from '@/lib/moduleRegistry'
import { PageModuleType } from '@pagemaker/shared-types'
import { Card, CardContent } from '@/components/ui/card'
import * as LucideIcons from 'lucide-react'

// 优化的碰撞检测算法
const customCollisionDetection: CollisionDetection = args => {
  const { active, droppableContainers } = args

  // 如果是从模块列表拖拽的模块类型
  if (active.data.current?.type === 'MODULE_TYPE') {
    // 只检测画布相关的拖放区域
    const canvasContainers = Array.from(droppableContainers.values()).filter(
      container => container.data.current?.type === 'CANVAS'
    )

    if (canvasContainers.length === 0) return []

    // 使用矩形相交检测，要求有实际的重叠
    const rectCollisions = rectIntersection({
      ...args,
      droppableContainers: canvasContainers
    })

    // 只有当真正有重叠时才返回碰撞结果
    return rectCollisions.length > 0 ? rectCollisions : []
  }

  // 对于其他类型的拖拽，使用默认检测
  const rectIntersectionCollisions = rectIntersection(args)

  if (rectIntersectionCollisions.length > 0) {
    return rectIntersectionCollisions
  }

  // 如果没有相交，使用最近中心点检测
  return closestCenter(args)
}

interface DragContextState {
  activeId: string | null
  isDragging: boolean
}

const DragContextProvider = createContext<DragContextState>({
  activeId: null,
  isDragging: false
})

export const useDragContext = () => useContext(DragContextProvider)

interface DragProviderProps {
  children: ReactNode
}

export function DragProvider({ children }: DragProviderProps) {
  const { addModule, reorderModules, currentPage } = usePageStore()
  const { setDragging, markUnsaved, draggedModuleType } = useEditorStore()

  // 配置传感器，优化触摸和键盘支持
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3 // 减少拖拽阻力
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 减少触摸延迟
        tolerance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event

      if (active.data.current?.type === 'MODULE_TYPE') {
        setDragging(true, active.data.current.moduleType)
      } else {
        setDragging(true)
      }
    },
    [setDragging]
  )

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // 可以在这里添加拖拽过程中的逻辑
    // 目前保持空白以减少性能开销
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      setDragging(false)

      // 如果没有拖拽到任何有效区域，直接返回
      if (!over) return

      try {
        // 处理从模块列表拖拽到画布的情况
        // 必须满足：1) 拖拽的是模块类型 2) 拖拽到的是画布 3) 确实有碰撞
        if (
          active.data.current?.type === 'MODULE_TYPE' &&
          over.data.current?.type === 'CANVAS' &&
          over.id === 'canvas'
        ) {
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

        // 其他情况不处理，避免意外添加模块
      } catch (error) {
        console.error('拖拽操作失败:', error)
        // 可以在这里添加错误处理逻辑
      }
    },
    [addModule, reorderModules, setDragging, markUnsaved]
  )

  // 渲染拖拽预览
  const renderDragOverlay = () => {
    if (!draggedModuleType) return null

    const moduleMetadata = getModuleMetadata(draggedModuleType as PageModuleType)
    if (!moduleMetadata) return null

    const getIconComponent = (iconName: string) => {
      const IconComponent = (LucideIcons as any)[iconName]
      return IconComponent || LucideIcons.HelpCircle
    }

    const IconComponent = getIconComponent(moduleMetadata.icon)

    return (
      <Card className="opacity-90 shadow-lg border-2 border-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-muted ${moduleMetadata.color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{moduleMetadata.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{moduleMetadata.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const modules = currentPage?.content || []
  const moduleIds = modules.map(module => module.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
        <DragContextProvider.Provider
          value={{
            activeId: null, // 可以根据需要实现
            isDragging: false // 可以根据需要实现
          }}
        >
          {children}
        </DragContextProvider.Provider>
      </SortableContext>

      <DragOverlay>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  )
}
