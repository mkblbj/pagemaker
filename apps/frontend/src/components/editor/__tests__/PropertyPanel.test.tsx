import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import { vi } from 'vitest'
import { PropertyPanel } from '../PropertyPanel'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock the stores
vi.mock('@/stores/usePageStore')
vi.mock('@/stores/useEditorStore')

const mockUsePageStore = usePageStore as any
const mockUseEditorStore = useEditorStore as any

describe('PropertyPanel', () => {
  const mockUpdateModule = vi.fn()
  const mockMarkUnsaved = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseEditorStore.mockReturnValue({})
  })

  it('应该显示标题模块的属性编辑器', () => {
    const titleModule = {
      id: 'title-1',
      type: PageModuleType.TITLE,
      text: '测试标题',
      level: 1
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [titleModule]
      },
      selectedModuleId: 'title-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    expect(screen.getByText('title 模块')).toBeInTheDocument()
    expect(screen.getByLabelText('标题文本')).toBeInTheDocument()
    expect(screen.getByLabelText('标题级别')).toBeInTheDocument()
    expect(screen.getByDisplayValue('测试标题')).toBeInTheDocument()
  })

  it('应该显示文本模块的属性编辑器', () => {
    const textModule = {
      id: 'text-1',
      type: PageModuleType.TEXT,
      content: '测试文本内容'
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [textModule]
      },
      selectedModuleId: 'text-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    expect(screen.getByText('text 模块')).toBeInTheDocument()
    expect(screen.getByLabelText('文本内容')).toBeInTheDocument()
    expect(screen.getByDisplayValue('测试文本内容')).toBeInTheDocument()
  })

  it('应该显示图片模块的属性编辑器', () => {
    const imageModule = {
      id: 'image-1',
      type: PageModuleType.IMAGE,
      src: 'https://example.com/image.jpg',
      alt: '测试图片'
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [imageModule]
      },
      selectedModuleId: 'image-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    expect(screen.getByText('image 模块')).toBeInTheDocument()
    expect(screen.getByLabelText('图片描述')).toBeInTheDocument()
    expect(screen.getByDisplayValue('测试图片')).toBeInTheDocument()
    expect(screen.getByText('更换图片')).toBeInTheDocument()
    expect(screen.getByAltText('测试图片')).toBeInTheDocument()
  })

  it('应该显示键值对模块的属性编辑器', () => {
    const keyValueModule = {
      id: 'kv-1',
      type: PageModuleType.KEY_VALUE,
      pairs: [
        { key: '键1', value: '值1' },
        { key: '键2', value: '值2' }
      ]
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [keyValueModule]
      },
      selectedModuleId: 'kv-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    expect(screen.getByText('keyValue 模块')).toBeInTheDocument()
    expect(screen.getByText('键值对列表')).toBeInTheDocument()
    expect(screen.getByDisplayValue('键1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('值1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('键2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('值2')).toBeInTheDocument()
  })

  it('应该显示分隔线模块的属性编辑器', () => {
    const separatorModule = {
      id: 'sep-1',
      type: PageModuleType.SEPARATOR
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [separatorModule]
      },
      selectedModuleId: 'sep-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    expect(screen.getByText('separator 模块')).toBeInTheDocument()
    expect(screen.getByText('分隔类型')).toBeInTheDocument()
    expect(screen.getByText('线条分隔')).toBeInTheDocument()
  })

  it('应该显示多列图文模块的属性编辑器', () => {
    const multiColumnModule = {
      id: 'mc-1',
      type: PageModuleType.MULTI_COLUMN,
      layout: 'imageLeft',
      imageConfig: {
        src: '',
        alt: '图片描述',
        alignment: 'center',
        width: '50%'
      },
      textConfig: {
        content: '输入文本内容',
        alignment: 'left',
        font: 'inherit',
        fontSize: '14px',
        color: '#000000',
        backgroundColor: 'transparent'
      }
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [multiColumnModule]
      },
      selectedModuleId: 'mc-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    expect(screen.getByText('multiColumn 模块')).toBeInTheDocument()
    expect(screen.getByText('布局类型')).toBeInTheDocument()
    expect(screen.getByText('图片配置')).toBeInTheDocument()
    expect(screen.getByText('文本配置')).toBeInTheDocument()
  })

  it('应该正确处理标题文本更新', () => {
    const titleModule = {
      id: 'title-1',
      type: PageModuleType.TITLE,
      text: '原标题',
      level: 1
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [titleModule]
      },
      selectedModuleId: 'title-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    const textInput = screen.getByLabelText('标题文本')
    fireEvent.change(textInput, { target: { value: '新标题' } })

    expect(mockUpdateModule).toHaveBeenCalledWith('title-1', { text: '新标题' })
    expect(mockMarkUnsaved).toHaveBeenCalled()
  })

  it('应该正确处理文本内容更新', () => {
    const textModule = {
      id: 'text-1',
      type: PageModuleType.TEXT,
      text: '原文本'
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [textModule]
      },
      selectedModuleId: 'text-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    const textArea = screen.getByLabelText('文本内容')
    fireEvent.change(textArea, { target: { value: '新文本内容' } })

    expect(mockUpdateModule).toHaveBeenCalledWith('text-1', { content: '新文本内容' })
    expect(mockMarkUnsaved).toHaveBeenCalled()
  })

  it('应该正确处理图片描述更新', () => {
    const imageModule = {
      id: 'image-1',
      type: PageModuleType.IMAGE,
      src: 'old-url.jpg',
      alt: '图片'
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [imageModule]
      },
      selectedModuleId: 'image-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    const altInput = screen.getByLabelText('图片描述')
    fireEvent.change(altInput, { target: { value: '新的图片描述' } })

    expect(mockUpdateModule).toHaveBeenCalledWith('image-1', { alt: '新的图片描述' })
    expect(mockMarkUnsaved).toHaveBeenCalled()
  })

  it('应该正确添加新的键值对', () => {
    const keyValueModule = {
      id: 'kv-1',
      type: PageModuleType.KEY_VALUE,
      rows: [{ key: '键1', value: '值1' }]
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [keyValueModule]
      },
      selectedModuleId: 'kv-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    const addButton = screen.getByText('添加')
    fireEvent.click(addButton)

    expect(mockUpdateModule).toHaveBeenCalledWith('kv-1', {
      rows: [
        { key: '键1', value: '值1' },
        { key: '新键', value: '新值' }
      ]
    })
    expect(mockMarkUnsaved).toHaveBeenCalled()
  })

  it('应该正确删除键值对', () => {
    const keyValueModule = {
      id: 'kv-1',
      type: PageModuleType.KEY_VALUE,
      rows: [
        { key: '键1', value: '值1' },
        { key: '键2', value: '值2' }
      ]
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [keyValueModule]
      },
      selectedModuleId: 'kv-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => btn.querySelector('.lucide-trash-2'))

    if (deleteButton) {
      fireEvent.click(deleteButton)
    }

    expect(mockUpdateModule).toHaveBeenCalledWith('kv-1', {
      rows: [{ key: '键2', value: '值2' }]
    })
    expect(mockMarkUnsaved).toHaveBeenCalled()
  })

  it('应该正确更新键值对的键', () => {
    const keyValueModule = {
      id: 'kv-1',
      type: PageModuleType.KEY_VALUE,
      rows: [{ key: '旧键', value: '值' }]
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [keyValueModule]
      },
      selectedModuleId: 'kv-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    const keyInput = screen.getByDisplayValue('旧键')
    fireEvent.change(keyInput, { target: { value: '新键' } })

    expect(mockUpdateModule).toHaveBeenCalledWith('kv-1', {
      rows: [{ key: '新键', value: '值' }]
    })
    expect(mockMarkUnsaved).toHaveBeenCalled()
  })

  it('应该正确更新键值对的值', () => {
    const keyValueModule = {
      id: 'kv-1',
      type: PageModuleType.KEY_VALUE,
      rows: [{ key: '键', value: '旧值' }]
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [keyValueModule]
      },
      selectedModuleId: 'kv-1',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    const valueInput = screen.getByDisplayValue('旧值')
    fireEvent.change(valueInput, { target: { value: '新值' } })

    expect(mockUpdateModule).toHaveBeenCalledWith('kv-1', {
      rows: [{ key: '键', value: '新值' }]
    })
    expect(mockMarkUnsaved).toHaveBeenCalled()
  })

  it('应该显示模块ID信息', () => {
    const textModule = {
      id: 'test-module-123',
      type: PageModuleType.TEXT,
      text: '测试'
    }

    mockUsePageStore.mockReturnValue({
      currentPage: {
        content: [textModule]
      },
      selectedModuleId: 'test-module-123',
      updateModule: mockUpdateModule,
      markUnsaved: mockMarkUnsaved
    })

    render(<PropertyPanel />)

    expect(screen.getByText('模块ID: test-module-123')).toBeInTheDocument()
    expect(screen.getByText('💡 修改属性会自动标记为未保存')).toBeInTheDocument()
  })
})
