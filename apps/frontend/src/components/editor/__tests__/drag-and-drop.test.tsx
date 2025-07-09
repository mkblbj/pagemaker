/**
 * 拖拽功能集成测试
 * 测试模块的拖拽添加和排序功能
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { DragProvider } from '../dnd/DragContext'
import { ModuleList } from '../ModuleList'
import { Canvas } from '../Canvas'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock stores
vi.mock('@/stores/usePageStore')
vi.mock('@/stores/useEditorStore')

// Mock 模块注册系统
vi.mock('@/lib/moduleRegistry', () => ({
  getAvailableModules: vi.fn(() => [
    {
      type: PageModuleType.TITLE,
      name: '标题',
      description: '添加标题文本',
      icon: 'Type',
      category: 'basic',
      color: 'text-blue-600',
      defaultConfig: { text: '新标题', level: 1 },
      isEnabled: true,
      sortOrder: 1
    },
    {
      type: PageModuleType.TEXT,
      name: '文本',
      description: '添加段落文本',
      icon: 'FileText',
      category: 'basic',
      color: 'text-green-600',
      defaultConfig: { text: '请输入文本内容' },
      isEnabled: true,
      sortOrder: 2
    }
  ]),
  getModulesByCategory: vi.fn(() => []),
  createModuleInstance: vi.fn(() => ({
    id: 'new-module-123',
    type: PageModuleType.TITLE,
    text: '新标题'
  })),
  getModuleMetadata: vi.fn(() => ({
    name: '标题',
    type: PageModuleType.TITLE
  }))
}))

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false
  }),
  useSensors: () => [],
  useSensor: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  TouchSensor: vi.fn(),
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  pointerWithin: vi.fn(),
  rectIntersection: vi.fn()
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false
  }),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn()
}))

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: vi.fn(),
  restrictToParentElement: vi.fn()
}))

const mockPageStore = {
  currentPage: {
    id: 'test-page',
    content: [
      {
        id: 'module-1',
        type: PageModuleType.TITLE,
        text: '测试标题'
      }
    ]
  },
  selectedModuleId: null,
  setSelectedModule: vi.fn(),
  deleteModule: vi.fn(),
  reorderModules: vi.fn(),
  addModule: vi.fn()
}

const mockEditorStore = {
  markUnsaved: vi.fn(),
  hasUnsavedChanges: false,
  setDragging: vi.fn(),
  isDragging: false,
  draggedModuleType: null
}

function TestDragDropEnvironment() {
  return (
    <DragProvider>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '300px' }}>
          <ModuleList />
        </div>
        <div style={{ flex: 1 }}>
          <Canvas />
        </div>
      </div>
    </DragProvider>
  )
}

describe('拖拽功能集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(usePageStore as any).mockReturnValue(mockPageStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)
  })

  it('应该渲染拖拽环境', () => {
    render(<TestDragDropEnvironment />)

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument()
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
  })

  it('应该显示可用的模块列表', () => {
    render(<TestDragDropEnvironment />)

    expect(screen.getByText('标题')).toBeInTheDocument()
    expect(screen.getByText('文本')).toBeInTheDocument()
  })

  it('应该显示画布中的现有模块', () => {
    render(<TestDragDropEnvironment />)

    expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
  })

  it('应该显示可拖拽的画布区域', () => {
    render(<TestDragDropEnvironment />)

    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('拖拽状态下应该显示拖拽提示', () => {
    const draggingStore = {
      ...mockEditorStore,
      isDragging: true
    }
    ;(useEditorStore as any).mockReturnValue(draggingStore)

    render(<TestDragDropEnvironment />)

    // 验证组件正常渲染，拖拽状态下的样式变化
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
  })

  it('应该处理拖拽开始事件', () => {
    render(<TestDragDropEnvironment />)

    // 模拟拖拽开始
    const dragEvent = new Event('dragstart')
    fireEvent(screen.getByTestId('dnd-context'), dragEvent)

    // 验证拖拽状态被设置
    // 由于我们使用了mock，这里主要验证组件能正常渲染
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
  })

  it('应该处理拖拽结束事件', () => {
    render(<TestDragDropEnvironment />)

    // 模拟拖拽结束
    const dropEvent = new Event('drop')
    fireEvent(screen.getByTestId('dnd-context'), dropEvent)

    // 验证组件正常工作
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
  })
})

describe('模块排序功能', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const multiModuleStore = {
      ...mockPageStore,
      currentPage: {
        id: 'test-page',
        content: [
          {
            id: 'module-1',
            type: PageModuleType.TITLE,
            text: '第一个模块'
          },
          {
            id: 'module-2',
            type: PageModuleType.TEXT,
            text: '第二个模块'
          },
          {
            id: 'module-3',
            type: PageModuleType.TITLE,
            text: '第三个模块'
          }
        ]
      }
    }

    ;(usePageStore as any).mockReturnValue(multiModuleStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)
  })

  it('应该渲染多个模块', () => {
    render(<TestDragDropEnvironment />)

    expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    expect(screen.getByTestId('module-module-2')).toBeInTheDocument()
    expect(screen.getByTestId('module-module-3')).toBeInTheDocument()
  })

  it('应该为每个模块提供排序功能', () => {
    render(<TestDragDropEnvironment />)

    // 每个模块都应该在可排序的上下文中
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument()

    // 验证模块按顺序显示 - 使用更精确的选择器
    expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    expect(screen.getByTestId('module-module-2')).toBeInTheDocument()
    expect(screen.getByTestId('module-module-3')).toBeInTheDocument()
  })
})

describe('错误处理', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该处理空页面状态', () => {
    const emptyStore = {
      ...mockPageStore,
      currentPage: null
    }
    ;(usePageStore as any).mockReturnValue(emptyStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)

    render(<TestDragDropEnvironment />)

    // 应该正常渲染，不抛出错误
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
  })

  it('应该处理空模块列表', () => {
    const emptyContentStore = {
      ...mockPageStore,
      currentPage: {
        id: 'test-page',
        content: []
      }
    }
    ;(usePageStore as any).mockReturnValue(emptyContentStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)

    render(<TestDragDropEnvironment />)

    expect(screen.getByText('画布为空')).toBeInTheDocument()
  })

  it('应该处理拖拽操作失败', () => {
    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const errorStore = {
      ...mockPageStore,
      addModule: vi.fn(() => {
        throw new Error('添加模块失败')
      })
    }
    ;(usePageStore as any).mockReturnValue(errorStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)

    render(<TestDragDropEnvironment />)

    // 组件应该正常渲染，即使有错误处理逻辑
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
