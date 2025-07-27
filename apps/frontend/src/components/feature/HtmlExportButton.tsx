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
import { usePageStore } from '@/stores/usePageStore'
import { useEffect } from 'react'

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
  const { targetArea } = usePageStore()
  const [isOpen, setIsOpen] = useState(false)
  const [generatedHTML, setGeneratedHTML] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopying, setCopying] = useState(false)

  // 根据目标区域自动设置导出选项
  const isMobileMode = targetArea === 'mobile'
  const [exportOptions, setExportOptions] = useState<HtmlExportOptions>({
    includeStyles: !isMobileMode, // 移动端模式下不包含样式
    minify: true, // デフォルトで圧縮を有効化
    title: pageTitle,
    description: `使用 Pagemaker CMS 创建的页面：${pageTitle}`,
    language: 'ja-JP',
    fullDocument: false, // 默认只导出内容部分
    mobileMode: isMobileMode // 移动端页面自动启用乐天模式
  })

  const clipboardCapabilities = getClipboardCapabilities()

  // 监听模块变化，自动清除生成的HTML
  useEffect(() => {
    setGeneratedHTML('')
  }, [modules])

  // 更新页面标题时同步更新导出选项
  useEffect(() => {
    setExportOptions(prev => ({
      ...prev,
      title: pageTitle,
      description: `使用 Pagemaker CMS 创建的页面：${pageTitle}`
    }))
  }, [pageTitle])

  // 监听目标区域变化，自动调整导出模式
  useEffect(() => {
    const isMobile = targetArea === 'mobile'
    setExportOptions(prev => ({
      ...prev,
      mobileMode: isMobile,
      includeStyles: !isMobile, // 移动端模式下禁用样式
      fullDocument: !isMobile // 移动端模式下禁用完整文档
    }))
  }, [targetArea])

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
      // 优先使用现有的textarea元素（在对话框环境中最可靠）
      const existingTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement
      if (existingTextarea) {
        existingTextarea.focus()
        existingTextarea.select()
        existingTextarea.setSelectionRange(0, existingTextarea.value.length)

        const success = document.execCommand('copy')

        if (success) {
          showCopyFeedback('内容已复制到剪贴板', true)
          return
        }
      }

      // 备选方案：创建新元素
      handleDirectCopy()
    } catch (error) {
      console.error('复制失败:', error)
      handleDirectCopy()
    } finally {
      setCopying(false)
    }
  }

  // 显示复制反馈
  const showCopyFeedback = (message: string, isSuccess: boolean) => {
    const feedback = document.createElement('div')
    feedback.textContent = message
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      background-color: ${isSuccess ? '#10b981' : '#ef4444'};
      box-shadow: 0 4px 12px ${isSuccess ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
    `

    document.body.appendChild(feedback)

    // 显示动画
    requestAnimationFrame(() => {
      feedback.style.transform = 'translateX(0)'
    })

    // 自动移除
    setTimeout(() => {
      feedback.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (feedback.parentNode) {
          document.body.removeChild(feedback)
        }
      }, 300)
    }, 3000)
  }

  // 直接复制方法（备选方案）
  const handleDirectCopy = () => {
    if (!generatedHTML) return

    try {
      const textArea = document.createElement('textarea')
      textArea.value = generatedHTML
      textArea.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        opacity: 0;
      `

      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      textArea.setSelectionRange(0, generatedHTML.length)

      const success = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (success) {
        showCopyFeedback('内容已复制到剪贴板', true)
      } else {
        showCopyFeedback('复制失败，请手动复制', false)
        setTimeout(() => showManualCopyDialog(), 1000)
      }
    } catch (error) {
      console.error('直接复制失败:', error)
      showCopyFeedback('复制失败，请手动复制', false)
      setTimeout(() => showManualCopyDialog(), 1000)
    }
  }

  // 显示手动复制对话框
  const showManualCopyDialog = () => {
    if (!generatedHTML) return

    const dialog = document.createElement('div')
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    const content = document.createElement('div')
    content.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      max-width: 600px;
      width: 90%;
    `

    const title = document.createElement('h3')
    title.textContent = '手动复制'
    title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px;'

    const instruction = document.createElement('p')
    instruction.textContent = '请手动选择下面的代码并按 Ctrl+C 复制：'
    instruction.style.cssText = 'margin: 0 0 12px 0;'

    const textarea = document.createElement('textarea')
    textarea.value = generatedHTML
    textarea.style.cssText = `
      width: 100%;
      height: 200px;
      font-family: monospace;
      font-size: 12px;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `

    const closeBtn = document.createElement('button')
    closeBtn.textContent = '关闭'
    closeBtn.style.cssText = `
      margin-top: 16px;
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `

    closeBtn.onclick = () => document.body.removeChild(dialog)
    dialog.onclick = e => {
      if (e.target === dialog) document.body.removeChild(dialog)
    }

    content.appendChild(title)
    content.appendChild(instruction)
    content.appendChild(textarea)
    content.appendChild(closeBtn)
    dialog.appendChild(content)
    document.body.appendChild(dialog)

    // 自动选中文本
    setTimeout(() => {
      textarea.focus()
      textarea.select()
    }, 100)
  }

  // 预览HTML
  const handlePreviewHTML = () => {
    if (!generatedHTML) return

    // 使用localStorage传递预览内容，避免URL长度限制
    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(previewId, generatedHTML)
    const previewUrl = `/preview?id=${previewId}`
    
    // 在新窗口打开预览页面（指定窗口特性以确保打开新窗口而非标签页）
    window.open(previewUrl, '_blank', 'width=500,height=900,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no')
  }

  // 对话框打开时自动生成HTML
  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // 总是重新生成HTML以确保最新内容
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

      <DialogContent
        className="w-[95vw] max-w-6xl sm:max-w-6xl md:max-w-6xl lg:max-w-6xl xl:max-w-6xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ maxWidth: '72rem', width: '95vw' }}
      >
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
            {isMobileMode && (
              <Badge variant="secondary" className="text-xs">
                {tEditor('乐天模式')}
              </Badge>
            )}
          </div>

          <Separator />

          {/* 导出选项 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{tEditor('导出选项')}</h4>
            {isMobileMode ? (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">{tEditor('移动端页面 - 自动乐天模式')}</p>
                  <p>
                    {tEditor('检测到移动端页面，已自动启用乐天HTML约束：使用<p>标签、<font>标签和有限的HTML标签。')}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              {!isMobileMode && (
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
              )}
              {!isMobileMode && (
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
                  <span className={`text-sm ${!exportOptions.fullDocument ? 'text-gray-400' : ''}`}>
                    {tEditor('包含CSS样式')}
                  </span>
                </label>
              )}
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
                {!generatedHTML && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    {tEditor('需要重新生成')}
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleGenerateHTML} disabled={isGenerating}>
                  <Settings className="h-4 w-4 mr-1" />
                  {isGenerating ? tEditor('生成中...') : tEditor('重新生成')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewHTML}
                  disabled={!generatedHTML || isGenerating}
                  data-preview-button
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
