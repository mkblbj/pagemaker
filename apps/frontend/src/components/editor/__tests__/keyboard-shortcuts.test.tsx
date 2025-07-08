/**
 * 键盘快捷键功能测试
 * 测试键盘导航和快捷键操作
 */

import { render, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { KeyboardShortcuts } from '../KeyboardShortcuts'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock stores
vi.mock('@/stores/usePageStore')
vi.mock('@/stores/useEditorStore')

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
  writable: true,
})

const mockPageStore = {
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
  },
  selectedModuleId: null,
  setSelectedModule: vi.fn(),
  deleteModule: vi.fn(),
  reorderModules: vi.fn()
}

const mockEditorStore = {
  markUnsaved: vi.fn()
}

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(usePageStore as any).mockReturnValue(mockPageStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)
    ;(window.confirm as any).mockReturnValue(true)
  })

  it('应该渲染无UI组件', () => {
    const { container } = render(<KeyboardShortcuts />)
    expect(container.firstChild).toBeNull()
  })

  describe('箭头键导航', () => {
    it('按下键选择第一个模块', () => {
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      expect(mockPageStore.setSelectedModule).toHaveBeenCalledWith('module-1')
    })

    it('按上键选择最后一个模块（当没有选中模块时）', () => {
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      
      expect(mockPageStore.setSelectedModule).toHaveBeenCalledWith('module-3')
    })

    it('从第一个模块向下导航到第二个模块', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-1'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      expect(mockPageStore.setSelectedModule).toHaveBeenCalledWith('module-2')
    })

    it('从第二个模块向上导航到第一个模块', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-2'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      
      expect(mockPageStore.setSelectedModule).toHaveBeenCalledWith('module-1')
    })

    it('在第一个模块按上键不应该导航', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-1'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      
      expect(mockPageStore.setSelectedModule).not.toHaveBeenCalled()
    })

    it('在最后一个模块按下键不应该导航', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-3'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      expect(mockPageStore.setSelectedModule).not.toHaveBeenCalled()
    })
  })

  describe('模块删除', () => {
    it('按Delete键删除选中的模块', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-2'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'Delete' })
      
      expect(window.confirm).toHaveBeenCalledWith('确定要删除选中的模块吗？')
      expect(mockPageStore.deleteModule).toHaveBeenCalledWith('module-2')
      expect(mockEditorStore.markUnsaved).toHaveBeenCalled()
    })

    it('按Backspace键删除选中的模块', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-1'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'Backspace' })
      
      expect(window.confirm).toHaveBeenCalledWith('确定要删除选中的模块吗？')
      expect(mockPageStore.deleteModule).toHaveBeenCalledWith('module-1')
      expect(mockEditorStore.markUnsaved).toHaveBeenCalled()
    })

    it('用户取消删除时不应该删除模块', () => {
      ;(window.confirm as any).mockReturnValue(false)
      
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-1'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'Delete' })
      
      expect(window.confirm).toHaveBeenCalled()
      expect(mockPageStore.deleteModule).not.toHaveBeenCalled()
      expect(mockEditorStore.markUnsaved).not.toHaveBeenCalled()
    })

    it('没有选中模块时不应该删除', () => {
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'Delete' })
      
      expect(window.confirm).not.toHaveBeenCalled()
      expect(mockPageStore.deleteModule).not.toHaveBeenCalled()
    })
  })

  describe('模块移动', () => {
    it('Shift+ArrowUp 向上移动模块', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-2' // 选择第二个模块
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowUp', shiftKey: true })
      
      expect(mockPageStore.reorderModules).toHaveBeenCalledWith(1, 0)
      expect(mockEditorStore.markUnsaved).toHaveBeenCalled()
    })

    it('Shift+ArrowDown 向下移动模块', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-2' // 选择第二个模块
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowDown', shiftKey: true })
      
      expect(mockPageStore.reorderModules).toHaveBeenCalledWith(1, 2)
      expect(mockEditorStore.markUnsaved).toHaveBeenCalled()
    })

    it('第一个模块不能向上移动', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-1' // 选择第一个模块
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowUp', shiftKey: true })
      
      expect(mockPageStore.reorderModules).not.toHaveBeenCalled()
    })

    it('最后一个模块不能向下移动', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-3' // 选择最后一个模块
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'ArrowDown', shiftKey: true })
      
      expect(mockPageStore.reorderModules).not.toHaveBeenCalled()
    })
  })

  describe('其他快捷键', () => {
    it('按Escape键取消选择', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-1'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(mockPageStore.setSelectedModule).toHaveBeenCalledWith(null)
    })

    it('按Enter键不应该有副作用', () => {
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: 'Enter' })
      
      // 应该阻止默认行为但不执行其他操作
      expect(mockPageStore.setSelectedModule).not.toHaveBeenCalled()
    })

    it('按空格键不应该有副作用', () => {
      render(<KeyboardShortcuts />)
      
      fireEvent.keyDown(document, { key: ' ' })
      
      // 应该阻止默认行为但不执行其他操作
      expect(mockPageStore.setSelectedModule).not.toHaveBeenCalled()
    })
  })

  describe('输入框中的按键应该被忽略', () => {
    it('在input中按Delete不应该删除模块', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-1'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()
      
      fireEvent.keyDown(input, { key: 'Delete' })
      
      expect(mockPageStore.deleteModule).not.toHaveBeenCalled()
      
      document.body.removeChild(input)
    })

    it('在textarea中按箭头键不应该导航模块', () => {
      render(<KeyboardShortcuts />)
      
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()
      
      fireEvent.keyDown(textarea, { key: 'ArrowDown' })
      
      expect(mockPageStore.setSelectedModule).not.toHaveBeenCalled()
      
      document.body.removeChild(textarea)
    })

    it('在contentEditable元素中按键不应该触发快捷键', () => {
      const selectedStore = {
        ...mockPageStore,
        selectedModuleId: 'module-1'
      }
      ;(usePageStore as any).mockReturnValue(selectedStore)
      
      render(<KeyboardShortcuts />)
      
      const div = document.createElement('div')
      div.contentEditable = 'true'
      document.body.appendChild(div)
      div.focus()
      
      fireEvent.keyDown(div, { key: 'Delete' })
      
      expect(mockPageStore.deleteModule).not.toHaveBeenCalled()
      
      document.body.removeChild(div)
    })
  })

  describe('空页面处理', () => {
    it('空页面时按箭头键不应该报错', () => {
      const emptyStore = {
        ...mockPageStore,
        currentPage: {
          id: 'test-page',
          content: []
        }
      }
      ;(usePageStore as any).mockReturnValue(emptyStore)
      
      render(<KeyboardShortcuts />)
      
      expect(() => {
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'ArrowUp' })
      }).not.toThrow()
    })

    it('null页面时按键不应该报错', () => {
      const nullStore = {
        ...mockPageStore,
        currentPage: null
      }
      ;(usePageStore as any).mockReturnValue(nullStore)
      
      render(<KeyboardShortcuts />)
      
      expect(() => {
        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'Delete' })
        fireEvent.keyDown(document, { key: 'Escape' })
      }).not.toThrow()
    })
  })
}) 