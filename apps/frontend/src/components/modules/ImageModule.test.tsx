import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageModule } from './ImageModule'
import { PageModuleType } from '@pagemaker/shared-types'
import * as imageService from '@/services/imageService'

// Mock imageService
vi.mock('@/services/imageService', () => ({
  imageService: {
    validateImageFile: vi.fn(),
    uploadImage: vi.fn(),
    getCabinetImages: vi.fn(),
    getCabinetFolders: vi.fn()
  }
}))

// Mock I18nContext
vi.mock('@/contexts/I18nContext', () => ({
  useTranslation: () => ({
    tEditor: (key: string) => key
  })
}))

const mockImageService = vi.mocked(imageService.imageService)

describe('ImageModule', () => {
  const defaultModule = {
    id: 'test-image-module',
    type: PageModuleType.IMAGE,
    src: '',
    alt: '测试图片',
    alignment: 'center' as const,
    size: {
      type: 'preset' as const,
      value: 'full'
    }
  }

  const mockOnUpdate = vi.fn()
  const mockOnStartEdit = vi.fn()
  const mockOnEndEdit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该渲染图片模块标识', () => {
      render(
        <ImageModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('图片模块')).toBeInTheDocument()
    })

    it('当没有图片时应该显示占位符', () => {
      render(
        <ImageModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByText('点击选择图片')).toBeInTheDocument()
      expect(screen.getByText('支持 JPG、PNG、GIF、WebP 格式')).toBeInTheDocument()
    })

    it('当有图片时应该显示图片', () => {
      const moduleWithImage = {
        ...defaultModule,
        src: 'https://example.com/image.jpg',
        alt: '测试图片'
      }

      render(
        <ImageModule
          module={moduleWithImage}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
      expect(image).toHaveAttribute('alt', '测试图片')
    })

    it('应该根据对齐方式设置样式', () => {
      const moduleWithLeftAlign = {
        ...defaultModule,
        src: 'https://example.com/image.jpg',
        alignment: 'left' as const
      }

      render(
        <ImageModule
          module={moduleWithLeftAlign}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const container = screen.getByRole('img').parentElement
      expect(container).toHaveStyle({ textAlign: 'left' })
    })
  })

  describe('编辑模式', () => {
    it('在编辑模式下有图片时应该显示删除按钮', () => {
      const moduleWithImage = {
        ...defaultModule,
        src: 'https://example.com/image.jpg'
      }

      render(
        <ImageModule
          module={moduleWithImage}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByTitle('删除图片')).toBeInTheDocument()
    })

    it('在编辑模式下没有图片时不应该显示删除按钮', () => {
      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.queryByTitle('删除图片')).not.toBeInTheDocument()
    })

    it('点击删除按钮应该清除图片', async () => {
      const user = userEvent.setup()
      const moduleWithImage = {
        ...defaultModule,
        src: 'https://example.com/image.jpg',
        alt: '测试图片'
      }

      render(
        <ImageModule
          module={moduleWithImage}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const deleteButton = screen.getByTitle('删除图片')
      await user.click(deleteButton)

      expect(mockOnUpdate).toHaveBeenCalledWith({ src: '', alt: '' })
    })
  })

  describe('图片选择功能', () => {
    it('应该通过点击占位符打开图片选择', async () => {
      const user = userEvent.setup()

      render(
        <ImageModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击占位符区域
      const placeholder = screen.getByText('点击选择图片').closest('div')
      expect(placeholder).toBeInTheDocument()
      await user.click(placeholder!)

      // 应该打开图片选择对话框
      expect(screen.getByText('选择图片')).toBeInTheDocument()
    })

    it('应该在对话框中显示上传选项', async () => {
      const user = userEvent.setup()

      render(
        <ImageModule
          module={defaultModule}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 点击占位符打开对话框
      const placeholder = screen.getByText('点击选择图片').closest('div')
      await user.click(placeholder!)

      // 验证上传选项存在
      expect(screen.getByText('上传新图片')).toBeInTheDocument()
      expect(screen.getByText('从R-Cabinet选择')).toBeInTheDocument()
      expect(screen.getByText('选择文件')).toBeInTheDocument()
    })
  })

  describe('链接功能', () => {
    it('应该为带链接的图片创建链接元素', () => {
      const moduleWithLink = {
        ...defaultModule,
        src: 'https://example.com/image.jpg',
        link: {
          type: 'url' as const,
          value: 'https://example.com'
        }
      }

      render(
        <ImageModule
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
        src: 'https://example.com/image.jpg',
        link: {
          type: 'email' as const,
          value: 'test@example.com'
        }
      }

      render(
        <ImageModule
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
})
