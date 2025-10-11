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
import { zhCN } from 'date-fns/locale'

export default function ShopConfigurationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
        title: '刷新成功',
        description: `API到期日期已更新: ${format(new Date(result.apiLicenseExpiryDate), 'PPP', { locale: zhCN })}`,
      })
      
      // 重新获取列表
      mutate()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '刷新失败',
        description: error instanceof Error ? error.message : '刷新API到期日期失败',
      })
    } finally {
      setRefreshingId(null)
    }
  }

  // 删除配置
  const handleDelete = async (id: string, shopName: string) => {
    if (!confirm(`确定要删除店铺配置"${shopName}"吗？`)) {
      return
    }

    try {
      setDeletingId(id)
      await shopService.deleteShopConfiguration(id)
      
      toast({
        title: '删除成功',
        description: `店铺配置"${shopName}"已删除`,
      })
      
      // 重新获取列表
      mutate()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error instanceof Error ? error.message : '删除店铺配置失败',
      })
    } finally {
      setDeletingId(null)
    }
  }

  // 格式化日期显示
  const formatExpiryDate = (dateStr?: string | null) => {
    if (!dateStr) return '未设置'
    
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const daysUntilExpiry = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      const formattedDate = format(date, 'yyyy-MM-dd', { locale: zhCN })
      
      if (daysUntilExpiry < 0) {
        return `${formattedDate} (已过期)`
      } else if (daysUntilExpiry < 30) {
        return `${formattedDate} (${daysUntilExpiry}天后过期)`
      }
      
      return formattedDate
    } catch {
      return '日期格式错误'
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
          <h1 className="text-3xl font-bold">店铺配置管理</h1>
          <p className="text-muted-foreground mt-2">
            管理乐天API和FTP凭据配置
          </p>
        </div>
        <Button onClick={() => router.push('/shop-configurations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          新增配置
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              <p>加载店铺配置失败: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {configurations && configurations.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无店铺配置</h3>
            <p className="text-muted-foreground mb-4">
              点击"新增配置"按钮创建第一个店铺配置
            </p>
            <Button onClick={() => router.push('/shop-configurations/new')}>
              <Plus className="mr-2 h-4 w-4" />
              新增配置
            </Button>
          </CardContent>
        </Card>
      )}

      {configurations && configurations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configurations.map((config) => {
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
                      <Badge variant="destructive">已过期</Badge>
                    )}
                    {expiryStatus === 'warning' && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        即将过期
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>API到期: {formatExpiryDate(config.api_license_expiry_date)}</span>
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
                        编辑
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshExpiry(config.id)}
                        disabled={refreshingId === config.id}
                        title="刷新API到期日期"
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
                        title="删除"
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


