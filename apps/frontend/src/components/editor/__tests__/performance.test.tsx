import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Canvas } from '../Canvas'
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
    transform: null,
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
  useSensors: () => [],
  useSensor: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  TouchSensor: vi.fn(),
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  pointerWithin: vi.fn(),
  rectIntersection: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  sortableKeyboardCoordinates: vi.fn(),
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
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  )
}))

const mockUsePageStore = vi.mocked(usePageStore)
const mockUseEditorStore = vi.mocked(useEditorStore)

// 生成大量测试模块
const generateLargeModuleList = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `module-${index + 1}`,
    type: index % 3 === 0 ? PageModuleType.TITLE : index % 3 === 1 ? PageModuleType.TEXT : PageModuleType.IMAGE,
    title: index % 3 === 0 ? `标题 ${index + 1}` : undefined,
    text: index % 3 === 1 ? `文本内容 ${index + 1}` : undefined,
    alt: index % 3 === 2 ? `图片 ${index + 1}` : undefined,
    src: index % 3 === 2 ? `https://example.com/image-${index + 1}.jpg` : undefined,
  }))
}

describe('Canvas 性能测试', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()

    // 默认 store 状态
    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: [],
        updated_at: new Date().toISOString(),
      },
      selectedModuleId: null,
      setSelectedModule: vi.fn(),
      deleteModule: vi.fn(),
      reorderModules: vi.fn(),
      addModule: vi.fn(),
    })

    mockUseEditorStore.mockReturnValue({
      markUnsaved: vi.fn(),
      hasUnsavedChanges: false,
    })
  })

  it('应该能够高效渲染100个模块', () => {
    const largeModuleList = generateLargeModuleList(100)
    
    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: largeModuleList,
        updated_at: new Date().toISOString(),
      },
      selectedModuleId: null,
      setSelectedModule: vi.fn(),
      deleteModule: vi.fn(),
      reorderModules: vi.fn(),
      addModule: vi.fn(),
    })

    const startTime = performance.now()
    
    render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // 渲染时间应该在合理范围内（小于1秒）
    expect(renderTime).toBeLessThan(1000)

    // 验证所有模块都被渲染
    expect(screen.getAllByTestId(/^module-/)).toHaveLength(100)
  })

  it('应该能够高效处理模块选择操作', async () => {
    const largeModuleList = generateLargeModuleList(50)
    const setSelectedModule = vi.fn()
    
    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: largeModuleList,
        updated_at: new Date().toISOString(),
      },
      selectedModuleId: null,
      setSelectedModule,
      deleteModule: vi.fn(),
      reorderModules: vi.fn(),
      addModule: vi.fn(),
    })

    render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    const startTime = performance.now()

    // 点击多个模块进行选择
    for (let i = 0; i < 10; i++) {
      const moduleElement = screen.getByTestId(`module-module-${i + 1}`)
      await user.click(moduleElement)
    }

    const endTime = performance.now()
    const operationTime = endTime - startTime

    // 操作时间应该在合理范围内
    expect(operationTime).toBeLessThan(500)
    expect(setSelectedModule).toHaveBeenCalledTimes(10)
  })

  it('应该能够高效处理模块排序操作', async () => {
    const moduleList = generateLargeModuleList(20)
    const reorderModules = vi.fn()
    
    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: moduleList,
        updated_at: new Date().toISOString(),
      },
      selectedModuleId: 'module-1',
      setSelectedModule: vi.fn(),
      deleteModule: vi.fn(),
      reorderModules,
      addModule: vi.fn(),
    })

    render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    const startTime = performance.now()

    // 执行多次排序操作
    for (let i = 0; i < 5; i++) {
      const moveDownButton = screen.getByRole('button', { name: '下移模块' })
      await user.click(moveDownButton)
    }

    const endTime = performance.now()
    const operationTime = endTime - startTime

    // 操作时间应该在合理范围内
    expect(operationTime).toBeLessThan(300)
    expect(reorderModules).toHaveBeenCalledTimes(5)
  })

  it('应该能够高效处理模块复制操作', async () => {
    const moduleList = generateLargeModuleList(10)
    const addModule = vi.fn()
    
    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: moduleList,
        updated_at: new Date().toISOString(),
      },
      selectedModuleId: 'module-1',
      setSelectedModule: vi.fn(),
      deleteModule: vi.fn(),
      reorderModules: vi.fn(),
      addModule,
    })

    render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    const startTime = performance.now()

    // 执行多次复制操作
    for (let i = 0; i < 10; i++) {
      const copyButton = screen.getByRole('button', { name: '复制模块' })
      await user.click(copyButton)
    }

    const endTime = performance.now()
    const operationTime = endTime - startTime

    // 操作时间应该在合理范围内
    expect(operationTime).toBeLessThan(400)
    expect(addModule).toHaveBeenCalledTimes(10)
  })

  it('应该能够高效处理大量模块的删除操作', async () => {
    const moduleList = generateLargeModuleList(30)
    const deleteModule = vi.fn()
    
    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: moduleList,
        updated_at: new Date().toISOString(),
      },
      selectedModuleId: 'module-1',
      setSelectedModule: vi.fn(),
      deleteModule,
      reorderModules: vi.fn(),
      addModule: vi.fn(),
    })

    render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    const startTime = performance.now()

    // 点击删除按钮（会打开确认对话框）
    const deleteButton = screen.getByRole('button', { name: '删除模块' })
    await user.click(deleteButton)

    const endTime = performance.now()
    const operationTime = endTime - startTime

    // 操作时间应该在合理范围内
    expect(operationTime).toBeLessThan(200)
    
    // 验证确认对话框出现
    expect(screen.getByText('确认删除')).toBeInTheDocument()
  })

  it('应该能够在大量模块下保持滚动性能', () => {
    const largeModuleList = generateLargeModuleList(200)
    
    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: largeModuleList,
        updated_at: new Date().toISOString(),
      },
      selectedModuleId: null,
      setSelectedModule: vi.fn(),
      deleteModule: vi.fn(),
      reorderModules: vi.fn(),
      addModule: vi.fn(),
    })

    const startTime = performance.now()
    
    render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    // 验证滚动容器存在
    const canvasElement = screen.getByTestId('canvas')
    expect(canvasElement).toHaveClass('overflow-y-auto')

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // 即使有200个模块，渲染时间也应该在合理范围内
    expect(renderTime).toBeLessThan(2000)
  })

  it('应该能够高效处理模块状态更新', () => {
    const moduleList = generateLargeModuleList(50)
    
    const { rerender } = render(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    mockUsePageStore.mockReturnValue({
      currentPage: {
        id: 'test-page',
        title: '测试页面',
        content: moduleList,
        updated_at: new Date().toISOString(),
      },
      selectedModuleId: 'module-25', // 选中中间的模块
      setSelectedModule: vi.fn(),
      deleteModule: vi.fn(),
      reorderModules: vi.fn(),
      addModule: vi.fn(),
    })

    const startTime = performance.now()
    
    // 重新渲染以触发状态更新
    rerender(
      <DragProvider>
        <Canvas />
      </DragProvider>
    )

    const endTime = performance.now()
    const updateTime = endTime - startTime

    // 状态更新时间应该在合理范围内
    expect(updateTime).toBeLessThan(300)
    
    // 验证选中的模块有正确的样式
    const selectedModule = screen.getByTestId('module-module-25')
    expect(selectedModule).toHaveClass('border-primary', 'bg-primary/5')
  })
}) 