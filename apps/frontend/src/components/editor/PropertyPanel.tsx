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
import { Settings, Image, Plus, Trash2, Upload, Link, X } from 'lucide-react'
import { PageModuleType } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useState, useRef } from 'react'
import { imageService } from '@/services/imageService'

// 图片模块属性组件
function ImageModuleProperties({
  module,
  onUpdate
}: {
  module: any
  onUpdate: (property: string, value: any) => void
}) {
  const { tEditor } = useTranslation()
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    const validation = imageService.validateImageFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || '文件验证失败')
      setUploadStatus('error')
      return
    }

    setUploadingFile(file)
    setUploadStatus('uploading')
    setUploadProgress(0)
    setUploadError(null)

    try {
      const uploadResult = await imageService.uploadImage(file, progress => {
        setUploadProgress(progress)
      })

      setUploadStatus('success')
      onUpdate('src', uploadResult.url)
      onUpdate('alt', module.alt || file.name.replace(/\.[^/.]+$/, ''))

      // 延迟关闭对话框以显示成功状态
      setTimeout(() => {
        setShowImageSelector(false)
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 1500)
    } catch (error) {
      console.error('图片上传失败:', error)
      setUploadError(error instanceof Error ? error.message : '图片上传失败，请重试')
      setUploadStatus('error')
    } finally {
      setUploadingFile(null)
    }
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  return (
    <div className="space-y-4">
      {/* 图片选择/上传 */}
      <div className="space-y-2">
        <Label>{tEditor('图片')}</Label>
        {!module.src ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => setShowImageSelector(true)}
          >
            <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{tEditor('点击选择图片')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <img src={module.src} alt={module.alt || '预览图片'} className="max-w-full h-auto rounded-lg shadow-sm" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImageSelector(true)} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                {tEditor('更换图片')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdate('src', '')
                  onUpdate('alt', '')
                }}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Alt文本 */}
      <div className="space-y-2">
        <Label htmlFor="image-alt">{tEditor('图片描述')}</Label>
        <Input
          id="image-alt"
          value={module.alt || ''}
          onChange={e => onUpdate('alt', e.target.value)}
          placeholder={tEditor('输入图片描述')}
        />
      </div>

      {/* 对齐方式 */}
      <div className="space-y-2">
        <Label>{tEditor('对齐方式')}</Label>
        <Select
          value={module.alignment || 'center'}
          onValueChange={(value: 'left' | 'center' | 'right') => onUpdate('alignment', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">{tEditor('左对齐')}</SelectItem>
            <SelectItem value="center">{tEditor('居中')}</SelectItem>
            <SelectItem value="right">{tEditor('右对齐')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 尺寸设置 */}
      <div className="space-y-2">
        <Label>{tEditor('图片尺寸')}</Label>
        <div className="space-y-2">
          <Select
            value={module.size?.type || 'preset'}
            onValueChange={(value: 'preset' | 'percentage') =>
              onUpdate('size', {
                type: value,
                value: value === 'preset' ? 'medium' : '100'
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preset">{tEditor('预设尺寸')}</SelectItem>
              <SelectItem value="percentage">{tEditor('百分比')}</SelectItem>
            </SelectContent>
          </Select>

          {module.size?.type === 'preset' ? (
            <Select
              value={module.size?.value || 'medium'}
              onValueChange={value => onUpdate('size', { type: 'preset', value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{tEditor('小图 (200px)')}</SelectItem>
                <SelectItem value="medium">{tEditor('中图 (400px)')}</SelectItem>
                <SelectItem value="large">{tEditor('大图 (600px)')}</SelectItem>
                <SelectItem value="full">{tEditor('全宽')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={module.size?.value || '100'}
                onChange={e => onUpdate('size', { type: 'percentage', value: e.target.value })}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          )}
        </div>
      </div>

      {/* 链接设置 */}
      <div className="space-y-2">
        <Label>{tEditor('链接设置')}</Label>
        <div className="space-y-2">
          <Select
            value={module.link?.type || 'none'}
            onValueChange={(value: string) => {
              if (value === 'none') {
                onUpdate('link', undefined)
              } else {
                onUpdate('link', { type: value, value: '' })
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{tEditor('无链接')}</SelectItem>
              <SelectItem value="url">{tEditor('网址')}</SelectItem>
              <SelectItem value="email">{tEditor('邮箱')}</SelectItem>
              <SelectItem value="phone">{tEditor('电话')}</SelectItem>
              <SelectItem value="anchor">{tEditor('页面锚点')}</SelectItem>
            </SelectContent>
          </Select>

          {module.link && (
            <Input
              value={module.link.value || ''}
              onChange={e => onUpdate('link', { ...module.link, value: e.target.value })}
              placeholder={
                module.link.type === 'url'
                  ? 'https://example.com'
                  : module.link.type === 'email'
                    ? 'example@email.com'
                    : module.link.type === 'phone'
                      ? '+86 138 0013 8000'
                      : module.link.type === 'anchor'
                        ? 'section-name'
                        : ''
              }
            />
          )}
        </div>
      </div>

      {/* 图片选择对话框 */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tEditor('选择图片')}</DialogTitle>
            <DialogDescription>{tEditor('从本地上传新图片或从R-Cabinet中选择已有图片')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />

              {uploadStatus === 'uploading' && (
                <div className="space-y-2 mb-4">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {tEditor('上传中')} {uploadProgress}%
                  </p>
                </div>
              )}

              <Button onClick={() => fileInputRef.current?.click()} disabled={uploadStatus === 'uploading'}>
                {uploadStatus === 'uploading' ? tEditor('上传中...') : tEditor('选择文件')}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                {tEditor('支持 JPG、PNG、GIF、WebP 格式，文件大小不超过5MB')}
              </p>

              {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
    if (selectedModule) {
      // 优先使用rows属性，向后兼容pairs属性
      const currentRows = (selectedModule as any).rows || (selectedModule as any).pairs || []
      const newRows = [...currentRows]
      newRows[index] = { ...newRows[index], [field]: value }
      // 使用rows属性存储，保持一致性
      handlePropertyUpdate('rows', newRows)
    }
  }

  // 添加键值对
  const handleAddKeyValue = () => {
    if (selectedModule) {
      // 优先使用rows属性，向后兼容pairs属性
      const currentRows = (selectedModule as any).rows || (selectedModule as any).pairs || []
      const newRows = [...currentRows, { key: tEditor('新键'), value: tEditor('新值') }]
      // 使用rows属性存储，保持一致性
      handlePropertyUpdate('rows', newRows)
    }
  }

  // 删除键值对
  const handleRemoveKeyValue = (index: number) => {
    if (selectedModule) {
      // 优先使用rows属性，向后兼容pairs属性
      const currentRows = (selectedModule as any).rows || (selectedModule as any).pairs || []
      const newRows = currentRows.filter((_: any, i: number) => i !== index)
      // 使用rows属性存储，保持一致性
      handlePropertyUpdate('rows', newRows)
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
        return <ImageModuleProperties module={selectedModule as any} onUpdate={handlePropertyUpdate} />

      case PageModuleType.KEY_VALUE:
        return (
          <div className="space-y-4">
            {/* 键值对列表 */}
            <div className="flex items-center justify-between">
              <Label>{tEditor('键值对列表')}</Label>
              <Button variant="outline" size="sm" onClick={handleAddKeyValue}>
                <Plus className="h-4 w-4 mr-1" />
                {tEditor('添加')}
              </Button>
            </div>
            <div className="space-y-3">
              {((selectedModule as any).rows || (selectedModule as any).pairs || []).map((row: any, index: number) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">
                        {tEditor('键值对')} {index + 1}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveKeyValue(index)}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{tEditor('键/标签')}</Label>
                      <Input
                        value={row.key || ''}
                        onChange={e => handleKeyValueUpdate(index, 'key', e.target.value)}
                        placeholder={tEditor('输入键或标签')}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{tEditor('值/内容')}</Label>
                      <Textarea
                        value={row.value || ''}
                        onChange={e => handleKeyValueUpdate(index, 'value', e.target.value)}
                        placeholder={tEditor('输入值或内容')}
                        className="text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* 样式配置 */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-sm font-medium">{tEditor('样式配置')}</Label>

              {/* 标签列背景色 */}
              <div className="space-y-2">
                <Label htmlFor="label-bg-color">{tEditor('标签列背景色')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="label-bg-color"
                    type="color"
                    value={(selectedModule as any).labelBackgroundColor || '#f3f4f6'}
                    onChange={e => handlePropertyUpdate('labelBackgroundColor', e.target.value)}
                    className="w-16 h-8 p-1 rounded"
                  />
                  <Input
                    value={(selectedModule as any).labelBackgroundColor || '#f3f4f6'}
                    onChange={e => handlePropertyUpdate('labelBackgroundColor', e.target.value)}
                    placeholder="#f3f4f6"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* 文本颜色 */}
              <div className="space-y-2">
                <Label htmlFor="text-color">{tEditor('文本颜色')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={(selectedModule as any).textColor || '#374151'}
                    onChange={e => handlePropertyUpdate('textColor', e.target.value)}
                    className="w-16 h-8 p-1 rounded"
                  />
                  <Input
                    value={(selectedModule as any).textColor || '#374151'}
                    onChange={e => handlePropertyUpdate('textColor', e.target.value)}
                    placeholder="#374151"
                    className="flex-1"
                  />
                </div>
              </div>
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
            {/* 分隔类型选择 */}
            <div className="space-y-2">
              <Label>{tEditor('分隔类型')}</Label>
              <Select
                value={(selectedModule as any).separatorType || 'line'}
                onValueChange={(value: 'line' | 'space') => handlePropertyUpdate('separatorType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">{tEditor('线条分隔')}</SelectItem>
                  <SelectItem value="space">{tEditor('空白间距')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 线条样式配置 - 仅在类型为线条时显示 */}
            {((selectedModule as any).separatorType || 'line') === 'line' && (
              <>
                <div className="space-y-2">
                  <Label>{tEditor('线条样式')}</Label>
                  <Select
                    value={(selectedModule as any).lineStyle || 'solid'}
                    onValueChange={(value: 'solid' | 'dashed' | 'dotted') => handlePropertyUpdate('lineStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">{tEditor('实线')}</SelectItem>
                      <SelectItem value="dashed">{tEditor('虚线')}</SelectItem>
                      <SelectItem value="dotted">{tEditor('点线')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-color">{tEditor('线条颜色')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="line-color"
                      type="color"
                      value={(selectedModule as any).lineColor || '#e5e7eb'}
                      onChange={e => handlePropertyUpdate('lineColor', e.target.value)}
                      className="w-16 h-8 p-1 rounded"
                    />
                    <Input
                      value={(selectedModule as any).lineColor || '#e5e7eb'}
                      onChange={e => handlePropertyUpdate('lineColor', e.target.value)}
                      placeholder="#e5e7eb"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-thickness">{tEditor('线条粗细')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="line-thickness"
                      type="number"
                      min="1"
                      max="10"
                      value={(selectedModule as any).lineThickness || 1}
                      onChange={e => handlePropertyUpdate('lineThickness', parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">px</span>
                  </div>
                </div>
              </>
            )}

            {/* 空白间距配置 - 仅在类型为空白时显示 */}
            {((selectedModule as any).separatorType || 'line') === 'space' && (
              <div className="space-y-2">
                <Label>{tEditor('间距高度')}</Label>
                <Select
                  value={(selectedModule as any).spaceHeight || 'medium'}
                  onValueChange={(value: 'small' | 'medium' | 'large' | 'extra-large') =>
                    handlePropertyUpdate('spaceHeight', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{tEditor('小间距 (20px)')}</SelectItem>
                    <SelectItem value="medium">{tEditor('中间距 (40px)')}</SelectItem>
                    <SelectItem value="large">{tEditor('大间距 (60px)')}</SelectItem>
                    <SelectItem value="extra-large">{tEditor('超大间距 (80px)')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
