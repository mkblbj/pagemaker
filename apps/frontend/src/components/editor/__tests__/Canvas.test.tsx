import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { Canvas } from '../Canvas'
import { usePageStore } from '@/stores/usePageStore'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock the stores
vi.mock('@/stores/usePageStore')

const mockUsePageStore = usePageStore as any

describe('Canvas', () => {
  const mockSetSelectedModule = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该显示空状态当没有模块时', () => {
    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: []
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    expect(screen.getByTestId('canvas')).toBeInTheDocument()
    expect(screen.getByText('画布为空')).toBeInTheDocument()
    expect(screen.getByText('从左侧模块列表中拖拽模块到此处，或点击下方按钮开始创建页面内容。')).toBeInTheDocument()
  })

  it('应该渲染页面模块', () => {
    const modules = [
      {
        id: 'title-1',
        type: PageModuleType.TITLE,
        text: '测试标题',
        level: 1
      },
      {
        id: 'text-1',
        type: PageModuleType.TEXT,
        text: '测试文本'
      }
    ]

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    expect(screen.getByText('测试标题')).toBeInTheDocument()
    expect(screen.getByText('测试文本')).toBeInTheDocument()
  })

  it('应该显示选中的模块', () => {
    const modules = [
      {
        id: 'title-1',
        type: PageModuleType.TITLE,
        text: '测试标题',
        level: 1
      }
    ]

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: 'title-1',
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    const moduleElement = screen.getByTestId('module-title-1')
    expect(moduleElement).toHaveClass('border-primary', 'bg-primary/5')
  })

  it('应该处理模块点击选择', () => {
    const modules = [
      {
        id: 'text-1',
        type: PageModuleType.TEXT,
        text: '可点击的文本'
      }
    ]

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    const moduleElement = screen.getByText('可点击的文本').closest('div')
    fireEvent.click(moduleElement!)

    expect(mockSetSelectedModule).toHaveBeenCalledWith('text-1')
  })

  it('应该处理空的页面内容', () => {
    mockUsePageStore.mockReturnValue({
      currentPage: null,
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    expect(screen.getByText('画布为空')).toBeInTheDocument()
  })

  it('应该处理多个模块', () => {
    const modules = [
      {
        id: 'title-1',
        type: PageModuleType.TITLE,
        text: '标题1',
        level: 1
      },
      {
        id: 'title-2',
        type: PageModuleType.TITLE,
        text: '标题2',
        level: 2
      },
      {
        id: 'text-1',
        type: PageModuleType.TEXT,
        text: '文本1'
      },
      {
        id: 'separator-1',
        type: PageModuleType.SEPARATOR
      },
      {
        id: 'image-1',
        type: PageModuleType.IMAGE,
        src: 'test.jpg',
        alt: '测试图片'
      }
    ]

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    expect(screen.getByText('标题1')).toBeInTheDocument()
    expect(screen.getByText('标题2')).toBeInTheDocument()
    expect(screen.getByText('文本1')).toBeInTheDocument()
    expect(screen.getByText('分隔线模块')).toBeInTheDocument()
    expect(screen.getByAltText('测试图片')).toBeInTheDocument()
  })

  it('应该处理键值对模块', () => {
    const modules = [
      {
        id: 'kv-1',
        type: PageModuleType.KEY_VALUE,
        pairs: [
          { key: '产品名称', value: '测试产品' },
          { key: '价格', value: '￥99.99' }
        ]
      }
    ]

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    expect(screen.getByText('产品名称:')).toBeInTheDocument()
    expect(screen.getByText('测试产品')).toBeInTheDocument()
    expect(screen.getByText('价格:')).toBeInTheDocument()
    expect(screen.getByText('￥99.99')).toBeInTheDocument()
  })

  it('应该处理多列布局模块', () => {
    const modules = [
      {
        id: 'mc-1',
        type: PageModuleType.MULTI_COLUMN,
        columns: 3
      }
    ]

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    expect(screen.getByText('多列布局模块')).toBeInTheDocument()
    expect(screen.getByText('列 1')).toBeInTheDocument()
    expect(screen.getByText('列 2')).toBeInTheDocument()
    expect(screen.getByText('列 3')).toBeInTheDocument()
  })

  it('应该处理未知模块类型', () => {
    const modules = [
      {
        id: 'unknown-1',
        type: 'UNKNOWN_TYPE' as PageModuleType
      }
    ]

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    expect(screen.getByText('未知模块类型')).toBeInTheDocument()
  })

  it('应该显示正确的画布容器样式', () => {
    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: []
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    const canvas = screen.getByTestId('canvas')
    expect(canvas).toHaveClass('h-full', 'overflow-y-auto', 'p-4')
  })

  it('应该处理长列表的模块', () => {
    const modules = Array.from({ length: 20 }, (_, i) => ({
      id: `text-${i}`,
      type: PageModuleType.TEXT,
      text: `文本模块 ${i + 1}`
    }))

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: null,
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    expect(screen.getByText('文本模块 1')).toBeInTheDocument()
    expect(screen.getByText('文本模块 10')).toBeInTheDocument()
    expect(screen.getByText('文本模块 20')).toBeInTheDocument()
  })

  it('应该处理模块选择状态切换', () => {
    const modules = [
      {
        id: 'text-1',
        type: PageModuleType.TEXT,
        text: '第一个文本'
      },
      {
        id: 'text-2',
        type: PageModuleType.TEXT,
        text: '第二个文本'
      }
    ]

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: modules
      },
      selectedModuleId: 'text-1',
      setSelectedModule: mockSetSelectedModule
    })

    render(<Canvas />)

    // 第一个模块应该被选中
    const firstModule = screen.getByTestId('module-text-1')
    expect(firstModule).toHaveClass('border-primary', 'bg-primary/5')

    // 第二个模块不应该被选中
    const secondModule = screen.getByText('第二个文本').closest('div')
    expect(secondModule).not.toHaveClass('border-primary', 'bg-primary/5')
  })
})
