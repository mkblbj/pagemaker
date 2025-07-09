'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { PageModuleType, ModuleMetadata } from '@pagemaker/shared-types'
import * as LucideIcons from 'lucide-react'

interface DraggableModuleItemProps {
  module: ModuleMetadata
  onAddModule: (moduleType: PageModuleType) => void
}

export function DraggableModuleItem({ module, onAddModule }: DraggableModuleItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `module-${module.type}`,
    data: {
      type: 'MODULE_TYPE',
      moduleType: module.type
    }
  })

  // 获取图标组件
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName]
    return IconComponent || LucideIcons.HelpCircle
  }

  const IconComponent = getIconComponent(module.icon)

  // 拖拽时不应用transform，保持原始位置避免其他元素重新布局
  const style = isDragging
    ? undefined
    : transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
        }
      : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent 
        hover:border-primary/20 group
        ${isDragging ? 'opacity-60' : ''}
      `}
      {...listeners}
      {...attributes}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-muted ${module.color}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">{module.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation()
              onAddModule(module.type)
            }}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
