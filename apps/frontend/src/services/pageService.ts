import { apiClient } from '@/lib/apiClient'
import type {
  PageTemplate,
  CreatePageTemplateRequest,
  UpdatePageTemplateRequest,
  ApiResponse,
  PageListResponse
} from '@pagemaker/shared-types'

export const pageService = {
  /**
   * 获取页面列表
   */
  async getPages(params?: { limit?: number; offset?: number; search?: string }): Promise<PageListResponse> {
    const response = await apiClient.get<ApiResponse<PageListResponse>>('/api/v1/pages/', {
      params
    })

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '获取页面列表失败')
    }

    return response.data.data
  },

  /**
   * 获取页面详情
   */
  async getPage(id: string): Promise<PageTemplate> {
    const response = await apiClient.get<ApiResponse<PageTemplate>>(`/api/v1/pages/${id}/`)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '获取页面详情失败')
    }

    return response.data.data
  },

  /**
   * 创建页面
   */
  async createPage(data: CreatePageTemplateRequest): Promise<PageTemplate> {
    const response = await apiClient.post<ApiResponse<PageTemplate>>('/api/v1/pages/', data)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '创建页面失败')
    }

    return response.data.data
  },

  /**
   * 更新页面
   */
  async updatePage(id: string, data: UpdatePageTemplateRequest): Promise<PageTemplate> {
    const response = await apiClient.patch<ApiResponse<PageTemplate>>(`/api/v1/pages/${id}/`, data)

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '更新页面失败')
    }

    return response.data.data
  },

  /**
   * 删除页面
   */
  async deletePage(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/pages/${id}/`)

    if (!response.data.success) {
      throw new Error(response.data.message || '删除页面失败')
    }
  },

  /**
   * 发布页面
   */
  async publishPage(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/api/v1/pages/${id}/publish/`
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '发布页面失败')
    }

    return response.data.data
  },

  /**
   * 保存页面（智能判断创建或更新）
   */
  async savePage(page: Partial<PageTemplate> & { name: string }): Promise<PageTemplate> {
    if (page.id) {
      // 更新现有页面
      const updateData: UpdatePageTemplateRequest = {
        name: page.name,
        content: page.content,
        target_area: page.target_area
      }
      return this.updatePage(page.id, updateData)
    } else {
      // 创建新页面
      const createData: CreatePageTemplateRequest = {
        name: page.name,
        content: page.content || [],
        target_area: page.target_area || 'pc'
      }
      return this.createPage(createData)
    }
  }
}

export default pageService
