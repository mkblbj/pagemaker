'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { shopService } from '@/services/shopService'
import useSWR from 'swr'
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Server,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN, enUS, ja } from 'date-fns/locale'
import { useTranslation } from '@/contexts/I18nContext'
import type { ShopConfiguration } from '@pagemaker/shared-types'

export default function ShopConfigurationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { tShopConfig, tCommon, currentLanguage } = useTranslation()
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 根据当前语言选择 date-fns locale
  const getDateLocale = () => {
    switch (currentLanguage) {
      case 'zh-CN':
        return zhCN
      case 'ja-JP':
        return ja
      case 'en-US':
      default:
        return enUS
    }
  }

  // 使用SWR获取店铺配置列表
  const { data: configurations, error, mutate } = useSWR(
    '/shop-configurations',
    () => shopService.getAllShopConfigurations()
  )

  const isLoading = !configurations && !error

  // 刷新API到期日期
  const handleRefreshExpiry = async (id: string) => {
    try {
      setRefreshingId(id)
      const result = await shopService.refreshApiExpiry(id)
      
      toast({
        title: tShopConfig('refreshSuccess'),
        description: `${tShopConfig('apiExpiryDate')}: ${format(new Date(result.apiLicenseExpiryDate), 'PPP', { locale: getDateLocale() })}`,
      })
      
      // 重新获取列表
      mutate()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: tShopConfig('refreshFailed'),
        description: error instanceof Error ? error.message : tShopConfig('refreshFailed'),
      })
    } finally {
      setRefreshingId(null)
    }
  }

  // 删除配置
  const handleDelete = async (id: string, shopName: string) => {
    if (!confirm(tShopConfig('deleteConfirm').replace('{name}', shopName))) {
      return
    }

    try {
      setDeletingId(id)
      await shopService.deleteShopConfiguration(id)
      
      toast({
        title: tShopConfig('deleteSuccess'),
        description: `${tShopConfig('deleteSuccess')}: "${shopName}"`,
      })
      
      // 重新获取列表
      mutate()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: tShopConfig('deleteFailed'),
        description: error instanceof Error ? error.message : tShopConfig('deleteFailed'),
      })
    } finally {
      setDeletingId(null)
    }
  }

  // 格式化日期显示
  const formatExpiryDate = (dateStr?: string | null) => {
    if (!dateStr) return tShopConfig('notSet')
    
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const daysUntilExpiry = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      const formattedDate = format(date, 'yyyy-MM-dd', { locale: getDateLocale() })
      
      if (daysUntilExpiry < 0) {
        return `${formattedDate} (${tShopConfig('expired')})`
      } else if (daysUntilExpiry < 30) {
        return `${formattedDate} (${tShopConfig('daysUntilExpiry').replace('{days}', daysUntilExpiry.toString())})`
      }
      
      return formattedDate
    } catch {
      return tShopConfig('dateFormatError')
    }
  }

  // 判断到期状态
  const getExpiryStatus = (dateStr?: string | null): 'expired' | 'warning' | 'ok' | 'none' => {
    if (!dateStr) return 'none'
    
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const daysUntilExpiry = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry < 0) return 'expired'
      if (daysUntilExpiry < 30) return 'warning'
      return 'ok'
    } catch {
      return 'none'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{tShopConfig('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {tShopConfig('description')}
          </p>
        </div>
        <Button onClick={() => router.push('/shop-configurations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {tShopConfig('newConfig')}
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{tShopConfig('loading')}</p>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              <p>{tShopConfig('loadError')}: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {configurations && configurations.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{tShopConfig('noConfigs')}</h3>
            <p className="text-muted-foreground mb-4">
              {tShopConfig('noConfigsDesc')}
            </p>
            <Button onClick={() => router.push('/shop-configurations/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {tShopConfig('newConfig')}
            </Button>
          </CardContent>
        </Card>
      )}

      {configurations && configurations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configurations.map((config: ShopConfiguration) => {
            const expiryStatus = getExpiryStatus(config.api_license_expiry_date)
            
            return (
              <Card key={config.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{config.shop_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {config.target_area}
                      </CardDescription>
                    </div>
                    {expiryStatus === 'expired' && (
                      <Badge variant="destructive">{tShopConfig('expired')}</Badge>
                    )}
                    {expiryStatus === 'warning' && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        {tShopConfig('expiringSoon')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{tShopConfig('apiExpiry')}: {formatExpiryDate(config.api_license_expiry_date)}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Server className="mr-2 h-4 w-4" />
                      <span>{config.ftp_host}:{config.ftp_port}</span>
                    </div>
                    
                    <div className="pt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/shop-configurations/${config.id}/edit`)}
                        className="flex-1"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        {tCommon('edit')}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshExpiry(config.id)}
                        disabled={refreshingId === config.id}
                        title={tShopConfig('refreshSuccess')}
                      >
                        {refreshingId === config.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config.id, config.shop_name)}
                        disabled={deletingId === config.id}
                        className="text-destructive hover:text-destructive"
                        title={tCommon('delete')}
                      >
                        {deletingId === config.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

