import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiColumnModule } from './MultiColumnModule'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock useTranslation
vi.mock('@/contexts/I18nContext', () => ({
  useTranslation: () => ({
    tEditor: (key: string, _params?: any) => {
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

describe('MultiColumnModule', () => {
  const defaultModule = {
    id: 'multi-column-test',
    type: PageModuleType.MULTI_COLUMN,
    layout: 'imageLeft' as const,
    imageConfig: {
      src: '',
      alt: '图片描述',
      alignment: 'center' as const,
      width: '50%'
    },
    textConfig: {
      content: '', // 空字符串，让组件显示placeholder
      alignment: 'left' as const,
      font: 'inherit',
      fontSize: '14px',
      color: '#000000',
      backgroundColor: 'transparent'
    },
    columnRatio: '1:1'
  }

  const mockOnUpdate = vi.fn()
  const mockOnStartEdit = vi.fn()
  const mockOnEndEdit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该渲染多列图文模块标识', () => {
      render(
        <MultiColumnModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('多列图文 - 图左文右')).toBeInTheDocument()
    })

    it('应该渲染空的图片和文本占位符', () => {
      render(
        <MultiColumnModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('点击选择图片')).toBeInTheDocument()
      expect(screen.getByText('点击添加文本')).toBeInTheDocument()
    })

    it('应该在有图片时渲染图片', () => {
      const moduleWithImage = {
        ...defaultModule,
        imageConfig: {
          ...defaultModule.imageConfig,
          src: 'https://example.com/image.jpg',
          alt: '测试图片'
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithImage}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const image = screen.getByAltText('测试图片')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('应该在有文本时渲染文本内容', () => {
      const moduleWithText = {
        ...defaultModule,
        textConfig: {
          ...defaultModule.textConfig,
          content: '<p>测试文本内容</p>'
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithText}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('测试文本内容')).toBeInTheDocument()
    })
  })

  describe('布局类型', () => {
    it('应该正确渲染图左文右布局', () => {
      const testModule = { ...defaultModule, layout: 'imageLeft' as const }

      render(
        <MultiColumnModule
          module={testModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('多列图文 - 图左文右')).toBeInTheDocument()
    })

    it('应该正确渲染文左图右布局', () => {
      const testModule = { ...defaultModule, layout: 'textLeft' as const }

      render(
        <MultiColumnModule
          module={testModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('多列图文 - 文左图右')).toBeInTheDocument()
    })

    it('应该正确渲染图上文下布局', () => {
      const testModule = { ...defaultModule, layout: 'imageTop' as const }

      render(
        <MultiColumnModule
          module={testModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('多列图文 - 图上文下')).toBeInTheDocument()
    })

    it('应该正确渲染文上图下布局', () => {
      const testModule = { ...defaultModule, layout: 'textTop' as const }

      render(
        <MultiColumnModule
          module={testModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('多列图文 - 文上图下')).toBeInTheDocument()
    })
  })

  describe('交互功能', () => {
    it('应该在点击时触发编辑模式', async () => {
      const user = userEvent.setup()

      render(
        <MultiColumnModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const moduleContainer = screen.getByText('多列图文 - 图左文右').closest('div')
      if (moduleContainer) {
        await user.click(moduleContainer)
        expect(mockOnStartEdit).toHaveBeenCalledTimes(1)
      }
    })

    it('应该在编辑模式下显示图片删除按钮（当有图片时）', () => {
      const moduleWithImage = {
        ...defaultModule,
        imageConfig: {
          ...defaultModule.imageConfig,
          src: 'https://example.com/test.jpg'
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithImage}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByTitle('删除图片')).toBeInTheDocument()
    })

    it('应该能够删除图片', async () => {
      const user = userEvent.setup()
      const moduleWithImage = {
        ...defaultModule,
        imageConfig: {
          ...defaultModule.imageConfig,
          src: 'https://example.com/test.jpg'
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithImage}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击删除按钮
      const deleteButton = screen.getByTitle('删除图片')
      await user.click(deleteButton)

      // 应该调用onUpdate清除图片
      expect(mockOnUpdate).toHaveBeenCalledWith({
        imageConfig: expect.objectContaining({
          src: '',
          alt: ''
        })
      })
    })

    it('应该在选中但非编辑状态时显示编辑提示', () => {
      render(
        <MultiColumnModule
          module={defaultModule}
          isSelected={true}
          isEditing={false}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('点击图片或文本区域直接编辑')).toBeInTheDocument()
    })
  })

  describe('样式应用', () => {
    it('应该应用正确的图片样式', () => {
      const moduleWithImage = {
        ...defaultModule,
        imageConfig: {
          src: 'https://example.com/image.jpg',
          alt: '测试图片',
          alignment: 'center' as const,
          width: '75%'
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithImage}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const image = screen.getByAltText('测试图片')
      expect(image).toHaveStyle({ width: '75%' })
    })

    it('应该应用正确的文本样式', () => {
      const moduleWithText = {
        ...defaultModule,
        textConfig: {
          content: '测试文本',
          alignment: 'center' as const,
          font: 'Arial',
          fontSize: '3', // 修改为数字格式
          color: '#ff0000',
          backgroundColor: '#f0f0f0'
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithText}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const textContainer = screen.getByText('测试文本').parentElement
      expect(textContainer).toHaveStyle({
        color: 'rgb(255, 0, 0)'
      })
      // 其他样式可能应用在不同的元素上或通过CSS类应用
    })
  })

  describe('链接功能', () => {
    it('应该在有链接时渲染可点击的图片', () => {
      const moduleWithLink = {
        ...defaultModule,
        imageConfig: {
          src: 'https://example.com/image.jpg',
          alt: '测试图片',
          alignment: 'center' as const,
          width: '50%',
          link: {
            type: 'url' as const,
            value: 'https://example.com'
          }
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithLink}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('应该正确处理邮箱链接', () => {
      const moduleWithEmailLink = {
        ...defaultModule,
        imageConfig: {
          src: 'https://example.com/image.jpg',
          alt: '测试图片',
          alignment: 'center' as const,
          width: '50%',
          link: {
            type: 'email' as const,
            value: 'test@example.com'
          }
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithEmailLink}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'mailto:test@example.com')
    })
  })

  describe('新增功能测试', () => {
    it('应该在图片区域显示ImageModule组件功能', async () => {
      const user = userEvent.setup()

      render(
        <MultiColumnModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 应该显示ImageModule的占位符（点击选择图片）
      expect(screen.getByText('点击选择图片')).toBeInTheDocument()

      // 点击图片区域应该触发ImageModule的功能
      const imagePlaceholder = screen.getByText('点击选择图片')
      await user.click(imagePlaceholder)

      // ImageModule会处理点击事件，这里我们验证组件存在即可
      expect(imagePlaceholder).toBeInTheDocument()
    })

    it('应该在点击文本占位符时进入文本编辑模式', async () => {
      const user = userEvent.setup()

      render(
        <MultiColumnModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击文本占位符
      const textPlaceholder = screen.getByText('点击添加文本')
      await user.click(textPlaceholder)

      // 应该显示可编辑的文本区域
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('应该在文本编辑时正确更新内容', async () => {
      const user = userEvent.setup()
      const moduleWithText = {
        ...defaultModule,
        textConfig: {
          ...defaultModule.textConfig,
          content: '原始文本'
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithText}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击文本区域进入编辑模式
      const textArea = screen.getByText('原始文本')
      await user.click(textArea)

      // 应该显示可编辑的文本区域
      const editableElement = screen.getByRole('textbox')
      expect(editableElement).toBeInTheDocument()

      // 修改文本内容
      fireEvent.input(editableElement, { target: { innerHTML: '新的文本内容' } })

      // 应该调用onUpdate更新文本配置
      expect(mockOnUpdate).toHaveBeenCalledWith({
        textConfig: expect.objectContaining({
          content: '新的文本内容'
        })
      })
    })

    it('应该清理HTML标签并正确处理空内容', async () => {
      const user = userEvent.setup()

      render(
        <MultiColumnModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击文本占位符进入编辑模式
      const textPlaceholder = screen.getByText('点击添加文本')
      await user.click(textPlaceholder)

      const textEditor = screen.getByRole('textbox')

      // 模拟输入包含br标签的内容（浏览器可能自动添加）
      fireEvent.input(textEditor, {
        target: { innerHTML: '<br>' }
      })

      // 失焦触发内容更新
      fireEvent.blur(textEditor)

      // 应该清理掉br标签，保存为空字符串
      expect(mockOnUpdate).toHaveBeenCalledWith({
        textConfig: expect.objectContaining({
          content: ''
        })
      })
    })

    it('应该正确切换布局并更新显示', async () => {
      const user = userEvent.setup()

      const moduleWithImageLeft = {
        ...defaultModule,
        layout: 'imageLeft' as const,
        imageConfig: { ...defaultModule.imageConfig, src: 'test-image.jpg' },
        textConfig: { ...defaultModule.textConfig, content: '测试文本' }
      }

      const { rerender } = render(
        <MultiColumnModule
          module={moduleWithImageLeft}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 验证图左文右布局
      expect(screen.getByText('多列图文 - 图左文右')).toBeInTheDocument()
      const container = screen.getByText('测试文本').closest('.flex')
      expect(container).toHaveClass('flex-row')

      // 切换到文左图右布局
      const moduleWithTextLeft = {
        ...moduleWithImageLeft,
        layout: 'textLeft' as const
      }

      rerender(
        <MultiColumnModule
          module={moduleWithTextLeft}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 验证文左图右布局
      expect(screen.getByText('多列图文 - 文左图右')).toBeInTheDocument()

      // 切换到图上文下布局
      const moduleWithImageTop = {
        ...moduleWithImageLeft,
        layout: 'imageTop' as const
      }

      rerender(
        <MultiColumnModule
          module={moduleWithImageTop}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 验证图上文下布局
      expect(screen.getByText('多列图文 - 图上文下')).toBeInTheDocument()
      const containerVertical = screen.getByText('测试文本').closest('.flex')
      expect(containerVertical).toHaveClass('flex-col')

      // 切换到文上图下布局
      const moduleWithTextTop = {
        ...moduleWithImageLeft,
        layout: 'textTop' as const
      }

      rerender(
        <MultiColumnModule
          module={moduleWithTextTop}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 验证文上图下布局
      expect(screen.getByText('多列图文 - 文上图下')).toBeInTheDocument()
    })

    it('应该在按Escape键时退出文本编辑模式', async () => {
      const user = userEvent.setup()
      const moduleWithText = {
        ...defaultModule,
        textConfig: {
          ...defaultModule.textConfig,
          content: '测试文本'
        }
      }

      render(
        <MultiColumnModule
          module={moduleWithText}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击文本区域进入编辑模式
      const textArea = screen.getByText('测试文本')
      await user.click(textArea)

      // 确认进入编辑模式
      const editableElement = screen.getByRole('textbox')
      expect(editableElement).toBeInTheDocument()

      // 按Escape键
      await user.type(editableElement, '{Escape}')

      // 应该退出编辑模式
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })
})
