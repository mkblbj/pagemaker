'use client'

import { useState } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { usePageStore } from '@/stores/usePageStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Type, Image, Minus, Layout, FileText, Columns, Search, Plus } from 'lucide-react'
import { PageModuleType } from '@pagemaker/shared-types'

// 可用模块类型定义
const AVAILABLE_MODULES = [
  {
    type: PageModuleType.TITLE,
    name: '标题',
    description: '添加标题文本',
    icon: Type,
    color: 'text-blue-600'
  },
  {
    type: PageModuleType.TEXT,
    name: '文本',
    description: '添加段落文本',
    icon: FileText,
    color: 'text-green-600'
  },
  {
    type: PageModuleType.IMAGE,
    name: '图片',
    description: '添加图片',
    icon: Image,
    color: 'text-purple-600'
  },
  {
    type: PageModuleType.SEPARATOR,
    name: '分隔线',
    description: '添加分隔线',
    icon: Minus,
    color: 'text-gray-600'
  },
  {
    type: PageModuleType.KEY_VALUE,
    name: '键值对',
    description: '添加键值对信息',
    icon: Layout,
    color: 'text-orange-600'
  },
  {
    type: PageModuleType.MULTI_COLUMN,
    name: '多列布局',
    description: '添加多列布局',
    icon: Columns,
    color: 'text-red-600'
  }
]

export function ModuleList() {
  const [searchTerm, setSearchTerm] = useState('')
  const { setDragging } = useEditorStore()
  const { addModule } = usePageStore()

  // 过滤模块
  const filteredModules = AVAILABLE_MODULES.filter(
    module =>
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 处理模块拖拽开始
  const handleDragStart = (e: React.DragEvent, moduleType: PageModuleType) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'MODULE',
        moduleType
      })
    )
    setDragging(true, moduleType)
  }

  // 处理模块拖拽结束
  const handleDragEnd = () => {
    setDragging(false)
  }

  // 处理模块点击添加
  const handleAddModule = (moduleType: PageModuleType) => {
    const newModule = {
      id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: moduleType,
      // 根据模块类型添加默认配置
      ...(moduleType === PageModuleType.TITLE && {
        text: '新标题',
        level: 1
      }),
      ...(moduleType === PageModuleType.TEXT && {
        text: '请输入文本内容'
      }),
      ...(moduleType === PageModuleType.IMAGE && {
        src: '',
        alt: '图片描述'
      }),
      ...(moduleType === PageModuleType.KEY_VALUE && {
        pairs: [{ key: '键', value: '值' }]
      }),
      ...(moduleType === PageModuleType.MULTI_COLUMN && {
        columns: 2,
        items: []
      })
    }

    addModule(newModule)
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
        {filteredModules.map(module => {
          const IconComponent = module.icon
          return (
            <Card
              key={module.type}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20"
              draggable
              onDragStart={e => handleDragStart(e, module.type)}
              onDragEnd={handleDragEnd}
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
                    onClick={() => handleAddModule(module.type)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
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
