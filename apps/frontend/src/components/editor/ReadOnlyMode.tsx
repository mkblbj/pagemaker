'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  Download,
  Share2,
  AlertTriangle,
  RefreshCw,
  Settings,
  Info,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { PageTemplate, PageModule, PageModuleType } from '@pagemaker/shared-types'
import { performCompatibilityCheck } from '@/lib/browserCompatibility'
import { createAppError, ErrorType, ErrorSeverity } from '@/lib/errorHandler'

interface ReadOnlyModeProps {
  page?: PageTemplate
  modules?: PageModule[]
  reason?: 'compatibility' | 'error' | 'maintenance' | 'permissions'
  error?: any
  onRetry?: () => void
  onUpgrade?: () => void
  showActions?: boolean
}

export function ReadOnlyMode({
  page,
  modules = [],
  reason = 'compatibility',
  error,
  onRetry,
  onUpgrade,
  showActions = true
}: ReadOnlyModeProps) {
  const [copied, setCopied] = useState(false)
  const [compatibilityData, setCompatibilityData] = useState(() => performCompatibilityCheck())

  useEffect(() => {
    setCompatibilityData(performCompatibilityCheck())
  }, [])

  const getReasonInfo = () => {
    switch (reason) {
      case 'compatibility':
        return {
          title: '浏览器兼容性限制',
          description: '您的浏览器不完全支持编辑器的所有功能，已切换到只读模式',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          severity: 'default' as const,
          actionText: '升级浏览器'
        }
      case 'error':
        return {
          title: '编辑器遇到问题',
          description: '编辑器出现错误，已切换到只读模式以保护您的数据',
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          severity: 'destructive' as const,
          actionText: '重新加载'
        }
      case 'maintenance':
        return {
          title: '系统维护中',
          description: '系统正在维护，编辑功能暂时不可用',
          icon: <Settings className="h-5 w-5 text-blue-500" />,
          severity: 'default' as const,
          actionText: '刷新状态'
        }
      case 'permissions':
        return {
          title: '权限不足',
          description: '您没有编辑此页面的权限，只能查看内容',
          icon: <Eye className="h-5 w-5 text-gray-500" />,
          severity: 'default' as const,
          actionText: '申请权限'
        }
      default:
        return {
          title: '只读模式',
          description: '当前处于只读模式',
          icon: <Info className="h-5 w-5 text-blue-500" />,
          severity: 'default' as const,
          actionText: '了解更多'
        }
    }
  }

  const reasonInfo = getReasonInfo()

  const handleCopyContent = async () => {
    try {
      const content = modules
        .map(module => {
          switch (module.type) {
            case PageModuleType.TITLE:
              return `# ${(module as any).text || ''}`
            case PageModuleType.TEXT:
              return (module as any).text || ''
            case PageModuleType.KEY_VALUE:
              return (module as any).pairs?.map((pair: any) => `${pair.key}: ${pair.value}`).join('\n') || ''
            default:
              return `[${module.type}模块]`
          }
        })
        .join('\n\n')

      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleExport = () => {
    const content = JSON.stringify(
      {
        page,
        modules,
        exportTime: new Date().toISOString()
      },
      null,
      2
    )

    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${page?.name || 'page'}-readonly.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderModuleReadOnly = (module: PageModule) => {
    switch (module.type) {
      case PageModuleType.TITLE:
        const level = (module as any).level || 1
        const titleClass = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : level === 3 ? 'text-lg' : 'text-base'
        return (
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              H{level} 标题
            </Badge>
            <div className={`font-bold text-gray-800 ${titleClass}`}>{(module as any).text || '标题文本'}</div>
          </div>
        )

      case PageModuleType.TEXT:
        return (
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              文本
            </Badge>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {(module as any).text || '文本内容'}
            </div>
          </div>
        )

      case PageModuleType.IMAGE:
        return (
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              图片
            </Badge>
            {(module as any).src ? (
              <img
                src={(module as any).src}
                alt={(module as any).alt || '图片'}
                className="max-w-full h-auto rounded border"
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <div className="text-gray-500">
                  <div className="text-sm">图片未加载</div>
                  <div className="text-xs mt-1">{(module as any).alt || '图片描述'}</div>
                </div>
              </div>
            )}
          </div>
        )

      case PageModuleType.SEPARATOR:
        return (
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              分隔线
            </Badge>
            <hr className="border-t-2 border-gray-300" />
          </div>
        )

      case PageModuleType.KEY_VALUE:
        const pairs = (module as any).pairs || []
        return (
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              键值对
            </Badge>
            <div className="space-y-2">
              {pairs.map((pair: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded border">
                  <span className="font-medium text-sm min-w-0 flex-1">{pair.key || '键'}:</span>
                  <span className="text-sm text-gray-700 min-w-0 flex-2">{pair.value || '值'}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case PageModuleType.MULTI_COLUMN:
        const columns = (module as any).columns || 2
        return (
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              {columns}列布局
            </Badge>
            <div
              className={`grid gap-4 ${
                columns === 2
                  ? 'grid-cols-2'
                  : columns === 3
                    ? 'grid-cols-3'
                    : columns === 4
                      ? 'grid-cols-4'
                      : 'grid-cols-2'
              }`}
            >
              {Array.from({ length: columns }).map((_, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded p-4 text-center text-sm text-gray-500 bg-gray-50"
                >
                  列 {index + 1}
                  <br />
                  <span className="text-xs">（空列）</span>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <Badge variant="destructive" className="text-xs">
              未知模块
            </Badge>
            <div className="text-sm text-gray-500 p-3 bg-yellow-50 border border-yellow-200 rounded">
              模块类型: {module.type}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 状态提示 */}
        <Alert variant={reasonInfo.severity}>
          {reasonInfo.icon}
          <AlertTitle>{reasonInfo.title}</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p>{reasonInfo.description}</p>

              {/* 错误详情 */}
              {error && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">查看错误详情</summary>
                  <div className="mt-2 p-3 bg-muted rounded text-xs">
                    <pre className="whitespace-pre-wrap">{error.message || JSON.stringify(error, null, 2)}</pre>
                  </div>
                </details>
              )}

              {/* 兼容性信息 */}
              {reason === 'compatibility' && (
                <div className="mt-3 text-sm">
                  <p>检测到的问题:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {compatibilityData.criticalIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                  {compatibilityData.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p>建议:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {compatibilityData.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* 操作栏 */}
        {showActions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                只读模式操作
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {onRetry && (
                  <Button variant="default" onClick={onRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {reasonInfo.actionText}
                  </Button>
                )}

                {onUpgrade && reason === 'compatibility' && (
                  <Button variant="outline" onClick={onUpgrade}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    升级浏览器
                  </Button>
                )}

                <Button variant="outline" onClick={handleCopyContent}>
                  {copied ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? '已复制' : '复制内容'}
                </Button>

                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </Button>

                <Button variant="outline" onClick={() => window.print()}>
                  <Share2 className="h-4 w-4 mr-2" />
                  打印页面
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 页面信息 */}
        {page && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{page.name || '未命名页面'}</span>
                <Badge variant="outline">只读</Badge>
              </CardTitle>
            </CardHeader>
            {(page.created_at || page.updated_at) && (
              <CardContent className="pt-0">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {page.created_at && <div>创建时间: {new Date(page.created_at).toLocaleString('zh-CN')}</div>}
                  {page.updated_at && <div>更新时间: {new Date(page.updated_at).toLocaleString('zh-CN')}</div>}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 模块内容 */}
        <div className="space-y-4">
          {modules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">页面内容为空</p>
                <p className="text-sm mt-1">此页面还没有添加任何内容</p>
              </CardContent>
            </Card>
          ) : (
            modules.map((module, index) => (
              <Card key={module.id || index} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">{renderModuleReadOnly(module)}</CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 页脚信息 */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Info className="h-4 w-4" />
              <span>
                当前处于只读模式 |{modules.length} 个模块 | 浏览器: {compatibilityData.browser.name}{' '}
                {compatibilityData.browser.version}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * 简化的只读预览组件
 */
interface SimpleReadOnlyPreviewProps {
  modules: PageModule[]
  title?: string
}

export function SimpleReadOnlyPreview({ modules, title }: SimpleReadOnlyPreviewProps) {
  return (
    <div className="space-y-4">
      {title && <div className="text-lg font-semibold text-gray-800 border-b pb-2">{title}</div>}

      {modules.map((module, index) => (
        <div key={module.id || index} className="p-4 border rounded-lg bg-white">
          <ReadOnlyMode modules={[module]} showActions={false} reason="permissions" />
        </div>
      ))}
    </div>
  )
}
