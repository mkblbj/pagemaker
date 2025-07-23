import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { KeyValueModule } from './KeyValueModule'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock I18n context
const mockTEditor = vi.fn((key: string) => key)
vi.mock('@/contexts/I18nContext', () => ({
  useTranslation: () => ({
    tEditor: mockTEditor
  })
}))

describe('KeyValueModule', () => {
  const mockModule = {
    id: 'keyvalue-1',
    type: PageModuleType.KEY_VALUE,
    rows: [
      { key: '产品名称', value: '测试产品' },
      { key: '价格', value: '¥999' },
      { key: '规格', value: '10cm x 15cm' }
    ],
    labelBackgroundColor: '#f3f4f6',
    textColor: '#374151'
  }

  const defaultProps = {
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

  it('应该渲染键值对表格', () => {
    render(<KeyValueModule {...defaultProps} />)

    // 检查表格是否存在
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    // 检查键值对数据
    expect(screen.getByText('产品名称')).toBeInTheDocument()
    expect(screen.getByText('测试产品')).toBeInTheDocument()
    expect(screen.getByText('价格')).toBeInTheDocument()
    expect(screen.getByText('¥999')).toBeInTheDocument()
    expect(screen.getByText('规格')).toBeInTheDocument()
    expect(screen.getByText('10cm x 15cm')).toBeInTheDocument()
  })

  it('应该应用自定义颜色样式', () => {
    render(<KeyValueModule {...defaultProps} />)

    const labelCells = screen.getAllByText(/产品名称|价格|规格/)
    const valueCells = screen.getAllByText(/测试产品|¥999|10cm x 15cm/)

    // 检查标签列背景色
    labelCells.forEach(cell => {
      expect(cell).toHaveStyle({ backgroundColor: '#f3f4f6' })
    })

    // 检查文本颜色
    ;[...labelCells, ...valueCells].forEach(cell => {
      expect(cell).toHaveStyle({ color: '#374151' })
    })
  })

  it('应该显示模块标识当鼠标悬停时', () => {
    render(<KeyValueModule {...defaultProps} />)

    const moduleContainer = screen.getByText('产品名称').closest('.group')
    expect(moduleContainer).toBeInTheDocument()

    // 模块标识应该存在但初始不可见
    const badge = screen.getByText('键值对表格 (3 行)')
    expect(badge).toBeInTheDocument()
  })

  it('应该处理选中状态', () => {
    render(<KeyValueModule {...defaultProps} isSelected={true} />)

    const moduleContainer = screen.getByText('产品名称').closest('.group')
    expect(moduleContainer).toHaveClass('border-blue-500', 'bg-blue-50/50')
  })

  it('应该处理编辑状态', () => {
    render(<KeyValueModule {...defaultProps} isEditing={true} />)
  })

  it('应该在点击时调用onStartEdit', () => {
    const mockOnStartEdit = vi.fn()
    render(<KeyValueModule {...defaultProps} onStartEdit={mockOnStartEdit} />)

    const moduleContainer = screen.getByText('产品名称').closest('.group')
    fireEvent.click(moduleContainer!)

    expect(mockOnStartEdit).toHaveBeenCalledTimes(1)
  })

  it('应该处理空数据情况', () => {
    const emptyModule = {
      ...mockModule,
      rows: []
    }

    render(<KeyValueModule {...defaultProps} module={emptyModule} />)

    // 应该显示默认的键值对
    expect(screen.getByText('键')).toBeInTheDocument()
    expect(screen.getByText('值')).toBeInTheDocument()
  })

  it('应该向后兼容pairs属性', () => {
    const legacyModule = {
      ...mockModule,
      rows: undefined,
      pairs: [{ key: '旧键', value: '旧值' }]
    }

    render(<KeyValueModule {...defaultProps} module={legacyModule as any} />)

    expect(screen.getByText('旧键')).toBeInTheDocument()
    expect(screen.getByText('旧值')).toBeInTheDocument()
  })

  it('应该使用默认颜色当未提供颜色时', () => {
    const moduleWithoutColors = {
      ...mockModule,
      labelBackgroundColor: undefined,
      textColor: undefined
    }

    render(<KeyValueModule {...defaultProps} module={moduleWithoutColors} />)

    const labelCells = screen.getAllByText(/产品名称|价格|规格/)

    // 检查默认背景色
    labelCells.forEach(cell => {
      expect(cell).toHaveStyle({ backgroundColor: '#f3f4f6' })
    })
  })

  it('应该正确显示行数在模块标识中', () => {
    const moduleWithManyRows = {
      ...mockModule,
      rows: [
        { key: '键1', value: '值1' },
        { key: '键2', value: '值2' },
        { key: '键3', value: '值3' },
        { key: '键4', value: '值4' },
        { key: '键5', value: '值5' }
      ]
    }

    render(<KeyValueModule {...defaultProps} module={moduleWithManyRows} />)

    expect(screen.getByText('键值对表格 (5 行)')).toBeInTheDocument()
  })

  it('应该正确处理多行文本值', () => {
    const moduleWithMultilineValue = {
      ...mockModule,
      rows: [{ key: '描述', value: '这是一个\n多行描述\n文本' }]
    }

    render(<KeyValueModule {...defaultProps} module={moduleWithMultilineValue} />)

    expect(screen.getByText('描述')).toBeInTheDocument()
    // 检查表格中包含多行文本的值单元格
    const valueCell = screen.getByText('描述').closest('tr')?.querySelector('td:last-child')
    expect(valueCell).toBeInTheDocument()
    expect(valueCell?.textContent).toContain('这是一个')
    expect(valueCell?.textContent).toContain('多行描述')
    expect(valueCell?.textContent).toContain('文本')
  })
})
