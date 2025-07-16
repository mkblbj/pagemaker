'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, Copy, Check, Code, Eye, Settings, AlertCircle, Info } from 'lucide-react'
import { generateHTML, type HtmlExportOptions } from '@/services/htmlExportService'
import { copyTextWithFeedback, getClipboardCapabilities } from '@/lib/clipboardUtils'
import type { PageModule } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

interface HtmlExportButtonProps {
  modules: PageModule[]
  pageTitle?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
}

export function HtmlExportButton({
  modules,
  pageTitle = '导出页面',
  className,
  variant = 'default',
  size = 'default',
  disabled = false
}: HtmlExportButtonProps) {
  const { tEditor, tCommon } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [generatedHTML, setGeneratedHTML] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopying, setCopying] = useState(false)
  const [exportOptions, setExportOptions] = useState<HtmlExportOptions>({
    includeStyles: true,
    minify: false,
    title: pageTitle,
    description: `使用 Pagemaker CMS 创建的页面：${pageTitle}`,
    language: 'ja-JP',
    fullDocument: false // 默认只导出内容部分
  })

  const clipboardCapabilities = getClipboardCapabilities()

  // 生成HTML
  const handleGenerateHTML = async () => {
    setIsGenerating(true)
    try {
      // 模拟短暂延迟以显示加载状态
      await new Promise(resolve => setTimeout(resolve, 300))

      const html = generateHTML(modules, exportOptions)
      setGeneratedHTML(html)
    } catch (error) {
      console.error('HTML生成失败:', error)
      // 这里可以添加错误处理
    } finally {
      setIsGenerating(false)
    }
  }

  // 复制HTML到剪贴板
  const handleCopyHTML = async () => {
    if (!generatedHTML) return

    setCopying(true)
    try {
      await copyTextWithFeedback(generatedHTML)
    } catch (error) {
      console.error('复制失败:', error)
    } finally {
      setCopying(false)
    }
  }

  // 预览HTML
  const handlePreviewHTML = () => {
    if (!generatedHTML) return

    const previewWindow = window.open('', '_blank', 'width=1200,height=800')
    if (previewWindow) {
      previewWindow.document.write(generatedHTML)
      previewWindow.document.close()
    }
  }

  // 对话框打开时自动生成HTML
  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open)
    if (open && !generatedHTML) {
      handleGenerateHTML()
    }
  }

  // 计算HTML大小
  const getHTMLSize = () => {
    if (!generatedHTML) return '0 KB'
    const bytes = new Blob([generatedHTML]).size
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  // 计算模块数量
  const getModuleCount = () => modules.length

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={disabled || modules.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {tEditor('导出HTML')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {tEditor('导出页面HTML')}
          </DialogTitle>
          <DialogDescription>{tEditor('生成完整的HTML代码，可直接粘贴到乐天店铺后台使用')}</DialogDescription>
        </DialogHeader>

        {/* 可滚动内容区域 */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
          {/* 页面信息 */}
          <div className="flex items-center gap-4 py-2">
            <Badge variant="outline" className="text-xs">
              {getModuleCount()} {tEditor('个模块')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getHTMLSize()}
            </Badge>
            {exportOptions.fullDocument && (
              <Badge variant="secondary" className="text-xs">
                {tEditor('完整文档')}
              </Badge>
            )}
            {exportOptions.includeStyles && exportOptions.fullDocument && (
              <Badge variant="secondary" className="text-xs">
                {tEditor('包含样式')}
              </Badge>
            )}
            {exportOptions.minify && (
              <Badge variant="secondary" className="text-xs">
                {tEditor('已压缩')}
              </Badge>
            )}
          </div>

          <Separator />

          {/* 导出选项 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{tEditor('导出选项')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.fullDocument}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      fullDocument: e.target.checked
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm">{tEditor('完整HTML文档')}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeStyles}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      includeStyles: e.target.checked
                    }))
                  }
                  className="rounded"
                  disabled={!exportOptions.fullDocument}
                />
                <span className="text-sm">{tEditor('包含CSS样式')}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.minify}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      minify: e.target.checked
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm">{tEditor('压缩HTML代码')}</span>
              </label>
            </div>
          </div>

          <Separator />

          {/* HTML代码区域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{tEditor('生成的HTML代码')}</h4>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerateHTML} disabled={isGenerating}>
                  <Settings className="h-4 w-4 mr-1" />
                  {isGenerating ? tEditor('生成中...') : tEditor('重新生成')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewHTML}
                  disabled={!generatedHTML || isGenerating}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {tEditor('预览')}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCopyHTML}
                  disabled={!generatedHTML || isCopying || isGenerating}
                >
                  {isCopying ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {isCopying ? tEditor('已复制') : tEditor('复制代码')}
                </Button>
              </div>
            </div>

            {/* 代码显示区域 */}
            <div className="border rounded-lg overflow-hidden">
              {isGenerating ? (
                <div className="h-48 flex items-center justify-center bg-muted/30">
                  <div className="text-center space-y-2">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-muted-foreground">{tEditor('正在生成HTML代码...')}</p>
                  </div>
                </div>
              ) : generatedHTML ? (
                <Textarea
                  value={generatedHTML}
                  readOnly
                  className="h-48 font-mono text-xs resize-none border-0 focus-visible:ring-0"
                  placeholder={tEditor('HTML代码将在这里显示...')}
                />
              ) : (
                <div className="h-48 flex items-center justify-center bg-muted/30">
                  <div className="text-center space-y-2">
                    <Code className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{tEditor('点击"重新生成"按钮生成HTML代码')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 使用提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">{tEditor('使用说明')}</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>{tEditor('默认导出纯内容HTML，适合直接粘贴到乐天店铺后台')}</li>
                  <li>{tEditor('勾选"完整HTML文档"可导出包含头部的完整HTML文件')}</li>
                  <li>{tEditor('建议在粘贴前先在预览中确认页面效果')}</li>
                  <li>{tEditor('如果样式显示异常，请确保乐天后台支持自定义CSS')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 浏览器兼容性警告 */}
          {!clipboardCapabilities.canCopyText && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">{tEditor('浏览器兼容性提示')}</p>
                  <p className="text-xs mt-1">
                    {tEditor('您的浏览器可能不完全支持自动复制功能，请手动选择代码并复制')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default HtmlExportButton
