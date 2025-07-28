'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { usePageStore } from '@/stores/usePageStore'
import { Button } from '@/components/ui/button'
import { Save, Eye, Settings, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, RotateCcw, Clock, Loader2 } from 'lucide-react'
import { ModuleList } from './ModuleList'
import { Canvas } from './Canvas'
import { PropertyPanel } from './PropertyPanel'
import { TargetAreaSelector } from './TargetAreaSelector'
import { usePageEditor } from '@/hooks/usePageEditor'
import { DragProvider } from './dnd/DragContext'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { KeyboardShortcutsHelp, KeyboardShortcutsHelpRef } from './KeyboardShortcutsHelp'
import { ResetConfirmDialog } from './ResetConfirmDialog'
import { useTranslation } from '@/contexts/I18nContext'
import { HtmlExportButton } from '@/components/feature/HtmlExportButton'
import { ToastContainer } from '@/components/ui/toast'

interface EditorLayoutProps {
  pageId: string
}

export function EditorLayout({ pageId }: EditorLayoutProps) {
  const { tEditor } = useTranslation()
  const {
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    toggleLeftPanel,
    toggleRightPanel,
    leftPanelWidth,
    rightPanelWidth,
    setLeftPanelWidth,
    setRightPanelWidth
  } = useEditorStore()

  const { currentPage, hasUnsavedChanges, clearAllModules, markUnsaved } = usePageStore()
  const { savePage, isSaving, previewPage } = usePageEditor()

  const helpDialogRef = useRef<KeyboardShortcutsHelpRef>(null)

  // 重置确认对话框状态
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  // 面板调整相关状态
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // 处理键盘快捷键帮助
  const handleShowHelp = useCallback(() => {
    helpDialogRef.current?.openDialog()
  }, [])

  // 处理重置所有模块
  const handleResetAllModules = useCallback(() => {
    setResetDialogOpen(true)
  }, [])

  // 确认重置所有模块
  const handleConfirmReset = useCallback(() => {
    clearAllModules()
    markUnsaved()
  }, [clearAllModules, markUnsaved])

  // 面板调整处理函数
  const handleMouseDown = useCallback(
    (panel: 'left' | 'right', e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(panel)
      setStartX(e.clientX)
      setStartWidth(panel === 'left' ? leftPanelWidth : rightPanelWidth)
    },
    [leftPanelWidth, rightPanelWidth]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const diff = e.clientX - startX
      let newWidth: number

      if (isResizing === 'left') {
        newWidth = Math.max(200, Math.min(500, startWidth + diff))
        setLeftPanelWidth(newWidth)
      } else {
        newWidth = Math.max(250, Math.min(500, startWidth - diff))
        setRightPanelWidth(newWidth)
      }
    },
    [isResizing, startX, startWidth, setLeftPanelWidth, setRightPanelWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(null)
  }, [])

  // 监听鼠标事件
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // 使用新的预览页面进行预览
  const handlePreview = async () => {
    if (!currentPage) return

    try {
      // 如果有未保存的更改，先保存
      if (hasUnsavedChanges) {
        await savePage()
      }

      // 使用新的预览页面路由
      const previewUrl = `/preview/${currentPage.id}`
      window.open(previewUrl, '_blank', 'width=480,height=900,scrollbars=no,resizable=yes')
    } catch (error) {
      console.error('预览失败:', error)
      // 备用预览方法 - 使用HTML导出服务直接预览
      try {
        const { generateHTML } = await import('@/services/htmlExportService')
        const { targetArea } = usePageStore.getState()

        const isMobileMode = targetArea === 'mobile'
        const exportOptions = {
          includeStyles: !isMobileMode,
          minify: true,
          title: currentPage.name || '页面预览',
          description: `使用 Pagemaker CMS 创建的页面：${currentPage.name}`,
          language: 'ja-JP',
          fullDocument: true,
          mobileMode: isMobileMode
        }

        const html = generateHTML(currentPage.content, exportOptions)
        
        // 创建简化的iPhone预览窗口
        const previewWindow = window.open('', '_blank', 'width=480,height=900,scrollbars=no,resizable=yes')
        if (previewWindow) {
          const previewHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>预览: ${currentPage.name}</title>
  <style>
              body {
       margin: 0;
        padding: 54px 12px 0 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: white;
        overflow-x: hidden;
       }
       .preview-content {
         width: 100%;
          height: calc(100vh - 54px);
          overflow-y: auto;
          /* 隐藏滚动条 */
          scrollbar-width: none;
          -ms-overflow-style: none;
         }
         .preview-content::-webkit-scrollbar {
           display: none;
         }
  </style>
</head>
<body>
  <div class="preview-content">
    ${html}
  </div>
</body>
</html>`
          previewWindow.document.write(previewHtml)
          previewWindow.document.close()
        }
      } catch (fallbackError) {
        console.error('备用预览也失败:', fallbackError)
        // 最后的备用方法
        previewPage()
      }
    }
  }

  return (
    <DragProvider>
      <KeyboardShortcuts onShowHelp={handleShowHelp} />
      <KeyboardShortcutsHelp ref={helpDialogRef} />
      <ToastContainer />
      <div className="flex h-full bg-gray-50 overflow-hidden" data-testid="editor-layout">
        {/* 左侧面板 - 模块列表 */}
        <div
          className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 overflow-hidden ${isLeftPanelCollapsed ? 'w-0' : ''}`}
          style={{ width: isLeftPanelCollapsed ? 0 : leftPanelWidth }}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{tEditor('模块库')}</h2>
                <Button variant="ghost" size="sm" onClick={toggleLeftPanel} className="hover:bg-white/50">
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <ModuleList />
            </div>
          </div>
        </div>

        {/* 左侧分割条 */}
        {!isLeftPanelCollapsed && (
          <div
            className={`w-1 bg-gray-200 hover:bg-blue-300 cursor-col-resize transition-colors select-none flex-shrink-0 ${isResizing === 'left' ? 'bg-blue-400' : ''}`}
            onMouseDown={e => handleMouseDown('left', e)}
          />
        )}

        {/* 中间画布区域 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 优化后的顶部工具栏 - 分为两行 */}
          <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
            {/* 第一行：页面信息和状态 */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center gap-6">
                {/* 左侧面板切换 */}
                {isLeftPanelCollapsed && (
                  <Button variant="ghost" size="sm" onClick={toggleLeftPanel}>
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                )}

                {/* 页面标题 */}
                <div>
                  <h1 className="text-lg font-semibold">{currentPage?.name || tEditor('页面编辑器')}</h1>
                </div>

                {/* 页面状态信息 */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>{tEditor('页面模块数量')}:</span>
                    <span className="font-medium text-foreground">{currentPage?.content?.length || 0}</span>
                  </div>
                  <div className="h-4 w-px bg-border" /> {/* 分隔线 */}
                  <div className="flex items-center gap-1">
                    <span>{tEditor('页面ID')}:</span>
                    <span className="font-mono text-xs">{pageId}</span>
                  </div>
                  <div className="h-4 w-px bg-border" /> {/* 分隔线 */}
                  <div className="flex items-center gap-1">
                    <span>{tEditor('最后更新')}:</span>
                    <span className="text-xs">
                      {currentPage?.updated_at
                        ? new Date(currentPage.updated_at).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : tEditor('未保存')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 保存状态指示 */}
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span>{tEditor('有未保存的更改')}</span>
                  </div>
                )}

                {/* 右侧面板切换 */}
                {isRightPanelCollapsed && (
                  <Button variant="ghost" size="sm" onClick={toggleRightPanel}>
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* 第二行：操作按钮 */}
            <div className="h-14 px-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={savePage}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {tEditor('保存中')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {tEditor('保存')}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {tEditor('预览')}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAllModules}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {tEditor('重置')}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <HtmlExportButton 
                  modules={currentPage?.content || []}
                  pageTitle={currentPage?.name}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowHelp}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {tEditor('帮助')}
                </Button>
              </div>
            </div>
          </div>

          {/* 画布区域 */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <div className="h-full overflow-y-auto">
              <div className="p-4 md:p-6">
                {/* 移动端画布宽度调整为一半 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-full w-full md:max-w-[50%] md:mx-auto">
                  <Canvas />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧分割条 */}
        {!isRightPanelCollapsed && (
          <div
            className={`w-1 bg-gray-200 hover:bg-blue-300 cursor-col-resize transition-colors select-none flex-shrink-0 ${isResizing === 'right' ? 'bg-blue-400' : ''}`}
            onMouseDown={e => handleMouseDown('right', e)}
          />
        )}

        {/* 右侧面板 - 属性编辑 */}
        <div
          className={`bg-white border-l border-gray-200 shadow-sm transition-all duration-300 overflow-hidden ${isRightPanelCollapsed ? 'w-0' : ''}`}
          style={{ width: isRightPanelCollapsed ? 0 : rightPanelWidth }}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{tEditor('属性设置')}</h2>
                <Button variant="ghost" size="sm" onClick={toggleRightPanel} className="hover:bg-white/50">
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <PropertyPanel />
            </div>
          </div>
        </div>
      </div>

      {/* 重置确认对话框 */}
      <ResetConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onConfirm={handleConfirmReset}
      />
    </DragProvider>
  )
}
