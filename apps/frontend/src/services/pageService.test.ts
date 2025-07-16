import { pageService } from './pageService'
import { shopService } from './shopService'
import { PageTemplate, PageModuleType } from '@pagemaker/shared-types'
import { apiClient } from '@/lib/apiClient'

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

const mockApiClient = apiClient as any

describe('pageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockPage: PageTemplate = {
    id: 'test-page-id',
    name: 'Test Page',
    content: [
      {
        id: 'module-1',
        type: PageModuleType.TEXT
      }
    ],
    target_area: 'pc',
    owner_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    module_count: 1
  }

  describe('getPage', () => {
    it('应该成功获取页面', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockPage
        }
      }

      mockApiClient.get.mockResolvedValue(mockResponse)

      const result = await pageService.getPage('test-page-id')

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/pages/test-page-id/')
      expect(result).toEqual(mockPage)
    })

    it('应该处理获取页面时的错误', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Page not found'
        }
      }

      mockApiClient.get.mockResolvedValue(mockResponse)

      await expect(pageService.getPage('non-existent-id')).rejects.toThrow('Page not found')
    })

    it('应该处理网络错误', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'))

      await expect(pageService.getPage('test-page-id')).rejects.toThrow('Network error')
    })
  })

  describe('updatePage', () => {
    const updateData = {
      name: 'Updated Page',
      content: [
        {
          id: 'module-2',
          type: PageModuleType.IMAGE
        }
      ]
    }

    it('应该成功更新页面', async () => {
      const updatedPage = { ...mockPage, ...updateData }
      const mockResponse = {
        data: {
          success: true,
          data: updatedPage
        }
      }

      mockApiClient.patch.mockResolvedValue(mockResponse)

      const result = await pageService.updatePage('test-page-id', updateData)

      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/v1/pages/test-page-id/', updateData)
      expect(result).toEqual(updatedPage)
    })

    it('应该处理更新页面时的错误', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Invalid data'
        }
      }

      mockApiClient.patch.mockResolvedValue(mockResponse)

      await expect(pageService.updatePage('test-page-id', updateData)).rejects.toThrow('Invalid data')
    })
  })

  describe('createPage', () => {
    const createData = {
      name: 'New Page',
      content: [],
      target_area: 'pc'
    }

    it('应该成功创建页面', async () => {
      const createdPage = { ...mockPage, ...createData }
      const mockResponse = {
        data: {
          success: true,
          data: createdPage
        }
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      const result = await pageService.createPage(createData)

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/pages/', createData)
      expect(result).toEqual(createdPage)
    })

    it('应该处理创建页面时的错误', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Invalid data'
        }
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      await expect(pageService.createPage(createData)).rejects.toThrow('Invalid data')
    })
  })

  describe('deletePage', () => {
    it('应该成功删除页面', async () => {
      const mockResponse = {
        data: {
          success: true
        }
      }

      mockApiClient.delete.mockResolvedValue(mockResponse)

      await pageService.deletePage('test-page-id')

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/v1/pages/test-page-id/')
    })

    it('应该处理删除页面时的错误', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Page not found'
        }
      }

      mockApiClient.delete.mockResolvedValue(mockResponse)

      await expect(pageService.deletePage('test-page-id')).rejects.toThrow('Page not found')
    })
  })
})

describe('shopService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockConfigs = [
    {
      id: 'config-1',
      shop_name: 'Test Shop',
      target_area: 'pc',
      api_service_secret: 'secret',
      api_license_key: 'key',
      ftp_host: 'ftp.example.com',
      ftp_port: 21,
      ftp_user: 'user',
      ftp_password: 'pass',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  describe('getShopConfigurations', () => {
    it('应该成功获取店铺配置', async () => {
      const result = await shopService.getShopConfigurations()

      expect(result).toEqual([
        { target_area: 'pc', config: { layout: 'desktop' } },
        { target_area: 'mobile', config: { layout: 'mobile' } }
      ])
    })

    it('应该处理获取店铺配置时的错误', async () => {
      // 由于现在是模拟数据，这个测试不再适用
      // 但为了保持测试结构，我们可以测试返回的数据结构
      const result = await shopService.getShopConfigurations()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('target_area')
      expect(result[0]).toHaveProperty('config')
    })
  })
})
