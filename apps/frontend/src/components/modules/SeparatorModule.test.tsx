import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { SeparatorModule } from './SeparatorModule'
import { PageModuleType } from '@pagemaker/shared-types'

describe('SeparatorModule', () => {
  const defaultModule = {
    id: 'separator-test',
    type: PageModuleType.SEPARATOR,
    separatorType: 'line' as const,
    lineStyle: 'solid' as const,
    lineColor: '#e5e7eb',
    lineThickness: 1,
    spaceHeight: 'medium' as const
  }

  const mockOnUpdate = vi.fn()
  const mockOnStartEdit = vi.fn()
  const mockOnEndEdit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该渲染分隔模块标识', () => {
      render(
        <SeparatorModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 使用更灵活的文本匹配
      expect(
        screen.getAllByText((content, element) => {
          return !!(element?.textContent?.includes('分隔模块') && element?.textContent?.includes('线条'))
        })[0]
      ).toBeInTheDocument()
    })

    it('应该渲染线条分隔', () => {
      render(
        <SeparatorModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const separator = screen.getByRole('separator')
      expect(separator).toHaveAttribute('aria-label', expect.stringContaining('线条'))
      expect(separator).toHaveStyle({
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: '#e5e7eb'
      })
    })

    it('应该渲染空白间距', () => {
      const spaceModule = {
        ...defaultModule,
        separatorType: 'space' as const
      }

      render(
        <SeparatorModule
          module={spaceModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(
        screen.getAllByText((content, element) => {
          return !!(element?.textContent?.includes('分隔模块') && element?.textContent?.includes('空白'))
        })[0]
      ).toBeInTheDocument()

      const separator = screen.getByRole('separator')
      expect(separator).toHaveAttribute('aria-label', expect.stringContaining('空白'))
      expect(separator).toHaveStyle({ height: '40px' })
    })
  })

  describe('配置选项', () => {
    it('应该支持不同的线条样式', () => {
      const dashedModule = {
        ...defaultModule,
        lineStyle: 'dashed' as const
      }

      render(
        <SeparatorModule
          module={dashedModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const separator = screen.getByRole('separator')
      expect(separator).toHaveStyle({ borderTopStyle: 'dashed' })
    })

    it('应该支持自定义线条颜色', () => {
      const colorModule = {
        ...defaultModule,
        lineColor: '#ff0000'
      }

      render(
        <SeparatorModule
          module={colorModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const separator = screen.getByRole('separator')
      expect(separator).toHaveStyle({ borderTopColor: '#ff0000' })
    })

    it('应该支持自定义线条粗细', () => {
      const thickModule = {
        ...defaultModule,
        lineThickness: 3
      }

      render(
        <SeparatorModule
          module={thickModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const separator = screen.getByRole('separator')
      expect(separator).toHaveStyle({ borderTopWidth: '3px' })
    })

    it('应该支持不同的空白间距高度', () => {
      const testCases = [
        { spaceHeight: 'small', expectedHeight: '20px' },
        { spaceHeight: 'medium', expectedHeight: '40px' },
        { spaceHeight: 'large', expectedHeight: '60px' },
        { spaceHeight: 'extra-large', expectedHeight: '80px' }
      ]

      testCases.forEach(({ spaceHeight, expectedHeight }) => {
        const spaceModule = {
          ...defaultModule,
          separatorType: 'space' as const,
          spaceHeight: spaceHeight as any
        }

        const { unmount } = render(
          <SeparatorModule
            module={spaceModule}
            onUpdate={mockOnUpdate}
            onStartEdit={mockOnStartEdit}
            onEndEdit={mockOnEndEdit}
          />
        )

        const separator = screen.getByRole('separator')
        expect(separator).toHaveStyle({ height: expectedHeight })

        unmount()
      })
    })
  })

  describe('交互行为', () => {
    it('应该在点击时触发编辑', async () => {
      const user = userEvent.setup()

      render(
        <SeparatorModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击整个模块容器
      const container = screen.getByRole('separator').closest('div')
      await user.click(container!)

      expect(mockOnStartEdit).toHaveBeenCalledTimes(1)
    })

    it('应该在选中状态下应用选中样式', () => {
      const { container } = render(
        <SeparatorModule
          module={defaultModule}
          isSelected={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 查找包含选中样式的元素
      const selectedElement = container.querySelector('.border-blue-500')
      expect(selectedElement).toBeInTheDocument()
      expect(selectedElement).toHaveClass('bg-blue-50/50')
    })
  })

  describe('默认值处理', () => {
    it('应该使用默认配置当属性缺失时', () => {
      const minimalModule = {
        id: 'separator-minimal',
        type: PageModuleType.SEPARATOR
      }

      render(
        <SeparatorModule
          module={minimalModule as any}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(
        screen.getAllByText((content, element) => {
          return !!(element?.textContent?.includes('分隔模块') && element?.textContent?.includes('线条'))
        })[0]
      ).toBeInTheDocument()

      const separator = screen.getByRole('separator')
      expect(separator).toHaveStyle({
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: '#e5e7eb'
      })
    })
  })
})
