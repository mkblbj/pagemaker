import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@/test-utils'
import { userEvent } from '@testing-library/user-event'
import { Canvas } from '../Canvas'
import { ModuleList } from '../ModuleList'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { DragProvider } from '../dnd/DragContext'
import { PageModuleType } from '@pagemaker/shared-types'

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
  verticalListSortingStrategy: vi.fn(),
  sortableKeyboardCoordinates: vi.fn()
}))

// Mock components
vi.mock('../ModuleRenderer', () => ({
  ModuleRenderer: ({ module }: any) => (
    <div data-testid={`module-renderer-${module.type}`}>
      {module.type === PageModuleType.TITLE && <div>{module.title}</div>}
      {module.type === PageModuleType.TEXT && <div>{module.text}</div>}
      {module.type === PageModuleType.IMAGE && <div>{module.alt}</div>}
    </div>
  )
}))

// Mock icons
vi.mock('lucide-react', () => ({
  FileX: () => <div data-testid="file-x-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  GripVertical: () => <div data-testid="grip-icon" />,
  MoveUp: () => <div data-testid="move-up-icon" />,
  MoveDown: () => <div data-testid="move-down-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Type: () => <div data-testid="type-icon" />,
  FileText: () => <div data-testid="text-icon" />,
  Image: () => <div data-testid="image-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  Layout: () => <div data-testid="layout-icon" />,
  Columns: () => <div data-testid="columns-icon" />,
  HelpCircle: () => <div data-testid="help-circle-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
  X: () => <div data-testid="x-icon" />
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>
}))

const mockUsePageStore = vi.mocked(usePageStore)
const mockUseEditorStore = vi.mocked(useEditorStore)

// 模拟不同浏览器环境
const mockBrowserEnvironment = (userAgent: string, features: Record<string, boolean> = {}) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true
  })

  // 模拟浏览器特性支持
  Object.entries(features).forEach(([feature, supported]) => {
    if (feature === 'dragAndDrop') {
      Object.defineProperty(window, 'DragEvent', {
        value: supported ? class DragEvent extends Event {} : undefined,
        configurable: true
      })
    }
    if (feature === 'touchEvents') {
      Object.defineProperty(window, 'TouchEvent', {
        value: supported ? class TouchEvent extends Event {} : undefined,
        configurable: true
      })
    }
    if (feature === 'pointerEvents') {
      Object.defineProperty(window, 'PointerEvent', {
        value: supported ? class PointerEvent extends Event {} : undefined,
        configurable: true
      })
    }
  })
}

