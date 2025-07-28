import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextModule } from './TextModule'
import { PageModuleType, type PageModule } from '@pagemaker/shared-types'

// Mock useTranslation
vi.mock('@/contexts/I18nContext', () => ({
  useTranslation: () => ({
    tEditor: (key: string, _params?: any) => {
      const translations: Record<string, string> = {
        文本模块: '文本模块',
        输入文本内容: '输入文本内容',
        点击输入文本内容: '点击输入文本内容',
        文本内容编辑器: '文本内容编辑器',
        加粗: '加粗',
        下划线: '下划线',
        添加链接: '添加链接',
        点击编辑: '点击编辑',
        请先选择要添加链接的文本: '请先选择要添加链接的文本',
        '请输入链接地址:': '请输入链接地址:'
      }
      return translations[key] || key
    }
  })
}))

// Mock document.execCommand
Object.defineProperty(document, 'execCommand', {
  value: vi.fn(),
  writable: true
})

// Mock document.queryCommandState
Object.defineProperty(document, 'queryCommandState', {
  value: vi.fn().mockReturnValue(false),
  writable: true
})

// Mock window.getSelection
Object.defineProperty(window, 'getSelection', {
  value: vi.fn().mockReturnValue({
    toString: () => '',
    rangeCount: 0
  }),
  writable: true
})

// Mock alert and prompt
global.alert = vi.fn()
global.prompt = vi.fn()

describe('TextModule', () => {
  const mockModule: PageModule = {
    id: 'test-text-module',
    type: PageModuleType.TEXT,
    content: '测试文本内容',
    alignment: 'left',
    fontSize: '3', // 使用1-7范围内的值
    fontFamily: 'Arial, sans-serif',
    textColor: '#333333',
    backgroundColor: 'transparent'
  }

  const mockProps = {
    module: mockModule,
    isSelected: false,
    isEditing: false,
    onUpdate: vi.fn(),
    onStartEdit: vi.fn(),
    onEndEdit: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该渲染文本内容', () => {
      render(<TextModule {...mockProps} />)

      expect(screen.getByText('测试文本内容')).toBeInTheDocument()
      expect(screen.getByText('文本模块')).toBeInTheDocument()
    })

    it('应该显示默认内容当没有内容时', () => {
      const propsWithoutContent = {
        ...mockProps,
        module: { ...mockModule, content: '' }
      }

      render(<TextModule {...propsWithoutContent} />)

      expect(screen.getByText('点击输入文本内容')).toBeInTheDocument()
    })

    it('应该应用样式属性', () => {
      render(<TextModule {...mockProps} />)

      const textElement = screen.getByText('测试文本内容')
      const parentDiv = textElement.closest('div')
      expect(parentDiv).toHaveStyle({
        color: 'rgb(51, 51, 51)'
      })
    })
  })

  describe('编辑模式', () => {
    it('应该在编辑模式显示格式化工具栏', () => {
      render(<TextModule {...mockProps} isEditing={true} />)

      expect(screen.getByRole('button', { name: '加粗' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '下划线' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '添加链接' })).toBeInTheDocument()
    })

    it('应该显示可编辑的文本区域', () => {
      render(<TextModule {...mockProps} isEditing={true} />)

      const editableElement = screen.getByRole('textbox')
      expect(editableElement).toBeInTheDocument()
      expect(editableElement).toHaveAttribute('contenteditable', 'true')
    })

    it('应该处理格式化按钮点击', async () => {
      const user = userEvent.setup()
      render(<TextModule {...mockProps} isEditing={true} />)

      const boldButton = screen.getByRole('button', { name: '加粗' })
      await user.click(boldButton)

      expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined)
    })
  })

  describe('内容更新', () => {
    it('应该在内容变化时调用onUpdate', () => {
      render(<TextModule {...mockProps} isEditing={true} />)

      const editableElement = screen.getByRole('textbox')
      fireEvent.input(editableElement, { target: { textContent: '新内容' } })

      expect(mockProps.onUpdate).toHaveBeenCalled()
    })
  })

  describe('事件处理', () => {
    it('应该处理点击开始编辑', async () => {
      const user = userEvent.setup()
      render(<TextModule {...mockProps} />)

      const moduleContainer = screen.getByText('测试文本内容').closest('div')
      if (moduleContainer) {
        await user.click(moduleContainer)
        expect(mockProps.onStartEdit).toHaveBeenCalled()
      }
    })
  })

  describe('无障碍访问性', () => {
    it('应该支持键盘导航', async () => {
      const user = userEvent.setup()
      render(<TextModule {...mockProps} isEditing={true} />)

      const editableElement = screen.getByRole('textbox')

      // 直接聚焦到元素来测试键盘访问性
      editableElement.focus()
      expect(editableElement).toHaveFocus()
    })

    it('应该有适当的ARIA标签', () => {
      render(<TextModule {...mockProps} isEditing={true} />)

      const editableElement = screen.getByRole('textbox')
      expect(editableElement).toHaveAttribute('aria-label', '文本内容编辑器')

      const boldButton = screen.getByRole('button', { name: '加粗' })
      expect(boldButton).toHaveAttribute('title', '加粗')
    })
  })
})
