/**
 * 模块操作功能测试
 * 测试模块的添加、删除、排序等核心功能
 */

import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Canvas } from '../Canvas'
import { DeleteConfirmDialog } from '../DeleteConfirmDialog'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock stores
vi.mock('@/stores/usePageStore')
vi.mock('@/stores/useEditorStore')

// Mock 模块注册系统
vi.mock('@/lib/moduleRegistry', () => ({
  getModuleMetadata: vi.fn(() => ({
    name: '测试模块',
    type: 'test'
  }))
}))

const mockPageStore = {
  currentPage: {
    id: 'test-page',
    content: [
      {
        id: 'module-1',
        type: PageModuleType.TITLE,
        text: '测试标题'
      },
      {
        id: 'module-2',
        type: PageModuleType.TEXT,
        text: '测试文本'
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
  hasUnsavedChanges: false
}

describe('Canvas 模块操作', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(usePageStore as any).mockReturnValue(mockPageStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)
  })

  it('应该渲染所有模块', () => {
    render(<Canvas />)

    expect(screen.getByTestId('module-module-1')).toBeInTheDocument()
    expect(screen.getByTestId('module-module-2')).toBeInTheDocument()
  })

  it('应该能够选择模块', async () => {
    const user = userEvent.setup()
    render(<Canvas />)

    const moduleElement = screen.getByTestId('module-module-1')
    await user.click(moduleElement)

    expect(mockPageStore.setSelectedModule).toHaveBeenCalledWith('module-1')
  })

  it('应该显示选中模块的操作按钮', () => {
    const selectedStore = {
      ...mockPageStore,
      selectedModuleId: 'module-1'
    }
    ;(usePageStore as any).mockReturnValue(selectedStore)

    render(<Canvas />)

    // 应该显示删除按钮
    expect(screen.getByRole('button', { name: /删除/i })).toBeInTheDocument()
    // 应该显示复制按钮
    expect(screen.getByRole('button', { name: /复制/i })).toBeInTheDocument()
  })

  it('应该能够删除模块', async () => {
    const user = userEvent.setup()
    const selectedStore = {
      ...mockPageStore,
      selectedModuleId: 'module-1'
    }
    ;(usePageStore as any).mockReturnValue(selectedStore)

    render(<Canvas />)

    const deleteButton = screen.getByRole('button', { name: /删除/i })
    await user.click(deleteButton)

    // 应该显示删除确认对话框
    expect(screen.getByText('删除模块确认')).toBeInTheDocument()
  })

  it('应该能够复制模块', async () => {
    const user = userEvent.setup()
    const selectedStore = {
      ...mockPageStore,
      selectedModuleId: 'module-1'
    }
    ;(usePageStore as any).mockReturnValue(selectedStore)

    render(<Canvas />)

    const copyButton = screen.getByRole('button', { name: /复制/i })
    await user.click(copyButton)

    expect(mockPageStore.addModule).toHaveBeenCalled()
    expect(mockEditorStore.markUnsaved).toHaveBeenCalled()
  })

  it('应该能够上移模块', async () => {
    const user = userEvent.setup()
    const selectedStore = {
      ...mockPageStore,
      selectedModuleId: 'module-2' // 选择第二个模块
    }
    ;(usePageStore as any).mockReturnValue(selectedStore)

    render(<Canvas />)

    const moveUpButton = screen.getByRole('button', { name: '上移模块' })
    await user.click(moveUpButton)

    expect(mockPageStore.reorderModules).toHaveBeenCalledWith(1, 0)
    expect(mockEditorStore.markUnsaved).toHaveBeenCalled()
  })

  it('应该能够下移模块', async () => {
    const user = userEvent.setup()
    const selectedStore = {
      ...mockPageStore,
      selectedModuleId: 'module-1' // 选择第一个模块
    }
    ;(usePageStore as any).mockReturnValue(selectedStore)

    render(<Canvas />)

    const moveDownButton = screen.getByRole('button', { name: '下移模块' })
    await user.click(moveDownButton)

    expect(mockPageStore.reorderModules).toHaveBeenCalledWith(0, 1)
    expect(mockEditorStore.markUnsaved).toHaveBeenCalled()
  })

  it('第一个模块的上移按钮应该被禁用', () => {
    const selectedStore = {
      ...mockPageStore,
      selectedModuleId: 'module-1' // 选择第一个模块
    }
    ;(usePageStore as any).mockReturnValue(selectedStore)

    render(<Canvas />)

    const moveUpButton = screen.getByRole('button', { name: '上移模块' })
    expect(moveUpButton).toBeDisabled()
  })

  it('最后一个模块的下移按钮应该被禁用', () => {
    const selectedStore = {
      ...mockPageStore,
      selectedModuleId: 'module-2' // 选择最后一个模块
    }
    ;(usePageStore as any).mockReturnValue(selectedStore)

    render(<Canvas />)

    const moveDownButton = screen.getByRole('button', { name: '下移模块' })
    expect(moveDownButton).toBeDisabled()
  })

  it('空画布应该显示空状态', () => {
    const emptyStore = {
      ...mockPageStore,
      currentPage: {
        ...mockPageStore.currentPage,
        content: []
      }
    }
    ;(usePageStore as any).mockReturnValue(emptyStore)

    render(<Canvas />)

    expect(screen.getByText('画布为空')).toBeInTheDocument()
    expect(screen.getByText(/从左侧模块列表中拖拽模块到此处/)).toBeInTheDocument()
  })
})

describe('DeleteConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    moduleName: '测试模块',
    moduleType: '标题'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该显示删除确认对话框', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)

    expect(screen.getByText('删除模块确认')).toBeInTheDocument()
    expect(screen.getByText(/您确定要删除这个模块吗/)).toBeInTheDocument()
  })

  it('应该显示模块信息', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)

    expect(screen.getByText('类型：标题')).toBeInTheDocument()
    expect(screen.getByText('名称：测试模块')).toBeInTheDocument()
  })

  it('点击取消应该关闭对话框', async () => {
    const user = userEvent.setup()
    render(<DeleteConfirmDialog {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /取消/i })
    await user.click(cancelButton)

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('点击确认删除应该调用确认回调', async () => {
    const user = userEvent.setup()
    render(<DeleteConfirmDialog {...defaultProps} />)

    const confirmButton = screen.getByRole('button', { name: /确认删除/i })
    await user.click(confirmButton)

    expect(defaultProps.onConfirm).toHaveBeenCalled()
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('不显示对话框时不应该渲染内容', () => {
    render(<DeleteConfirmDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('删除模块确认')).not.toBeInTheDocument()
  })
})
