'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar, Monitor, Smartphone, Store, Copy } from 'lucide-react'
import { pageService } from '@/services/pageService'
import { shopService } from '@/services/shopService'
import { PageTemplateListItem, ShopConfiguration } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'
import { toastManager, ToastContainer } from '@/components/ui/toast'

export default function PagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tCommon, tEditor, tError } = useTranslation()
  
  // URL 参数状态
  const shopIdFromUrl = searchParams.get('shop_id')
  const deviceTypeFromUrl = (searchParams.get('device_type') as 'pc' | 'mobile' | 'all') || 'all'
  const pageFromUrl = parseInt(searchParams.get('page') || '1')

  const [pages, setPages] = useState<PageTemplateListItem[]>([])
  const [shops, setShops] = useState<ShopConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // 筛选状态
  const [selectedShopId, setSelectedShopId] = useState<string>(shopIdFromUrl || '')
  const [selectedDeviceType, setSelectedDeviceType] = useState<'pc' | 'mobile' | 'all'>(deviceTypeFromUrl)
  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  
  // 分页配置
  const pageSize = 20
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.ceil(totalCount / pageSize)

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // 获取店铺列表
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const shopList = await shopService.getAllShopConfigurations()
        setShops(shopList)
        
        // 如果 URL 没有店铺ID，默认选中第一个店铺
        if (!shopIdFromUrl && shopList.length > 0) {
          setSelectedShopId(shopList[0].id)
        }
      } catch (error) {
        console.error('获取店铺列表失败:', error)
        setError(error instanceof Error ? error.message : '获取店铺列表失败')
      }
    }
    
    fetchShops()
  }, [shopIdFromUrl])

  // 更新 URL 参数
  const updateUrlParams = useCallback((shopId: string, deviceType: 'pc' | 'mobile' | 'all', page: number) => {
    const params = new URLSearchParams()
    params.set('shop_id', shopId)
    if (deviceType !== 'all') {
      params.set('device_type', deviceType)
    }
    params.set('page', page.toString())
    router.push(`/pages?${params.toString()}`)
  }, [router])

  // 获取页面列表
  const fetchPages = useCallback(async (shopId: string, deviceType: 'pc' | 'mobile' | 'all', page: number, search?: string) => {
    if (!shopId) return
    
    try {
      setLoading(true)
      setError(null)
      const result = await pageService.getPages({
        shop_id: shopId,
        device_type: deviceType,
        search: search || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize
      })
      setPages(result.pages)
      setTotalCount(result.pagination?.total || 0)
    } catch (error) {
      console.error('获取页面列表失败:', error)
      setError(error instanceof Error ? error.message : '获取页面列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 当筛选条件变化时获取页面
  useEffect(() => {
    if (selectedShopId) {
      fetchPages(selectedShopId, selectedDeviceType, currentPage, debouncedSearchTerm)
    }
  }, [selectedShopId, selectedDeviceType, currentPage, debouncedSearchTerm, fetchPages])

  // 处理店铺切换
  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId)
    setCurrentPage(1)
    updateUrlParams(shopId, selectedDeviceType, 1)
  }

  // 处理设备类型切换
  const handleDeviceTypeChange = (deviceType: 'pc' | 'mobile' | 'all') => {
    setSelectedDeviceType(deviceType)
    setCurrentPage(1)
    updateUrlParams(selectedShopId, deviceType, 1)
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrlParams(selectedShopId, selectedDeviceType, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 获取设备类型图标和标签
  const getDeviceTypeDisplay = (deviceType: string) => {
    switch (deviceType) {
      case 'pc':
        return { icon: <Monitor className="h-4 w-4" />, label: tCommon('PC端') }
      case 'mobile':
        return { icon: <Smartphone className="h-4 w-4" />, label: tCommon('移动端') }
      default:
        return { icon: <Monitor className="h-4 w-4" />, label: deviceType }
    }
  }

  // 处理编辑页面
  const handleEditPage = (pageId: string) => {
    router.push(`/editor/${pageId}?from_shop=${selectedShopId}`)
  }

  // 处理预览页面
  const handlePreviewPage = (pageId: string) => {
    window.open(`/preview/${pageId}`, '_blank', 'width=480,height=900,scrollbars=no,resizable=yes')
  }

  // 处理复制页面
  const handleCopyPage = async (page: PageTemplateListItem) => {
    try {
      // 获取完整的页面详情
      const fullPage = await pageService.getPage(page.id)
      
      // 创建副本，名称添加 -copy 后缀
      const copyName = `${fullPage.name}-copy`
      const copyData = {
        name: copyName,
        content: fullPage.content,
        device_type: page.device_type,
        shop_id: selectedShopId
      }
      
      await pageService.createPage(copyData)
      
      // 刷新页面列表
      await fetchPages(selectedShopId, selectedDeviceType, currentPage, debouncedSearchTerm)
      
      // 显示成功提示
      toastManager.show({
        type: 'success',
        title: tCommon('复制成功'),
        description: tCommon('页面已成功复制为：{name}', { name: copyName }),
        duration: 3000
      })
    } catch (error) {
      console.error('复制页面失败:', error)
      // 显示错误提示
      toastManager.show({
        type: 'error',
        title: tError('复制失败'),
        description: error instanceof Error ? error.message : tError('复制页面失败，请重试'),
        duration: 5000
      })
    }
  }

  // 处理删除页面
  const handleDeletePage = async (pageId: string) => {
    if (!confirm(tCommon('确定要删除这个页面吗？此操作不可撤销。'))) {
      return
    }

    try {
      await pageService.deletePage(pageId)
      setPages(pages.filter(page => page.id !== pageId))
      setTotalCount(prev => prev - 1)
    } catch (error) {
      console.error('删除页面失败:', error)
      alert(tError('删除页面失败，请重试'))
    }
  }

  // 处理创建新页面
  const handleCreatePage = () => {
    router.push(`/editor/new?shop_id=${selectedShopId}`)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // 获取当前选中的店铺
  const selectedShop = shops.find(shop => shop.id === selectedShopId)

  return (
    <>
      <ToastContainer />
      <div className="container mx-auto p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{tCommon('页面管理')}</h1>
          <p className="text-muted-foreground">{tCommon('管理您的页面模板，创建和编辑页面内容')}</p>
        </div>
        <Button onClick={handleCreatePage} disabled={!selectedShopId}>
          <Plus className="h-4 w-4 mr-2" />
          {tCommon('创建页面')}
        </Button>
      </div>

      {/* 筛选器和搜索 */}
      <div className="mb-6 space-y-4">
        {/* 店铺和设备类型选择器 */}
        <div className="flex flex-wrap gap-4">
          {/* 店铺选择 */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{tCommon('店铺')}:</span>
            <Select value={selectedShopId} onValueChange={handleShopChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={tCommon('请选择店铺')} />
              </SelectTrigger>
              <SelectContent>
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.shop_name} ({shop.target_area})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 设备类型选择 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{tCommon('设备类型')}:</span>
            <Select value={selectedDeviceType} onValueChange={handleDeviceTypeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('全部')}</SelectItem>
                <SelectItem value="pc">{tCommon('PC端')}</SelectItem>
                <SelectItem value="mobile">{tCommon('移动端')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tCommon('搜索页面...')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 当前店铺信息 */}
      {selectedShop && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {tCommon('当前店铺')}: <span className="font-medium text-foreground">{selectedShop.shop_name}</span>
            {' '}({selectedShop.target_area})
          </span>
        </div>
      )}

      {/* 页面列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{tError('加载失败')}</h3>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      ) : !selectedShopId ? (
        <Card className="p-8 text-center">
          <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{tCommon('请选择店铺')}</h3>
          <p className="text-muted-foreground">{tCommon('选择一个店铺开始管理页面')}</p>
        </Card>
      ) : pages.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? tCommon('没有找到匹配的页面') : tCommon('还没有页面')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? tCommon('尝试使用不同的关键词搜索') : tCommon('创建您的第一个页面开始使用')}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreatePage}>
              <Plus className="h-4 w-4 mr-2" />
              {tCommon('创建页面')}
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map(page => {
              const deviceDisplay = getDeviceTypeDisplay(page.device_type)
              return (
                <Card key={page.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{page.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {deviceDisplay.icon}
                          <Badge variant="outline" className="text-xs">
                            {deviceDisplay.label}
                          </Badge>
                          {page.shop_name && (
                            <Badge variant="secondary" className="text-xs">
                              {page.shop_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* 页面信息 */}
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>
                            {page.module_count || 0} {tCommon('个模块')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {tCommon('更新于')} {formatDate(page.updated_at)}
                          </span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditPage(page.id)} className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          {tCommon('编辑')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePreviewPage(page.id)}
                          title={tCommon('预览')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCopyPage(page)}
                          title={tCommon('复制')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePage(page.id)}
                          title={tCommon('删除')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {tCommon('上一页')}
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 10) {
                    pageNum = i + 1
                  } else if (currentPage <= 5) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 4) {
                    pageNum = totalPages - 9 + i
                  } else {
                    pageNum = currentPage - 4 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {tCommon('下一页')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* 页面统计 */}
      {pages.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {tCommon('共')} {totalCount} {tCommon('个页面')} · {tCommon('页')} {currentPage} / {totalPages}
        </div>
      )}
    </div>
    </>
  )
}
