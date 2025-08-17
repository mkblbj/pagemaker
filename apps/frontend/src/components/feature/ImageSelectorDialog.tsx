'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/contexts/I18nContext'
import { imageService, type CabinetImage } from '@/services/imageService'
import { RCabinetFileTree } from '@/components/ui/rcabinet-file-tree'
import { CheckCircle, Image as ImageIcon, XCircle, RefreshCw, ChevronRight, ArrowUpDown } from 'lucide-react'

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
}

export default function ImageSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  initialTab = 'cabinet'
}: ImageSelectorDialogProps) {
  const { tEditor } = useTranslation()

  // tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab)

  // 每次打开时重置到指定初始标签
  useEffect(() => {
    if (open) setActiveTab(initialTab)
    // 重新打开时，保持已选文件夹图片立即可见
    if (open && activeTab === 'cabinet' && selectedFolderId) {
      void loadCabinetImages(selectedFolderId)
    }
  }, [open, initialTab])

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
      const uploadResult = await imageService.uploadImage(file, progress => setUploadProgress(progress))
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

  // cabinet - 从localStorage恢复上次选择的文件夹
  const [selectedFolderId, setSelectedFolderId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('rcabinet_selected_folder_id') || '0'
    }
    return '0'
  })
  const [selectedFolderName, setSelectedFolderName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('rcabinet_selected_folder_name') || '根目录'
    }
    return '根目录'
  })
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('rcabinet_selected_folder_path') || ''
    }
    return ''
  })
  const [cabinetImages, setCabinetImages] = useState<CabinetImage[]>([])
  const [loadingCabinet, setLoadingCabinet] = useState(false)
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
  const itemHeight = 176 // 每行高度估算
  const itemsPerRow = 5
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
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName)
    setSelectedFolderPath(folderPath || '')
    // 保存选择状态到localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('rcabinet_selected_folder_id', folderId)
      window.localStorage.setItem('rcabinet_selected_folder_name', folderName)
      window.localStorage.setItem('rcabinet_selected_folder_path', folderPath || '')
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

  const loadCabinetImages = async (folderId?: string) => {
    const targetFolderId = folderId || selectedFolderId
    setLoadingCabinet(true)
    try {
      // 分页抓取所有图片，避免只显示第一页
      const pageSize = 100
      let page = 1
      let allImages: CabinetImage[] = []
      while (true) {
        const resp = await imageService.getCabinetImages({
          page,
          pageSize,
          folderId: targetFolderId,
          sortMode: imageSortMode
        })
        allImages = allImages.concat(resp.images || [])
        const fetched = page * pageSize
        if (resp.total !== undefined) {
          if (fetched >= resp.total) break
        }
        if (!resp.images || resp.images.length === 0) break
        page += 1
      }
      setCabinetImages(allImages)
    } catch (error) {
      // 忽略，界面已有空态
    } finally {
      setLoadingCabinet(false)
    }
  }

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
          'max-w-none',
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
                void loadCabinetImages(selectedFolderId)
              }}
            >
              {tEditor('从R-Cabinet选择')}
            </button>
          </div>

          {activeTab === 'upload' && (
            <div className="space-y-4 mt-4">
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
            <div className="flex h-[500px] mt-4 border rounded-lg overflow-hidden">
              <div className="w-80 border-r">
                <RCabinetFileTree
                  onFolderSelect={handleFolderSelect}
                  selectedFolderId={selectedFolderId}
                  className="h-full"
                />
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-shrink-0 bg-white border-b px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* 路径面包屑 */}
                      <div className="flex items-center gap-1 text-sm text-gray-600 flex-1 min-w-0">
                        {buildPathBreadcrumb().map((breadcrumb, index, array) => (
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
                        ))}
                      </div>
                      {cabinetImages.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                          {cabinetImages.length} {tEditor('个图片')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingCabinet && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
                          {tEditor('加载中...')}
                        </div>
                      )}
                      {/* 图片排序选择 */}
                      <div className="relative">
                        <select
                          value={imageSortMode}
                          onChange={e => setImageSortMode(e.target.value as any)}
                          className="appearance-none bg-white border rounded px-3 py-1 pr-8 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="name-asc">{tEditor('文件名 A-Z')}</option>
                          <option value="name-desc">{tEditor('文件名 Z-A')}</option>
                          <option value="date-desc">{tEditor('上传时间 新-旧')}</option>
                          <option value="date-asc">{tEditor('上传时间 旧-新')}</option>
                          <option value="size-desc">{tEditor('文件大小 大-小')}</option>
                          <option value="size-asc">{tEditor('文件大小 小-大')}</option>
                        </select>
                        <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                      <button
                        className="inline-flex items-center justify-center h-8 w-8 border rounded hover:bg-gray-50"
                        title={tEditor('刷新图片')}
                        onClick={() => loadCabinetImages(selectedFolderId)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  ref={containerRef}
                  onScroll={virtual ? handleScroll : undefined}
                  className="flex-1 overflow-y-auto p-4"
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
                          <div className="grid grid-cols-5 gap-3">
                            {cabinetImages.slice(startIndex, endIndex).map(image => (
                              <div
                                key={image.id}
                                className="group cursor-pointer border rounded-lg p-2 hover:border-blue-500 hover:shadow-md transition-all duration-200"
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
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-3">
                          {cabinetImages.map(image => (
                            <div
                              key={image.id}
                              className="group cursor-pointer border rounded-lg p-2 hover:border-blue-500 hover:shadow-md transition-all duration-200"
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
                  )}
                </div>
                <div className="flex-shrink-0 border-t px-4 py-2 flex items-center gap-3 text-xs text-gray-600">
                  <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                    <input type="checkbox" checked={virtual} onChange={e => setVirtual(e.target.checked)} />
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
