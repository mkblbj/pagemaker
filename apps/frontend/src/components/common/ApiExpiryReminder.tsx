'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { shopService } from '@/services/shopService'
import { useTranslation } from '@/contexts/I18nContext'
import { ShopConfiguration } from '@pagemaker/shared-types'
import { AlertTriangle, RefreshCw, Calendar } from 'lucide-react'

interface ExpiringShop {
  shop: ShopConfiguration
  daysUntilExpiry: number
}

export function ApiExpiryReminder() {
  const { tCommon, tError } = useTranslation()
  const [open, setOpen] = useState(false)
  const [expiringShops, setExpiringShops] = useState<ExpiringShop[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshingShopId, setRefreshingShopId] = useState<string | null>(null)

  // 检查API到期时间
  const checkApiExpiry = async () => {
    try {
      const shops = await shopService.getAllShopConfigurations()
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const expiring: ExpiringShop[] = []

      shops.forEach(shop => {
        if (shop.api_license_expiry_date) {
          const expiryDate = new Date(shop.api_license_expiry_date)
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          // 如果到期时间在7天以内且未过期
          if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
            expiring.push({ shop, daysUntilExpiry })
          }
        }
      })

      setExpiringShops(expiring)

      // 如果有到期的店铺，显示提醒
      if (expiring.length > 0) {
        setOpen(true)
      }
    } catch (error) {
      console.error('检查API到期时间失败:', error)
    }
  }

  // 刷新单个店铺的API到期时间
  const refreshShopExpiry = async (shopId: string) => {
    setRefreshingShopId(shopId)
    try {
      await shopService.refreshApiExpiry(shopId)
      // 重新检查所有店铺的到期时间
      await checkApiExpiry()
    } catch (error) {
      console.error('刷新API到期时间失败:', error)
      // 显示错误提示
      alert(tError('刷新失败') + ': ' + (error instanceof Error ? error.message : tError('未知错误')))
    } finally {
      setRefreshingShopId(null)
    }
  }

  // 刷新所有到期的店铺
  const refreshAllExpiringShops = async () => {
    setLoading(true)
    try {
      for (const expiringShop of expiringShops) {
        await shopService.refreshApiExpiry(expiringShop.shop.id)
      }
      // 重新检查
      await checkApiExpiry()
    } catch (error) {
      console.error('批量刷新API到期时间失败:', error)
      alert(tError('刷新失败') + ': ' + (error instanceof Error ? error.message : tError('未知错误')))
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时检查API到期时间，并设置定期检查
  useEffect(() => {
    checkApiExpiry()

    // 每30分钟检查一次API到期时间
    const interval = setInterval(() => {
      checkApiExpiry()
    }, 30 * 60 * 1000) // 30分钟

    return () => clearInterval(interval)
  }, [])

  // 如果没有到期的店铺，不渲染任何内容
  if (expiringShops.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {tCommon('API许可证到期提醒')}
          </DialogTitle>
          <DialogDescription>
            {tCommon('以下店铺的API许可证将在7天内到期，请及时更新以避免服务中断。')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {expiringShops.map(({ shop, daysUntilExpiry }) => (
            <Alert key={shop.id} className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">
                {shop.shop_name} ({shop.target_area})
              </AlertTitle>
              <AlertDescription className="text-orange-700">
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {daysUntilExpiry === 0
                        ? tCommon('今日到期')
                        : tCommon('{days}天后到期', { days: daysUntilExpiry.toString() })
                      }
                    </span>
                    <Badge variant={daysUntilExpiry <= 1 ? "destructive" : "secondary"}>
                      {daysUntilExpiry <= 1 ? tCommon('紧急') : tCommon('警告')}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshShopExpiry(shop.id)}
                    disabled={refreshingShopId === shop.id}
                    className="ml-2"
                  >
                    {refreshingShopId === shop.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    {tCommon('刷新')}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            {tCommon('稍后处理')}
          </Button>
          <Button
            onClick={refreshAllExpiringShops}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                {tCommon('刷新中...')}
              </>
            ) : (
              tCommon('全部刷新')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
