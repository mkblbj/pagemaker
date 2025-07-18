import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TitleModule } from './TitleModule'
import { PageModuleType } from '@pagemaker/shared-types'

const mockModule = {
  id: 'test-title',
  type: PageModuleType.TITLE,
  text: '测试标题',
  level: 1,
  alignment: 'left' as const,
  color: '#000000',
  fontFamily: 'inherit',
  fontWeight: 'bold' as const
}

describe('TitleModule', () => {
  const mockOnUpdate = vi.fn()
  const mockOnStartEdit = vi.fn()
  const mockOnEndEdit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染标题模块', () => {
    render(
      <TitleModule
        module={mockModule}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    expect(screen.getByText('测试标题')).toBeInTheDocument()
    expect(screen.getByText('标题模块 (H1)')).toBeInTheDocument()
  })

  it('应该在选中时显示编辑提示', () => {
    render(
      <TitleModule
        module={mockModule}
        isSelected={true}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    expect(screen.getByText('点击编辑')).toBeInTheDocument()
  })

  it('应该在编辑模式下显示文本框', () => {
    render(
      <TitleModule
        module={mockModule}
        isEditing={true}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('测试标题')
  })

  it('应该在点击时调用onStartEdit', async () => {
    const user = userEvent.setup()
    render(
      <TitleModule
        module={mockModule}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    await user.click(screen.getByText('测试标题'))
    expect(mockOnStartEdit).toHaveBeenCalled()
  })

  it('应该在文本更改时调用onUpdate', async () => {
    const user = userEvent.setup()
    render(
      <TitleModule
        module={mockModule}
        isEditing={true}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, '新标题')

    expect(mockOnUpdate).toHaveBeenCalledWith({ text: '新标题' })
  })

  it('应该在按Enter键时结束编辑', async () => {
    const user = userEvent.setup()
    render(
      <TitleModule
        module={mockModule}
        isEditing={true}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '{Enter}')

    expect(mockOnEndEdit).toHaveBeenCalled()
  })

  it('应该在按Escape键时取消编辑', async () => {
    const user = userEvent.setup()
    render(
      <TitleModule
        module={mockModule}
        isEditing={true}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '{Escape}')

    expect(mockOnEndEdit).toHaveBeenCalled()
  })

  it('应该根据级别应用正确的样式', () => {
    const h2Module = { ...mockModule, level: 2 }
    render(
      <TitleModule module={h2Module} onUpdate={mockOnUpdate} onStartEdit={mockOnStartEdit} onEndEdit={mockOnEndEdit} />
    )

    expect(screen.getByText('标题模块 (H2)')).toBeInTheDocument()
    const titleElement = screen.getByText('测试标题')
    expect(titleElement).toHaveClass('text-2xl')
  })

  it('应该根据对齐方式应用正确的样式', () => {
    const centerModule = { ...mockModule, alignment: 'center' as const }
    render(
      <TitleModule
        module={centerModule}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    const titleElement = screen.getByText('测试标题')
    expect(titleElement).toHaveClass('text-center')
  })

  it('应该应用自定义颜色和字体', () => {
    const customModule = {
      ...mockModule,
      color: '#ff0000',
      fontFamily: 'Arial, sans-serif'
    }
    render(
      <TitleModule
        module={customModule}
        onUpdate={mockOnUpdate}
        onStartEdit={mockOnStartEdit}
        onEndEdit={mockOnEndEdit}
      />
    )

    const titleElement = screen.getByText('测试标题')
    expect(titleElement).toHaveStyle({ color: '#ff0000', fontFamily: 'Arial, sans-serif' })
  })
})
