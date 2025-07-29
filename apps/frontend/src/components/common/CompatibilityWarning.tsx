'use client'

import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AlertTriangle, XCircle, Info, X, ChevronDown, ChevronUp, Monitor, Wifi, Cpu, Globe } from 'lucide-react'
import {
  performCompatibilityCheck,
  generateCompatibilityReport,
  setupCompatibilityMonitoring
} from '@/lib/browserCompatibility'

interface CompatibilityWarningProps {
  onClose?: () => void
  showDetails?: boolean
  persistent?: boolean
}

export function CompatibilityWarning({ onClose, showDetails = false, persistent = false }: CompatibilityWarningProps) {
  const [compatibilityData, setCompatibilityData] = useState(() => performCompatibilityCheck())
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    // 设置兼容性监控
    const cleanup = setupCompatibilityMonitoring((event, data) => {
      console.log('兼容性事件:', event, data)
      // 重新检查兼容性
      setCompatibilityData(performCompatibilityCheck())
    })

    return cleanup
  }, [])

  // 如果没有问题且不是持久显示，则不显示
  if (!persistent && compatibilityData.overallSupported && compatibilityData.criticalIssues.length === 0) {
    return null
  }

  const handleClose = () => {
    onClose?.()
  }

  const getSeverityColor = () => {
    if (compatibilityData.criticalIssues.length > 0) {
      return 'destructive'
    }
    return 'default'
  }

  const getSeverityIcon = () => {
    if (compatibilityData.criticalIssues.length > 0) {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />
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

  return (
    <Card className="mb-4 border-l-4 border-l-yellow-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon()}
            <CardTitle className="text-lg">
              {compatibilityData.criticalIssues.length > 0 ? '兼容性问题' : '兼容性提醒'}
            </CardTitle>
            <Badge variant={getSeverityColor() as any}>
              {compatibilityData.criticalIssues.length > 0 ? '需要注意' : '建议优化'}
            </Badge>
          </div>
          {!persistent && (
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 浏览器信息 */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-2xl">{getBrowserIcon(compatibilityData.browser.name)}</span>
          <div className="flex-1">
            <div className="font-medium">
              {compatibilityData.browser.name} {compatibilityData.browser.version}
            </div>
            <div className="text-sm text-muted-foreground">
              {compatibilityData.browser.isSupported ? '✅ 支持' : '❌ 版本过低'}
            </div>
          </div>
          <Badge variant={compatibilityData.browser.isSupported ? 'default' : 'destructive'}>
            {compatibilityData.browser.isSupported ? '兼容' : '不兼容'}
          </Badge>
        </div>

        {/* 关键问题 */}
        {compatibilityData.criticalIssues.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>关键问题</AlertTitle>
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

        {/* 建议 */}
        {compatibilityData.recommendations.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
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

        {/* 系统信息概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <Monitor className="h-4 w-4 text-blue-500" />
            <div className="text-xs">
              <div className="font-medium">屏幕</div>
              <div className="text-muted-foreground">{compatibilityData.screen.isSupported ? '✅' : '❌'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <Wifi className="h-4 w-4 text-green-500" />
            <div className="text-xs">
              <div className="font-medium">网络</div>
              <div className="text-muted-foreground">{compatibilityData.network.isOnline ? '在线' : '离线'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <Cpu className="h-4 w-4 text-purple-500" />
            <div className="text-xs">
              <div className="font-medium">性能</div>
              <div className="text-muted-foreground">
                {compatibilityData.performance.warnings.length === 0 ? '✅' : '⚠️'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <Globe className="h-4 w-4 text-orange-500" />
            <div className="text-xs">
              <div className="font-medium">功能</div>
              <div className="text-muted-foreground">
                {Object.values(compatibilityData.browser.features).filter(Boolean).length}/
                {Object.keys(compatibilityData.browser.features).length}
              </div>
            </div>
          </div>
        </div>

        {/* 详细信息 */}
        {showDetails && (
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>详细信息</span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              {/* 功能支持详情 */}
              <div>
                <h4 className="font-medium mb-2">功能支持</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.entries(compatibilityData.browser.features).map(([feature, supported]) => (
                    <div key={feature} className="flex items-center gap-2">
                      <span className={supported ? 'text-green-500' : 'text-red-500'}>{supported ? '✅' : '❌'}</span>
                      <span className="capitalize">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 警告信息 */}
              {compatibilityData.browser.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">警告信息</h4>
                  <ul className="space-y-1 text-sm">
                    {compatibilityData.browser.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 屏幕信息 */}
              {compatibilityData.screen.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">屏幕信息</h4>
                  <ul className="space-y-1 text-sm">
                    {compatibilityData.screen.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Monitor className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 性能信息 */}
              {compatibilityData.performance.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">性能信息</h4>
                  <ul className="space-y-1 text-sm">
                    {compatibilityData.performance.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Cpu className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 完整报告 */}
              <div>
                <h4 className="font-medium mb-2">完整报告</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {generateCompatibilityReport()}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 简化的兼容性检查组件
 */
export function SimpleCompatibilityCheck() {
  const [compatibilityData] = useState(() => performCompatibilityCheck())

  if (compatibilityData.overallSupported) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>浏览器兼容性问题</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-1">
          <p>检测到以下问题可能影响使用体验：</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {compatibilityData.criticalIssues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
          {compatibilityData.recommendations.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="font-medium">建议：</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {compatibilityData.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
