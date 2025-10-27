'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TestComponent } from '@/components/test-component'
import { useTranslation } from '@/contexts/I18nContext'
import {
  getDashboardStats,
  formatActivityTime,
  getActivityColor,
  type DashboardStats,
} from '@/services/dashboardService'

export default function DashboardPage() {
  const { tCommon } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const data = await getDashboardStats()
        setStats(data)
        setError(null)
      } catch (err) {
        console.error('获取仪表盘数据失败:', err)
        setError('加载数据失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{tCommon('仪表板')}</h1>
          <p className="text-muted-foreground">
            {tCommon('欢迎使用 Pagemaker CMS，这里是您的内容管理中心')}
          </p>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{tCommon('加载中...')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{tCommon('仪表板')}</h1>
          <p className="text-muted-foreground">
            {tCommon('欢迎使用 Pagemaker CMS，这里是您的内容管理中心')}
          </p>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{tCommon('仪表板')}</h1>
        <p className="text-muted-foreground">
          {tCommon('欢迎使用 Pagemaker CMS，这里是您的内容管理中心')}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('总页面数')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pages.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pages.recent_change ?? '0'} {tCommon('比上个月增加')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('PC 端页面')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pages.by_device.pc ?? 0}</div>
            <p className="text-xs text-muted-foreground">{tCommon('电脑版页面')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('移动端页面')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pages.by_device.mobile ?? 0}</div>
            <p className="text-xs text-muted-foreground">{tCommon('手机版页面')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('店铺数')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.shops.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{tCommon('已配置店铺')}</p>
          </CardContent>
        </Card>
      </div>

      {/* 店铺页面统计 */}
      {stats && stats.shops.pages_by_shop.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('各店铺页面统计')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.shops.pages_by_shop.map((shop) => (
                <div key={shop.shop_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="font-medium">{shop.shop_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{shop.page_count}</span>
                    <span className="text-sm text-muted-foreground">{tCommon('个页面')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('最近活动')}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.activities.length > 0 ? (
              <div className="space-y-4">
                {stats.activities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div
                      className={`w-2 h-2 rounded-full bg-${getActivityColor(activity.action)}-500`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground">{activity.user}</span>{' '}
                        {tCommon(activity.action_display)}
                        {tCommon('了页面')} &ldquo;{activity.page_name}&rdquo;
                        {activity.shop_name && (
                          <span className="text-muted-foreground">
                            {' '}
                            - {activity.shop_name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatActivityTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{tCommon('暂无活动记录')}</p>
            )}
          </CardContent>
        </Card>

        {/* 系统测试 */}
        {/* <div>
          <h2 className="text-xl font-semibold mb-4">{tCommon('系统测试')}</h2>
          <TestComponent />
        </div> */}
      </div>
    </div>
  )
}