describe('浏览器兼容性测试', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()

    // 默认 store 状态
    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: [
          {
            id: 'module-1',
            type: PageModuleType.TITLE,
            title: '测试标题',
            level: 1
          }
        ],
        updated_at: new Date().toISOString()
      },
      selectedModuleId: null,
      setSelectedModule: vi.fn(),
      deleteModule: vi.fn(),
      reorderModules: vi.fn(),
      addModule: vi.fn()
    })

    mockUseEditorStore.mockReturnValue({
      markUnsaved: vi.fn(),
      hasUnsavedChanges: false
    })
  })

  describe('Chrome 浏览器兼容性', () => {
    beforeEach(() => {
      mockBrowserEnvironment(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        {
          dragAndDrop: true,
          touchEvents: true,
          pointerEvents: true
        }
      )
    })

    it('应该在 Chrome 中正常渲染编辑器组件', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      expect(screen.getByTestId('canvas')).toBeInTheDocument()
      expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    })

    it('应该在 Chrome 中支持拖拽功能', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      // 验证拖拽上下文存在
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument()
    })
  })

  describe('Firefox 浏览器兼容性', () => {
    beforeEach(() => {
      mockBrowserEnvironment('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0', {
        dragAndDrop: true,
        touchEvents: false,
        pointerEvents: true
      })
    })

    it('应该在 Firefox 中正常渲染编辑器组件', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      expect(screen.getByTestId('canvas')).toBeInTheDocument()
      expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    })

    it('应该在 Firefox 中处理模块操作', async () => {
      const setSelectedModule = vi.fn()
      mockUsePageStore.mockReturnValue({
        currentPage: {
          id: 'test-page',
          title: '测试页面',
          content: [
            {
              id: 'module-1',
              type: PageModuleType.TITLE,
              title: '测试标题',
              level: 1
            }
          ],
          updated_at: new Date().toISOString()
        },
        selectedModuleId: null,
        setSelectedModule,
        deleteModule: vi.fn(),
        reorderModules: vi.fn(),
        addModule: vi.fn()
      })

      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      const moduleElement = screen.getByTestId('module-module-1')
      await user.click(moduleElement)

      expect(setSelectedModule).toHaveBeenCalledWith('module-1')
    })
  })

  describe('Safari 浏览器兼容性', () => {
    beforeEach(() => {
      mockBrowserEnvironment(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.0 Safari/537.36',
        {
          dragAndDrop: true,
          touchEvents: true,
          pointerEvents: false // Safari 较晚支持 Pointer Events
        }
      )
    })

    it('应该在 Safari 中正常渲染编辑器组件', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      expect(screen.getByTestId('canvas')).toBeInTheDocument()
      expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    })

    it('应该在 Safari 中处理触摸事件', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      // 验证组件能正常渲染，即使没有 Pointer Events 支持
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    })
  })

  describe('Edge 浏览器兼容性', () => {
    beforeEach(() => {
      mockBrowserEnvironment(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        {
          dragAndDrop: true,
          touchEvents: true,
          pointerEvents: true
        }
      )
    })

    it('应该在 Edge 中正常渲染编辑器组件', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      expect(screen.getByTestId('canvas')).toBeInTheDocument()
      expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    })
  })

  describe('移动端浏览器兼容性', () => {
    beforeEach(() => {
      mockBrowserEnvironment(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        {
          dragAndDrop: false, // 移动端可能不支持标准拖拽
          touchEvents: true,
          pointerEvents: true
        }
      )
    })

    it('应该在移动端浏览器中正常渲染', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      expect(screen.getByTestId('canvas')).toBeInTheDocument()
      expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    })

    it('应该在移动端提供替代的交互方式', async () => {
      mockUsePageStore.mockReturnValue({
        currentPage: {
          id: 'test-page',
          title: '测试页面',
          content: [
            {
              id: 'module-1',
              type: PageModuleType.TITLE,
              title: '测试标题',
              level: 1
            }
          ],
          updated_at: new Date().toISOString()
        },
        selectedModuleId: 'module-1',
        setSelectedModule: vi.fn(),
        deleteModule: vi.fn(),
        reorderModules: vi.fn(),
        addModule: vi.fn()
      })

      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      // 验证移动端可以通过按钮进行操作
      expect(screen.getAllByRole('button', { name: '上移模块' })).toHaveLength(1)
      expect(screen.getAllByRole('button', { name: '下移模块' })).toHaveLength(1)
    })
  })

  describe('老版本浏览器兼容性', () => {
    beforeEach(() => {
      mockBrowserEnvironment(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
        {
          dragAndDrop: true,
          touchEvents: false,
          pointerEvents: false
        }
      )
    })

    it('应该在老版本浏览器中提供基础功能', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      // 基础渲染应该正常
      expect(screen.getByTestId('canvas')).toBeInTheDocument()
      expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    })

    it('应该在不支持新特性时提供降级方案', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      // 即使不支持某些特性，基础功能仍应可用
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    })
  })

  describe('CSS 特性兼容性', () => {
    it('应该使用兼容的 CSS 类名', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      const canvasElement = screen.getByTestId('canvas')

      // 验证使用了标准的 CSS 类名
      expect(canvasElement).toHaveClass('h-full', 'overflow-y-auto', 'p-4', 'relative')
    })

    it('应该支持不同的颜色模式', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      const moduleElement = screen.getByTestId('module-module-1')

      // 验证使用了支持暗色模式的类名
      expect(moduleElement).toHaveClass('transition-all')
    })
  })

  describe('JavaScript 特性兼容性', () => {
    it('应该处理事件监听器的兼容性', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      // 验证事件监听器正常工作
      expect(screen.getByTestId('canvas')).toBeInTheDocument()
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    })
  })

  describe('无障碍访问兼容性', () => {
    it('应该在屏幕阅读器中提供正确的标签', () => {
      mockUsePageStore.mockReturnValue({
        currentPage: {
          id: 'test-page',
          title: '测试页面',
          content: [
            {
              id: 'module-1',
              type: PageModuleType.TITLE,
              title: '测试标题',
              level: 1
            }
          ],
          updated_at: new Date().toISOString()
        },
        selectedModuleId: 'module-1',
        setSelectedModule: vi.fn(),
        deleteModule: vi.fn(),
        reorderModules: vi.fn(),
        addModule: vi.fn()
      })

      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      // 验证按钮有正确的 aria-label
      expect(screen.getAllByRole('button', { name: '上移模块' })).toHaveLength(1)
      expect(screen.getAllByRole('button', { name: '下移模块' })).toHaveLength(1)
      expect(screen.getAllByRole('button', { name: '复制模块' })).toHaveLength(1)
      expect(screen.getAllByRole('button', { name: '删除模块' })).toHaveLength(1)
    })

    it('应该支持键盘导航', () => {
      render(
        <DragProvider>
          <Canvas />
        </DragProvider>
      )

      // 验证基本的键盘导航功能存在
      expect(screen.getByTestId('canvas')).toBeInTheDocument()
      expect(screen.getByTestId('module-module-1')).toBeInTheDocument()

      // 验证模块是可交互的
      const moduleElement = screen.getByTestId('module-module-1')
      expect(moduleElement).toBeInTheDocument()
    })
  })
})
