import { render, screen, fireEvent, act } from '@/test-utils'
import { vi } from 'vitest'
import { createRef } from 'react'
import { KeyboardShortcutsHelp, KeyboardShortcutsHelpRef } from '../KeyboardShortcutsHelp'

describe('KeyboardShortcutsHelp', () => {
  it('应该渲染帮助按钮', () => {
    render(<KeyboardShortcutsHelp />)

    const helpButton = screen.getByRole('button', { name: /键盘快捷键帮助/i })
    expect(helpButton).toBeInTheDocument()
  })

  it('点击帮助按钮应该打开对话框', () => {
    render(<KeyboardShortcutsHelp />)

    const helpButton = screen.getByRole('button', { name: /键盘快捷键帮助/i })
    fireEvent.click(helpButton)

    expect(screen.getByText('键盘快捷键')).toBeInTheDocument()
  })

  it('应该显示所有快捷键类别', () => {
    render(<KeyboardShortcutsHelp />)

    const helpButton = screen.getByRole('button', { name: /键盘快捷键帮助/i })
    fireEvent.click(helpButton)

    expect(screen.getByText('模块导航')).toBeInTheDocument()
    expect(screen.getByText('模块操作')).toBeInTheDocument()
    expect(screen.getByText('帮助')).toBeInTheDocument()
  })

  it('应该显示具体的快捷键', () => {
    render(<KeyboardShortcutsHelp />)

    const helpButton = screen.getByRole('button', { name: /键盘快捷键帮助/i })
    fireEvent.click(helpButton)

    expect(screen.getByText('选择上一个模块')).toBeInTheDocument()
    expect(screen.getByText('选择下一个模块')).toBeInTheDocument()
    expect(screen.getByText('向上移动选中模块')).toBeInTheDocument()
    // 使用 getAllByText 处理重复的"删除选中模块"
    expect(screen.getAllByText('删除选中模块')).toHaveLength(2)
  })

  it('应该显示键盘符号', () => {
    render(<KeyboardShortcutsHelp />)

    const helpButton = screen.getByRole('button', { name: /键盘快捷键帮助/i })
    fireEvent.click(helpButton)

    // 检查是否显示了键盘符号，使用 getAllByText 处理重复元素
    expect(screen.getAllByText('↑')).toHaveLength(2) // 普通选择和 Shift+向上移动
    expect(screen.getAllByText('↓')).toHaveLength(2) // 普通选择和 Shift+向下移动
    expect(screen.getAllByText('⇧')).toHaveLength(2) // Shift 键出现两次
    expect(screen.getByText('⌦')).toBeInTheDocument() // Delete
  })

  it('应该显示提示信息', () => {
    render(<KeyboardShortcutsHelp />)

    const helpButton = screen.getByRole('button', { name: /键盘快捷键帮助/i })
    fireEvent.click(helpButton)

    expect(screen.getByText(/快捷键在输入框中不会生效/)).toBeInTheDocument()
  })

  it('应该支持通过 ref 打开对话框', async () => {
    const ref = createRef<KeyboardShortcutsHelpRef>()
    render(<KeyboardShortcutsHelp ref={ref} />)

    // 通过 ref 打开对话框，使用 act 包装
    await act(async () => {
      ref.current?.openDialog()
    })

    expect(screen.getByText('键盘快捷键')).toBeInTheDocument()
  })
})
