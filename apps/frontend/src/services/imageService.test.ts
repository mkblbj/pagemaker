import { describe, it, expect, vi, beforeEach } from 'vitest'
import { imageService, type ImageUploadResponse, type CabinetImageListResponse } from './imageService'
import { apiClient } from '@/lib/apiClient'

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

const mockApiClient = {
  post: vi.fn(),
  get: vi.fn()
}

describe('imageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重新设置mock
    vi.mocked(apiClient.post).mockImplementation(mockApiClient.post)
    vi.mocked(apiClient.get).mockImplementation(mockApiClient.get)
  })

  describe('uploadImage', () => {
    it('应该成功上传图片', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse: ImageUploadResponse = {
        url: 'https://image.rakuten.co.jp/test/test.jpg',
        filename: 'test.jpg',
        size: 1024,
        mimeType: 'image/jpeg'
      }

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      })

      const result = await imageService.uploadImage(mockFile)

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/media/upload/', expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: expect.any(Function)
      })
      expect(result).toEqual(mockResponse)
    })

    it('应该处理上传失败', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      mockApiClient.post.mockResolvedValue({
        data: {
          success: false,
          message: '上传失败'
        }
      })

      await expect(imageService.uploadImage(mockFile)).rejects.toThrow('上传失败')
    })

    it('应该处理网络错误', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      mockApiClient.post.mockRejectedValue(new Error('网络错误'))

      await expect(imageService.uploadImage(mockFile)).rejects.toThrow('网络错误')
    })
  })

  describe('getCabinetImages', () => {
    it('应该成功获取图片列表', async () => {
      const mockResponse: CabinetImageListResponse = {
        images: [
          {
            id: '123',
            url: 'https://image.rakuten.co.jp/test/image1.jpg',
            filename: 'image1.jpg',
            size: 1024,
            mimeType: 'image/jpeg',
            width: 800,
            height: 600,
            uploadedAt: '2023-01-01T00:00:00Z'
          }
        ],
        total: 1,
        page: 1,
        pageSize: 20
      }

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      })

      const result = await imageService.getCabinetImages({ page: 1, pageSize: 20 })

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/media/cabinet-images/', {
        params: { page: 1, pageSize: 20 }
      })
      expect(result).toEqual(mockResponse)
    })

    it('应该处理搜索参数', async () => {
      const mockResponse: CabinetImageListResponse = {
        images: [],
        total: 0,
        page: 1,
        pageSize: 20
      }

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockResponse
        }
      })

      await imageService.getCabinetImages({ page: 1, pageSize: 20, search: 'test' })

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/media/cabinet-images/', {
        params: { page: 1, pageSize: 20, search: 'test' }
      })
    })

    it('应该处理获取失败', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: false,
          message: '获取失败'
        }
      })

      await expect(imageService.getCabinetImages()).rejects.toThrow('获取失败')
    })
  })

  describe('validateImageFile', () => {
    it('应该验证有效的图片文件', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validFile, 'size', { value: 1024 })

      const result = imageService.validateImageFile(validFile)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('应该拒绝不支持的文件类型', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      const result = imageService.validateImageFile(invalidFile)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('不支持的图片格式')
    })

    it('应该拒绝过大的文件', () => {
      const largeFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }) // 6MB

      const result = imageService.validateImageFile(largeFile)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('图片文件过大')
    })

    it('应该验证各种支持的图片格式', () => {
      const formats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

      formats.forEach(format => {
        const file = new File(['test'], `test.${format.split('/')[1]}`, { type: format })
        Object.defineProperty(file, 'size', { value: 1024 })

        const result = imageService.validateImageFile(file)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('generatePreviewUrl', () => {
    it('应该生成预览URL', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onload: null as any,
        onerror: null as any
      }

      global.FileReader = vi.fn(() => mockFileReader) as any

      const promise = imageService.generatePreviewUrl(mockFile)

      // 模拟FileReader成功
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload()
        }
      }, 0)

      const result = await promise

      expect(result).toBe('data:image/jpeg;base64,dGVzdA==')
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
    })

    it('应该处理读取错误', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: null,
        onload: null as any,
        onerror: null as any
      }

      global.FileReader = vi.fn(() => mockFileReader) as any

      const promise = imageService.generatePreviewUrl(mockFile)

      // 模拟FileReader错误
      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror(new Error('读取失败'))
        }
      }, 0)

      await expect(promise).rejects.toThrow()
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
    })
  })
})
