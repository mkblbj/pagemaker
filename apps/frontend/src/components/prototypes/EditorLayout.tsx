'use client'

import * as React from 'react'
import { Save, Download, ArrowLeft, Plus, ChevronRight, Settings2, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface EditorLayoutProps {
  children?: React.ReactNode
  onSave?: () => void
  onExport?: () => void
  onBack?: () => void
  saveStatus?: 'saved' | 'saving' | 'error' | 'unsaved'
  leftPanelContent?: React.ReactNode
  rightPanelContent?: React.ReactNode
  pageTitle?: string
}

export default function EditorLayout({
  children,
  onSave,
  onExport,
  onBack,
  saveStatus = 'unsaved',
  leftPanelContent = <DefaultLeftPanelContent />,
  rightPanelContent = <DefaultRightPanelContent />,
  pageTitle = '编辑页面'
}: EditorLayoutProps) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = React.useState(false)
  const [isRightPanelOpen, setIsRightPanelOpen] = React.useState(false)

  const getSaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saved':
        return <span className="text-sm text-green-600">已保存</span>
      case 'saving':
        return <span className="text-sm text-blue-600 animate-pulse">保存中...</span>
      case 'error':
        return <span className="text-sm text-red-600">保存失败</span>
      default:
        return <span className="text-sm text-gray-500">未保存</span>
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
      {/* Top Bar */}
      <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsLeftPanelOpen(true)}
            aria-label="打开模块选择面板"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <nav aria-label="面包屑导航">
            <ol className="flex items-center space-x-1.5 text-sm text-gray-500">
              <li>
                <a href="#" className="hover:text-blue-600">
                  页面管理
                </a>
              </li>
              <li>
                <ChevronRight className="h-4 w-4" />
              </li>
              <li>
                <span className="font-medium text-gray-700">{pageTitle}</span>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {getSaveStatusIndicator()}
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="hidden sm:inline-flex bg-white text-gray-700 hover:bg-gray-100"
              aria-label="保存页面"
            >
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="bg-blue-600 text-white hover:bg-blue-700"
              aria-label="导出HTML"
            >
              <Download className="h-4 w-4 mr-2" />
              导出HTML
            </Button>
          )}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-gray-600 hover:text-blue-600"
              aria-label="返回"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsRightPanelOpen(true)}
            aria-label="打开属性配置面板"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel (Desktop) */}
        <aside className="hidden md:flex flex-col w-[300px] bg-white border-r border-gray-200 shrink-0 overflow-y-auto">
          <PanelHeader title="模块选择" />
          <div className="p-4 flex-1">{leftPanelContent}</div>
        </aside>

        {/* Mobile Left Panel (Sheet) */}
        <Sheet open={isLeftPanelOpen} onOpenChange={setIsLeftPanelOpen}>
          <SheetContent side="left" className="w-[300px] p-0 md:hidden bg-white">
            <SheetHeader className="p-4 border-b border-gray-200">
              <SheetTitle>模块选择</SheetTitle>
            </SheetHeader>
            <div className="p-4">{leftPanelContent}</div>
          </SheetContent>
        </Sheet>

        {/* Center Canvas */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100"
          style={{ minWidth: '320px' }}
          aria-label="可视化编辑画布"
          tabIndex={0} // For keyboard navigation
        >
          {children || <DefaultCanvasContent />}
        </main>

        {/* Right Panel (Desktop) */}
        <aside className="hidden md:flex flex-col w-[320px] bg-white border-l border-gray-200 shrink-0 overflow-y-auto">
          <PanelHeader title="属性配置" />
          <div className="p-4 flex-1">{rightPanelContent}</div>
        </aside>

        {/* Mobile Right Panel (Sheet) */}
        <Sheet open={isRightPanelOpen} onOpenChange={setIsRightPanelOpen}>
          <SheetContent side="right" className="w-[320px] p-0 md:hidden bg-white">
            <SheetHeader className="p-4 border-b border-gray-200">
              <SheetTitle>属性配置</SheetTitle>
            </SheetHeader>
            <div className="p-4">{rightPanelContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

// Placeholder components for panels and canvas
const PanelHeader = ({ title }: { title: string }) => (
  <div className="h-12 flex items-center px-4 border-b border-gray-200 shrink-0">
    <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
  </div>
)

const DefaultLeftPanelContent = () => (
  <div className="space-y-2">
    <p className="text-sm text-gray-500 mb-4">从这里选择模块添加到页面。</p>
    {['文本块', '图片', '按钮组', '轮播图', '产品列表'].map(item => (
      <div
        key={item}
        className="p-3 border border-gray-200 rounded-md hover:border-blue-600 hover:shadow-sm cursor-grab bg-white flex items-center"
        draggable
        onDragStart={e => e.dataTransfer.setData('text/plain', item)}
        aria-label={`拖拽 ${item} 模块`}
      >
        <LayoutGrid className="h-4 w-4 mr-2 text-gray-400" />
        {item}
      </div>
    ))}
  </div>
)

const DefaultRightPanelContent = () => (
  <div>
    <p className="text-sm text-gray-500">选中模块后，在这里配置属性。</p>
    {/* Example properties */}
    <div className="mt-4 space-y-3">
      <div>
        <label htmlFor="text-color" className="text-xs text-gray-600 block mb-1">
          文字颜色
        </label>
        <input
          type="color"
          id="text-color"
          defaultValue="#333333"
          className="w-full h-8 border border-gray-300 rounded"
        />
      </div>
      <div>
        <label htmlFor="padding" className="text-xs text-gray-600 block mb-1">
          内边距 (px)
        </label>
        <input
          type="number"
          id="padding"
          defaultValue="16"
          className="w-full p-2 border border-gray-300 rounded text-sm"
        />
      </div>
    </div>
  </div>
)

const DefaultCanvasContent = () => (
  <div
    className="w-full h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white"
    onDragOver={e => {
      e.preventDefault()
      e.currentTarget.classList.add('border-blue-600', 'bg-blue-50')
    }}
    onDragLeave={e => {
      e.currentTarget.classList.remove('border-blue-600', 'bg-blue-50')
    }}
    onDrop={e => {
      e.preventDefault()
      e.currentTarget.classList.remove('border-blue-600', 'bg-blue-50')
      const data = e.dataTransfer.getData('text/plain')
      alert(`放置了模块: ${data}`)
    }}
    aria-label="拖拽模块到此区域"
  >
    <Plus className="h-12 w-12 text-gray-400 mb-2" />
    <p className="text-gray-500">将模块拖拽到这里</p>
    <p className="text-xs text-gray-400 mt-1">
      或点击{' '}
      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600">
        添加模块
      </Button>
    </p>
  </div>
)
