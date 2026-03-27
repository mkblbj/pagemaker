'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Monitor,
  Wifi,
  Cpu,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Home,
  Globe,
  Settings
} from 'lucide-react'
import {
  performCompatibilityCheck,
  generateCompatibilityReport,
  setupCompatibilityMonitoring
} from '@/lib/browserCompatibility'
import { CompatibilityWarning } from '@/components/common/CompatibilityWarning'
import { BRAND_COMPATIBILITY_DESCRIPTION } from '@/lib/brand'

export default function CompatibilityCheckPage() {
  const [compatibilityData, setCompatibilityData] = useState<ReturnType<typeof performCompatibilityCheck> | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [monitoringEnabled, setMonitoringEnabled] = useState(false)
  const [monitoringEvents, setMonitoringEvents] = useState<
    Array<{
      event: string
      timestamp: Date
      data?: any
    }>
  >([])

  // 在客户端初始化兼容性检查
  useEffect(() => {
    setCompatibilityData(performCompatibilityCheck())
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | null = null

    if (monitoringEnabled && compatibilityData) {
      cleanup = setupCompatibilityMonitoring((event, data) => {
        setMonitoringEvents(prev =>
          [
            ...prev,
            {
              event,
              timestamp: new Date(),
              data
            }
          ].slice(-10)
        ) // 只保留最近10个事件

        // 重新检查兼容性
        setCompatibilityData(performCompatibilityCheck())
      })
    }

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [monitoringEnabled, compatibilityData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // 模拟刷新延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    setCompatibilityData(performCompatibilityCheck())
    setIsRefreshing(false)
  }

  const handleDownloadReport = () => {
    const report = generateCompatibilityReport()
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compatibility-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getBrowserIcon = (browserName: string) => {
    switch (browserName) {
      case 'chrome':
        return '🌐'
      case 'firefox':
        return '🦊'
      case 'safari':
        return '🧭'
      case 'edge':
        return '🔷'
      case 'opera':
        return '🎭'
      default:
        return '❓'
    }
  }

  const getStatusIcon = (supported: boolean) => {
    return supported ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  // 加载状态
  if (!compatibilityData) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="p-8 text-center">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <h2 className="text-lg font-semibold mb-2">正在检测兼容性...</h2>
          <p className="text-muted-foreground">请稍候，正在分析您的浏览器环境</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">浏览器兼容性检测</h1>
            <p className="text-muted-foreground mt-2">{BRAND_COMPATIBILITY_DESCRIPTION}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => (window.location.href = '/')}>
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              重新检测
            </Button>
            <Button onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              下载报告
            </Button>
          </div>
        </div>

        {/* 总体状态 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {compatibilityData.overallSupported ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              总体兼容性状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={compatibilityData.overallSupported ? 'default' : 'destructive'} className="text-sm">
                {compatibilityData.overallSupported ? '✅ 完全兼容' : '❌ 存在兼容性问题'}
              </Badge>
              <div className="text-sm text-muted-foreground">检测时间: {new Date().toLocaleString('zh-CN')}</div>
            </div>

            {compatibilityData.criticalIssues.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>发现 {compatibilityData.criticalIssues.length} 个关键问题</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1">
                    {compatibilityData.criticalIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {compatibilityData.recommendations.length > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>建议</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1">
                    {compatibilityData.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 详细检测结果 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 浏览器信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                浏览器信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-2xl">{getBrowserIcon(compatibilityData.browser.name)}</span>
                  <div className="flex-1">
                    <div className="font-medium">
                      {compatibilityData.browser.name} {compatibilityData.browser.version}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      主版本: {compatibilityData.browser.majorVersion}
                    </div>
                  </div>
                  <Badge variant={compatibilityData.browser.isSupported ? 'default' : 'destructive'}>
                    {compatibilityData.browser.isSupported ? '兼容' : '不兼容'}
                  </Badge>
                </div>

                {compatibilityData.browser.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">警告信息</h4>
                    <div className="space-y-1">
                      {compatibilityData.browser.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 系统信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系统信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  <div className="text-sm">
                    <div className="font-medium">屏幕</div>
                    <div className="text-muted-foreground">
                      {window.screen.width}×{window.screen.height}
                    </div>
                    <div className="text-xs">{compatibilityData.screen.isSupported ? '✅ 支持' : '❌ 过小'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Wifi className="h-4 w-4 text-green-500" />
                  <div className="text-sm">
                    <div className="font-medium">网络</div>
                    <div className="text-muted-foreground">{compatibilityData.network.isOnline ? '在线' : '离线'}</div>
                    <div className="text-xs">{compatibilityData.network.connectionType || '未知'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Cpu className="h-4 w-4 text-purple-500" />
                  <div className="text-sm">
                    <div className="font-medium">CPU</div>
                    <div className="text-muted-foreground">{navigator.hardwareConcurrency || '未知'} 核心</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Monitor className="h-4 w-4 text-orange-500" />
                  <div className="text-sm">
                    <div className="font-medium">内存</div>
                    <div className="text-muted-foreground">{(navigator as any).deviceMemory || '未知'} GB</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能支持详情 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>功能支持详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(compatibilityData.browser.features).map(([feature, supported]) => (
                <div key={feature} className="flex items-center gap-2 p-2 bg-muted rounded">
                  {getStatusIcon(supported)}
                  <span className="text-sm capitalize">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 实时监控 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>实时监控</span>
              <Button variant="outline" size="sm" onClick={() => setMonitoringEnabled(!monitoringEnabled)}>
                {monitoringEnabled ? '停止监控' : '开始监控'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${monitoringEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm">{monitoringEnabled ? '监控中 - 检测网络、屏幕变化' : '监控已停止'}</span>
              </div>

              {monitoringEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">最近事件</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {monitoringEvents.map((event, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs p-2 bg-muted rounded">
                        <span className="font-medium">{event.event}</span>
                        <span className="text-muted-foreground">{event.timestamp.toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 兼容性警告组件演示 */}
        <Card>
          <CardHeader>
            <CardTitle>兼容性警告组件</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">这是集成在编辑器中的兼容性警告组件的演示:</p>
            <CompatibilityWarning showDetails={true} persistent={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
