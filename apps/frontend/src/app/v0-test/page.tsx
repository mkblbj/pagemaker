'use client'

import React from 'react'
import EditorLayout from '@/components/prototypes/EditorLayout'
import ModuleList from '@/components/prototypes/ModuleList'
import PropertiesPanel from '@/components/prototypes/PropertiesPanel'
import type { PageModule } from '@/components/prototypes/ModuleList'
import type { ModulePropertiesData } from '@/components/prototypes/PropertiesPanel'

const mockModules: PageModule[] = [
  {
    id: 'title-1',
    type: 'title',
    name: '标题',
    description: '添加一个页面或段落标题',
    icon: 'Type',
    category: 'basic'
  },
  {
    id: 'text-1',
    type: 'text',
    name: '文本块',
    description: '插入一段格式化文本内容',
    icon: 'Pilcrow',
    category: 'basic'
  },
  {
    id: 'image-1',
    type: 'image',
    name: '图片',
    description: '上传或选择一张图片',
    icon: 'ImageIcon',
    category: 'basic'
  }
]

const mockSelectedModule: ModulePropertiesData = {
  id: 'title-instance-1',
  type: 'title',
  name: '页面主标题',
  icon: 'Type',
  properties: {
    content: '欢迎来到我的页面',
    level: 'h1',
    alignment: 'center',
    color: '#1975B0',
    marginTop: 16,
    marginBottom: 24,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor: '#FFFFFF'
  }
}

export default function V0TestPage() {
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'error' | 'unsaved'>('unsaved')
  const [selectedModule, setSelectedModule] = React.useState<ModulePropertiesData | null>(mockSelectedModule)

  const handleSave = () => {
    setSaveStatus('saving')
    setTimeout(() => setSaveStatus('saved'), 1000)
  }

  const handleExport = () => {
    alert('导出HTML功能演示')
  }

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  const handleModuleDragStart = (event: React.DragEvent<HTMLDivElement>, module: PageModule) => {
    console.log('拖拽开始:', module.name)
  }

  const handleModuleDragEnd = () => {
    console.log('拖拽结束')
  }

  const handlePropertyChange = (moduleId: string, propertyPath: string, value: unknown) => {
    console.log('属性更改:', { moduleId, propertyPath, value })
    setSaveStatus('unsaved')
  }

  const handleDeleteModule = (moduleId: string) => {
    console.log('删除模块:', moduleId)
    setSelectedModule(null)
  }

  const handleResetModule = (moduleId: string) => {
    console.log('重置模块:', moduleId)
  }

  const leftPanelContent = (
    <ModuleList modules={mockModules} onModuleDragStart={handleModuleDragStart} onModuleDragEnd={handleModuleDragEnd} />
  )

  const rightPanelContent = (
    <PropertiesPanel
      selectedModule={selectedModule}
      onPropertyChange={handlePropertyChange}
      onDeleteModule={handleDeleteModule}
      onResetModule={handleResetModule}
    />
  )

  const canvasContent = (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-6 min-h-[600px]">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
          <h1 className="text-2xl font-bold text-blue-800 mb-2">v0.dev 原型测试画布</h1>
          <p className="text-blue-600">这里是可视化编辑区域。拖拽左侧模块到此处进行页面构建。</p>
        </div>

        {selectedModule && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h2 className="text-lg font-semibold mb-2">当前选中模块</h2>
            <div className="text-sm text-gray-600">
              <p>
                <strong>名称:</strong> {selectedModule.name}
              </p>
              <p>
                <strong>类型:</strong> {selectedModule.type}
              </p>
              <p>
                <strong>ID:</strong> {selectedModule.id}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <h3 className="font-medium mb-2">响应式测试</h3>
            <p className="text-sm text-gray-600">调整浏览器窗口大小查看响应式效果</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <h3 className="font-medium mb-2">无障碍访问</h3>
            <p className="text-sm text-gray-600">使用Tab键进行键盘导航测试</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <h3 className="font-medium mb-2">组件集成</h3>
            <p className="text-sm text-gray-600">shadcn/ui + Tailwind CSS 集成测试</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <EditorLayout
      onSave={handleSave}
      onExport={handleExport}
      onBack={handleBack}
      saveStatus={saveStatus}
      leftPanelContent={leftPanelContent}
      rightPanelContent={rightPanelContent}
      pageTitle="v0.dev 原型验证"
    >
      {canvasContent}
    </EditorLayout>
  )
}
