'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/contexts/I18nContext'
import { imageService, type CabinetImage } from '@/services/imageService'
import { preloadService } from '@/services/preloadService'
import { RCabinetFileTree } from '@/components/ui/rcabinet-file-tree'
import { CheckCircle, Image as ImageIcon, XCircle, RefreshCw, ChevronRight, ArrowUpDown, Search, X } from 'lucide-react'

type ActiveTab = 'upload' | 'cabinet'

export interface ImageSelectorResult {
  url: string
  filename: string
  width?: number
  height?: number
}

export interface ImageSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (result: ImageSelectorResult) => void
  initialTab?: ActiveTab
  pageId?: string  // 页面ID，用于获取对应店铺的配置
}

export default function ImageSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  initialTab = 'cabinet',
  pageId
}: ImageSelectorDialogProps) {
  const { tEditor } = useTranslation()

  // 工具函数：生成带页面ID的存储键
  const getStorageKey = useCallback((key: string) => pageId ? `${key}_${pageId}` : key, [pageId])

  // tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab)

  // 每次打开时重置到指定初始标签，并从 localStorage 恢复最新的文件夹状态
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
      
      // 每次打开对话框时，都从 localStorage 恢复最新的文件夹状态
      if (pageId && typeof window !== 'undefined') {
        const savedFolderId = window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_id')) || '0'
        const savedFolderName = window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_name')) || '根目录'
        const savedFolderPath = window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_path')) || ''
        
        console.log('[ImageSelectorDialog] 对话框打开，恢复文件夹状态:', { savedFolderId, savedFolderName, savedFolderPath })
        
        setSelectedFolderId(savedFolderId)
        setSelectedFolderName(savedFolderName)
        setSelectedFolderPath(savedFolderPath)
      }
    }
  }, [open, initialTab, pageId, getStorageKey])

  // 当 pageId 变化时，重新加载对应页面的缓存状态，并预热缓存
  useEffect(() => {
    if (pageId && typeof window !== 'undefined') {
      console.log('[ImageSelectorDialog] pageId 变化，重新加载缓存状态', pageId)
      
      const savedFolderId = window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_id')) || '0'
      const savedFolderName = window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_name')) || '根目录'
      const savedFolderPath = window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_path')) || ''
      
      console.log('[ImageSelectorDialog] 恢复的文件夹状态:', { savedFolderId, savedFolderName, savedFolderPath })
      
      setSelectedFolderId(savedFolderId)
      setSelectedFolderName(savedFolderName)
      setSelectedFolderPath(savedFolderPath)
      
      // 如果对话框是打开的且在 cabinet 标签，重新加载图片
      if (open && activeTab === 'cabinet') {
        console.log('[ImageSelectorDialog] 对话框已打开，重新加载图片')
        void loadCabinetImages(savedFolderId)
      } else {
        // 对话框未打开时，后台预热缓存
        preloadService.warmupCache(pageId)
      }
    }
  }, [pageId])

  // upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void handleFileUpload(file)
  }

  const handleFileUpload = async (file: File) => {
    const validation = imageService.validateImageFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || '文件验证失败')
      setUploadStatus('error')
      return
    }

    setUploadStatus('uploading')
    setUploadProgress(0)
    setUploadError(null)

    try {
      const uploadResult = await imageService.uploadImage(file, progress => setUploadProgress(progress), pageId)
      setUploadStatus('success')
      // 返回结果并关闭
      onSelect({ url: uploadResult.url, filename: file.name })
      setTimeout(() => {
        onOpenChange(false)
        setUploadStatus('idle')
        setUploadProgress(0)
      }, 300)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '图片上传失败，请重试')
      setUploadStatus('error')
    }
  }

  // cabinet - 从localStorage恢复上次选择的文件夹（按页面ID区分缓存）
  const [selectedFolderId, setSelectedFolderId] = useState<string>(() => {
    if (typeof window !== 'undefined' && pageId) {
      return window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_id')) || '0'
    }
    return '0'
  })
  const [selectedFolderName, setSelectedFolderName] = useState<string>(() => {
    if (typeof window !== 'undefined' && pageId) {
      return window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_name')) || '根目录'
    }
    return '根目录'
  })
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>(() => {
    if (typeof window !== 'undefined' && pageId) {
      return window.localStorage.getItem(getStorageKey('rcabinet_selected_folder_path')) || ''
    }
    return ''
  })
  const [cabinetImages, setCabinetImages] = useState<CabinetImage[]>([])
  const [loadingCabinet, setLoadingCabinet] = useState(false)
  const [imageSearchTerm, setImageSearchTerm] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [virtual, setVirtual] = useState(true)
  const [imageSortMode, setImageSortMode] = useState<
    'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc'
  >(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('rcabinet_image_sort_mode') as any
      if (['name-asc', 'name-desc', 'date-asc', 'date-desc', 'size-asc', 'size-desc'].includes(saved)) return saved
    }
    return 'name-asc'
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const itemHeight = 140 // 每行高度估算
  const itemsPerRow = 8
  const bufferRows = 4

  const startRow = useMemo(() => Math.max(Math.floor(scrollTop / itemHeight) - bufferRows, 0), [scrollTop])
  const totalRows = useMemo(() => Math.ceil((cabinetImages.length || 0) / itemsPerRow), [cabinetImages.length])
  const endRow = useMemo(() => {
    if (!containerRef.current) return totalRows
    const rowsVisible = Math.ceil(containerRef.current.clientHeight / itemHeight) + bufferRows
    return Math.min(startRow + rowsVisible, totalRows)
  }, [startRow, totalRows])
  const startIndex = useMemo(() => startRow * itemsPerRow, [startRow])
  const endIndex = useMemo(() => Math.min(endRow * itemsPerRow, cabinetImages.length), [endRow, cabinetImages.length])

  const handleScroll = () => {
    if (!containerRef.current) return
    setScrollTop(containerRef.current.scrollTop)
  }

  const handleFolderSelect = (folderId: string, folderName: string, folderPath?: string) => {
    // 清除搜索词
    setImageSearchTerm('')
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName)
    setSelectedFolderPath(folderPath || '')
    // 保存选择状态到localStorage（按页面ID区分）
    if (typeof window !== 'undefined' && pageId) {
      window.localStorage.setItem(getStorageKey('rcabinet_selected_folder_id'), folderId)
      window.localStorage.setItem(getStorageKey('rcabinet_selected_folder_name'), folderName)
      window.localStorage.setItem(getStorageKey('rcabinet_selected_folder_path'), folderPath || '')
    }
    void loadCabinetImages(folderId)
  }

  // 构建路径面包屑
  const buildPathBreadcrumb = () => {
    if (selectedFolderId === '0') {
      return [{ name: tEditor('根目录'), path: '', id: '0' }]
    }

    const pathParts = selectedFolderPath.split('/').filter(part => part.length > 0)
    const breadcrumbs = [{ name: tEditor('根目录'), path: '', id: '0' }]

    let currentPath = ''
    for (let i = 0; i < pathParts.length; i++) {
      currentPath += (i === 0 ? '' : '/') + pathParts[i]
      const isLast = i === pathParts.length - 1
      breadcrumbs.push({
        name: isLast ? selectedFolderName : pathParts[i],
        path: currentPath,
        id: isLast ? selectedFolderId : `path_${currentPath}`
      })
    }

    return breadcrumbs
  }

  const loadCabinetImages = async (folderId?: string, force: boolean = false, searchTerm?: string) => {
    const targetFolderId = folderId || selectedFolderId
    const isSearchMode = !!(searchTerm && searchTerm.trim())
    setLoadingCabinet(true)
    try {
      // 后端已经处理了分页和缓存，前端只需请求第一页即可获取所有数据
      const resp = await imageService.getCabinetImages({
        page: 1,
        pageSize: 1000, // 大页面数，后端会返回所有数据
        folderId: isSearchMode ? undefined : targetFolderId, // 搜索模式下不限制文件夹
        sortMode: imageSortMode,
        pageId,  // 传递 pageId 以获取对应店铺的配置
        force,   // 强制刷新时跳过缓存
        search: isSearchMode ? searchTerm.trim() : undefined // 搜索关键词
      })
      
      // 如果还有更多数据，继续获取
      const allImages = [...(resp.images || [])]
      if (resp.total && resp.total > allImages.length) {
        const remainingPages = Math.ceil((resp.total - allImages.length) / 1000)
        for (let i = 2; i <= remainingPages + 1; i++) {
          const pageResp = await imageService.getCabinetImages({
            page: i,
            pageSize: 1000,
            folderId: isSearchMode ? undefined : targetFolderId,
            sortMode: imageSortMode,
            pageId,
            search: isSearchMode ? searchTerm.trim() : undefined
            // 后续页不需要 force，因为第一页已经刷新了缓存
          })
          allImages.push(...(pageResp.images || []))
          if (!pageResp.images || pageResp.images.length === 0) break
        }
      }
      
      setCabinetImages(allImages)
    } catch (error) {
      console.error('[ImageSelectorDialog] 加载图片失败:', error)
      // 忽略，界面已有空态
    } finally {
      setLoadingCabinet(false)
    }
  }

  // 处理图片搜索（带防抖）
  const handleImageSearch = (term: string) => {
    setImageSearchTerm(term)
    
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // 设置新的防抖定时器
    searchTimeoutRef.current = setTimeout(() => {
      if (term.trim()) {
        void loadCabinetImages(undefined, false, term)
      } else {
        // 清空搜索时，恢复显示当前文件夹的图片
        void loadCabinetImages(selectedFolderId)
      }
    }, 300)
  }

  // 清除搜索
  const clearImageSearch = () => {
    setImageSearchTerm('')
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    void loadCabinetImages(selectedFolderId)
  }

  // 当对话框打开且在 cabinet 标签时，加载选中文件夹的图片
  useEffect(() => {
    if (open && activeTab === 'cabinet' && selectedFolderId) {
      console.log('[ImageSelectorDialog] 加载文件夹图片:', selectedFolderId)
      void loadCabinetImages(selectedFolderId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, selectedFolderId])

  // 图片排序模式变化时重新加载图片
  useEffect(() => {
    if (activeTab === 'cabinet' && selectedFolderId && typeof window !== 'undefined') {
      void loadCabinetImages(selectedFolderId)
    }
    // 保存排序模式到localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('rcabinet_image_sort_mode', imageSortMode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSortMode])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-none p-0 gap-0 flex flex-col',
          activeTab === 'cabinet'
            ? 'w-[90vw] h-[75vh] sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw] xl:max-w-[90vw]'
            : 'w-[600px] h-auto sm:max-w-[600px] md:max-w-[600px] lg:max-w-[600px] xl:max-w-[600px]'
        )}
        style={
          activeTab === 'cabinet'
            ? { maxWidth: '90vw', width: '90vw', height: '75vh' }
            : { maxWidth: '600px', width: '600px' }
        }
      >
        <DialogHeader className="pb-2 pt-6 px-6">
          <DialogTitle className="text-base">{tEditor('选择图片')}</DialogTitle>
        </DialogHeader>

        <div className="w-full flex-1 flex flex-col overflow-hidden px-6 pb-6">
          <div className="grid w-full grid-cols-2 border-b">
            <button
              className={cn(
                'px-3 py-1.5 text-sm font-medium border-b-2 transition-colors',
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
                'px-3 py-1.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'cabinet'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
              onClick={() => {
                setActiveTab('cabinet')
                void loadCabinetImages(selectedFolderId)
              }}
            >
              {tEditor('从R-Cabinet选择')}
            </button>
          </div>

          {activeTab === 'upload' && (
            <div className="space-y-4 mt-2">
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
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
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
            <div className="flex flex-1 mt-2 border rounded-lg overflow-hidden">
              <div className="w-80 border-r">
                <RCabinetFileTree
                  onFolderSelect={handleFolderSelect}
                  selectedFolderId={selectedFolderId}
                  className="h-full"
                  pageId={pageId}
                />
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-shrink-0 bg-white border-b px-3 py-2 space-y-2">
                  {/* 搜索框 */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={tEditor('搜索文件名')}
                      value={imageSearchTerm}
                      onChange={e => handleImageSearch(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {imageSearchTerm && (
                      <button
                        onClick={clearImageSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 transition-colors"
                        title={tEditor('清除搜索')}
                      >
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* 路径面包屑或搜索结果标识 */}
                      <div className="flex items-center gap-1 text-xs text-gray-600 flex-1 min-w-0">
                        {imageSearchTerm.trim() ? (
                          <div className="flex items-center gap-1.5">
                            <Search className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-blue-600">{tEditor('搜索结果')}: "{imageSearchTerm}"</span>
                          </div>
                        ) : (
                          buildPathBreadcrumb().map((breadcrumb, index, array) => (
                            <div key={breadcrumb.id} className="flex items-center gap-1 flex-shrink-0">
                              <span
                                className={cn(
                                  'truncate max-w-[120px]',
                                  index === array.length - 1
                                    ? 'font-medium text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                                )}
                                title={breadcrumb.name}
                              >
                                {breadcrumb.name}
                              </span>
                              {index < array.length - 1 && (
                                <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      {cabinetImages.length > 0 && (
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                          {cabinetImages.length} {tEditor('个图片')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {loadingCabinet && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
                          {tEditor('加载中...')}
                        </div>
                      )}
                      {/* 图片排序选择 */}
                      <div className="relative">
                        <select
                          value={imageSortMode}
                          onChange={e => setImageSortMode(e.target.value as any)}
                          className="appearance-none bg-white border rounded px-2 py-0.5 pr-6 text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="name-asc">{tEditor('文件名 A-Z')}</option>
                          <option value="name-desc">{tEditor('文件名 Z-A')}</option>
                          <option value="date-desc">{tEditor('上传时间 新-旧')}</option>
                          <option value="date-asc">{tEditor('上传时间 旧-新')}</option>
                          <option value="size-desc">{tEditor('文件大小 大-小')}</option>
                          <option value="size-asc">{tEditor('文件大小 小-大')}</option>
                        </select>
                        <ArrowUpDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-gray-400 pointer-events-none" />
                      </div>
                      <button
                        className="inline-flex items-center justify-center h-6 w-6 border rounded hover:bg-gray-50"
                        title={tEditor('刷新图片')}
                        onClick={() => loadCabinetImages(selectedFolderId, true)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  ref={containerRef}
                  onScroll={virtual ? handleScroll : undefined}
                  className="flex-1 overflow-y-auto p-2"
                >
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
                    <div>
                      {virtual ? (
                        <div
                          style={{
                            paddingTop: startRow * itemHeight,
                            paddingBottom: (totalRows - endRow) * itemHeight
                          }}
                        >
                          <div className="grid grid-cols-8 gap-2">
                            {cabinetImages.slice(startIndex, endIndex).map(image => (
                              <div
                                key={image.id}
                                className="group cursor-pointer border rounded-lg p-1.5 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                                onClick={() => {
                                  onSelect({
                                    url: image.url,
                                    filename: image.filename,
                                    width: image.width,
                                    height: image.height
                                  })
                                  onOpenChange(false)
                                }}
                              >
                                <div className="aspect-square overflow-hidden rounded mb-1.5">
                                  <img
                                    src={image.url}
                                    alt={image.filename}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                </div>
                                <div className="text-[11px] leading-tight font-medium text-gray-700 truncate mb-0.5" title={image.filename}>
                                  {image.filename}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {image.width}×{image.height}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-8 gap-2">
                          {cabinetImages.map(image => (
                            <div
                              key={image.id}
                              className="group cursor-pointer border rounded-lg p-1.5 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                              onClick={() => {
                                onSelect({
                                  url: image.url,
                                  filename: image.filename,
                                  width: image.width,
                                  height: image.height
                                })
                                onOpenChange(false)
                              }}
                            >
                              <div className="aspect-square overflow-hidden rounded mb-1.5">
                                <img
                                  src={image.url}
                                  alt={image.filename}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              <div className="text-[11px] leading-tight font-medium text-gray-700 truncate mb-0.5" title={image.filename}>
                                {image.filename}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {image.width}×{image.height}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 border-t px-3 py-1.5 flex items-center gap-3 text-[10px] text-gray-600">
                  <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                    <input type="checkbox" checked={virtual} onChange={e => setVirtual(e.target.checked)} className="h-3 w-3" />
                    启用虚拟滚动
                  </label>
                  <span>共 {cabinetImages.length} 张</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
