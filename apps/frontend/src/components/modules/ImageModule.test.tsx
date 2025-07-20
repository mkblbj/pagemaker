import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageModule } from './ImageModule'
import { PageModuleType } from '@pagemaker/shared-types'
import * as imageService from '@/services/imageService'

// Mock useTranslation
vi.mock('@/contexts/I18nContext', () => ({
  useTranslation: () => ({
    tEditor: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        图片模块: '图片模块',
        点击选择图片: '点击选择图片',
        '支持 JPG、PNG、GIF、WebP 格式': '支持 JPG、PNG、GIF、WebP 格式',
        选择图片: '选择图片',
        上传新图片: '上传新图片',
        '从R-Cabinet选择': '从R-Cabinet选择',
        选择文件: '选择文件',
        '支持 JPG、PNG、GIF、WebP 格式，文件大小不超过5MB': '支持 JPG、PNG、GIF、WebP 格式，文件大小不超过5MB',
        加载中: '加载中...',
        图片属性: '图片属性',
        Alt文本: 'Alt文本',
        图片描述文本: '图片描述文本',
        对齐方式: '对齐方式',
        左对齐: '左对齐',
        居中: '居中',
        右对齐: '右对齐',
        图片尺寸: '图片尺寸',
        预设尺寸: '预设尺寸',
        百分比: '百分比',
        超链接: '超链接',
        选择链接类型: '选择链接类型',
        无链接: '无链接',
        网址: '网址',
        邮箱: '邮箱',
        电话: '电话',
        页面锚点: '页面锚点'
      }
      return translations[key] || key
    }
  })
}))

