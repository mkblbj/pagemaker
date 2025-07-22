'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { usePageStore } from '@/stores/usePageStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Eye,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react'
import { ModuleList } from './ModuleList'
import { Canvas } from './Canvas'
import { PropertyPanel } from './PropertyPanel'
import { TargetAreaSelector } from './TargetAreaSelector'
import { usePageEditor } from '@/hooks/usePageEditor'
import { DragProvider } from './dnd/DragContext'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { KeyboardShortcutsHelp, KeyboardShortcutsHelpRef } from './KeyboardShortcutsHelp'
import { useTranslation } from '@/contexts/I18nContext'
import { HtmlExportButton } from '@/components/feature/HtmlExportButton'

interface EditorLayoutProps {
  pageId: string
}

export function EditorLayout({ pageId }: EditorLayoutProps) {
  const { tEditor } = useTranslation()
  const {
    leftPanelWidth,
    rightPanelWidth,
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    setLeftPanelWidth,
    setRightPanelWidth,
    toggleLeftPanel,
    toggleRightPanel,
    isLoading,
    error
  } = useEditorStore()

  const { currentPage, hasUnsavedChanges } = usePageStore()
  const { isSaving, savePage, previewPage } = usePageEditor()

  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartWidth, setDragStartWidth] = useState(0)

  // 键盘快捷键帮助对话框状态
  const helpDialogRef = useRef<KeyboardShortcutsHelpRef | null>(null)

  // 处理显示帮助对话框
  const handleShowHelp = useCallback(() => {
    helpDialogRef.current?.openDialog()
  }, [])

  // 处理分割条拖拽开始
  const handleMouseDown = useCallback(
    (panel: 'left' | 'right', e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(panel)
      setDragStartX(e.clientX)

      if (panel === 'left') {
        setDragStartWidth(leftPanelWidth)
      } else {
        setDragStartWidth(rightPanelWidth)
      }
    },
    [leftPanelWidth, rightPanelWidth]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      e.preventDefault()
      const deltaX = e.clientX - dragStartX

      if (isResizing === 'left') {
        const newWidth = Math.max(200, Math.min(500, dragStartWidth + deltaX))
        setLeftPanelWidth(newWidth)
      } else if (isResizing === 'right') {
        const newWidth = Math.max(250, Math.min(600, dragStartWidth - deltaX))
        setRightPanelWidth(newWidth)
      }
    },
    [isResizing, dragStartX, dragStartWidth, setLeftPanelWidth, setRightPanelWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(null)
    setDragStartX(0)
    setDragStartWidth(0)
  }, [])

  // 防止默认事件 - 移到useEffect外面确保引用稳定
  const preventDefault = useCallback((e: Event) => {
    e.preventDefault()
  }, [])

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isResizing && typeof window !== 'undefined') {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('selectstart', preventDefault) // 防止文本选择

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('selectstart', preventDefault)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp, preventDefault])

  // 如果正在加载，显示加载指示器
  if (isLoading) {
    return (
      <div className="flex h-screen bg-background" data-testid="editor-layout">
        <div className="flex items-center justify-center w-full">
          <div className="text-center" data-testid="loading-indicator">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">{tEditor('加载中')}...</p>
          </div>
        </div>
      </div>
    )
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="flex h-screen bg-background" data-testid="editor-layout">
        <div className="flex items-center justify-center w-full">
          <div className="text-center" data-testid="error-message">
            <p className="text-destructive mb-2">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {tEditor('重新加载')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DragProvider>
      <KeyboardShortcuts onShowHelp={handleShowHelp} />
      <KeyboardShortcutsHelp ref={helpDialogRef} />
      <div className="flex h-screen bg-background" data-testid="editor-layout">
        {/* 左侧面板 - 模块列表 */}
        <div
          className={`bg-card border-r transition-all duration-300 overflow-x-hidden ${isLeftPanelCollapsed ? 'w-0 overflow-hidden' : ''}`}
          style={{ width: isLeftPanelCollapsed ? 0 : leftPanelWidth }}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{tEditor('模块库')}</h2>
                <Button variant="ghost" size="sm" onClick={toggleLeftPanel}>
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ModuleList />
            </div>
          </div>
        </div>

        {/* 左侧分割条 */}
        {!isLeftPanelCollapsed && (
          <div
            className={`w-1 bg-border hover:bg-primary/20 cursor-col-resize transition-colors select-none ${isResizing === 'left' ? 'bg-primary/30' : ''}`}
            onMouseDown={e => handleMouseDown('left', e)}
          />
        )}

        {/* 中间画布区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 顶部工具栏 */}
          <div className="h-16 bg-card border-b px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 左侧面板切换 */}
              {isLeftPanelCollapsed && (
                <Button variant="ghost" size="sm" onClick={toggleLeftPanel}>
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}

              {/* 页面标题 */}
              <div>
                <h1 className="text-xl font-semibold">{currentPage?.name || tEditor('页面编辑器')}</h1>
                <p className="text-sm text-muted-foreground">
                  {tEditor('页面ID')}: {pageId}
                </p>
              </div>

              {/* 目标区域选择 */}
              <TargetAreaSelector />
            </div>

            <div className="flex items-center gap-2">
              {/* 保存状态指示 */}
              {hasUnsavedChanges && (
                <span className="text-sm text-muted-foreground" data-testid="unsaved-indicator">
                  {tEditor('未保存的更改')}
                </span>
              )}

              {/* 操作按钮 */}
              <Button variant="outline" size="sm" onClick={previewPage}>
                <Eye className="h-4 w-4 mr-2" />
                {tEditor('预览')}
              </Button>
              <Button variant="outline" size="sm" disabled={isSaving} onClick={savePage}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? tEditor('保存中...') : tEditor('保存')}
              </Button>
              <HtmlExportButton
                modules={currentPage?.content || []}
                pageTitle={currentPage?.name}
                variant="outline"
                size="sm"
              />
              <Button variant="outline" size="sm" onClick={handleShowHelp}>
                <Settings className="h-4 w-4 mr-2" />
                {tEditor('帮助')}
              </Button>

              {/* 右侧面板切换 */}
              {isRightPanelCollapsed && (
                <Button variant="ghost" size="sm" onClick={toggleRightPanel}>
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 画布区域 */}
          <div className="flex-1 overflow-auto">
            <Canvas />
          </div>
        </div>

        {/* 右侧分割条 */}
        {!isRightPanelCollapsed && (
          <div
            className={`w-1 bg-border hover:bg-primary/20 cursor-col-resize transition-colors select-none ${isResizing === 'right' ? 'bg-primary/30' : ''}`}
            onMouseDown={e => handleMouseDown('right', e)}
          />
        )}

        {/* 右侧面板 - 属性编辑 */}
        <div
          className={`bg-card border-l transition-all duration-300 ${isRightPanelCollapsed ? 'w-0 overflow-hidden' : ''}`}
          style={{ width: isRightPanelCollapsed ? 0 : rightPanelWidth }}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{tEditor('属性面板')}</h2>
                <Button variant="ghost" size="sm" onClick={toggleRightPanel}>
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <PropertyPanel />
            </div>
          </div>
        </div>
      </div>
    </DragProvider>
  )
}
