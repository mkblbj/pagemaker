'use client'

import { useState, useEffect } from 'react'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Monitor, Smartphone, Store } from 'lucide-react'
import { shopService } from '@/services/shopService'
import { useTranslation } from '@/contexts/I18nContext'
import type { ShopConfiguration } from '@pagemaker/shared-types'

export function ShopAndDeviceSelector() {
  const { currentPage, updatePage, markUnsaved } = usePageStore()
  const { setError } = useEditorStore()
  const { tCommon } = useTranslation()
  const [shops, setShops] = useState<ShopConfiguration[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isNewPage = !currentPage?.id

  // 获取店铺列表
  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true)
        const shopList = await shopService.getAllShopConfigurations()
        setShops(shopList)
      } catch (error) {
        console.error('获取店铺列表失败:', error)
        setError('获取店铺列表失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchShops()
  }, [setError])

  // 获取当前选中的店铺
  const currentShop = shops.find(shop => shop.id === currentPage?.shop_id)

  // 处理店铺切换（仅新建页面时允许）
  const handleShopChange = (shopId: string) => {
    if (!isNewPage) return
    updatePage({ shop_id: shopId })
    markUnsaved()
  }

  // 处理设备类型切换（仅新建页面时允许）
  const handleDeviceTypeChange = (deviceType: 'pc' | 'mobile') => {
    if (!isNewPage) return
    updatePage({ device_type: deviceType })
    markUnsaved()
  }

  // 获取设备类型图标
  const getDeviceTypeIcon = (deviceType: string) => {
    return deviceType === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />
  }

  return (
    <div className="flex items-center gap-4">
      {/* 店铺选择/显示 */}
      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">{tCommon('店铺')}:</Label>
        {isLoading ? (
          <Badge variant="outline" className="animate-pulse">
            {tCommon('加载中')}...
          </Badge>
        ) : isNewPage ? (
          // 新建页面：显示下拉选择（不设置默认值，强制用户选择）
          <Select value={currentPage?.shop_id || undefined} onValueChange={handleShopChange}>
            <SelectTrigger className="w-48 h-8">
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
        ) : (
          // 编辑页面：只读显示
          <Badge variant="secondary" className="text-sm">
            {currentShop ? `${currentShop.shop_name} (${currentShop.target_area})` : tCommon('未知店铺')}
          </Badge>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 设备类型选择/显示 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{tCommon('设备类型')}:</Label>
        {isNewPage ? (
          // 新建页面：显示下拉选择
          <Select value={currentPage?.device_type || 'pc'} onValueChange={handleDeviceTypeChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pc">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>{tCommon('PC端')}</span>
                </div>
              </SelectItem>
              <SelectItem value="mobile">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>{tCommon('移动端')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          // 编辑页面：只读显示
          <Badge variant="outline" className="flex items-center gap-1">
            {getDeviceTypeIcon(currentPage?.device_type || 'pc')}
            <span>{currentPage?.device_type === 'mobile' ? tCommon('移动端') : tCommon('PC端')}</span>
          </Badge>
        )}
      </div>
    </div>
  )
}