// Mock imageService
vi.mock('@/services/imageService', () => ({
  imageService: {
    uploadImage: vi.fn(),
    getCabinetImages: vi.fn(),
    validateImageFile: vi.fn(),
    generatePreviewUrl: vi.fn()
  },
  validateImageFile: vi.fn(),
  generatePreviewUrl: vi.fn()
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
      value: 'medium'
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
    it('在编辑模式下应该显示工具按钮', () => {
      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByTitle('选择图片')).toBeInTheDocument()
      expect(screen.getByTitle('图片属性')).toBeInTheDocument()
    })

    it('点击选择图片按钮应该打开图片选择对话框', async () => {
      const user = userEvent.setup()

      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const selectButton = screen.getByTitle('选择图片')
      await user.click(selectButton)

      expect(screen.getByText('选择图片')).toBeInTheDocument()
      expect(screen.getByText('上传新图片')).toBeInTheDocument()
      expect(screen.getByText('从R-Cabinet选择')).toBeInTheDocument()
    })

    it('点击属性按钮应该打开属性配置对话框', async () => {
      const user = userEvent.setup()

      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const propertiesButton = screen.getByTitle('图片属性')
      await user.click(propertiesButton)

      expect(screen.getByText('图片属性')).toBeInTheDocument()
      expect(screen.getByText('Alt文本')).toBeInTheDocument()
      expect(screen.getByText('对齐方式')).toBeInTheDocument()
      expect(screen.getByText('图片尺寸')).toBeInTheDocument()
    })
  })

  describe('图片上传功能', () => {
    it('应该处理文件选择和上传', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      mockImageService.validateImageFile.mockReturnValue({ valid: true })
      mockImageService.uploadImage.mockResolvedValue({
        url: 'https://example.com/uploaded.jpg',
        filename: 'test.jpg',
        size: 1024,
        mimeType: 'image/jpeg'
      })

      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 打开图片选择对话框
      const selectButton = screen.getByTitle('选择图片')
      await user.click(selectButton)

      // 点击选择文件按钮
      const uploadButton = screen.getByText('选择文件')
      await user.click(uploadButton)

      // 模拟文件选择
      const fileInput = screen.getByRole('button', { hidden: true })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(mockImageService.validateImageFile).toHaveBeenCalledWith(mockFile)
        expect(mockImageService.uploadImage).toHaveBeenCalledWith(mockFile)
        expect(mockOnUpdate).toHaveBeenCalledWith({
          src: 'https://example.com/uploaded.jpg',
          alt: '测试图片'
        })
      })
    })

    it('应该处理无效文件', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      mockImageService.validateImageFile.mockReturnValue({
        valid: false,
        error: '不支持的文件格式'
      })

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 打开图片选择对话框
      const selectButton = screen.getByTitle('选择图片')
      await user.click(selectButton)

      // 点击选择文件按钮
      const uploadButton = screen.getByText('选择文件')
      await user.click(uploadButton)

      // 模拟文件选择
      const fileInput = screen.getByRole('button', { hidden: true })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('不支持的文件格式')
        expect(mockImageService.uploadImage).not.toHaveBeenCalled()
      })

      alertSpy.mockRestore()
    })
  })

  describe('R-Cabinet图片选择', () => {
    it('应该加载R-Cabinet图片列表', async () => {
      const user = userEvent.setup()
      const mockImages = [
        {
          id: '1',
          url: 'https://example.com/image1.jpg',
          filename: 'image1.jpg',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: '2023-01-01T00:00:00Z'
        }
      ]

      mockImageService.getCabinetImages.mockResolvedValue({
        images: mockImages,
        total: 1,
        page: 1,
        pageSize: 20
      })

      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 打开图片选择对话框
      const selectButton = screen.getByTitle('选择图片')
      await user.click(selectButton)

      // 切换到R-Cabinet标签
      const cabinetTab = screen.getByText('从R-Cabinet选择')
      await user.click(cabinetTab)

      await waitFor(() => {
        expect(mockImageService.getCabinetImages).toHaveBeenCalledWith({
          page: 1,
          pageSize: 20
        })
      })
    })

    it('应该处理R-Cabinet图片选择', async () => {
      const user = userEvent.setup()
      const mockImages = [
        {
          id: '1',
          url: 'https://example.com/image1.jpg',
          filename: 'image1.jpg',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: '2023-01-01T00:00:00Z'
        }
      ]

      mockImageService.getCabinetImages.mockResolvedValue({
        images: mockImages,
        total: 1,
        page: 1,
        pageSize: 20
      })

      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 打开图片选择对话框
      const selectButton = screen.getByTitle('选择图片')
      await user.click(selectButton)

      // 切换到R-Cabinet标签
      const cabinetTab = screen.getByText('从R-Cabinet选择')
      await user.click(cabinetTab)

      // 等待图片加载并点击选择
      await waitFor(() => {
        const image = screen.getByAltText('image1.jpg')
        expect(image).toBeInTheDocument()
      })

      const image = screen.getByAltText('image1.jpg')
      await user.click(image)

      expect(mockOnUpdate).toHaveBeenCalledWith({
        src: 'https://example.com/image1.jpg',
        alt: '测试图片'
      })
    })
  })

  describe('属性配置', () => {
    it('应该更新Alt文本', async () => {
      const user = userEvent.setup()

      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 打开属性配置对话框
      const propertiesButton = screen.getByTitle('图片属性')
      await user.click(propertiesButton)

      // 修改Alt文本
      const altInput = screen.getByPlaceholderText('图片描述文本')
      await user.clear(altInput)
      await user.type(altInput, '新的图片描述')

      expect(mockOnUpdate).toHaveBeenCalledWith({ alt: '新的图片描述' })
    })

    it('应该更新对齐方式', async () => {
      const user = userEvent.setup()

      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      // 打开属性配置对话框
      const propertiesButton = screen.getByTitle('图片属性')
      await user.click(propertiesButton)

      // 修改对齐方式
      const alignmentSelect = screen.getByDisplayValue('居中')
      await user.click(alignmentSelect)
      
      const leftOption = screen.getByText('左对齐')
      await user.click(leftOption)

      expect(mockOnUpdate).toHaveBeenCalledWith({ alignment: 'left' })
    })
  })

  describe('链接功能', () => {
    it('应该为有链接的图片生成正确的href', () => {
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
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('应该为邮箱链接生成正确的href', () => {
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

    it('应该为电话链接生成正确的href', () => {
      const moduleWithPhoneLink = {
        ...defaultModule,
        src: 'https://example.com/image.jpg',
        link: {
          type: 'phone' as const,
          value: '+86 138 0013 8000'
        }
      }

      render(
        <ImageModule
          module={moduleWithPhoneLink}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'tel:+86 138 0013 8000')
    })
  })

  describe('无障碍访问性', () => {
    it('应该有正确的alt属性', () => {
      const moduleWithImage = {
        ...defaultModule,
        src: 'https://example.com/image.jpg',
        alt: '详细的图片描述'
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
      expect(image).toHaveAttribute('alt', '详细的图片描述')
    })

    it('按钮应该有正确的title属性', () => {
      render(
        <ImageModule
          module={defaultModule}
          isEditing={true}
          onUpdate={mockOnUpdate}
          onStartEdit={mockOnStartEdit}
          onEndEdit={mockOnEndEdit}
        />
      )

      expect(screen.getByTitle('选择图片')).toBeInTheDocument()
      expect(screen.getByTitle('图片属性')).toBeInTheDocument()
    })
  })
}) 