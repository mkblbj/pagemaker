import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@/test-utils'
import { DragProvider } from '../dnd/DragContext'
import { ModuleList } from '../ModuleList'
import { Canvas } from '../Canvas'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'

// Mock stores
vi.mock('@/stores/usePageStore')
vi.mock('@/stores/useEditorStore')

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false
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
  closestCenter: vi.fn(),
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
  verticalListSortingStrategy: vi.fn(),
  sortableKeyboardCoordinates: vi.fn()
}))

// Mock lucide-react
vi.mock('lucide-react', async importOriginal => {
  const actual = (await importOriginal()) as any

  const mockIcons = {
    Search: () => <div data-testid="search-icon" />,
    Plus: () => <div data-testid="plus-icon" />,
    FileX: () => <div data-testid="file-x-icon" />,
    Type: () => <div data-testid="type-icon" />,
    FileText: () => <div data-testid="text-icon" />,
    Image: () => <div data-testid="image-icon" />,
    Minus: () => <div data-testid="minus-icon" />,
    Layout: () => <div data-testid="layout-icon" />,
    Columns: () => <div data-testid="columns-icon" />,
    HelpCircle: () => <div data-testid="help-circle-icon" />,
    GripVertical: () => <div data-testid="grip-icon" />,
    MoveUp: () => <div data-testid="move-up-icon" />,
    MoveDown: () => <div data-testid="move-down-icon" />,
    Copy: () => <div data-testid="copy-icon" />,
    Trash2: () => <div data-testid="trash-icon" />,
    AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
    X: () => <div data-testid="x-icon" />,
    XIcon: () => <div data-testid="x-icon" />
  }

  return {
    ...actual,
    ...mockIcons
  }
})

// Mock UI components
vi.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, className }: any) => (
    <input placeholder={placeholder} value={value} onChange={onChange} className={className} />
  )
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}))

// Mock module registry
vi.mock('@/lib/moduleRegistry', () => ({
  getAvailableModules: () => [
    {
      type: 'title',
      name: '标题',
      description: '添加标题文本',
      icon: 'Type',
      category: 'basic',
      color: 'text-blue-600'
    },
    {
      type: 'text',
      name: '文本',
      description: '添加段落文本',
      icon: 'FileText',
      category: 'basic',
      color: 'text-green-600'
    }
  ],
  createModuleInstance: (type: string) => ({
    id: `module-${Date.now()}`,
    type,
    text: type === 'title' ? '新标题' : '新文本'
  }),
  getModuleMetadata: (type: string) => {
    const modules = {
      title: {
        type: 'title',
        name: '标题',
        description: '添加标题文本',
        icon: 'Type',
        category: 'basic',
        color: 'text-blue-600'
      },
      text: {
        type: 'text',
        name: '文本',
        description: '添加段落文本',
        icon: 'FileText',
        category: 'basic',
        color: 'text-green-600'
      }
    }
    return modules[type as keyof typeof modules] || null
  }
}))

// Mock DeleteConfirmDialog
vi.mock('../DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: () => <div data-testid="delete-confirm-dialog" />
}))

const mockUsePageStore = vi.mocked(usePageStore)
const mockUseEditorStore = vi.mocked(useEditorStore)

describe('拖拽功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        name: '测试页面',
        content: [],
        updated_at: new Date().toISOString()
      },
      selectedModuleId: null,
      setSelectedModule: vi.fn(),
      deleteModule: vi.fn(),
      reorderModules: vi.fn(),
      addModule: vi.fn(),
      updateModule: vi.fn(),
      markSaved: vi.fn(),
      hasUnsavedChanges: false
    })

    mockUseEditorStore.mockReturnValue({
      markUnsaved: vi.fn(),
      hasUnsavedChanges: false,
      isDragging: false,
      draggedModuleType: null,
      setDragging: vi.fn()
    })
  })

  it('应该正确渲染DragProvider包装的组件', () => {
    render(
      <DragProvider>
        <div data-testid="test-content">测试内容</div>
      </DragProvider>
    )

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('应该正确渲染ModuleList中的可拖拽模块', () => {
    render(
      <DragProvider>
        <ModuleList />
      </DragProvider>
    )

    expect(screen.getByText('标题')).toBeInTheDocument()
    expect(screen.getByText('文本')).toBeInTheDocument()
    expect(screen.getByText('添加标题文本')).toBeInTheDocument()
    expect(screen.getByText('添加段落文本')).toBeInTheDocument()
  })

  it('应该正确渲染Canvas作为拖拽目标', () => {
    render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    expect(screen.getByTestId('canvas')).toBeInTheDocument()
    expect(screen.getByText('画布为空')).toBeInTheDocument()
  })

  it('应该在拖拽状态下显示正确的视觉反馈', () => {
    mockUseEditorStore.mockReturnValue({
      markUnsaved: vi.fn(),
      hasUnsavedChanges: false,
      isDragging: true,
      draggedModuleType: 'title',
      setDragging: vi.fn()
    })

    render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    // Canvas应该显示拖拽状态的样式
    const canvas = screen.getByTestId('canvas')
    expect(canvas).toHaveClass('bg-blue-50/30')
  })
})
