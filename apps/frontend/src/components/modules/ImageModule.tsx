'use client'

import { useState, useEffect, useRef } from 'react'
import { Image as ImageIcon, Upload, Link, Settings, Folder, CheckCircle, XCircle, ChevronDown, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { PageModule } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'
import { imageService, type CabinetImage, type CabinetFolder } from '@/services/imageService'

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
  onEndEdit
}: ImageModuleProps) {
  const { tEditor } = useTranslation()
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cabinetImages, setCabinetImages] = useState<CabinetImage[]>([])
  const [cabinetFolders, setCabinetFolders] = useState<CabinetFolder[]>([])
  const [folderTree, setFolderTree] = useState<CabinetFolder[]>([]) // 树形结构
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['0'])) // 展开的文件夹ID
  const [selectedFolderId, setSelectedFolderId] = useState<string>('0') // 默认根目录
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>('') // 文件夹搜索关键词
  const [loadingCabinet, setLoadingCabinet] = useState(false)
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'cabinet'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 构建文件夹树形结构
  const buildFolderTree = (folders: CabinetFolder[]): CabinetFolder[] => {
    const folderMap = new Map<string, CabinetFolder>()
    const rootFolders: CabinetFolder[] = []

    // 首先创建所有文件夹的映射
    folders.forEach(folder => {
      folderMap.set(folder.path, { ...folder, children: [] })
    })

    // 构建树形结构
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.path)!
      
      if (folder.node === 1 || !folder.parentPath || folder.parentPath === '') {
        // 根级文件夹（node=1 或者没有父路径）
        rootFolders.push(folderWithChildren)
      } else {
        // 子文件夹，找到父文件夹
        const parent = folderMap.get(folder.parentPath)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(folderWithChildren)
        } else {
          // 如果找不到父文件夹，作为根级处理
          rootFolders.push(folderWithChildren)
        }
      }
    })

    // 按名称排序
    const sortFolders = (folders: CabinetFolder[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name))
      folders.forEach(folder => {
        if (folder.children && folder.children.length > 0) {
          sortFolders(folder.children)
        }
      })
    }
    sortFolders(rootFolders)

    return rootFolders
  }

  // 过滤文件夹树（支持搜索）
  const filterFolderTree = (folders: CabinetFolder[], searchTerm: string): CabinetFolder[] => {
    if (!searchTerm.trim()) {
      return folders
    }

    const filtered: CabinetFolder[] = []
    
    for (const folder of folders) {
      const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase())
      const filteredChildren = folder.children ? filterFolderTree(folder.children, searchTerm) : []
      
      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...folder,
          children: filteredChildren
        })
        
        // 如果有匹配的子文件夹，自动展开当前文件夹
        if (filteredChildren.length > 0) {
          setExpandedFolders(prev => new Set([...prev, folder.id]))
        }
      }
    }
    
    return filtered
  }

  // 切换文件夹展开/收起状态
  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  // 自动展开到指定文件夹的路径
  const expandToFolder = (targetFolderId: string) => {
    const findFolderPath = (folders: CabinetFolder[], targetId: string, path: string[] = []): string[] | null => {
      for (const folder of folders) {
        const currentPath = [...path, folder.id]
        if (folder.id === targetId) {
          return currentPath
        }
        if (folder.children && folder.children.length > 0) {
          const childPath = findFolderPath(folder.children, targetId, currentPath)
          if (childPath) {
            return childPath
          }
        }
      }
      return null
    }

    const pathToTarget = findFolderPath(folderTree, targetFolderId)
    if (pathToTarget) {
      setExpandedFolders(prev => {
        const newSet = new Set(prev)
        // 展开路径上的所有父文件夹
        pathToTarget.slice(0, -1).forEach(folderId => {
          newSet.add(folderId)
        })
        return newSet
      })
    }
  }

  // 获取R-Cabinet文件夹列表
  const loadCabinetFolders = async () => {
    setLoadingFolders(true)
    try {
      const response = await imageService.getCabinetFolders({ page: 1, pageSize: 100 })
      setCabinetFolders(response.folders)
      // 构建树形结构
      const tree = buildFolderTree(response.folders)
      setFolderTree(tree)
    } catch (error) {
      console.error('加载文件夹列表失败:', error)
    } finally {
      setLoadingFolders(false)
    }
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
      const uploadResult = await imageService.uploadImage(file, (progress) => {
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
    const size = module.size || { type: 'preset', value: 'medium' }
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
      <img
        src={module.src}
        alt={module.alt || ''}
        style={imageStyles}
        className="transition-all duration-200"
      />
    )

    return linkHref ? (
      <a href={linkHref} target="_blank" rel="noopener noreferrer">
        {imageElement}
      </a>
    ) : imageElement
  }

  // 递归渲染文件夹树
  const renderFolderTree = (folders: CabinetFolder[], level: number = 0): React.ReactNode => {
    return folders.map((folder) => {
      const isExpanded = expandedFolders.has(folder.id)
      const hasChildren = folder.children && folder.children.length > 0
      const isSelected = selectedFolderId === folder.id
      
      return (
        <div key={folder.id} className="select-none">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm hover:bg-gray-100 transition-colors",
              isSelected && "bg-blue-100 text-blue-700 hover:bg-blue-100"
            )}
            style={{ paddingLeft: `${8 + level * 16}px` }}
          >
            {/* 展开/收起按钮 */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolderExpansion(folder.id)
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-gray-500 transition-transform",
                    !isExpanded && "-rotate-90"
                  )}
                />
              </button>
            ) : (
              <div className="w-4" />
            )}
            
            {/* 文件夹图标和信息 */}
            <div
              className="flex items-center gap-2 flex-1 min-w-0"
              onClick={() => {
                setSelectedFolderId(folder.id)
                loadCabinetImages(folder.id)
                // 自动展开到选中的文件夹
                expandToFolder(folder.id)
              }}
            >
              <Folder className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{folder.name}</div>
                <div className="text-xs text-gray-500">
                  {folder.fileCount} {tEditor('个文件')}
                </div>
              </div>
            </div>
          </div>
          
          {/* 子文件夹 */}
          {hasChildren && isExpanded && (
            <div className="ml-2">
              {renderFolderTree(folder.children!, level + 1)}
            </div>
          )}
        </div>
      )
    })
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
      <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-600" />
          <Badge variant="secondary" className="text-xs">
            {tEditor('图片模块')}
          </Badge>
        </div>
        
        {isEditing && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setShowImageSelector(true)
              }}
              className="h-8 w-8 p-0"
              title={tEditor('选择图片')}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setShowPropertiesPanel(true)
              }}
              className="h-8 w-8 p-0"
              title={tEditor('图片属性')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 图片内容 */}
      <div 
        className="w-full"
        style={{ textAlign: alignment }}
      >
        {renderImageContent()}
      </div>

      {/* 图片选择对话框 */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{tEditor('选择图片')}</DialogTitle>
          </DialogHeader>
          
          <div className="w-full">
            <div className="grid w-full grid-cols-2 border-b">
              <button
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'upload' 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
                onClick={() => setActiveTab('upload')}
              >
                {tEditor('上传新图片')}
              </button>
              <button
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'cabinet' 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
                onClick={() => {
                  setActiveTab('cabinet')
                  // 先加载文件夹列表
                  loadCabinetFolders()
                  // 如果当前没有选择文件夹或者没有图片，加载根目录的图片
                  if (!selectedFolderId || selectedFolderId === '0' || cabinetImages.length === 0) {
                    loadCabinetImages('0')
                  } else {
                    // 否则加载当前选中文件夹的图片
                    loadCabinetImages(selectedFolderId)
                  }
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
                    <AlertDescription className="text-red-800">
                      {uploadError}
                    </AlertDescription>
                  </Alert>
                )}
                
                {uploadStatus === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {tEditor('图片上传成功！')}
                    </AlertDescription>
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
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadStatus === 'uploading'}
                  >
                    {uploadStatus === 'uploading' ? tEditor('上传中...') : tEditor('选择文件')}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    {tEditor('支持 JPG、PNG、GIF、WebP 格式，文件大小不超过5MB')}
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'cabinet' && (
              <div className="flex h-96 mt-4 border rounded-lg overflow-hidden">
                {/* 左侧文件夹树 */}
                <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{tEditor('文件夹')}</span>
                      {loadingFolders && (
                        <span className="text-xs text-gray-500">{tEditor('加载中...')}</span>
                      )}
                    </div>
                    
                    {/* 文件夹搜索框 */}
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder={tEditor('搜索文件夹...')}
                        value={folderSearchTerm}
                        onChange={(e) => setFolderSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {folderSearchTerm && (
                        <button
                          onClick={() => setFolderSearchTerm('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                          title={tEditor('清除搜索')}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* 根目录 */}
                    {!folderSearchTerm.trim() && (
                      <div
                        className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm",
                          selectedFolderId === '0' 
                            ? "bg-blue-100 text-blue-700" 
                            : "hover:bg-gray-100 text-gray-700"
                        )}
                        onClick={() => {
                          setSelectedFolderId('0')
                          loadCabinetImages('0')
                        }}
                      >
                        <Folder className="h-4 w-4" />
                        <span>{tEditor('根目录')}</span>
                      </div>
                    )}
                    
                    {/* 文件夹树 */}
                    <div className="mt-1">
                      {renderFolderTree(filterFolderTree(folderTree, folderSearchTerm))}
                    </div>
                  </div>
                </div>

                {/* 右侧图片网格 */}
                <div className="flex-1 overflow-y-auto">
                  {/* 当前文件夹信息 */}
                  <div className="sticky top-0 bg-white border-b px-3 py-2 text-sm text-gray-600">
                    {selectedFolderId === '0' ? (
                      <span>{tEditor('根目录')}</span>
                    ) : (
                      <span>
                        {cabinetFolders.find(f => f.id === selectedFolderId)?.name || tEditor('未知文件夹')}
                        {cabinetFolders.find(f => f.id === selectedFolderId)?.fileCount !== undefined && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({cabinetFolders.find(f => f.id === selectedFolderId)?.fileCount} {tEditor('个文件')})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  
                  {loadingCabinet ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">{tEditor('加载图片中...')}</p>
                    </div>
                  ) : cabinetImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <ImageIcon className="h-12 w-12 mb-2 text-gray-300" />
                      <p>{tEditor('该文件夹中没有图片')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 p-2">
                      {cabinetImages.map((image) => (
                        <div
                          key={image.id}
                          className="cursor-pointer border rounded p-1 hover:border-blue-500"
                          onClick={() => handleCabinetImageSelect(image)}
                        >
                          <img
                            src={image.url}
                            alt={image.filename}
                            style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                          />
                          <div className="text-xs text-gray-600 mt-1 truncate">
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
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 属性配置对话框 */}
      <Dialog open={showPropertiesPanel} onOpenChange={setShowPropertiesPanel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tEditor('图片属性')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Alt文本 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {tEditor('Alt文本')}
              </label>
              <Input
                value={module.alt || ''}
                onChange={(e) => onUpdate?.({ alt: e.target.value })}
                placeholder={tEditor('图片描述文本')}
              />
            </div>

            {/* 对齐方式 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {tEditor('对齐方式')}
              </label>
              <Select
                value={module.alignment || 'center'}
                onValueChange={(value: 'left' | 'center' | 'right') => 
                  onUpdate?.({ alignment: value })
                }
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
            <div>
              <label className="text-sm font-medium mb-2 block">
                {tEditor('图片尺寸')}
              </label>
              <div className="space-y-2">
                <Select
                  value={module.size?.type || 'preset'}
                  onValueChange={(value: 'preset' | 'percentage') => 
                    onUpdate?.({ 
                      size: { 
                        type: value, 
                        value: value === 'preset' ? 'medium' : '100' 
                      } 
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
                    onValueChange={(value) => 
                      onUpdate?.({ 
                        size: { type: 'preset', value } 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_SIZES.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={module.size?.value || '100'}
                      onChange={(e) => 
                        onUpdate?.({ 
                          size: { type: 'percentage', value: e.target.value } 
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                )}
              </div>
            </div>

            {/* 链接设置 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {tEditor('超链接')}
              </label>
              <div className="space-y-2">
                <Select
                  value={module.link?.type || 'none'}
                  onValueChange={(value: 'url' | 'email' | 'phone' | 'anchor' | 'none') => 
                    value !== 'none' ? 
                      onUpdate?.({ link: { type: value, value: '' } }) :
                      onUpdate?.({ link: undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tEditor('选择链接类型')} />
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
                    onChange={(e) => 
                      onUpdate?.({ 
                        link: { ...module.link, value: e.target.value } 
                      })
                    }
                    placeholder={
                      module.link.type === 'url' ? 'https://example.com' :
                      module.link.type === 'email' ? 'example@email.com' :
                      module.link.type === 'phone' ? '+86 138 0013 8000' :
                      'section-name'
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 