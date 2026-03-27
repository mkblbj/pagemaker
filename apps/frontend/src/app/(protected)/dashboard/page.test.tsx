import { render, screen } from '@/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './page'
import { useTranslation } from '@/contexts/I18nContext'
import { getDashboardStats, formatActivityTime, getActivityColor } from '@/services/dashboardService'

vi.mock('@/contexts/I18nContext', () => ({
  useTranslation: vi.fn(),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('@/services/dashboardService', () => ({
  getDashboardStats: vi.fn(),
  formatActivityTime: vi.fn(),
  getActivityColor: vi.fn()
}))

describe('DashboardPage', () => {
  const mockTranslation = {
    tCommon: vi.fn((key: string) => key),
    tEditor: vi.fn((key: string) => key)
  }

  const mockStats = {
    pages: {
      total: 12,
      by_device: {
        pc: 8,
        mobile: 4
      },
      recent_change: '+2'
    },
    shops: {
      total: 3,
      pages_by_shop: [{ shop_id: 'shop-1', shop_name: '旗舰店', page_count: 5 }]
    },
    activities: [
      {
        id: 'activity-1',
        action: 'created' as const,
        action_display: '创建',
        page_id: 'page-1',
        page_name: '关于我们',
        user: 'Alice',
        shop_name: '旗舰店',
        device_type: 'pc',
        created_at: '2026-03-27T00:00:00.000Z'
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTranslation as any).mockReturnValue(mockTranslation)
    ;(getDashboardStats as any).mockResolvedValue(mockStats)
    ;(formatActivityTime as any).mockReturnValue('2 小时前')
    ;(getActivityColor as any).mockReturnValue('blue')
  })

  it('应该渲染页面标题和描述', async () => {
    render(<DashboardPage />)

    expect(screen.getByText('仪表板')).toBeInTheDocument()
    expect(screen.getByText('欢迎使用 UO-PageMaker，这里是您的内容管理中心')).toBeInTheDocument()
    expect(mockTranslation.tCommon).toHaveBeenCalledWith('仪表板')

    await screen.findByText('总页面数')
  })

  it('应该渲染统计卡片', async () => {
    render(<DashboardPage />)

    expect(await screen.findByText('总页面数')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('PC 端页面')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('移动端页面')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('店铺数')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('+2 比上个月增加')).toBeInTheDocument()
  })

  it('应该渲染店铺统计和最近活动', async () => {
    render(<DashboardPage />)

    expect(await screen.findByText('各店铺页面统计')).toBeInTheDocument()
    expect(screen.getAllByText('旗舰店')).not.toHaveLength(0)
    expect(screen.getByText('最近活动')).toBeInTheDocument()
    expect(screen.getByText(/关于我们/)).toBeInTheDocument()
    expect(screen.getByText('2 小时前')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('应该使用正确的CSS类名进行布局', async () => {
    render(<DashboardPage />)

    await screen.findByText('总页面数')

    const mainContainer = screen.getByText('仪表板').closest('div')?.parentElement
    expect(mainContainer).toHaveClass('space-y-6')
  })

  it('应该正确调用仪表盘数据服务', async () => {
    render(<DashboardPage />)

    await screen.findByText('总页面数')

    expect(getDashboardStats).toHaveBeenCalledTimes(1)
    expect(formatActivityTime).toHaveBeenCalledWith('2026-03-27T00:00:00.000Z')
    expect(getActivityColor).toHaveBeenCalledWith('created')
  })

  it('应该正确调用翻译函数', async () => {
    render(<DashboardPage />)

    await screen.findByText('总页面数')

    const expectedKeys = [
      '仪表板',
      '加载中...',
      '总页面数',
      '比上个月增加',
      'PC 端页面',
      '电脑版页面',
      '移动端页面',
      '手机版页面',
      '店铺数',
      '已配置店铺',
      '各店铺页面统计',
      '个页面',
      '最近活动',
      '创建',
      '了页面'
    ]

    expectedKeys.forEach(key => {
      expect(mockTranslation.tCommon).toHaveBeenCalledWith(key)
    })
  })
})
