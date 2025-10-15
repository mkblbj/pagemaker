'use client'

import { useEffect, useState, useRef } from 'react'
import { HtmlModule, splitHtmlToModules } from '@/lib/htmlSplitter'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Image, Table2, Type, Minus } from 'lucide-react'
import { useTranslation } from '@/contexts/I18nContext'

// 模块预览组件 - 使用 iframe 自动调整高度
function ModulePreview({ html, index, kind, tEditor }: { html: string; index: number; kind: string; tEditor: (key: string) => string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(200)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (!iframeDoc) return

        // 自动调整 iframe 高度
        const resizeIframe = () => {
          const body = iframeDoc.body
          const html = iframeDoc.documentElement
          if (!body || !html) return

          const height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
          )
          setIframeHeight(Math.min(height + 10, 500)) // 最大 500px
        }

        // 等待内容加载完成
        setTimeout(resizeIframe, 100)

        // 监听窗口大小变化
        const observer = new ResizeObserver(resizeIframe)
        observer.observe(iframeDoc.body)

        return () => {
          observer.disconnect()
        }
      } catch (error) {
        console.error('调整 iframe 高度失败:', error)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }, [html])

  const getModuleIcon = (kind: string) => {
    switch (kind) {
      case 'gap':
        return <Minus className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'table':
        return <Table2 className="h-4 w-4" />
      case 'text':
        return <Type className="h-4 w-4" />
      default:
        return null
    }
  }

  const getModuleTypeLabel = (kind: string) => {
    switch (kind) {
      case 'gap':
        return tEditor('间隔')
      case 'image':
        return tEditor('图片')
      case 'table':
        return tEditor('表格')
      case 'text':
        return tEditor('文本')
      default:
        return kind
    }
  }

  return (
    <div className="border rounded-lg bg-muted/30 overflow-hidden">
      {/* 模块头部 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex items-center gap-2">
          {getModuleIcon(kind)}
          <Badge variant="secondary" className="text-xs">
            {getModuleTypeLabel(kind)}
          </Badge>
        </div>
      </div>
      {/* 模块内容预览 - 使用 iframe 隔离样式 */}
      <div className="p-3">
        <iframe
          ref={iframeRef}
          srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: inherit; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`}
          className="w-full border-0"
          style={{ 
            height: `${iframeHeight}px`
          }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}

export interface SplitPreviewDialogProps {
  open: boolean
  html: string
  onConfirm: (modules: HtmlModule[]) => void
  onCancel: () => void
}

interface ModuleStats {
  total: number
  gap: number
  image: number
  table: number
  text: number
}

/**
 * 拆分预览对话框
 * 
 * 显示 HTML 拆分结果的预览，让用户确认后再替换模块
 */
export function SplitPreviewDialog({ open, html, onConfirm, onCancel }: SplitPreviewDialogProps) {
  const { tEditor } = useTranslation()
  const [modules, setModules] = useState<HtmlModule[]>([])
  const [stats, setStats] = useState<ModuleStats>({ total: 0, gap: 0, image: 0, table: 0, text: 0 })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !html) {
      setModules([])
      setStats({ total: 0, gap: 0, image: 0, table: 0, text: 0 })
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 拆分 HTML
      const splitModules = splitHtmlToModules(html)
      
      if (splitModules.length === 0) {
        setError('无法拆分 HTML，请检查输入内容')
        setModules([])
        setStats({ total: 0, gap: 0, image: 0, table: 0, text: 0 })
        setIsLoading(false)
        return
      }

      setModules(splitModules)

      // 统计各类型模块数量
      const newStats = splitModules.reduce(
        (acc, m) => {
          acc[m.kind]++
          acc.total++
          return acc
        },
        { total: 0, gap: 0, image: 0, table: 0, text: 0 } as ModuleStats
      )
      setStats(newStats)
    } catch (err) {
      console.error('拆分 HTML 失败:', err)
      setError(err instanceof Error ? err.message : '拆分失败，请检查 HTML 格式')
      setModules([])
      setStats({ total: 0, gap: 0, image: 0, table: 0, text: 0 })
    } finally {
      setIsLoading(false)
    }
  }, [open, html])

  const handleConfirm = () => {
    if (modules.length > 0) {
      onConfirm(modules)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{tEditor('拆分预览')}</DialogTitle>
          <DialogDescription>
            {tEditor('查看 HTML 拆分结果，确认后将替换当前模块为多个可编辑模块')}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">{tEditor('正在拆分 HTML...')}</div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{tEditor('拆分失败')}</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && modules.length > 0 && (
          <>
            {/* 统计信息 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium">
                  {tEditor('拆分统计')}！{tEditor('共')} <span className="text-lg font-bold text-primary">{stats.total}</span> {tEditor('个模块')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {stats.gap > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Minus className="h-3 w-3" />
                    {tEditor('间隔')}: {stats.gap}
                  </Badge>
                )}
                {stats.image > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Image className="h-3 w-3" />
                    {tEditor('图片')}: {stats.image}
                  </Badge>
                )}
                {stats.table > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Table2 className="h-3 w-3" />
                    {tEditor('表格')}: {stats.table}
                  </Badge>
                )}
                {stats.text > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Type className="h-3 w-3" />
                    {tEditor('文本')}: {stats.text}
                  </Badge>
                )}
              </div>
            </div>

            {/* 模块预览列表 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{tEditor('模块预览')}（{tEditor('共')} {modules.length} {tEditor('个')}）：</h4>
              <ScrollArea className="h-[400px] border rounded-lg p-3">
                <div className="space-y-2">
                  {modules.map((m, i) => (
                    <ModulePreview
                      key={m.id}
                      html={m.html}
                      index={i}
                      kind={m.kind}
                      tEditor={tEditor}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {tEditor('取消')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || error !== null || modules.length === 0}
          >
            {tEditor('确认拆分')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

