'use client'

import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, Type, FileText, Image, Layout, Columns, Plus, Trash2 } from 'lucide-react'
import { PageModuleType } from '@pagemaker/shared-types'

export function PropertyPanel() {
  const { currentPage, selectedModuleId, updateModule } = usePageStore()
  const { markUnsaved } = useEditorStore()

  const selectedModule = currentPage?.content?.find(module => module.id === selectedModuleId)

  // 处理属性更新
  const handlePropertyUpdate = (property: string, value: any) => {
    if (selectedModuleId) {
      updateModule(selectedModuleId, { [property]: value })
      markUnsaved()
    }
  }

  // 处理键值对更新
  const handleKeyValueUpdate = (index: number, field: 'key' | 'value', value: string) => {
    if (selectedModule && (selectedModule as any).pairs) {
      const newPairs = [...(selectedModule as any).pairs]
      newPairs[index] = { ...newPairs[index], [field]: value }
      handlePropertyUpdate('pairs', newPairs)
    }
  }

  // 添加键值对
  const handleAddKeyValue = () => {
    if (selectedModule) {
      const currentPairs = (selectedModule as any).pairs || []
      const newPairs = [...currentPairs, { key: '新键', value: '新值' }]
      handlePropertyUpdate('pairs', newPairs)
    }
  }

  // 删除键值对
  const handleRemoveKeyValue = (index: number) => {
    if (selectedModule && (selectedModule as any).pairs) {
      const newPairs = (selectedModule as any).pairs.filter((_: any, i: number) => i !== index)
      handlePropertyUpdate('pairs', newPairs)
    }
  }

  if (!selectedModule) {
    return (
      <div className="h-full flex flex-col" data-testid="property-panel">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h3 className="font-semibold">属性设置</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div className="text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">选择一个模块</p>
            <p className="text-xs mt-1">点击画布中的模块来编辑其属性</p>
          </div>
        </div>
      </div>
    )
  }

  const renderModuleProperties = () => {
    switch (selectedModule.type) {
      case PageModuleType.TITLE:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title-text">标题文本</Label>
              <Input
                id="title-text"
                value={(selectedModule as any).text || ''}
                onChange={e => handlePropertyUpdate('text', e.target.value)}
                placeholder="输入标题文本"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-level">标题级别</Label>
              <Select
                value={String((selectedModule as any).level || 1)}
                onValueChange={value => handlePropertyUpdate('level', parseInt(value))}
              >
                <SelectTrigger id="title-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">H1 - 主标题</SelectItem>
                  <SelectItem value="2">H2 - 副标题</SelectItem>
                  <SelectItem value="3">H3 - 三级标题</SelectItem>
                  <SelectItem value="4">H4 - 四级标题</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case PageModuleType.TEXT:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-content">文本内容</Label>
              <Textarea
                id="text-content"
                value={(selectedModule as any).text || ''}
                onChange={e => handlePropertyUpdate('text', e.target.value)}
                placeholder="输入文本内容"
                rows={6}
              />
            </div>
          </div>
        )

      case PageModuleType.IMAGE:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-src">图片URL</Label>
              <Input
                id="image-src"
                value={(selectedModule as any).src || ''}
                onChange={e => handlePropertyUpdate('src', e.target.value)}
                placeholder="输入图片URL或点击上传"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">图片描述</Label>
              <Input
                id="image-alt"
                value={(selectedModule as any).alt || ''}
                onChange={e => handlePropertyUpdate('alt', e.target.value)}
                placeholder="输入图片描述文本"
              />
            </div>
            <Button variant="outline" className="w-full">
              <Image className="h-4 w-4 mr-2" />
              上传图片
            </Button>
          </div>
        )

      case PageModuleType.KEY_VALUE:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>键值对列表</Label>
              <Button variant="outline" size="sm" onClick={handleAddKeyValue}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
            <div className="space-y-3">
              {((selectedModule as any).pairs || []).map((pair: any, index: number) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">键值对 {index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveKeyValue(index)}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      value={pair.key || ''}
                      onChange={e => handleKeyValueUpdate(index, 'key', e.target.value)}
                      placeholder="键"
                      className="text-sm"
                    />
                    <Input
                      value={pair.value || ''}
                      onChange={e => handleKeyValueUpdate(index, 'value', e.target.value)}
                      placeholder="值"
                      className="text-sm"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )

      case PageModuleType.MULTI_COLUMN:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="columns-count">列数</Label>
              <Select
                value={String((selectedModule as any).columns || 2)}
                onValueChange={value => handlePropertyUpdate('columns', parseInt(value))}
              >
                <SelectTrigger id="columns-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 列</SelectItem>
                  <SelectItem value="3">3 列</SelectItem>
                  <SelectItem value="4">4 列</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>多列布局功能将在后续版本中完善</p>
            </div>
          </div>
        )

      case PageModuleType.SEPARATOR:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>分隔线模块暂无可配置属性</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>该模块类型暂不支持属性编辑</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-full flex flex-col" data-testid="property-panel">
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h3 className="font-semibold">属性设置</h3>
        </div>
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {selectedModule.type} 模块
          </Badge>
        </div>
      </div>

      {/* 属性编辑区域 */}
      <div className="flex-1 overflow-y-auto p-4">{renderModuleProperties()}</div>

      {/* 底部信息 */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground">
          <p>模块ID: {selectedModule.id}</p>
          <p className="mt-1">💡 修改属性会自动标记为未保存</p>
        </div>
      </div>
    </div>
  )
}
