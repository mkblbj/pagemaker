/**
 * 仪表盘数据服务
 * 提供仪表盘统计数据和最近活动的 API 调用
 */

import { apiClient } from '@/lib/apiClient'

/**
 * 活动类型
 */
export type ActivityAction = 'created' | 'updated' | 'deleted'

/**
 * 活动记录
 */
export interface Activity {
  id: string
  action: ActivityAction
  action_display: string
  page_id: string
  page_name: string
  user: string
  shop_name: string
  device_type: string
  created_at: string
}

/**
 * 店铺页面统计
 */
export interface ShopPageStats {
  shop_id: string
  shop_name: string
  page_count: number
}

/**
 * 页面统计数据
 */
export interface PageStats {
  total: number
  by_device: Record<string, number>
  recent_change: string
}

/**
 * 店铺统计数据
 */
export interface ShopStats {
  total: number
  pages_by_shop: ShopPageStats[]
}

/**
 * 仪表盘统计数据
 */
export interface DashboardStats {
  pages: PageStats
  shops: ShopStats
  activities: Activity[]
}

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await apiClient.get('/api/v1/dashboard/stats/')

    if (!response.data.success) {
      throw new Error(response.data.error?.message || '获取仪表盘数据失败')
    }

    return response.data.data
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    throw error
  }
}

/**
 * 格式化活动时间为相对时间
 */
export function formatActivityTime(isoString: string): string {
  const now = new Date()
  const activityTime = new Date(isoString)
  const diffMs = now.getTime() - activityTime.getTime()

  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`
  } else if (diffDays < 30) {
    return `${diffDays} 天前`
  } else {
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} 个月前`
  }
}

/**
 * 获取活动操作的颜色
 */
export function getActivityColor(action: ActivityAction): string {
  switch (action) {
    case 'created':
      return 'blue'
    case 'updated':
      return 'yellow'
    case 'deleted':
      return 'red'
    default:
      return 'gray'
  }
}

