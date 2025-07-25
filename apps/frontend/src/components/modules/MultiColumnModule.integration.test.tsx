import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModuleRenderer } from '@/components/editor/ModuleRenderer'
import { generateHTML } from '@/services/htmlExportService'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock useTranslation
vi.mock('@/contexts/I18nContext', () => ({
  useTranslation: () => ({
    tEditor: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        多列图文: '多列图文',
        图左文右: '图左文右',
        文左图右: '文左图右',
        图上文下: '图上文下',
        文上图下: '文上图下',
        图片描述: '图片描述',
        输入文本内容: '输入文本内容',
        点击添加图片: '点击添加图片',
        点击添加文本: '点击添加文本',
        切换布局: '切换布局',
        在右侧属性面板中配置图片和文本: '在右侧属性面板中配置图片和文本'
      }
      return translations[key] || key
    }
  })
}))

describe('MultiColumnModule 集成测试', () => {
  const completeModule = {
    id: 'multi-column-integration-test',
    type: PageModuleType.MULTI_COLUMN,
    layout: 'imageLeft' as const,
    imageConfig: {
      src: 'https://example.com/test-image.jpg',
      alt: '集成测试图片',
      alignment: 'center' as const,
      width: '60%',
      link: {
        type: 'url' as const,
        value: 'https://example.com/link'
      }
    },
    textConfig: {
      content: '<p><strong>集成测试文本</strong></p><p>这是一段包含格式化的文本内容。</p>',
      alignment: 'left' as const,
      font: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#333333',
      backgroundColor: '#f8f9fa'
    },
    columnRatio: '3:2'
  }

  describe('与ModuleRenderer集成', () => {
    it('应该通过ModuleRenderer正确渲染完整的多列图文模块', () => {
      const mockOnUpdate = vi.fn()
      const mockOnStartEdit = vi.fn()
      const mockOnEndEdit = vi.fn()

      render(
        <ModuleRenderer
          module={completeModule}
          isSelected={false}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 验证模块标识
      expect(screen.getByText('多列图文 - 图左文右')).toBeInTheDocument()

      // 验证图片渲染
      const image = screen.getByAltText('集成测试图片')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg')
      expect(image).toHaveStyle({ width: '60%' })

      // 验证图片链接
      const imageLink = image.closest('a')
      expect(imageLink).toHaveAttribute('href', 'https://example.com/link')

      // 验证文本内容
      expect(screen.getByText('集成测试文本')).toBeInTheDocument()
      expect(screen.getByText('这是一段包含格式化的文本内容。')).toBeInTheDocument()
    })

    it('应该支持选中状态和编辑模式切换', async () => {
      const user = userEvent.setup()
      const mockOnUpdate = vi.fn()
      const mockOnStartEdit = vi.fn()
      const mockOnEndEdit = vi.fn()

      const { rerender } = render(
        <ModuleRenderer
          module={completeModule}
          isSelected={false}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击模块进入选中状态
      const moduleContainer = screen.getByText('多列图文 - 图左文右').closest('div')
      if (moduleContainer) {
        await user.click(moduleContainer)
        expect(mockOnStartEdit).toHaveBeenCalledTimes(1)
      }

      // 重新渲染为选中状态
      rerender(
        <ModuleRenderer
          module={completeModule}
          isSelected={true}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('点击图片或文本区域直接编辑')).toBeInTheDocument()

      // 重新渲染为编辑状态
      rerender(
        <ModuleRenderer
          module={completeModule}
          isSelected={true}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByTitle('删除图片')).toBeInTheDocument()
    })
  })

  describe('与HTML导出服务集成', () => {
    it('应该生成正确的标准HTML', () => {
      const html = generateHTML([completeModule])

      // 验证包含响应式样式
      expect(html).toContain('<style>')
      expect(html).toContain('.pm-multi-column')
      expect(html).toContain('flex-direction: row')
      expect(html).toContain('@media (max-width: 768px)')

      // 验证容器结构
      expect(html).toContain('<div class="pm-multi-column">')
      expect(html).toContain('<div class="pm-multi-column-image"')
      expect(html).toContain('<div class="pm-multi-column-text"')

      // 验证图片部分
      expect(html).toContain('src="https://example.com/test-image.jpg"')
      expect(html).toContain('alt="集成测试图片"')
      expect(html).toContain('width: 60%')
      expect(html).toContain('href="https://example.com/link"')
      expect(html).toContain('target="_blank"')

      // 验证文本部分
      expect(html).toContain('<p><strong>集成测试文本</strong></p>')
      expect(html).toContain('font-family: Arial, sans-serif')
      expect(html).toContain('font-size: 16px')
      expect(html).toContain('color: #333333')
      expect(html).toContain('background-color: #f8f9fa')
    })

    it('应该生成正确的移动端HTML', () => {
      const html = generateHTML([completeModule], { mobileMode: true })

      // 验证使用table布局而非flex，符合乐天移动端规范
      expect(html).toContain('<table width="100%" cellspacing="0" cellpadding="10" border="0">')
      expect(html).not.toContain('<style>')
      expect(html).not.toContain('flex-direction')
      expect(html).not.toContain('<tbody>') // 确保不包含乐天不支持的tbody标签

      // 验证图片部分（移动端）
      expect(html).toContain('src="https://example.com/test-image.jpg"')
      expect(html).toContain('alt="集成测试图片"')
      expect(html).toContain('width="60%"')
      expect(html).toContain('href="https://example.com/link"')

      // 验证文本部分（移动端）
      expect(html).toContain('<font size="4" color="#333333">')
      expect(html).toContain('bgcolor="#f8f9fa"')
    })

    it('应该正确处理不同的布局类型导出', () => {
      const layouts = ['imageLeft', 'textLeft', 'imageTop', 'textTop'] as const

      layouts.forEach(layout => {
        const moduleWithLayout = { ...completeModule, layout }
        const html = generateHTML([moduleWithLayout])

        // 所有布局都应该包含基本结构
        expect(html).toContain('<div class="pm-multi-column">')
        expect(html).toContain('<div class="pm-multi-column-image"')
        expect(html).toContain('<div class="pm-multi-column-text"')

        // 验证布局方向
        if (layout === 'imageLeft' || layout === 'textLeft') {
          expect(html).toContain('flex-direction: row')
        } else {
          expect(html).toContain('flex-direction: column')
        }
      })
    })

    it('应该正确处理空内容的导出', () => {
      const emptyModule = {
        ...completeModule,
        imageConfig: { src: '', alt: '', alignment: 'center' as const, width: '50%' },
        textConfig: {
          content: '',
          alignment: 'left' as const,
          font: 'inherit',
          fontSize: '14px',
          color: '#000000',
          backgroundColor: 'transparent'
        }
      }

      const standardHtml = generateHTML([emptyModule])
      const mobileHtml = generateHTML([emptyModule], { mobileMode: true })

      expect(standardHtml).toContain('多列图文模块：内容未设置')
      expect(mobileHtml).toContain('多列图文模块：内容未设置')
    })
  })

  describe('数据结构兼容性', () => {
    it('应该正确处理完整的模块配置', () => {
      const mockOnUpdate = vi.fn()

      render(
        <ModuleRenderer
          module={completeModule}
          isSelected={false}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={() => {}}
          onEndEdit={() => {}}
        />
      )

      // 验证图片样式正确应用
      const image = screen.getByAltText('集成测试图片')
      expect(image).toHaveStyle({ width: '60%' })

      // 验证文本内容存在（样式由内联样式应用，DOM结构可能不同）
      expect(screen.getByText('集成测试文本')).toBeInTheDocument()
      expect(screen.getByText('这是一段包含格式化的文本内容。')).toBeInTheDocument()

      // 验证模块整体配置正确
      expect(screen.getByText('多列图文 - 图左文右')).toBeInTheDocument()
    })

    it('应该正确处理部分配置缺失的情况', () => {
      const partialModule = {
        id: 'partial-module',
        type: PageModuleType.MULTI_COLUMN,
        layout: 'imageTop' as const,
        imageConfig: {
          src: 'https://example.com/image.jpg',
          alt: '部分配置图片',
          alignment: 'left' as const,
          width: '100%'
        },
        textConfig: {
          content: '简单文本',
          alignment: 'center' as const,
          font: 'inherit',
          fontSize: '14px',
          color: '#000000'
          // 缺少 backgroundColor
        }
      }

      const mockOnUpdate = vi.fn()

      render(
        <ModuleRenderer
          module={partialModule}
          isSelected={false}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={() => {}}
          onEndEdit={() => {}}
        />
      )

      expect(screen.getByText('多列图文 - 图上文下')).toBeInTheDocument()
      expect(screen.getByAltText('部分配置图片')).toBeInTheDocument()
      expect(screen.getByText('简单文本')).toBeInTheDocument()
    })
  })
})
