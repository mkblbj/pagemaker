'use client'

import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, Image, Plus, Trash2 } from 'lucide-react'
import { PageModuleType } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

export function PropertyPanel() {
  const { currentPage, selectedModuleId, updateModule, markUnsaved } = usePageStore()
  const { tEditor } = useTranslation()

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
      const newPairs = [...currentPairs, { key: tEditor('新键'), value: tEditor('新值') }]
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
            <h3 className="font-semibold">{tEditor('属性设置')}</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div className="text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{tEditor('未选择模块')}</p>
            <p className="text-xs mt-1">{tEditor('请在画布中选择一个模块以编辑其属性')}</p>
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
              <Label htmlFor="title-text">{tEditor('标题文本')}</Label>
              <Input
                id="title-text"
                value={(selectedModule as any).text || ''}
                onChange={e => handlePropertyUpdate('text', e.target.value)}
                placeholder={tEditor('输入标题文本')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-level">{tEditor('标题级别')}</Label>
              <Select
                value={String((selectedModule as any).level || 1)}
                onValueChange={value => handlePropertyUpdate('level', parseInt(value))}
              >
                <SelectTrigger id="title-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{tEditor('H1 - 主标题')}</SelectItem>
                  <SelectItem value="2">{tEditor('H2 - 副标题')}</SelectItem>
                  <SelectItem value="3">{tEditor('H3 - 三级标题')}</SelectItem>
                  <SelectItem value="4">{tEditor('H4 - 四级标题')}</SelectItem>
                  <SelectItem value="5">{tEditor('H5 - 五级标题')}</SelectItem>
                  <SelectItem value="6">{tEditor('H6 - 六级标题')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-alignment">{tEditor('对齐方式')}</Label>
              <Select
                value={(selectedModule as any).alignment || 'left'}
                onValueChange={value => handlePropertyUpdate('alignment', value)}
              >
                <SelectTrigger id="title-alignment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">{tEditor('左对齐')}</SelectItem>
                  <SelectItem value="center">{tEditor('居中对齐')}</SelectItem>
                  <SelectItem value="right">{tEditor('右对齐')}</SelectItem>
                  <SelectItem value="justify">{tEditor('两端对齐')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-font-family">{tEditor('字体')}</Label>
              <Select
                value={(selectedModule as any).fontFamily || 'inherit'}
                onValueChange={value => handlePropertyUpdate('fontFamily', value)}
              >
                <SelectTrigger id="title-font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">{tEditor('系统默认')}</SelectItem>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                  <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                  <SelectItem value="'Helvetica Neue', sans-serif">Helvetica Neue</SelectItem>
                  <SelectItem value="'MS Mincho', serif">明朝体</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-font-weight">{tEditor('字体粗细')}</Label>
              <Select
                value={(selectedModule as any).fontWeight || 'bold'}
                onValueChange={value => handlePropertyUpdate('fontWeight', value)}
              >
                <SelectTrigger id="title-font-weight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{tEditor('正常')}</SelectItem>
                  <SelectItem value="bold">{tEditor('加粗')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-color">{tEditor('文字颜色')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="title-color"
                  type="color"
                  value={(selectedModule as any).color || '#000000'}
                  onChange={e => handlePropertyUpdate('color', e.target.value)}
                  className="w-16 h-8 p-1 rounded"
                />
                <Input
                  value={(selectedModule as any).color || '#000000'}
                  onChange={e => handlePropertyUpdate('color', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )

      case PageModuleType.TEXT:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-content">{tEditor('文本内容')}</Label>
              <Textarea
                id="text-content"
                value={(selectedModule as any).content || ''}
                onChange={e => handlePropertyUpdate('content', e.target.value)}
                placeholder={tEditor('输入文本内容')}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-alignment">{tEditor('对齐方式')}</Label>
              <Select
                value={(selectedModule as any).alignment || 'left'}
                onValueChange={value => handlePropertyUpdate('alignment', value)}
              >
                <SelectTrigger id="text-alignment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">{tEditor('左对齐')}</SelectItem>
                  <SelectItem value="center">{tEditor('居中对齐')}</SelectItem>
                  <SelectItem value="right">{tEditor('右对齐')}</SelectItem>
                  <SelectItem value="justify">{tEditor('两端对齐')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-font-family">{tEditor('字体')}</Label>
              <Select
                value={(selectedModule as any).fontFamily || 'inherit'}
                onValueChange={value => handlePropertyUpdate('fontFamily', value)}
              >
                <SelectTrigger id="text-font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">{tEditor('系统默认')}</SelectItem>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                  <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                  <SelectItem value="'Helvetica Neue', sans-serif">Helvetica Neue</SelectItem>
                  <SelectItem value="'MS Mincho', serif">明朝体</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-font-size">{tEditor('字体大小')}</Label>
              <Select
                value={(selectedModule as any).fontSize || '14px'}
                onValueChange={value => handlePropertyUpdate('fontSize', value)}
              >
                <SelectTrigger id="text-font-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">12px</SelectItem>
                  <SelectItem value="14px">14px</SelectItem>
                  <SelectItem value="16px">16px</SelectItem>
                  <SelectItem value="18px">18px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                  <SelectItem value="24px">24px</SelectItem>
                  <SelectItem value="28px">28px</SelectItem>
                  <SelectItem value="32px">32px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-color">{tEditor('文字颜色')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={(selectedModule as any).textColor || '#000000'}
                  onChange={e => handlePropertyUpdate('textColor', e.target.value)}
                  className="w-16 h-8 p-1 rounded"
                />
                <Input
                  value={(selectedModule as any).textColor || '#000000'}
                  onChange={e => handlePropertyUpdate('textColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-bg-color">{tEditor('背景颜色')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="text-bg-color"
                  type="color"
                  value={(selectedModule as any).backgroundColor || '#ffffff'}
                  onChange={e => handlePropertyUpdate('backgroundColor', e.target.value)}
                  className="w-16 h-8 p-1 rounded"
                />
                <Input
                  value={(selectedModule as any).backgroundColor || 'transparent'}
                  onChange={e => handlePropertyUpdate('backgroundColor', e.target.value)}
                  placeholder="transparent"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )

      case PageModuleType.IMAGE:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-src">{tEditor('图片URL')}</Label>
              <Input
                id="image-src"
                value={(selectedModule as any).src || ''}
                onChange={e => handlePropertyUpdate('src', e.target.value)}
                placeholder={tEditor('输入图片URL')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">{tEditor('图片描述')}</Label>
              <Input
                id="image-alt"
                value={(selectedModule as any).alt || ''}
                onChange={e => handlePropertyUpdate('alt', e.target.value)}
                placeholder={tEditor('输入图片描述')}
              />
            </div>
            <Button variant="outline" className="w-full">
              <Image className="h-4 w-4 mr-2" />
              {tEditor('上传图片')}
            </Button>
            {(selectedModule as any).src && (
              <div className="mt-4">
                <img
                  src={(selectedModule as any).src}
                  alt={(selectedModule as any).alt || '预览图片'}
                  className="max-w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            )}
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
          <h3 className="font-semibold">{tEditor('属性设置')}</h3>
        </div>
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {tEditor('{type} 模块', { type: selectedModule.type })}
          </Badge>
        </div>
      </div>

      {/* 属性编辑区域 */}
      <div className="flex-1 overflow-y-auto p-4">{renderModuleProperties()}</div>

      {/* 底部信息 */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground">
          <p>
            {tEditor('模块ID')}: {selectedModule.id}
          </p>
          <p className="mt-1">{tEditor('💡 修改属性会自动标记为未保存')}</p>
        </div>
      </div>
    </div>
  )
}
