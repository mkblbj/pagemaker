'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, CheckCircle, XCircle, ChevronDown, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { PageModule } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'
import { imageService, type CabinetImage, type CabinetFolder } from '@/services/imageService'
import { RCabinetFileTree } from '@/components/ui/rcabinet-file-tree'

// 图片模块配置接口
interface ImageModuleConfig {
  src: string // R-Cabinet图片URL
  alt: string // Alt文本
  alignment: 'left' | 'center' | 'right' // 对齐方式
  link?: {
    type: 'url' | 'email' | 'phone' | 'anchor'
    value: string
  } // 超链接配置
  size: {
    type: 'preset' | 'percentage'
    value: string // 预设名称或百分比值
  } // 尺寸配置
}

interface ImageModuleProps {
  module: PageModule & ImageModuleConfig
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

// 预设尺寸选项
const PRESET_SIZES = [
  { value: 'small', label: '小图 (200px)', width: '200px' },
  { value: 'medium', label: '中图 (400px)', width: '400px' },
  { value: 'large', label: '大图 (600px)', width: '600px' },
  { value: 'full', label: '全宽', width: '100%' }
]

export function ImageModule({
  module,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onStartEdit,
  onEndEdit: _onEndEdit
}: ImageModuleProps) {
  const { tEditor } = useTranslation()
  const [showImageSelector, setShowImageSelector] = useState(false)

  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cabinetImages, setCabinetImages] = useState<CabinetImage[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>('0') // 默认根目录
  const [selectedFolderName, setSelectedFolderName] = useState<string>('根目录')
  const [loadingCabinet, setLoadingCabinet] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'cabinet'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件夹选择
  const handleFolderSelect = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName)
    loadCabinetImages(folderId)
  }

  // 获取R-Cabinet图片列表
  const loadCabinetImages = async (folderId?: string) => {
    const targetFolderId = folderId || selectedFolderId
    setLoadingCabinet(true)
    try {
      const response = await imageService.getCabinetImages({
        page: 1,
        pageSize: 20,
        folderId: targetFolderId
      })
      setCabinetImages(response.images)
    } catch (error) {
      console.error('加载图片列表失败:', error)
    } finally {
      setLoadingCabinet(false)
    }
  }

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
      onUpdate?.({
        src: uploadResult.url,
        alt: module.alt || file.name.replace(/\.[^/.]+$/, '')
      })

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

  // 处理R-Cabinet图片选择
  const handleCabinetImageSelect = (image: CabinetImage) => {
    onUpdate?.({
      src: image.url,
      alt: module.alt || image.filename.replace(/\.[^/.]+$/, '')
    })
    setShowImageSelector(false)
  }

  // 获取图片样式
  const getImageStyles = () => {
    const styles: React.CSSProperties = {}

    // 对齐方式
    const alignment = module.alignment || 'center'

    // 尺寸设置
    const size = module.size || { type: 'preset', value: 'full' }
    if (size.type === 'preset') {
      const preset = PRESET_SIZES.find(p => p.value === size.value)
      if (preset) {
        styles.width = preset.width
      }
    } else if (size.type === 'percentage') {
      styles.width = `${size.value}%`
    }

    styles.maxWidth = '100%'
    styles.height = 'auto'

    return { styles, alignment }
  }

  // 获取链接配置
  const getLinkHref = () => {
    if (!module.link) return undefined

    switch (module.link.type) {
      case 'email':
        return `mailto:${module.link.value}`
      case 'phone':
        return `tel:${module.link.value}`
      case 'anchor':
        return `#${module.link.value}`
      default:
        return module.link.value
    }
  }

  const { styles: imageStyles, alignment } = getImageStyles()
  const linkHref = getLinkHref()

  // 渲染图片内容
  const renderImageContent = () => {
    if (!module.src) {
      return (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => setShowImageSelector(true)}
        >
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">{tEditor('点击选择图片')}</p>
          <p className="text-sm text-gray-400">{tEditor('支持 JPG、PNG、GIF、WebP 格式')}</p>
        </div>
      )
    }

    const imageElement = (
      <img src={module.src} alt={module.alt || ''} style={imageStyles} className="transition-all duration-200" />
    )

    return linkHref ? (
      <a href={linkHref} target="_blank" rel="noopener noreferrer">
        {imageElement}
      </a>
    ) : (
      imageElement
    )
  }

  return (
    <div
      className={cn(
        'group relative border-2 border-transparent rounded-lg p-4 transition-all duration-200',
        isSelected && 'border-blue-500 bg-blue-50/50',
        'hover:border-blue-300 hover:bg-blue-50/30'
      )}
      onClick={onStartEdit}
    >
      {/* 模块标识 */}
      <div className="flex items-center justify-between mb-2 opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-600" />
          <Badge variant="secondary" className="text-xs">
            {tEditor('图片模块')}
          </Badge>
        </div>

        {isEditing && module.src && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={e => {
                e.stopPropagation()
                onUpdate?.({ src: '', alt: '' })
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title={tEditor('删除图片')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 图片内容 */}
      <div className="w-full" style={{ textAlign: alignment }}>
        {renderImageContent()}
      </div>

      {/* 图片选择对话框 */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent
          className={cn(
            'max-w-none',
            activeTab === 'cabinet'
              ? 'w-[90vw] h-[75vh] sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw] xl:max-w-[90vw]'
              : 'w-[600px] h-auto sm:max-w-[600px] md:max-w-[600px] lg:max-w-[600px] xl:max-w-[600px]'
          )}
          style={
            activeTab === 'cabinet'
              ? { maxWidth: '90vw', width: '90vw', height: '75vh' }
              : { maxWidth: '600px', width: '600px', height: 'auto' }
          }
        >
          <DialogHeader>
            <DialogTitle>{tEditor('选择图片')}</DialogTitle>
            <DialogDescription>{tEditor('从本地上传新图片或从R-Cabinet中选择已有图片')}</DialogDescription>
          </DialogHeader>

          <div className="w-full">
            <div className="grid w-full grid-cols-2 border-b">
              <button
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                onClick={() => setActiveTab('upload')}
              >
                {tEditor('上传新图片')}
              </button>
              <button
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'cabinet'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                onClick={() => {
                  setActiveTab('cabinet')
                  // 加载当前选中文件夹的图片
                  loadCabinetImages(selectedFolderId)
                }}
              >
                {tEditor('从R-Cabinet选择')}
              </button>
            </div>

            {activeTab === 'upload' && (
              <div className="space-y-4 mt-4">
                {/* 上传状态提示 */}
                {uploadStatus === 'error' && uploadError && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{uploadError}</AlertDescription>
                  </Alert>
                )}

                {uploadStatus === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{tEditor('图片上传成功！')}</AlertDescription>
                  </Alert>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />

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
                </div>
              </div>
            )}

            {activeTab === 'cabinet' && (
              <div className="flex h-[500px] mt-4 border rounded-lg overflow-hidden">
                {/* 左侧文件夹树 */}
                <div className="w-80 border-r">
                  <RCabinetFileTree
                    onFolderSelect={handleFolderSelect}
                    selectedFolderId={selectedFolderId}
                    className="h-full"
                  />
                </div>

                {/* 右侧图片网格 */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* 当前文件夹信息 */}
                  <div className="flex-shrink-0 bg-white border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{selectedFolderName}</span>
                        {cabinetImages.length > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {cabinetImages.length} {tEditor('个图片')}
                          </span>
                        )}
                      </div>
                      {loadingCabinet && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
                          {tEditor('加载中...')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 图片网格区域 */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {loadingCabinet ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-blue-500 animate-spin mx-auto mb-2" />
                          <p className="text-gray-500">{tEditor('加载图片中...')}</p>
                        </div>
                      </div>
                    ) : cabinetImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <ImageIcon className="h-16 w-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">{tEditor('该文件夹中没有图片')}</p>
                        <p className="text-sm text-gray-400">{tEditor('请选择其他文件夹或上传新图片')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-3">
                        {cabinetImages.map(image => (
                          <div
                            key={image.id}
                            className="group cursor-pointer border rounded-lg p-2 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                            onClick={() => handleCabinetImageSelect(image)}
                          >
                            <div className="aspect-square overflow-hidden rounded-md mb-2">
                              <img
                                src={image.url}
                                alt={image.filename}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <div className="text-xs text-gray-600 truncate mb-1" title={image.filename}>
                              {image.filename}
                            </div>
                            <div className="text-xs text-gray-500">
                              {image.width}×{image.height}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
