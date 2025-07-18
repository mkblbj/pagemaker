import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TitleModule } from './TitleModule'
import { ModuleRenderer } from '@/components/editor/ModuleRenderer'
import { generateHTML } from '@/services/htmlExportService'
import { PageModuleType } from '@pagemaker/shared-types'

describe('TitleModule 集成测试', () => {
  const mockModule = {
    id: 'title-integration-test',
    type: PageModuleType.TITLE,
    text: '集成测试标题',
    level: 2,
    alignment: 'center' as const,
    color: '#1975B0',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold' as const
  }

  describe('与ModuleRenderer集成', () => {
    it('应该通过ModuleRenderer正确渲染', () => {
      const mockOnUpdate = vi.fn()
      const mockOnStartEdit = vi.fn()
      const mockOnEndEdit = vi.fn()

      render(
        <ModuleRenderer
          module={mockModule}
          isSelected={false}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('集成测试标题')).toBeInTheDocument()
      expect(screen.getByText('标题模块 (H2)')).toBeInTheDocument()
    })

    it('应该支持选中状态', () => {
      const mockOnUpdate = vi.fn()
      const mockOnStartEdit = vi.fn()
      const mockOnEndEdit = vi.fn()

      render(
        <ModuleRenderer
          module={mockModule}
          isSelected={true}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('点击编辑')).toBeInTheDocument()
    })

    it('应该支持编辑状态', async () => {
      const user = userEvent.setup()
      const mockOnUpdate = vi.fn()
      const mockOnStartEdit = vi.fn()
      const mockOnEndEdit = vi.fn()

      render(
        <ModuleRenderer
          module={mockModule}
          isSelected={true}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveValue('集成测试标题')

      await user.clear(textarea)
      await user.type(textarea, '修改后的标题')

      expect(mockOnUpdate).toHaveBeenCalledWith({ text: '修改后的标题' })
    })
  })

  describe('与HTML导出服务集成', () => {
    it('应该正确导出HTML', () => {
      const html = generateHTML([mockModule])

      expect(html).toContain('<h2 class="pm-title"')
      expect(html).toContain('text-align: center')
      expect(html).toContain('color: #1975B0')
      expect(html).toContain('font-family: Arial, sans-serif')
      expect(html).toContain('font-weight: bold')
      expect(html).toContain('集成测试标题')
    })

    it('应该正确导出不同配置的标题', () => {
      const customModule = {
        ...mockModule,
        level: 1,
        alignment: 'right' as const,
        color: '#ff0000',
        fontFamily: 'Times New Roman, serif',
        fontWeight: 'normal' as const,
        text: '自定义标题'
      }

      const html = generateHTML([customModule])

      expect(html).toContain('<h1 class="pm-title"')
      expect(html).toContain('text-align: right')
      expect(html).toContain('color: #ff0000')
      expect(html).toContain('font-family: Times New Roman, serif')
      expect(html).toContain('font-weight: normal')
      expect(html).toContain('自定义标题')
    })

    it('应该正确处理特殊字符', () => {
      const specialCharsModule = {
        ...mockModule,
        text: '标题 <script>alert("XSS")</script> & 特殊字符'
      }

      const html = generateHTML([specialCharsModule])

      expect(html).toContain('&lt;script&gt;')
      expect(html).toContain('&amp;')
      expect(html).not.toContain('<script>')
      expect(html).not.toContain('alert("XSS")')
    })

    it('应该支持完整HTML文档导出', () => {
      const html = generateHTML([mockModule], { fullDocument: true })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html lang="zh-CN">')
      expect(html).toContain('<head>')
      expect(html).toContain('<body>')
      expect(html).toContain('<h2 class="pm-title"')
      expect(html).toContain('集成测试标题')
    })
  })

  describe('完整的编辑流程', () => {
    it('应该支持完整的编辑和保存流程', async () => {
      const user = userEvent.setup()
      const mockOnUpdate = vi.fn()
      const mockOnStartEdit = vi.fn()
      const mockOnEndEdit = vi.fn()

      const { rerender } = render(
        <ModuleRenderer
          module={mockModule}
          isSelected={false}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 1. 点击标题开始编辑
      await user.click(screen.getByText('集成测试标题'))
      expect(mockOnStartEdit).toHaveBeenCalled()

      // 2. 模拟进入编辑状态
      rerender(
        <ModuleRenderer
          module={mockModule}
          isSelected={true}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 3. 修改文本
      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, '新的标题文本')

      expect(mockOnUpdate).toHaveBeenCalledWith({ text: '新的标题文本' })

      // 4. 按Enter键结束编辑
      await user.type(textarea, '{Enter}')
      expect(mockOnEndEdit).toHaveBeenCalled()

      // 5. 验证导出的HTML包含新文本
      const updatedModule = { ...mockModule, text: '新的标题文本' }
      const html = generateHTML([updatedModule])
      expect(html).toContain('新的标题文本')
    })

    it('应该支持Escape键取消编辑', async () => {
      const user = userEvent.setup()
      const mockOnUpdate = vi.fn()
      const mockOnStartEdit = vi.fn()
      const mockOnEndEdit = vi.fn()

      render(
        <ModuleRenderer
          module={mockModule}
          isSelected={true}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, '临时文本')
      await user.type(textarea, '{Escape}')

      expect(mockOnEndEdit).toHaveBeenCalled()
    })
  })

  describe('样式应用测试', () => {
    it('应该正确应用所有样式属性', () => {
      render(<TitleModule module={mockModule} isSelected={false} isEditing={false} />)

      const titleElement = screen.getByText('集成测试标题')

      // 验证CSS类
      expect(titleElement).toHaveClass('text-2xl') // H2 级别
      expect(titleElement).toHaveClass('text-center') // 居中对齐
      expect(titleElement).toHaveClass('font-bold') // 加粗

      // 验证内联样式
      expect(titleElement).toHaveStyle({
        color: '#1975B0',
        fontFamily: 'Arial, sans-serif'
      })
    })

    it('应该正确处理不同级别的标题', () => {
      const levels = [1, 2, 3, 4, 5, 6]
      const expectedClasses = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm']

      levels.forEach((level, index) => {
        const testModule = { ...mockModule, level }
        const { unmount } = render(<TitleModule module={testModule} isSelected={false} isEditing={false} />)

        const titleElement = screen.getByText('集成测试标题')
        expect(titleElement).toHaveClass(expectedClasses[index])

        unmount()
      })
    })
  })
})
